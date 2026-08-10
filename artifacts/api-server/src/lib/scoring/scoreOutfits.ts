import type { CatalogItem, NormalizedSkinSignals, OutfitScore, ReasonCode, UserPreferences, VtoResult } from "../types";
import { REASON_COPY } from "./reasonCodes";
import { computeSkinColorFit } from "./skinColorFit";

export interface ScoreOutfitsInput {
  items: CatalogItem[];
  preferences: UserPreferences;
  skinSignals: NormalizedSkinSignals;
  vtoResults: VtoResult[];
}

/**
 * "Explainable Confidence Heuristic v0" — a transparent points system, NOT a
 * machine-learned or weighted-regression model. Every point added or
 * subtracted below is traceable to a single rule and surfaced to the user
 * as a plain-language reason chip or caution note.
 *
 * Point budget (see build spec section 15):
 *   occasionFit      0-25
 *   styleVibe        0-20
 *   budget           0-15
 *   skinOutfitFit    0-25
 *   vtoSuccess       0-10
 *   cautionPenalty   0-20 (subtracted)
 * Final score is clamped to 0-100.
 */
export function scoreOutfits({ items, preferences, skinSignals, vtoResults }: ScoreOutfitsInput): OutfitScore[] {
  return items.map((item) => {
    const reasonCodes: ReasonCode[] = [];
    const cautionCodes: ReasonCode[] = [];
    let points = 0;

    if (item.occasionTags.includes(preferences.occasion)) {
      points += 25;
      reasonCodes.push("wedding_guest_match");
    }

    if (item.styleVibe === preferences.styleVibe || item.styleVibe === "either") {
      points += 20;
      reasonCodes.push("style_vibe_match");
      if (preferences.styleVibe === "bold" && item.styleVibe === "bold") {
        reasonCodes.push("bold_color_matches_vibe");
      }
      if (preferences.styleVibe === "classic" && item.styleVibe === "classic") {
        reasonCodes.push("classic_silhouette_matches_vibe");
      }
    } else {
      points += 5;
      reasonCodes.push("style_vibe_mismatch");
    }

    if (item.priceTier === preferences.budgetTier) {
      points += 15;
      reasonCodes.push("budget_match");
    } else {
      points += 5;
      reasonCodes.push("budget_mismatch");
    }

    const skinColorFit = computeSkinColorFit(item.colorFamily, item.undertone, item.fabricFinish, skinSignals);
    points += skinColorFit.skinFitPoints;
    reasonCodes.push(...skinColorFit.reasonCodes);
    cautionCodes.push(...skinColorFit.cautionCodes);

    const vto = vtoResults.find((v) => v.catalogItemId === item.id);
    if (vto?.status === "success") {
      points += 10;
    }

    const confidenceScore = Math.max(0, Math.min(100, points - skinColorFit.cautionPoints));

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
