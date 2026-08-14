import { Jimp, intToRGBA } from "jimp";
import { rgbToHex } from "../color/lab";
import type { ColorFamily, Undertone } from "../types";

/**
 * Reference RGB swatch for each catalog color family, plus the undertone the
 * catalog already assigns that family (see `weddingGuestCatalog.ts`). Used
 * to map an uploaded garment's dominant color onto the same vocabulary the
 * scoring engine already understands, via nearest-neighbor distance — a
 * simple, transparent v0 approach appropriate for a hackathon-scale rule
 * engine, not a learned color model.
 */
const COLOR_FAMILY_REFERENCE: Record<ColorFamily, { rgb: [number, number, number]; undertone: Undertone }> = {
  navy: { rgb: [28, 37, 65], undertone: "cool" },
  emerald: { rgb: [0, 110, 80], undertone: "cool" },
  sage: { rgb: [158, 169, 133], undertone: "cool" },
  black: { rgb: [25, 25, 25], undertone: "neutral" },
  rose: { rgb: [196, 120, 130], undertone: "warm" },
  champagne: { rgb: [235, 214, 170], undertone: "warm" },
  lavender: { rgb: [180, 165, 200], undertone: "cool" },
  teal: { rgb: [30, 110, 110], undertone: "cool" },
  burgundy: { rgb: [105, 30, 45], undertone: "warm" },
  coral: { rgb: [224, 122, 95], undertone: "warm" },
  mustard: { rgb: [200, 155, 60], undertone: "warm" },
  ivory: { rgb: [240, 234, 222], undertone: "neutral" },
  terracotta: { rgb: [190, 110, 80], undertone: "warm" },
};

export function nearestColorFamily(rgb: Rgb): { colorFamily: ColorFamily; undertone: Undertone } {
  let best: ColorFamily = "navy";
  let bestDistance = Infinity;
  for (const [family, ref] of Object.entries(COLOR_FAMILY_REFERENCE) as [ColorFamily, { rgb: [number, number, number]; undertone: Undertone }][]) {
    const d = distance(rgb, ref.rgb);
    if (d < bestDistance) {
      bestDistance = d;
      best = family;
    }
  }
  return { colorFamily: best, undertone: COLOR_FAMILY_REFERENCE[best].undertone };
}

type Rgb = [number, number, number];

const SAMPLE_SIZE = 96;
/**
 * Per-step tolerances for the backdrop flood fill, tried loosest first.
 *
 * A loose step walks a graded studio backdrop easily, but against a pale
 * garment on a pale backdrop the edge contrast can be lower than the step
 * itself, and the fill bleeds through the garment — leaving only its shadowed
 * folds behind, which read as grey. So the fill is retried tighter until it
 * stops claiming an implausible share of the frame.
 */
const FLOOD_STEP_TOLERANCES = [14, 10, 7, 5, 3] as const;
/** A backdrop occupying more than this much of a garment photo means the fill leaked. */
const MAX_BACKDROP_SHARE = 0.85;
/** Below this share of the frame we assume the mask went wrong and fall back. */
const MIN_GARMENT_SHARE = 0.03;
const CLUSTER_COUNT = 6;
const KMEANS_ITERATIONS = 12;

function distance(a: Rgb, b: Rgb): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function isNearWhite(p: Rgb): boolean {
  return p[0] > 240 && p[1] > 240 && p[2] > 240;
}

function isNearBlack(p: Rgb): boolean {
  return p[0] < 12 && p[1] < 12 && p[2] < 12;
}

/**
 * Flood-fills inward from the frame border to mark the backdrop.
 *
 * Colour distance from a single sampled backdrop value cannot do this job:
 * studio backdrops are graded (one corner is 40 RGB units off the other), so
 * any threshold loose enough to swallow the whole backdrop also swallows a
 * pale garment, and any threshold tight enough to spare the garment leaves
 * half the backdrop behind. A flood fill compares each pixel only to its
 * *neighbour*, so it walks a gradient indefinitely while still stopping at
 * the hard edge where the garment starts.
 */
function buildBackdropMask(pixels: Rgb[][], size: number, tolerance: number): { mask: boolean[][]; share: number } {
  const isBackdrop: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const queue: Array<[number, number]> = [];

  const seed = (x: number, y: number): void => {
    if (!isBackdrop[y]![x]) {
      isBackdrop[y]![x] = true;
      queue.push([x, y]);
    }
  };
  for (let i = 0; i < size; i++) {
    seed(i, 0);
    seed(i, size - 1);
    seed(0, i);
    seed(size - 1, i);
  }

  const neighbours: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (let head = 0; head < queue.length; head++) {
    const [x, y] = queue[head]!;
    const current = pixels[y]![x]!;
    for (const [dx, dy] of neighbours) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      if (isBackdrop[ny]![nx]) continue;
      if (distance(pixels[ny]![nx]!, current) > tolerance) continue;
      isBackdrop[ny]![nx] = true;
      queue.push([nx, ny]);
    }
  }

  return { mask: isBackdrop, share: queue.length / (size * size) };
}

/** Retries the fill tighter until it stops swallowing the subject. */
function buildBackdropMaskAdaptive(pixels: Rgb[][], size: number): boolean[][] {
  let last = buildBackdropMask(pixels, size, FLOOD_STEP_TOLERANCES[0]);
  for (const tolerance of FLOOD_STEP_TOLERANCES) {
    last = buildBackdropMask(pixels, size, tolerance);
    if (last.share <= MAX_BACKDROP_SHARE) break;
  }
  return last.mask;
}

export interface ColorCluster {
  centroid: Rgb;
  share: number;
}

/**
 * Plain k-means over RGB with deterministic, luminance-spread seeding, so
 * repeated runs on the same photo always give the same answer (a catalog
 * whose colours drifted between builds would be worse than useless).
 */
function clusterColors(samples: Rgb[], k: number): ColorCluster[] {
  if (samples.length === 0) return [];

  const luminance = (p: Rgb): number => 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  const byLuma = [...samples].sort((a, b) => luminance(a) - luminance(b));
  const centroids: Rgb[] = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.min(byLuma.length - 1, Math.floor(((i + 0.5) / k) * byLuma.length));
    centroids.push([...byLuma[idx]!] as Rgb);
  }

  const assignment = new Array<number>(samples.length).fill(-1);
  for (let iter = 0; iter < KMEANS_ITERATIONS; iter++) {
    let moved = false;
    for (let i = 0; i < samples.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = distance(samples[i]!, centroids[c]!);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (assignment[i] !== best) {
        assignment[i] = best;
        moved = true;
      }
    }

    const sums = centroids.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < samples.length; i++) {
      const s = sums[assignment[i]!]!;
      s[0]! += samples[i]![0];
      s[1]! += samples[i]![1];
      s[2]! += samples[i]![2];
      s[3]! += 1;
    }
    for (let c = 0; c < centroids.length; c++) {
      const s = sums[c]!;
      if (s[3]! > 0) centroids[c] = [s[0]! / s[3]!, s[1]! / s[3]!, s[2]! / s[3]!];
    }

    if (!moved) break;
  }

  const counts = centroids.map(() => 0);
  for (const a of assignment) counts[a] = (counts[a] ?? 0) + 1;

  return centroids
    .map((centroid, i) => ({ centroid, share: counts[i]! / samples.length }))
    .filter((c) => c.share > 0);
}

/** Diagnostic view of what the extractor sees — used by the catalog tooling. */
/** Per-channel median — a robust central estimate, unlike a mean. */
function medianRgb(samples: Rgb[]): Rgb {
  const pick = (channel: 0 | 1 | 2): number => {
    const sorted = samples.map((s) => s[channel]).sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  };
  return [pick(0), pick(1), pick(2)];
}

export async function analyzeGarmentColors(
  imageBytes: Buffer,
): Promise<{ garmentShare: number; usedFallback: boolean; clusters: ColorCluster[]; median: Rgb | null }> {
  const image = await Jimp.read(imageBytes);
  image.resize({ w: SAMPLE_SIZE, h: SAMPLE_SIZE });

  const pixels: Rgb[][] = [];
  for (let y = 0; y < SAMPLE_SIZE; y++) {
    const row: Rgb[] = [];
    for (let x = 0; x < SAMPLE_SIZE; x++) {
      const { r, g, b } = intToRGBA(image.getPixelColor(x, y));
      row.push([r, g, b]);
    }
    pixels.push(row);
  }

  const isBackdrop = buildBackdropMaskAdaptive(pixels, SAMPLE_SIZE);

  const garment: Rgb[] = [];
  const everything: Rgb[] = [];
  for (let y = 0; y < SAMPLE_SIZE; y++) {
    for (let x = 0; x < SAMPLE_SIZE; x++) {
      const p = pixels[y]![x]!;
      if (isNearWhite(p) || isNearBlack(p)) continue;
      everything.push(p);
      if (!isBackdrop[y]![x]) garment.push(p);
    }
  }

  const garmentShare = garment.length / (SAMPLE_SIZE * SAMPLE_SIZE);

  // A garment that runs off the edge of the frame (a flat-lay, a cropped
  // phone photo) leaves the flood fill nowhere to go. Rather than report a
  // sliver of shadow as the garment colour, fall back to the whole frame.
  const usedFallback = garmentShare < MIN_GARMENT_SHARE;
  const samples = usedFallback ? everything : garment;

  return {
    garmentShare,
    usedFallback,
    clusters: clusterColors(samples, CLUSTER_COUNT),
    median: samples.length > 0 ? medianRgb(samples) : null,
  };
}

/**
 * Estimates a garment's own colour from a photo of it.
 *
 * Returns the single most-occupied colour cluster of the non-backdrop
 * pixels. Deliberately not an average: averaging a teal saree against its
 * gold border, or a navy dress against its own highlights, produces a colour
 * that appears nowhere in the garment. Since `colorHex` is what the
 * personal-colour engine scores against, a blended reading would quietly
 * turn every strong colour into a muted neutral and wreck the verdict.
 *
 * Runs entirely locally — no extra YouCam API call or cost.
 */
export async function sampleGarmentColorRgb(imageBytes: Buffer): Promise<Rgb | null> {
  const { clusters } = await analyzeGarmentColors(imageBytes);
  if (clusters.length === 0) return null;
  return clusters.reduce((best, c) => (c.share > best.share ? c : best)).centroid;
}

/**
 * Extracts a garment's dominant colour and snaps it to the catalog's
 * `ColorFamily`/`Undertone` vocabulary.
 *
 * `colorHex` is the honest measurement and is what personal-colour matching
 * runs on; it is null when nothing usable was sampled, so callers can
 * decline to judge the colour rather than judging a made-up grey. The
 * family/undertone labels alongside it are only ever used to *describe* the
 * garment, never to infer whether it suits the wearer.
 */
export async function extractGarmentColor(
  imageBytes: Buffer,
): Promise<{ colorFamily: ColorFamily; undertone: Undertone; colorHex: string | null }> {
  const rgb = await sampleGarmentColorRgb(imageBytes);

  if (!rgb) {
    return { colorFamily: "black", undertone: "neutral", colorHex: null };
  }

  return {
    ...nearestColorFamily(rgb),
    colorHex: rgbToHex({ r: rgb[0], g: rgb[1], b: rgb[2] }),
  };
}
