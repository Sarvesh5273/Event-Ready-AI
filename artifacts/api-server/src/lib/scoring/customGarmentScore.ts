import type { ColorFamily, CustomGarmentScore, NormalizedSkinSignals, Undertone, VtoTaskStatus } from "../types";
import { computeSkinColorFit } from "./skinColorFit";
import { REASON_COPY } from "./reasonCodes";

/**
 * Confidence score for a garment the user uploaded themselves, reusing the
 * exact same skin/color fit rules as catalog scoring (`scoreOutfits.ts`) via
 * `computeSkinColorFit` — not a separate, ad-hoc heuristic. Deliberately a
 * SMALLER point budget than catalog scoring: there's no occasion/style/
 * budget preference to match against a garment the user already picked for
 * themselves, and fabric finish can't be reliably read from a photo.
 *   skinColorFit   0-25
 *   vtoSuccess     0-10
 *   cautionPenalty 0-20 (subtracted)
 * Clamped 0-100, same as catalog scoring, but built from a narrower set of
 * signals — surface it under a distinct label (e.g. "Skin & Color
 * Compatibility"), never as the full catalog "Confidence Score".
 */
export function scoreCustomGarment(
  colorFamily: ColorFamily,
  undertone: Undertone,
  skinSignals: NormalizedSkinSignals,
  vtoStatus: VtoTaskStatus,
): CustomGarmentScore {
  const { skinFitPoints, cautionPoints, reasonCodes, cautionCodes } = computeSkinColorFit(
    colorFamily,
    undertone,
    null, // fabric finish can't be read from a photo — skip fabric-driven rules
    skinSignals,
  );

  let points = skinFitPoints;
  if (vtoStatus === "success") points += 10;

  const confidenceScore = Math.max(0, Math.min(100, points - cautionPoints));

  return {
    confidenceScore,
    reasonCodes,
    cautionCodes,
    userFacingReasons: reasonCodes.map((code) => REASON_COPY[code]),
    userFacingCautions: cautionCodes.map((code) => REASON_COPY[code]),
  };
}
