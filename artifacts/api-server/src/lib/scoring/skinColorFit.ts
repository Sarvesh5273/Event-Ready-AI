import type { ColorFamily, FabricFinish, NormalizedSkinSignals, ReasonCode, Undertone } from "../types";

const SOFT_PALETTE: ColorFamily[] = ["rose", "champagne", "lavender", "sage"];
const HIGH_CONTRAST_PALETTE: ColorFamily[] = ["navy", "black", "burgundy", "teal"];

export interface SkinColorFitResult {
  /** Already clamped to the 0-25 skinOutfitFit point budget. */
  skinFitPoints: number;
  /** Already clamped to the 0-20 cautionPenalty point budget. */
  cautionPoints: number;
  reasonCodes: ReasonCode[];
  cautionCodes: ReasonCode[];
}

/**
 * The core "does this color/fabric work with this skin" rule ladder. Shared
 * by catalog scoring (`scoreOutfits.ts`, which knows the full hand-tagged
 * `fabricFinish`) and custom-garment scoring (`customGarmentScore.ts`, which
 * only knows a photo-derived color — pass `fabricFinish: null` there to skip
 * the fabric-driven rules rather than guessing). Keeping this in one place
 * means both paths use identical reasoning, not two hand-written heuristics
 * that could quietly drift apart.
 */
export function computeSkinColorFit(
  colorFamily: ColorFamily,
  undertone: Undertone,
  fabricFinish: FabricFinish | null,
  skinSignals: NormalizedSkinSignals,
): SkinColorFitResult {
  const reasonCodes: ReasonCode[] = [];
  const cautionCodes: ReasonCode[] = [];

  let skinFit = 10;
  if (undertone === "cool" && skinSignals.redness === "high") {
    skinFit += 5;
    reasonCodes.push("cool_tone_supports_redness");
  }
  if ((fabricFinish === "matte" || fabricFinish === "soft_sheen") && skinSignals.oiliness === "high") {
    skinFit += 5;
    reasonCodes.push("matte_finish_supports_oiliness");
  }
  if ((fabricFinish === "matte" || fabricFinish === "soft_sheen") && skinSignals.texture === "high") {
    skinFit += 5;
    reasonCodes.push("matte_finish_supports_texture");
  }
  if (skinSignals.darkCircles === "high" && HIGH_CONTRAST_PALETTE.includes(colorFamily)) {
    skinFit += 5;
    reasonCodes.push("contrast_supports_tired_eye_area");
  }
  if ((skinSignals.radiance === "low" || skinSignals.moisture === "low") && SOFT_PALETTE.includes(colorFamily)) {
    skinFit += 5;
    reasonCodes.push("soft_color_supports_low_radiance");
  }

  let penalty = 0;
  if (fabricFinish === "high_shine" && skinSignals.oiliness === "high") {
    penalty += 10;
    cautionCodes.push("high_shine_camera_caution");
  }
  if (fabricFinish === "high_shine" && skinSignals.texture === "high") {
    penalty += 10;
    cautionCodes.push("high_shine_texture_caution");
  }
  if (undertone === "warm" && skinSignals.redness === "high") {
    penalty += 10;
    cautionCodes.push("warm_tone_redness_caution");
  }

  return {
    skinFitPoints: Math.min(25, skinFit),
    cautionPoints: Math.min(20, penalty),
    reasonCodes,
    cautionCodes,
  };
}
