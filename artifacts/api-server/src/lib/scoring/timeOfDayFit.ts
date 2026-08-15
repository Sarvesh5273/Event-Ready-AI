import type { FabricFinish, ReasonCode, TimeOfDay } from "../types";

/**
 * Scores a garment's fabric finish against when the event actually happens.
 *
 * This exists because fabric finish is the one catalog attribute that genuinely
 * behaves differently by time of day: sheen that reads rich under evening
 * lighting can read glaring in direct daylight, and a matte weave that looks
 * composed at noon can go flat once the light drops. Asking for a preference
 * that did not move any points would be decoration, so this term is additive
 * and traceable like every other rule in the engine.
 *
 * It is deliberately kept separate from the skin-based finish rules in
 * `skinColorFit`. The two can disagree — sheen suits an evening reception but
 * not high oiliness — and when they do, both sides are surfaced rather than one
 * silently cancelling the other out.
 */

export const TIME_OF_DAY_MAX = 10;

export interface TimeOfDayFit {
  points: number;
  reasonCode: ReasonCode;
}

const EVENING: Record<FabricFinish, TimeOfDayFit> = {
  high_shine: { points: TIME_OF_DAY_MAX, reasonCode: "evening_sheen_match" },
  soft_sheen: { points: 8, reasonCode: "evening_sheen_match" },
  matte: { points: 3, reasonCode: "evening_matte_flat" },
};

const DAY: Record<FabricFinish, TimeOfDayFit> = {
  matte: { points: TIME_OF_DAY_MAX, reasonCode: "daytime_matte_match" },
  soft_sheen: { points: 7, reasonCode: "daytime_matte_match" },
  high_shine: { points: 2, reasonCode: "daytime_shine_heavy" },
};

export function computeTimeOfDayFit(fabricFinish: FabricFinish, timeOfDay: TimeOfDay): TimeOfDayFit {
  return timeOfDay === "evening" ? EVENING[fabricFinish] : DAY[fabricFinish];
}
