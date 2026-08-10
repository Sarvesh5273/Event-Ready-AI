/**
 * CIELAB colour science primitives.
 *
 * Everything in the personal-colour engine reasons in LAB rather than RGB,
 * because RGB distance does not correspond to perceived difference: #FF0000
 * and #FF3300 are far apart numerically but nearly identical to the eye,
 * while two dark navies can be numerically close and visibly distinct.
 * Seasonal colour analysis is entirely about *perceived* relationships
 * between a person's colouring and a garment, so perceptual space is the
 * only honest place to do the maths.
 *
 * Reference white is D65 (daylight), matching sRGB's own white point.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Lab {
  /** Lightness, 0 (black) to 100 (white). */
  l: number;
  /** Green (negative) to red (positive). */
  a: number;
  /** Blue (negative) to yellow (positive). */
  b: number;
}

/** D65 reference white, scaled to Y = 100. */
const WHITE_X = 95.047;
const WHITE_Y = 100.0;
const WHITE_Z = 108.883;

/** CIE standard epsilon/kappa, expressed in the forms used below. */
const EPSILON = 216 / 24389;
const KAPPA_TERM = 841 / 108;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Parses `#rrggbb` / `rrggbb` / `#rgb`. Returns null for anything else so
 * callers can degrade gracefully rather than silently analysing black —
 * YouCam occasionally omits a colour field (e.g. hair colour on a tightly
 * cropped selfie) and a bogus #000000 would drag the whole reading dark.
 */
export function hexToRgb(hex: string | null | undefined): Rgb | null {
  if (!hex) return null;
  const cleaned = hex.trim().replace(/^#/, "");

  const expanded =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;

  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const part = (v: number) =>
    Math.round(clamp(v, 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Undoes the sRGB transfer function to get linear-light values in 0..1. */
function srgbToLinear(channel8Bit: number): number {
  const c = clamp(channel8Bit, 0, 255) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function rgbToLab(rgb: Rgb): Lab {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  // Linear sRGB -> CIE XYZ (D65), sRGB matrix.
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) * 100;
  const y = (0.2126729 * r + 0.7151522 * g + 0.072175 * b) * 100;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) * 100;

  const f = (t: number): number => (t > EPSILON ? Math.cbrt(t) : KAPPA_TERM * t + 16 / 116);

  const fx = f(x / WHITE_X);
  const fy = f(y / WHITE_Y);
  const fz = f(z / WHITE_Z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function hexToLab(hex: string | null | undefined): Lab | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToLab(rgb) : null;
}

/** Distance from the neutral axis — how saturated/vivid a colour is. */
export function labChroma(lab: Lab): number {
  return Math.sqrt(lab.a * lab.a + lab.b * lab.b);
}

/** Hue angle in degrees, 0..360. Meaningless for near-neutral colours. */
export function labHueDeg(lab: Lab): number {
  const deg = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  return deg < 0 ? deg + 360 : deg;
}

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * CIEDE2000 colour difference — the current CIE recommendation, and the
 * standard the textile and paint industries grade colour matches against.
 *
 * Rough interpretation of the result: under ~2 is a match most people
 * cannot see, ~2-10 reads as a related shade of the same colour, and beyond
 * ~20 the two colours are unmistakably different. Those bands are what the
 * garment matcher thresholds against.
 *
 * The simpler Euclidean CIE76 distance is not good enough here: it badly
 * overstates differences in saturated blues, which is exactly where a lot
 * of eveningwear sits.
 */
export function deltaE2000(reference: Lab, sample: Lab): number {
  const kL = 1;
  const kC = 1;
  const kH = 1;

  const c1 = labChroma(reference);
  const c2 = labChroma(sample);
  const cBar = (c1 + c2) / 2;

  const cBar7 = Math.pow(cBar, 7);
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + Math.pow(25, 7))));

  const a1Prime = reference.a * (1 + g);
  const a2Prime = sample.a * (1 + g);

  const c1Prime = Math.sqrt(a1Prime * a1Prime + reference.b * reference.b);
  const c2Prime = Math.sqrt(a2Prime * a2Prime + sample.b * sample.b);
  const cBarPrime = (c1Prime + c2Prime) / 2;

  const hueOf = (aPrime: number, b: number): number => {
    if (aPrime === 0 && b === 0) return 0;
    const deg = (Math.atan2(b, aPrime) * 180) / Math.PI;
    return deg < 0 ? deg + 360 : deg;
  };

  const h1Prime = hueOf(a1Prime, reference.b);
  const h2Prime = hueOf(a2Prime, sample.b);

  const deltaLPrime = sample.l - reference.l;
  const deltaCPrime = c2Prime - c1Prime;

  const chromaProduct = c1Prime * c2Prime;
  let deltahPrime: number;
  if (chromaProduct === 0) {
    deltahPrime = 0;
  } else {
    const diff = h2Prime - h1Prime;
    if (Math.abs(diff) <= 180) deltahPrime = diff;
    else if (diff > 180) deltahPrime = diff - 360;
    else deltahPrime = diff + 360;
  }

  const deltaHPrime = 2 * Math.sqrt(chromaProduct) * Math.sin(toRad(deltahPrime) / 2);

  const lBarPrime = (reference.l + sample.l) / 2;

  let hBarPrime: number;
  if (chromaProduct === 0) {
    hBarPrime = h1Prime + h2Prime;
  } else if (Math.abs(h1Prime - h2Prime) <= 180) {
    hBarPrime = (h1Prime + h2Prime) / 2;
  } else if (h1Prime + h2Prime < 360) {
    hBarPrime = (h1Prime + h2Prime + 360) / 2;
  } else {
    hBarPrime = (h1Prime + h2Prime - 360) / 2;
  }

  const t =
    1 -
    0.17 * Math.cos(toRad(hBarPrime - 30)) +
    0.24 * Math.cos(toRad(2 * hBarPrime)) +
    0.32 * Math.cos(toRad(3 * hBarPrime + 6)) -
    0.2 * Math.cos(toRad(4 * hBarPrime - 63));

  const deltaTheta = 30 * Math.exp(-Math.pow((hBarPrime - 275) / 25, 2));
  const cBarPrime7 = Math.pow(cBarPrime, 7);
  const rC = 2 * Math.sqrt(cBarPrime7 / (cBarPrime7 + Math.pow(25, 7)));
  const rT = -Math.sin(toRad(2 * deltaTheta)) * rC;

  const lBarMinus50Sq = Math.pow(lBarPrime - 50, 2);
  const sL = 1 + (0.015 * lBarMinus50Sq) / Math.sqrt(20 + lBarMinus50Sq);
  const sC = 1 + 0.045 * cBarPrime;
  const sH = 1 + 0.015 * cBarPrime * t;

  const termL = deltaLPrime / (kL * sL);
  const termC = deltaCPrime / (kC * sC);
  const termH = deltaHPrime / (kH * sH);

  return Math.sqrt(termL * termL + termC * termC + termH * termH + rT * termC * termH);
}

/** Maps `value` onto 0..1 across [lo, hi], clamping outside the range. */
export function ramp(value: number, lo: number, hi: number): number {
  if (hi === lo) return 0;
  return clamp((value - lo) / (hi - lo), 0, 1);
}

/** Maps `value` onto -1..+1 across [lo, hi], clamping outside the range. */
export function bipolar(value: number, lo: number, hi: number): number {
  return ramp(value, lo, hi) * 2 - 1;
}
