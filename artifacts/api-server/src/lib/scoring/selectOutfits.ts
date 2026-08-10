import type { CatalogItem, NormalizedSkinSignals, OutfitCandidate, ReasonCode, UserPreferences } from "../types";

interface ScoredCandidate {
  item: CatalogItem;
  score: number;
  reasons: ReasonCode[];
}

function scoreForSelection(
  item: CatalogItem,
  preferences: UserPreferences,
  skin: NormalizedSkinSignals,
): ScoredCandidate {
  let score = 0;
  const reasons: ReasonCode[] = [];

  if (item.styleVibe === preferences.styleVibe || item.styleVibe === "either") {
    score += 3;
    reasons.push("style_vibe_match");
  } else {
    score -= 2;
    reasons.push("style_vibe_mismatch");
  }

  if (item.priceTier === preferences.budgetTier) {
    score += 2;
    reasons.push("budget_match");
  } else {
    score -= 2;
    reasons.push("budget_mismatch");
  }

  if (item.undertone === "cool" && skin.redness === "high") {
    score += 2;
    reasons.push("cool_tone_supports_redness");
  }

  if ((item.fabricFinish === "matte" || item.fabricFinish === "soft_sheen") && skin.oiliness === "high") {
    score += 2;
    reasons.push("matte_finish_supports_oiliness");
  }

  if (item.fabricFinish === "high_shine" && skin.oiliness === "high") {
    score -= 2;
    reasons.push("high_shine_camera_caution");
  }

  if (item.undertone === "warm" && skin.redness === "high") {
    score -= 1;
    reasons.push("warm_tone_redness_caution");
  }

  return { item, score, reasons };
}

export interface SelectOutfitsInput {
  catalog: CatalogItem[];
  preferences: UserPreferences;
  skinSignals: NormalizedSkinSignals;
  /** How many outfits to shortlist. Defaults to 3 (1 recommended + 2 comparisons). */
  count?: number;
}

/**
 * Filters the catalog down to the current occasion, scores every eligible
 * item with a lightweight v0 selection heuristic (see spec section 14), and
 * greedily assembles a shortlist that favors visual diversity — distinct
 * silhouettes and color families — over always taking the single
 * highest-scoring item.
 */
export function selectOutfits({ catalog, preferences, skinSignals, count = 3 }: SelectOutfitsInput): OutfitCandidate[] {
  const eligible = catalog.filter((item) => item.occasionTags.includes(preferences.occasion));
  const scored = eligible
    .map((item) => scoreForSelection(item, preferences, skinSignals))
    .sort((a, b) => b.score - a.score);

  const picked: ScoredCandidate[] = [];

  for (const candidate of scored) {
    if (picked.length >= count) break;

    const usedSilhouettes = new Set(picked.map((p) => p.item.silhouette));
    const usedColors = new Set(picked.map((p) => p.item.colorFamily));
    const isDiverse = !usedSilhouettes.has(candidate.item.silhouette) || !usedColors.has(candidate.item.colorFamily);

    if (picked.length === 0 || isDiverse) {
      picked.push(candidate);
    }
  }

  // Small catalogs (e.g. Demo Mode's 3-item replay set) may not have enough
  // diverse options — top up with the remaining highest scorers.
  if (picked.length < count) {
    for (const candidate of scored) {
      if (picked.length >= count) break;
      if (!picked.includes(candidate)) picked.push(candidate);
    }
  }

  return picked.map((p) => ({ item: p.item, selectionReasons: p.reasons }));
}
