import { MAX_COLOR_POINTS, judgeGarmentColor } from "../color/match";
import type { ColorAnalysis } from "../color/season";
import { COLOR_VERDICT_REASON } from "./reasonCodes";
import type { CatalogItem, NormalizedSkinSignals, OutfitCandidate, ReasonCode, UserPreferences } from "../types";

interface ScoredCandidate {
  item: CatalogItem;
  score: number;
  reasons: ReasonCode[];
}

/** Weight of the personal-colour term in shortlisting, in the same units as the rules below. */
const COLOR_SELECTION_WEIGHT = 5;

function scoreForSelection(
  item: CatalogItem,
  preferences: UserPreferences,
  skin: NormalizedSkinSignals,
  colorAnalysis: ColorAnalysis | null,
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

  // Personal colour has to drive the shortlist, not just reorder it. Only
  // three garments are ever tried on, so a garment cut here can never be
  // recovered by scoring later — shortlisting on anything less than the real
  // measurement would mean the best-suited piece may never be shown at all.
  // It carries the heaviest weight here for the same reason.
  const colorMatch = colorAnalysis ? judgeGarmentColor(item.colorHex, colorAnalysis) : null;
  if (colorMatch) {
    score += (colorMatch.points / MAX_COLOR_POINTS) * COLOR_SELECTION_WEIGHT;
    reasons.push(COLOR_VERDICT_REASON[colorMatch.verdict]);
  }

  if ((item.fabricFinish === "matte" || item.fabricFinish === "soft_sheen") && skin.oiliness === "high") {
    score += 2;
    reasons.push("matte_finish_supports_oiliness");
  }

  if (item.fabricFinish === "high_shine" && skin.oiliness === "high") {
    score -= 2;
    reasons.push("high_shine_camera_caution");
  }

  return { item, score, reasons };
}

export interface SelectOutfitsInput {
  catalog: CatalogItem[];
  preferences: UserPreferences;
  skinSignals: NormalizedSkinSignals;
  /**
   * The palette measured from the user's face, or null when no colour
   * reading is available. When null, shortlisting silently falls back to
   * style and finish rather than substituting a guessed complexion.
   */
  colorAnalysis: ColorAnalysis | null;
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
export function selectOutfits({ catalog, preferences, skinSignals, colorAnalysis, count = 3 }: SelectOutfitsInput): OutfitCandidate[] {
  // Tradition is a hard filter, not a scoring nudge: someone who came here
  // for a saree should not be shown a jumpsuit because it scored two points
  // better on finish. Falls back to the whole catalog if a tradition somehow
  // has no items, so a filter can never empty the shortlist.
  const byTradition =
    preferences.tradition === "any" ? catalog : catalog.filter((item) => item.tradition === preferences.tradition);
  const inTradition = byTradition.length > 0 ? byTradition : catalog;

  const eligible = inTradition.filter((item) => item.occasionTags.includes(preferences.occasion));
  const scored = eligible
    .map((item) => scoreForSelection(item, preferences, skinSignals, colorAnalysis))
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
