import { hexToLab, labChroma } from "../color/lab";
import type { FabricFinish, NormalizedSkinSignals, ReasonCode } from "../types";

export interface FinishFitResult {
  /** Already clamped to the 0-15 skin-concern point budget. */
  finishFitPoints: number;
  /** Already clamped to the 0-20 cautionPenalty point budget. */
  cautionPoints: number;
  reasonCodes: ReasonCode[];
  cautionCodes: ReasonCode[];
}

/**
 * The skin-*concern* half of outfit fit: how a fabric's finish and a
 * garment's depth interact with what Skin Analysis actually measured
 * (oiliness, texture, dark circles, radiance, moisture).
 *
 * Deliberately says nothing about whether the colour suits the wearer. That
 * question is now answered by `judgeGarmentColor`, which compares the
 * garment's measured colour against the palette measured from the user's own
 * face, instead of inferring it from a hand-typed undertone label. Splitting
 * the two means the report can say a garment is a wonderful colour but a
 * risky fabric — a distinction the old combined rule could not express.
 *
 * "Deep" and "soft" are read off the garment's measured colour rather than
 * a curated list of colour-family names, so they work for an uploaded
 * garment exactly as well as for a catalog one.
 */
export function computeFinishFit(
  colorHex: string | null,
  fabricFinish: FabricFinish | null,
  skinSignals: NormalizedSkinSignals,
): FinishFitResult {
  const reasonCodes: ReasonCode[] = [];
  const cautionCodes: ReasonCode[] = [];
  const lab = colorHex ? hexToLab(colorHex) : null;
  const isDeep = lab !== null && lab.l < 45;
  const isSoft = lab !== null && lab.l >= 60 && labChroma(lab) < 25;

  let fit = 5;
  if ((fabricFinish === "matte" || fabricFinish === "soft_sheen") && skinSignals.oiliness === "high") {
    fit += 5;
    reasonCodes.push("matte_finish_supports_oiliness");
  }
  if ((fabricFinish === "matte" || fabricFinish === "soft_sheen") && skinSignals.texture === "high") {
    fit += 5;
    reasonCodes.push("matte_finish_supports_texture");
  }
  if (skinSignals.darkCircles === "high" && isDeep) {
    fit += 5;
    reasonCodes.push("contrast_supports_tired_eye_area");
  }
  if ((skinSignals.radiance === "low" || skinSignals.moisture === "low") && isSoft) {
    fit += 5;
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

  return {
    finishFitPoints: Math.min(15, fit),
    cautionPoints: Math.min(20, penalty),
    reasonCodes,
    cautionCodes,
  };
}

