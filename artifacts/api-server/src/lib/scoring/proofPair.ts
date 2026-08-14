import { MAX_COLOR_POINTS, judgeGarmentColor } from "../color/match";
import type { GarmentColorMatch } from "../color/match";
import type { ColorAnalysis } from "../color/season";
import type { CatalogItem, ProofShot, ProofShotSide, Silhouette, UserPreferences, VtoResult } from "../types";

export interface GarmentProofPair {
  /** The silhouette both garments share — the controlled variable. */
  silhouette: Silhouette;
  best: CatalogItem;
  worst: CatalogItem;
  bestMatch: GarmentColorMatch;
  worstMatch: GarmentColorMatch;
  /** Colour-points difference between the two, on the 0..MAX_COLOR_POINTS scale. */
  gap: number;
}

/**
 * Minimum colour-points gap before a pair is worth showing.
 *
 * A side-by-side whose two halves look about the same is worse than no
 * side-by-side at all: it invites the viewer to conclude the measurement is
 * noise. Below this threshold we return null and the UI shows nothing.
 */
const MIN_PROOF_GAP = 8;

export interface PickGarmentProofPairInput {
  catalog: CatalogItem[];
  preferences: UserPreferences;
  /** Null when no colour reading is available — no measurement, no proof. */
  colorAnalysis: ColorAnalysis | null;
}

/**
 * Picks two real, buyable garments of the *same silhouette* — the one whose
 * colour best suits this person and the one that suits them worst.
 *
 * This exists to make the recommendation falsifiable. A ranked list asks the
 * user to trust a number; two try-on images of their own body, identical
 * except for colour, let them check the claim with their own eyes in about a
 * second.
 *
 * Holding silhouette constant is the entire point and not a nicety. If the
 * flattering option is a wrap dress and the unflattering one is a jumpsuit,
 * the comparison proves nothing — cut, drape and proportion all changed too,
 * so any visible difference is unattributable. Same shape, same body, same
 * photo, one variable.
 *
 * Returns null rather than inventing a pair when the catalog cannot supply
 * two same-silhouette options, when no colour was measured, or when the gap
 * is too small to be legible.
 */
export function pickGarmentProofPair({
  catalog,
  preferences,
  colorAnalysis,
}: PickGarmentProofPairInput): GarmentProofPair | null {
  if (!colorAnalysis) return null;

  // Same hard tradition filter as shortlisting: proving a point with a
  // garment the user would never wear is not proving it to them.
  const byTradition =
    preferences.tradition === "any" ? catalog : catalog.filter((item) => item.tradition === preferences.tradition);
  const inTradition = byTradition.length > 0 ? byTradition : catalog;
  const eligible = inTradition.filter((item) => item.occasionTags.includes(preferences.occasion));

  const groups = new Map<Silhouette, { item: CatalogItem; match: GarmentColorMatch }[]>();
  for (const item of eligible) {
    const match = judgeGarmentColor(item.colorHex, colorAnalysis);
    if (!match) continue;
    const group = groups.get(item.silhouette);
    if (group) group.push({ item, match });
    else groups.set(item.silhouette, [{ item, match }]);
  }

  let winner: GarmentProofPair | null = null;

  for (const [silhouette, members] of groups) {
    if (members.length < 2) continue;

    let best = members[0]!;
    let worst = members[0]!;
    for (const member of members) {
      if (member.match.points > best.match.points) best = member;
      if (member.match.points < worst.match.points) worst = member;
    }

    const gap = best.match.points - worst.match.points;
    // Pick the widest gap available: the most convincing demonstration is the
    // one where the difference is hardest to argue with.
    if (gap >= MIN_PROOF_GAP && (!winner || gap > winner.gap)) {
      winner = {
        silhouette,
        best: best.item,
        worst: worst.item,
        bestMatch: best.match,
        worstMatch: worst.match,
        gap,
      };
    }
  }

  return winner;
}

/**
 * Turns a picked pair into the wire shape, attaching the try-on render for
 * each half.
 *
 * Returns null unless *both* halves rendered successfully. A side-by-side
 * missing one side is not a weaker proof, it is not a proof at all — it would
 * show the user a flattering photo next to an empty box and ask them to take
 * the unflattering half on trust, which is exactly the thing this feature
 * exists to avoid.
 */
export function toProofShot(pair: GarmentProofPair | null, vtoResults: VtoResult[]): ProofShot | null {
  if (!pair) return null;

  const renderFor = (catalogItemId: string): string | null =>
    vtoResults.find((v) => v.catalogItemId === catalogItemId && v.status === "success")?.resultImageUrl ?? null;

  const bestImage = renderFor(pair.best.id);
  const worstImage = renderFor(pair.worst.id);
  if (!bestImage || !worstImage) return null;

  const side = (item: CatalogItem, match: GarmentColorMatch, tryOnImageUrl: string): ProofShotSide => ({
    catalogItemId: item.id,
    name: item.name,
    colorHex: item.colorHex,
    colorFamily: item.colorFamily,
    tryOnImageUrl,
    colorPoints: match.points,
    verdict: match.verdict,
    headline: match.headline,
  });

  return {
    silhouette: pair.silhouette,
    gap: pair.gap,
    maxPoints: MAX_COLOR_POINTS,
    best: side(pair.best, pair.bestMatch, bestImage),
    worst: side(pair.worst, pair.worstMatch, worstImage),
  };
}

export { MAX_COLOR_POINTS };
