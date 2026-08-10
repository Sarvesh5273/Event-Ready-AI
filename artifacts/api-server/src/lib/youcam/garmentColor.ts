import { Jimp, intToRGBA } from "jimp";
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
};

function nearestColorFamily(rgb: [number, number, number]): { colorFamily: ColorFamily; undertone: Undertone } {
  let best: ColorFamily = "navy";
  let bestDistance = Infinity;
  for (const [family, ref] of Object.entries(COLOR_FAMILY_REFERENCE) as [ColorFamily, { rgb: [number, number, number]; undertone: Undertone }][]) {
    const dx = rgb[0] - ref.rgb[0];
    const dy = rgb[1] - ref.rgb[1];
    const dz = rgb[2] - ref.rgb[2];
    const distance = dx * dx + dy * dy + dz * dz;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = family;
    }
  }
  return { colorFamily: best, undertone: COLOR_FAMILY_REFERENCE[best].undertone };
}

/**
 * Extracts a dominant-color estimate from an uploaded garment photo: average
 * RGB over the center 60% of the (downsampled) image, skipping near-white
 * and near-black pixels to reduce bias from plain product-photo backgrounds
 * and shadow, then snaps that average to the nearest catalog `ColorFamily`
 * (and its associated `Undertone`). Runs entirely locally — no extra YouCam
 * API call or cost.
 */
export async function extractGarmentColor(imageBytes: Buffer): Promise<{ colorFamily: ColorFamily; undertone: Undertone }> {
  const image = await Jimp.read(imageBytes);
  image.resize({ w: 32, h: 32 });

  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const x0 = Math.floor(width * 0.2);
  const x1 = Math.ceil(width * 0.8);
  const y0 = Math.floor(height * 0.2);
  const y1 = Math.ceil(height * 0.8);

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const { r, g, b } = intToRGBA(image.getPixelColor(x, y));
      const isNearWhite = r > 235 && g > 235 && b > 235;
      const isNearBlack = r < 15 && g < 15 && b < 15;
      if (isNearWhite || isNearBlack) continue;
      rSum += r;
      gSum += g;
      bSum += b;
      count++;
    }
  }

  // Every sampled pixel was background/shadow (e.g. a garment shot on pure
  // white) — fall back to a neutral mid-gray average rather than crashing.
  const avg: [number, number, number] = count > 0 ? [rSum / count, gSum / count, bSum / count] : [128, 128, 128];
  return nearestColorFamily(avg);
}
