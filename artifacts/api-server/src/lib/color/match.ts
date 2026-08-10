/**
 * Judges a garment's colour against a wearer's measured palette.
 *
 * This replaces the old hand-tagged "undertone" comparison. Previously a
 * garment was labelled cool/warm/neutral by hand and matched against an
 * inferred undertone; now both sides are real colour measurements and the
 * comparison is a perceptual distance, so the verdict holds up for any
 * garment — including one the user uploads that we have never seen.
 */

import { clamp, deltaE2000, hexToLab, ramp } from "./lab";
import type { PaletteColor } from "./palettes";
import type { ColorAnalysis } from "./season";

export type ColorVerdict = "hero" | "harmonious" | "neutral" | "clash";

/** Maximum points colour fit can contribute to an outfit score. */
export const MAX_COLOR_POINTS = 30;

export interface GarmentColorMatch {
  verdict: ColorVerdict;
  /** CIEDE2000 distance to the closest colour in the wearer's palette. */
  deltaToHero: number;
  nearestHero: PaletteColor;
  /** Closest colour on the wearer's avoid list, when the garment is near one. */
  nearestClash: PaletteColor | null;
  deltaToClash: number | null;
  /** 0..MAX_COLOR_POINTS contribution to the outfit score. */
  points: number;
  /** One-line explanation written for the wearer. */
  headline: string;
}

function nearest(
  targetHex: string,
  candidates: PaletteColor[],
): { color: PaletteColor; delta: number } | null {
  const target = hexToLab(targetHex);
  if (!target || candidates.length === 0) return null;

  let best: { color: PaletteColor; delta: number } | null = null;
  for (const candidate of candidates) {
    const lab = hexToLab(candidate.hex);
    if (!lab) continue;
    const delta = deltaE2000(lab, target);
    if (!best || delta < best.delta) best = { color: candidate, delta };
  }
  return best;
}

/**
 * Distance bands are grounded in how CIEDE2000 actually behaves: under ~10
 * two colours read as the same shade, ~10-25 as clearly related, and past
 * ~45 as unrelated. A garment does not need to *be* a palette swatch to
 * work — being in the neighbourhood is enough, which is why the score decays
 * smoothly rather than snapping between buckets.
 */
export function judgeGarmentColor(
  garmentHex: string,
  analysis: ColorAnalysis,
): GarmentColorMatch | null {
  const hero = nearest(garmentHex, analysis.heroColors);
  if (!hero) return null;

  const clash = nearest(garmentHex, analysis.avoidColors);

  const heroScore = MAX_COLOR_POINTS * (1 - ramp(hero.delta, 8, 45));

  // Only penalise when the garment is genuinely closer to a problem colour
  // than to a palette colour — otherwise a deep burgundy that happens to sit
  // near an "avoid" swatch would be punished for a resemblance nobody sees.
  const isClashDominant = clash !== null && clash.delta < hero.delta;
  const clashPenalty = isClashDominant ? 12 * (1 - ramp(clash.delta, 6, 30)) : 0;

  const points = Math.round(clamp(heroScore - clashPenalty, 0, MAX_COLOR_POINTS));

  let verdict: ColorVerdict;
  if (hero.delta <= 12) verdict = "hero";
  else if (hero.delta <= 26) verdict = "harmonious";
  else if (isClashDominant && clash !== null && clash.delta <= 20) verdict = "clash";
  else verdict = "neutral";

  const headline = buildHeadline(verdict, hero.color, clash?.color ?? null, analysis);

  return {
    verdict,
    deltaToHero: Math.round(hero.delta * 10) / 10,
    nearestHero: hero.color,
    nearestClash: clash?.color ?? null,
    deltaToClash: clash ? Math.round(clash.delta * 10) / 10 : null,
    points,
    headline,
  };
}

function buildHeadline(
  verdict: ColorVerdict,
  hero: PaletteColor,
  clash: PaletteColor | null,
  analysis: ColorAnalysis,
): string {
  switch (verdict) {
    case "hero":
      return `This is essentially ${hero.name.toLowerCase()} — a core ${analysis.seasonLabel} colour.`;
    case "harmonious":
      return `Sits close to ${hero.name.toLowerCase()} in your palette, so it works with your colouring.`;
    case "clash":
      return clash
        ? `Leans towards ${clash.name.toLowerCase()}, which tends to fight ${analysis.seasonLabel} colouring.`
        : `This one pulls against your palette.`;
    case "neutral":
      return `Neither a palette colour nor a problem one — it will read as safe rather than striking.`;
  }
}

/**
 * Picks the pair of colours used for the side-by-side try-on proof: the
 * palette colour that should look best on this person, and the avoid colour
 * that should look worst.
 *
 * The "worst" pick is deliberately the avoid colour *furthest* from the
 * palette rather than a random one — the comparison is only convincing if
 * the difference is unmistakable on camera.
 */
export function pickProofPair(analysis: ColorAnalysis): { best: PaletteColor; worst: PaletteColor } | null {
  const best = analysis.heroColors[0];
  if (!best || analysis.avoidColors.length === 0) return null;

  const bestLab = hexToLab(best.hex);
  if (!bestLab) return null;

  let worst: { color: PaletteColor; delta: number } | null = null;
  for (const candidate of analysis.avoidColors) {
    const lab = hexToLab(candidate.hex);
    if (!lab) continue;
    const delta = deltaE2000(bestLab, lab);
    if (!worst || delta > worst.delta) worst = { color: candidate, delta };
  }

  return worst ? { best, worst: worst.color } : null;
}
