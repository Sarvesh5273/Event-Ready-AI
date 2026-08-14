import type { ColorAnalysis } from "../color/season";
import { MAX_COLOR_POINTS, judgeGarmentColor } from "../color/match";
import type { CatalogItem, NormalizedSkinSignals, OutfitScore, ReasonCode, UserPreferences, VtoResult } from "../types";
import { COLOR_VERDICT_REASON, REASON_COPY } from "./reasonCodes";
import { computeFinishFit } from "./skinColorFit";

export interface ScoreOutfitsInput {
  items: CatalogItem[];
  preferences: UserPreferences;
  skinSignals: NormalizedSkinSignals;
  /**
   * The palette measured from the user's face, or null when the Facial
   * Colour Tones read failed or was unavailable — see `checkToneTask`.
   */
  colorAnalysis: ColorAnalysis | null;
  vtoResults: VtoResult[];
}

const OCCASION_MAX = 20;
const STYLE_MAX = 15;
const FINISH_MAX = 15;
const VTO_MAX = 10;

/**
 * "Explainable Confidence Heuristic" — a transparent points system, NOT a
 * machine-learned or weighted-regression model. Every point added or
 * subtracted below is traceable to a single rule and surfaced to the user
 * as a plain-language reason chip or caution note.
 *
 * Point budget:
 *   occasionFit      0-20
 *   styleVibe        0-15
 *   personalColor    0-30
 *   skinConcernFit   0-15
 *   vtoSuccess       0-10
 *   cautionPenalty   0-20 (subtracted)
 * Final score is clamped to 0-100.
 *
 * Personal colour is deliberately the single largest term. It is the only
 * one derived from a measurement of the user rather than from a preference
 * they typed in or a label we attached to the garment, so it is both the
 * most informative and the hardest for the user to work out unaided.
 *
 * When there is no colour reading the colour term is removed from the score
 * *and from the denominator*, and the result is expressed as a percentage of
 * what could actually be assessed. Awarding half marks for an unmeasured
 * dimension instead would quietly inflate the number while the accompanying
 * copy claimed the score covered fit and style only — the arithmetic has to
 * match what the user is told.
 */
export function scoreOutfits({ items, preferences, skinSignals, colorAnalysis, vtoResults }: ScoreOutfitsInput): OutfitScore[] {
  return items.map((item) => {
    const reasonCodes: ReasonCode[] = [];
    const cautionCodes: ReasonCode[] = [];
    let points = 0;
    let maxPoints = OCCASION_MAX + STYLE_MAX + FINISH_MAX + VTO_MAX;

    if (item.occasionTags.includes(preferences.occasion)) {
      points += OCCASION_MAX;
      reasonCodes.push("wedding_guest_match");
    }

    if (item.styleVibe === preferences.styleVibe || item.styleVibe === "either") {
      points += STYLE_MAX;
      reasonCodes.push("style_vibe_match");
      if (preferences.styleVibe === "bold" && item.styleVibe === "bold") {
        reasonCodes.push("bold_color_matches_vibe");
      }
      if (preferences.styleVibe === "classic" && item.styleVibe === "classic") {
        reasonCodes.push("classic_silhouette_matches_vibe");
      }
    } else {
      points += 4;
      reasonCodes.push("style_vibe_mismatch");
    }

    const colorMatch = colorAnalysis ? judgeGarmentColor(item.colorHex, colorAnalysis) : null;
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

    const finishFit = computeFinishFit(item.colorHex, item.fabricFinish, skinSignals);
    points += finishFit.finishFitPoints;
    reasonCodes.push(...finishFit.reasonCodes);
    cautionCodes.push(...finishFit.cautionCodes);

    const vto = vtoResults.find((v) => v.catalogItemId === item.id);
    if (vto?.status === "success") {
      points += VTO_MAX;
    }

    const confidenceScore = Math.max(
      0,
      Math.min(100, Math.round((100 * (points - finishFit.cautionPoints)) / maxPoints)),
    );

    return {
      catalogItemId: item.id,
      confidenceScore,
      reasonCodes,
      cautionCodes,
      userFacingReasons: reasonCodes.map((code) => REASON_COPY[code]),
      userFacingCautions: cautionCodes.map((code) => REASON_COPY[code]),
    };
  });
}

/**
 * Picks the single highest-confidence outfit whose try-on actually
 * succeeded — never recommends a hero image that couldn't be generated.
 * Shared by the report builder and the Live Mode pipeline (which needs to
 * know the same answer early, to know which outfit's image to animate into
 * a video) so the two never disagree about which outfit is "the" pick.
 */
export function pickRecommendedCatalogItemId(scores: OutfitScore[], vtoResults: VtoResult[]): string | null {
  const successfulCatalogItemIds = new Set(
    vtoResults.filter((v) => v.status === "success").map((v) => v.catalogItemId),
  );
  const recommended = [...scores]
    .filter((s) => successfulCatalogItemIds.has(s.catalogItemId))
    .sort((a, b) => b.confidenceScore - a.confidenceScore)[0];
  return recommended?.catalogItemId ?? null;
}
