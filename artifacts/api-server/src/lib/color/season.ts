/**
 * Personal colour analysis: turns YouCam's measured facial colours into a
 * seasonal palette.
 *
 * The inputs here are real measurements — YouCam's AI Facial Colour Tones
 * Analyzer returns hex values for skin, hair, eyes, lips and eyebrows. Those
 * three primary features (skin, hair, eyes) are exactly what a human colour
 * analyst reads in a studio session, so the analysis below is a faithful
 * mechanisation of an established method rather than an invented heuristic.
 *
 * The method: place the person on three axes, then let the *strongest* axis
 * decide their season. That "dominant characteristic" approach is how the
 * twelve-subtype system actually works — someone who is mildly warm but very
 * deep is a Deep Autumn, not a True Autumn, because depth is the trait that
 * drives what they can wear.
 */

import { bipolar, clamp, hexToLab, labChroma, labHueDeg, ramp, type Lab } from "./lab";
import { SEASON_PALETTES, type ColorSeason, type PaletteColor } from "./palettes";

/** Measured facial colours as returned by YouCam Facial Colour Tones. */
export interface FacialColorTones {
  skinColor: string | null;
  hairColor: string | null;
  hairColorName: string | null;
  eyeColor: string | null;
  eyeColorName: string | null;
  lipColor: string | null;
  eyebrowColor: string | null;
}

export type DominantTrait = "warm" | "cool" | "light" | "deep" | "bright" | "soft";

/**
 * Where the wearer sits on each axis. All three run -1..+1 and are reported
 * to the UI, because showing the axes is what makes the verdict feel
 * measured rather than assigned.
 */
export interface PaletteAxes {
  /** -1 fully cool .. +1 fully warm. */
  temperature: number;
  /** -1 deep .. +1 light. */
  value: number;
  /** -1 soft/muted .. +1 bright/clear. */
  chroma: number;
}

export interface ColorAnalysis {
  season: ColorSeason;
  seasonLabel: string;
  tagline: string;
  rationale: string;
  dominantTrait: DominantTrait;
  axes: PaletteAxes;
  /** 0..1 — how clearly the dominant trait beat the runner-up. */
  confidence: number;
  measured: FacialColorTones;
  heroColors: PaletteColor[];
  avoidColors: PaletteColor[];
  bestNeutral: PaletteColor;
}

/**
 * Skin hue angle in LAB, corrected for lightness.
 *
 * All human skin sits in the red-yellow quadrant, so the discriminator is
 * *where* in that quadrant: nearer red is a cool/pink undertone, nearer
 * yellow is a warm/golden one. The complication is that the a* (red) channel
 * stays high as skin gets deeper, which drags the hue angle down — so a warm
 * deep complexion and a cool fair one can measure the same raw angle.
 *
 * Comparing against a fixed threshold therefore reads deep skin as cool
 * almost by construction. Instead we compare each reading against the
 * neutral hue *expected at that lightness*, which keeps the warm/cool call
 * meaningful across the full range of skin tones rather than only pale ones.
 */
function skinTemperature(skin: Lab): number {
  const neutralHue = 53 + 0.08 * (clamp(skin.l, 25, 90) - 35);
  return bipolar(labHueDeg(skin) - neutralHue, -8, 8);
}

/**
 * Hair warmth is carried by chroma, not hue angle.
 *
 * This is counter-intuitive but measurable: auburn (#7A3B18) has a hue angle
 * of about 52 degrees while ash brown (#6B5D52) measures about 62 — so
 * ranking by hue would call the ash hair the warmer of the two. What
 * actually separates them is saturation, because warm hair colour comes from
 * pheomelanin, the red-gold pigment. Warm hair is vivid; ash, grey and
 * cool-brown hair are desaturated at the same lightness.
 *
 * The weight falls away for very dark hair, where there is too little light
 * reflected to measure colour reliably — near-black hair abstains from the
 * temperature vote rather than swinging it on measurement noise. Its depth
 * still counts, via the value axis.
 */
function hairTemperature(hair: Lab): { value: number; weight: number } {
  return {
    value: bipolar(labChroma(hair), 8, 28),
    weight: ramp(hair.l, 12, 32),
  };
}

/**
 * Eye warmth reads off the blue-yellow axis directly rather than hue angle,
 * because eye colour crosses the colour wheel (blue eyes sit at ~270 degrees,
 * amber at ~60) and a linear hue ramp would wrap around incoherently.
 *
 * The window starts at b* = 8 rather than at zero because brown eyes are the
 * most common eye colour in the world and *all* of them measure positive on
 * this axis — a neutral dark brown lands around b* = 12, a genuinely golden
 * amber around b* = 34. Splitting at zero would cast a warm vote for every
 * brown-eyed person alive, which skews the reading warm for exactly the
 * people the fixed-threshold skin rule already mistreated. The useful
 * distinction is between browns, not between brown and blue.
 */
function eyeTemperature(eye: Lab): { value: number; weight: number } {
  return {
    value: bipolar(eye.b, 8, 30),
    weight: ramp(labChroma(eye), 3, 18),
  };
}

function computeTemperature(skin: Lab, hair: Lab | null, eye: Lab | null): number {
  let weighted = skinTemperature(skin) * 0.5;
  let totalWeight = 0.5;

  if (hair) {
    const { value, weight } = hairTemperature(hair);
    weighted += value * 0.3 * weight;
    totalWeight += 0.3 * weight;
  }

  if (eye) {
    const { value, weight } = eyeTemperature(eye);
    weighted += value * 0.2 * weight;
    totalWeight += 0.2 * weight;
  }

  return clamp(weighted / totalWeight, -1, 1);
}

/**
 * Value = overall lightness of the person, not just their skin. Someone with
 * fair skin and near-black hair is not "light" — the hair pulls them deep,
 * which is why hair carries nearly as much weight as skin here.
 */
function computeValue(skin: Lab, hair: Lab | null): number {
  const skinValue = bipolar(skin.l, 40, 75);
  if (!hair) return clamp(skinValue, -1, 1);

  const hairValue = bipolar(hair.l, 18, 65);
  return clamp(skinValue * 0.55 + hairValue * 0.45, -1, 1);
}

/**
 * Chroma = clarity. Two things make a person "bright": strong contrast
 * between their features (pale skin against dark hair), and vivid colour in
 * the features themselves (a saturated blue or green eye). Low contrast plus
 * muted features is what "soft" means.
 */
function computeChroma(skin: Lab, hair: Lab | null, eye: Lab | null, lip: Lab | null): number {
  const contrast = hair ? ramp(Math.abs(skin.l - hair.l), 12, 55) : 0.4;

  const vividness = ramp(
    Math.max(eye ? labChroma(eye) : 0, lip ? labChroma(lip) * 0.75 : 0),
    8,
    30,
  );

  return clamp((contrast * 0.6 + vividness * 0.4) * 2 - 1, -1, 1);
}

interface TraitStrength {
  trait: DominantTrait;
  strength: number;
}

function rankTraits(axes: PaletteAxes): TraitStrength[] {
  const traits: TraitStrength[] = [
    { trait: "warm", strength: Math.max(0, axes.temperature) },
    { trait: "cool", strength: Math.max(0, -axes.temperature) },
    { trait: "light", strength: Math.max(0, axes.value) },
    { trait: "deep", strength: Math.max(0, -axes.value) },
    { trait: "bright", strength: Math.max(0, axes.chroma) },
    { trait: "soft", strength: Math.max(0, -axes.chroma) },
  ];

  return traits.sort((a, b) => b.strength - a.strength);
}

/**
 * The dominant trait picks the season family; temperature or value then
 * resolves which of the two seasons sharing that trait applies. For example
 * "deep" is shared by Deep Autumn and Deep Winter, and warmth decides.
 */
function seasonFor(dominant: DominantTrait, axes: PaletteAxes): ColorSeason {
  // A dead-neutral reading resolves cool rather than warm: cool palettes are
  // the more forgiving default when the measurement genuinely can't separate
  // the two, and a wrongly-warm recommendation is the more visible error.
  const isWarm = axes.temperature > 0;

  switch (dominant) {
    case "warm":
      return axes.value >= 0 ? "true_spring" : "true_autumn";
    case "cool":
      return axes.value >= 0 ? "true_summer" : "true_winter";
    case "light":
      return isWarm ? "light_spring" : "light_summer";
    case "deep":
      return isWarm ? "deep_autumn" : "deep_winter";
    case "bright":
      return isWarm ? "bright_spring" : "bright_winter";
    case "soft":
      return isWarm ? "soft_autumn" : "soft_summer";
  }
}

/**
 * Runs the analysis. Returns null when skin colour is unreadable — without
 * it there is no anchor for any of the three axes, and guessing would be
 * worse than telling the user the photo didn't work.
 */
export function analyzeColorSeason(tones: FacialColorTones): ColorAnalysis | null {
  const skin = hexToLab(tones.skinColor);
  if (!skin) return null;

  const hair = hexToLab(tones.hairColor);
  const eye = hexToLab(tones.eyeColor);
  const lip = hexToLab(tones.lipColor);

  const axes: PaletteAxes = {
    temperature: computeTemperature(skin, hair, eye),
    value: computeValue(skin, hair),
    chroma: computeChroma(skin, hair, eye, lip),
  };

  const ranked = rankTraits(axes);
  const dominant = ranked[0];
  const runnerUp = ranked[1];

  const season = seasonFor(dominant.trait, axes);
  const palette = SEASON_PALETTES[season];

  // Confidence blends how decisively the top trait won with how much of the
  // face we actually got to measure. A reading taken from skin alone is
  // materially less certain than one backed by hair and eye colour too.
  const separation = ramp(dominant.strength - runnerUp.strength, 0, 0.35);
  const coverage = (hair ? 0.3 : 0) + (eye ? 0.2 : 0) + 0.5;
  const confidence = clamp(0.45 + separation * 0.4 + (coverage - 0.5) * 0.3, 0.35, 0.96);

  return {
    season,
    seasonLabel: palette.label,
    tagline: palette.tagline,
    rationale: palette.rationale,
    dominantTrait: dominant.trait,
    axes,
    confidence: Math.round(confidence * 100) / 100,
    measured: tones,
    heroColors: palette.heroColors,
    avoidColors: palette.avoidColors,
    bestNeutral: palette.bestNeutral,
  };
}

/** Human-readable axis description, e.g. "warm, deep and muted". */
export function describeAxes(axes: PaletteAxes): string {
  const temp = axes.temperature > 0.15 ? "warm" : axes.temperature < -0.15 ? "cool" : "neutral";
  const value = axes.value > 0.15 ? "light" : axes.value < -0.15 ? "deep" : "medium";
  const chroma = axes.chroma > 0.15 ? "clear" : axes.chroma < -0.15 ? "muted" : "balanced";
  return `${temp}, ${value} and ${chroma}`;
}
