import { MAX_COLOR_POINTS, judgeGarmentColor } from "../color/match";
import type { ColorAnalysis } from "../color/season";
import type { CustomGarmentScore, NormalizedSkinSignals, ReasonCode, VtoTaskStatus } from "../types";
import { computeFinishFit } from "./skinColorFit";
import { COLOR_VERDICT_REASON, REASON_COPY } from "./reasonCodes";

const FINISH_MAX = 15;
const VTO_MAX = 10;

/**
 * Compatibility score for a garment the user uploaded themselves.
 *
 * Runs the same measured-colour comparison as catalog scoring: the garment's
 * colour sampled from the user's own photo, judged against the palette
 * measured from their face. Where either measurement is missing — the photo
 * gave nothing usable to sample, or the colour-tones task failed — the
 * colour term is dropped from the score *and its denominator* rather than
 * being filled in with a neutral guess, so the number never implies a
 * comparison that was not actually made.
 *
 *   personalColor  0-30 (only when both measurements exist)
 *   skinConcernFit 0-15
 *   vtoSuccess     0-10
 *   cautionPenalty 0-20 (subtracted)
 *
 * Reported as a percentage of what could actually be assessed. Deliberately
 * a narrower set of signals than catalog scoring — there is no occasion,
 * style preference to match against a garment the user already
 * chose for themselves, and fabric finish cannot be read from a photo — so
 * surface it under a distinct label (e.g. "Skin & Color Compatibility"),
 * never as the full catalog "Confidence Score".
 */
export function scoreCustomGarment(
  colorHex: string | null,
  colorAnalysis: ColorAnalysis | null,
  skinSignals: NormalizedSkinSignals,
  vtoStatus: VtoTaskStatus,
): CustomGarmentScore {
  const reasonCodes: ReasonCode[] = [];
  const cautionCodes: ReasonCode[] = [];

  let points = 0;
  let maxPoints = FINISH_MAX + VTO_MAX;

  const colorMatch = colorHex && colorAnalysis ? judgeGarmentColor(colorHex, colorAnalysis) : null;
  if (colorMatch) {
    points += colorMatch.points;
    maxPoints += MAX_COLOR_POINTS;
    const code = COLOR_VERDICT_REASON[colorMatch.verdict];
    if (colorMatch.verdict === "clash" || colorMatch.verdict === "washed_out") {
      cautionCodes.push(code);
    } else reasonCodes.push(code);
  } else {
    reasonCodes.push("color_reading_unavailable");
  }

  // Passing a null fabric finish skips the finish-driven rules rather than
  // guessing at a fabric we cannot see in a photo.
  const finishFit = computeFinishFit(colorHex, null, skinSignals);
  points += finishFit.finishFitPoints;
  reasonCodes.push(...finishFit.reasonCodes);
  cautionCodes.push(...finishFit.cautionCodes);

  if (vtoStatus === "success") points += VTO_MAX;

  const confidenceScore = Math.max(
    0,
    Math.min(100, Math.round((100 * (points - finishFit.cautionPoints)) / maxPoints)),
  );

  return {
    confidenceScore,
    reasonCodes,
    cautionCodes,
    userFacingReasons: reasonCodes.map((code) => REASON_COPY[code]),
    userFacingCautions: cautionCodes.map((code) => REASON_COPY[code]),
  };
}
