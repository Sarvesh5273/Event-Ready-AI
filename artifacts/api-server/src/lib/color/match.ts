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

export type ColorVerdict = "hero" | "harmonious" | "neutral" | "clash" | "washed_out";

/** Maximum points colour fit can contribute to an outfit score. */
export const MAX_COLOR_POINTS = 30;

/**
 * Hue harmony answers "is this one of your colours". Value contrast answers a
 * different question — "will this read as a garment, or will it merge into
 * you" — and the two disagree often enough that scoring only the first gets
 * visibly wrong answers.
 *
 * A garment sitting at the wearer's own lightness has nothing to separate it
 * from their skin, so the eye stops finding an edge at the neckline and the
 * face flattens, however well-chosen the hue. Conversely a colour outside the
 * palette can still look deliberate and sharp when it carries the depth the
 * wearer's own colouring leads you to expect. Contrast therefore contributes
 * its own points rather than merely scaling the hue score, because otherwise
 * a well-matched hue can never lose to a better-contrasted one.
 */
const HUE_WEIGHT = 0.6;
const CONTRAST_WEIGHT = 0.4;

/**
 * How much lighter or darker than the wearer's skin a garment needs to sit
 * before it reads as a garment rather than an extension of the wearer.
 *
 * The curve rises to a floor and then *stays* satisfied, rather than aiming
 * at a target. Too little separation is a real and very visible failure — the
 * neckline stops registering as an edge and the face flattens. Too much
 * mostly is not: deep skin against ivory and fair skin against black are two
 * of the most reliably flattering combinations there are, and an earlier
 * symmetric version of this function scored both at zero, which is how the
 * error was caught.
 *
 * The one case where excess does cost something is a genuinely low-contrast
 * person, whose features can be overpowered by a hard dark/light break. That
 * is a soft, partial penalty applied only in proportion to how little
 * contrast they carry — never the cliff that the target-band version imposed
 * on everyone.
 */
const WASHOUT_FLOOR = 7;
const SEPARATION_NEEDED_MIN = 14;
const SEPARATION_NEEDED_MAX = 34;
const OVERSHOOT_MAX_PENALTY = 0.3;

/**
 * A garment that washes the wearer out cannot be allowed to score like a
 * mid-table option just because its hue is right. Without this cap a textbook
 * palette colour sitting at the wearer's own lightness keeps the full hue
 * score and loses only the contrast term — landing mid-table while the copy
 * tells the user it flattens their face. The cap keeps the number and the
 * verdict saying the same thing, and keeps a washout from being shortlisted.
 */
const WASHOUT_MAX_POINTS = 10;

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
  /** L* gap between the garment and the wearer's skin. */
  separation: number;
  /**
   * 0..1 — how well that gap matches the contrast the wearer naturally
   * carries, or null when their contrast could not be measured and the
   * garment was judged on hue alone.
   */
  contrastFit: number | null;
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
function contrastFitFor(
  garmentL: number,
  analysis: ColorAnalysis,
): { separation: number; fit: number | null } {
  const separation = Math.abs(garmentL - analysis.skinLightness);

  // Contrast was never measured, so how much separation this wearer needs is
  // genuinely unknown. Returning null makes the caller drop the term; a
  // stand-in value would score every garment against a wearer we never read.
  if (analysis.contrastLevel === null) {
    return { separation: Math.round(separation * 10) / 10, fit: null };
  }

  const needed =
    SEPARATION_NEEDED_MIN + (SEPARATION_NEEDED_MAX - SEPARATION_NEEDED_MIN) * analysis.contrastLevel;

  const reached = ramp(separation, WASHOUT_FLOOR, needed);
  const overshoot =
    ramp(separation - needed, 25, 60) * (1 - analysis.contrastLevel) * OVERSHOOT_MAX_PENALTY;

  return { separation: Math.round(separation * 10) / 10, fit: clamp(reached - overshoot, 0, 1) };
}

export function judgeGarmentColor(
  garmentHex: string,
  analysis: ColorAnalysis,
): GarmentColorMatch | null {
  const garmentLab = hexToLab(garmentHex);
  const hero = nearest(garmentHex, analysis.heroColors);
  if (!hero || !garmentLab) return null;

  const clash = nearest(garmentHex, analysis.avoidColors);

  const heroScore = MAX_COLOR_POINTS * (1 - ramp(hero.delta, 8, 45));
  const { separation, fit } = contrastFitFor(garmentLab.l, analysis);

  // Only penalise when the garment is genuinely closer to a problem colour
  // than to a palette colour — otherwise a deep burgundy that happens to sit
  // near an "avoid" swatch would be punished for a resemblance nobody sees.
  const isClashDominant = clash !== null && clash.delta < hero.delta;
  const clashPenalty = isClashDominant ? 12 * (1 - ramp(clash.delta, 6, 30)) : 0;

  // With no contrast measurement, hue carries the whole score rather than
  // being scaled down to 60% of a scale whose other 40% cannot be filled.
  const blended =
    fit === null
      ? heroScore - clashPenalty
      : heroScore * HUE_WEIGHT + MAX_COLOR_POINTS * fit * CONTRAST_WEIGHT - clashPenalty;

  // Washing out is its own failure and gets its own verdict. A garment can be
  // a textbook palette hue and still be the wrong thing to wear because it
  // disappears into the wearer, and saying "harmonious" about it would be
  // technically true and useless.
  //
  // The test is the raw L* gap, not the fitted score, so it still holds when
  // contrast could not be measured: skin lightness alone is enough to know a
  // garment is sitting on top of it.
  const washedOut = separation < WASHOUT_FLOOR;

  const points = Math.round(
    clamp(washedOut ? Math.min(blended, WASHOUT_MAX_POINTS) : blended, 0, MAX_COLOR_POINTS),
  );

  // "Clash" has to mean the garment actively works against the wearer, not
  // merely that its nearest neighbour happens to sit on the avoid list. A
  // colour that lands mid-table on the blended score is not fighting anyone —
  // it is unremarkable, and "neutral" says so honestly. Reserving the harsh
  // label for genuinely low scores keeps it meaningful when it does appear.
  const CLASH_MAX_POINTS = 13;

  let verdict: ColorVerdict;
  if (washedOut) verdict = "washed_out";
  else if (hero.delta <= 12 && (fit === null || fit >= 0.45)) verdict = "hero";
  else if (isClashDominant && clash !== null && clash.delta <= 20 && points < CLASH_MAX_POINTS) {
    verdict = "clash";
  } else if (points >= 17) verdict = "harmonious";
  else if (hero.delta <= 26) verdict = "harmonious";
  else verdict = "neutral";

  const headline = buildHeadline(verdict, hero.color, clash?.color ?? null, analysis);

  return {
    verdict,
    deltaToHero: Math.round(hero.delta * 10) / 10,
    nearestHero: hero.color,
    nearestClash: clash?.color ?? null,
    deltaToClash: clash ? Math.round(clash.delta * 10) / 10 : null,
    points,
    separation,
    contrastFit: fit === null ? null : Math.round(fit * 100) / 100,
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
    case "washed_out":
      return `Sits at almost exactly your own colouring, so it flattens your face rather than lifting it.`;
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
