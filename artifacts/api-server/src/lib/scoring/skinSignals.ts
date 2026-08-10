import type { NormalizedSkinSignals, SkinSignalLevel } from "../types";

export interface RawSkinScores {
  redness?: number;
  oiliness?: number;
  darkCircles?: number;
  radiance?: number;
  moisture?: number;
  texture?: number;
}

/** Used whenever Skin Analysis is unavailable or fails — pipeline continues with no skin-based bonuses/cautions applied. */
export const NEUTRAL_SKIN_SIGNALS: NormalizedSkinSignals = {
  redness: "unknown",
  oiliness: "unknown",
  darkCircles: "unknown",
  radiance: "unknown",
  moisture: "unknown",
  texture: "unknown",
};

/**
 * v0 threshold function. Cut points (67 / 34) are a heuristic choice to
 * produce a legible three-tier UI label, calibrated against the field names
 * and score direction documented in YouCam's real AI Skin Analysis API
 * response (see `public/demo/replay/skin-result-raw.json` and
 * `youcam/skinAnalysis.ts#mapSkinAnalysisOutputToRawScores`, which performs
 * the raw_score -> concern-score inversion before this function ever sees a
 * number). They are still NOT clinically validated against a large labeled
 * sample — treat this as a v0 heuristic, not a diagnostic threshold.
 *
 * Convention: inputs here are CONCERN-direction (higher = more of that
 * concern present), matching the Demo Mode replay data below. YouCam's own
 * raw scores are the opposite (HEALTHY-direction, higher = healthier) — the
 * inversion happens once, at the API boundary, so this function and every
 * downstream consumer (`scoreOutfits.ts`, `selectOutfits.ts`) only ever see
 * one consistent scale.
 */
function toLevel(score: number | undefined): SkinSignalLevel {
  if (score == null || Number.isNaN(score)) return "unknown";
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}

/** Normalizes raw concern-direction skin scores into the low/medium/high/unknown scale used everywhere else in the app. */
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
