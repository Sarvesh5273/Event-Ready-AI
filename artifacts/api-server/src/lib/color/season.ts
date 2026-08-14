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

/** Which measured feature anchored the depth and contrast reading. */
export type DepthSource = "hair" | "eyebrow";

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
  /** Skin L* — the reference every garment's value contrast is measured against. */
  skinLightness: number;
  /**
   * 0..1 — how much contrast the wearer carries between their skin and their
   * hair/brows. Drives how much separation a garment needs to look right on
   * them, which is a separate question from whether its hue suits them.
   *
   * Null when neither hair nor brows could be read. Contrast is a measurement,
   * so there is no honest default for it: a substituted "medium" would silently
   * decide how much separation every garment needs for a wearer nothing was
   * measured on. Consumers must drop the contrast term rather than fill it in.
   */
  contrastLevel: number | null;
  /** Which feature the depth reading came from, or null if neither was measurable. */
  depthSource: DepthSource | null;
  /** True when the hair swatch was measured but rejected as implausible. */
  hairReadingRejected: boolean;
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

/**
 * Hair segmentation is the least reliable measurement of the set. It traces a
 * soft, translucent edge against whatever is behind it, so the swatch that
 * comes back can be backdrop, a rim-lit highlight, or forehead skin rather
 * than hair — and when that happens the value is not noisy, it is simply
 * somebody else's colour.
 *
 * Eyebrows are the cross-check. They are small, opaque, always inside the
 * face crop, and share their pigment with the hair, so brow lightness tracks
 * natural hair depth closely. Hair that measures far *lighter* than the brows
 * is therefore the signature of a failed hair segmentation: the swatch has
 * drifted towards skin or background, both of which are lighter than hair.
 *
 * The asymmetry is deliberate — only "much lighter" is rejected. Hair darker
 * than the brows is ordinary, and genuinely bleached or greying hair is also
 * much lighter than the brows, so this rule reads dye as "use the brows".
 * That is the same call a human analyst makes: colour is read from natural
 * depth, not from the box dye.
 */
const HAIR_LIGHTER_THAN_BROW_LIMIT = 18;

interface DepthReading {
  lab: Lab;
  source: DepthSource;
  /** Hair only votes on temperature when it survived the cross-check. */
  hairUsable: boolean;
  rejected: boolean;
}

function resolveDepth(hair: Lab | null, brow: Lab | null): DepthReading | null {
  if (hair && brow && hair.l - brow.l > HAIR_LIGHTER_THAN_BROW_LIMIT) {
    return { lab: brow, source: "eyebrow", hairUsable: false, rejected: true };
  }
  if (hair) return { lab: hair, source: "hair", hairUsable: true, rejected: false };
  if (brow) return { lab: brow, source: "eyebrow", hairUsable: false, rejected: false };
  return null;
}

/**
 * Contrast is the lightness gap between the face and the hair framing it.
 * It is reported separately from the axes because it answers a different
 * question: not "which colours suit this person" but "how much separation
 * does a garment need before it reads as deliberate on them".
 */
function computeContrast(skin: Lab, depth: Lab | null): number | null {
  return depth ? ramp(Math.abs(skin.l - depth.l), 12, 55) : null;
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
function computeValue(skin: Lab, depth: Lab | null): number {
  const skinValue = bipolar(skin.l, 40, 75);
  if (!depth) return clamp(skinValue, -1, 1);

  const depthValue = bipolar(depth.l, 18, 65);
  return clamp(skinValue * 0.55 + depthValue * 0.45, -1, 1);
}

/**
 * Chroma = clarity. Two things make a person "bright": strong contrast
 * between their features (pale skin against dark hair), and vivid colour in
 * the features themselves (a saturated blue or green eye). Low contrast plus
 * muted features is what "soft" means.
 */
function computeChroma(contrast: number | null, eye: Lab | null, lip: Lab | null): number {
  const vividness = ramp(
    Math.max(eye ? labChroma(eye) : 0, lip ? labChroma(lip) * 0.75 : 0),
    8,
    30,
  );

  // With no depth reading, vividness carries the full weight rather than
  // being averaged against a stand-in contrast value. Re-weighting what was
  // actually measured is honest; inventing the missing half is not.
  if (contrast === null) return clamp(vividness * 2 - 1, -1, 1);

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
  const brow = hexToLab(tones.eyebrowColor);

  const depth = resolveDepth(hair, brow);
  const contrastLevel = computeContrast(skin, depth?.lab ?? null);

  const axes: PaletteAxes = {
    temperature: computeTemperature(skin, depth?.hairUsable ? hair : null, eye),
    value: computeValue(skin, depth?.lab ?? null),
    chroma: computeChroma(contrastLevel, eye, lip),
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
  const coverage = (depth ? 0.3 : 0) + (eye ? 0.2 : 0) + 0.5;
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
    skinLightness: Math.round(skin.l * 10) / 10,
    contrastLevel: contrastLevel === null ? null : Math.round(contrastLevel * 100) / 100,
    depthSource: depth?.source ?? null,
    hairReadingRejected: depth?.rejected ?? false,
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
