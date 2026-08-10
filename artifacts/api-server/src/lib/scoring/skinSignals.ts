import type { NormalizedSkinSignals, SkinSignalLevel } from "../types";

export interface RawSkinScores {
  redness?: number;
  oiliness?: number;
  darkCircles?: number;
  radiance?: number;
  moisture?: number;
  texture?: number;
}

/**
 * Provisional v0 threshold function. These cut points (67 / 34) are an
 * arbitrary choice made to produce a legible three-tier UI label — they are
 * NOT clinically or dermatologically validated, and should be recalibrated
 * against real, labeled YouCam output before this heuristic is trusted for
 * anything beyond a demo/prototype.
 */
function toLevel(score: number | undefined): SkinSignalLevel {
  if (score == null || Number.isNaN(score)) return "unknown";
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}

/** Normalizes raw YouCam-style skin scores into the low/medium/high/unknown scale used everywhere else in the app. */
export function normalizeSkinSignals(raw: RawSkinScores): NormalizedSkinSignals {
  return {
    redness: toLevel(raw.redness),
    oiliness: toLevel(raw.oiliness),
    darkCircles: toLevel(raw.darkCircles),
    radiance: toLevel(raw.radiance),
    moisture: toLevel(raw.moisture),
    texture: toLevel(raw.texture),
  };
}
