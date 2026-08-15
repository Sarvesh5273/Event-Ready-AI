/**
 * Guards the one invariant the proof shot depends on:
 *
 *   the deliberately-unflattering half of the pair must never appear in the
 *   shortlist, the scores, or the recommendation.
 *
 * If it ever does, the results screen recommends a garment while the proof
 * section directly below labels the same garment "not your colour" — the most
 * damaging possible contradiction for an app whose whole claim is that it
 * measures rather than flatters.
 *
 * This is easy to break by accident because shortlisting blends colour with
 * style, occasion and finish, so the colour-worst item can out-score others on
 * the rest. With a tradition filter the eligible pool is as small as six, of
 * which three are shortlisted.
 *
 *   cd scripts && pnpm exec tsx ../artifacts/api-server/scripts/check-proof-pair-invariant.ts
 */
import { weddingGuestCatalog } from "../src/lib/catalog/weddingGuestCatalog";
import { analyzeColorSeason } from "../src/lib/color/season";
import { DEMO_RAW_SKIN_SCORES } from "../src/lib/demo/replay";
import { pickGarmentProofPair } from "../src/lib/scoring/proofPair";
import { scoreOutfits, pickRecommendedCatalogItemId } from "../src/lib/scoring/scoreOutfits";
import { selectOutfits } from "../src/lib/scoring/selectOutfits";
import { normalizeSkinSignals } from "../src/lib/scoring/skinSignals";
import type { FacialColorTones, StyleVibe, TimeOfDay, Tradition, UserPreferences, VtoResult } from "../src/lib/types";

/** A spread of colourings so the check is not tuned to one persona. */
const PERSONAS: Array<{ label: string; tones: FacialColorTones }> = [
  { label: "fair warm", tones: tones("#F2D2B8", "#8B5A2B", "#7A9A5B") },
  { label: "fair cool", tones: tones("#EFD9D2", "#3B2F2F", "#4A6E8A") },
  { label: "medium warm", tones: tones("#C98A5E", "#3A2419", "#5A3B22") },
  { label: "deep cool", tones: tones("#5C3A2E", "#151515", "#2E2A28") },
  { label: "deep warm", tones: tones("#7A4A2A", "#2A1A10", "#4A2E18") },
  { label: "olive neutral", tones: tones("#A8825C", "#241C14", "#3E3226") },
];

function tones(skinColor: string, hairColor: string, eyeColor: string): FacialColorTones {
  return {
    skinColor,
    hairColor,
    hairColorName: null,
    eyeColor,
    eyeColorName: null,
    lipColor: null,
    eyebrowColor: hairColor,
  };
}

const skinSignals = normalizeSkinSignals(DEMO_RAW_SKIN_SCORES);
const TRADITIONS: Tradition[] = ["any", ...new Set(weddingGuestCatalog.map((item) => item.tradition))];
const VIBES: StyleVibe[] = [...new Set(weddingGuestCatalog.map((item) => item.styleVibe))].filter(
  (vibe): vibe is StyleVibe => vibe !== "either",
);
const OCCASIONS = [...new Set(weddingGuestCatalog.flatMap((item) => item.occasionTags))];
const TIMES: TimeOfDay[] = ["day", "evening"];
/**
 * Crossed with the occasions so the sweep exercises both lighting branches.
 * Time of day reweights fabric finish, which reorders the shortlist, so a
 * sweep that only ever ran one branch would miss half the selection space.
 */
const OCCASION_TIMES = OCCASIONS.flatMap((occasion) => TIMES.map((timeOfDay) => ({ occasion, timeOfDay })));

let checked = 0;
let withPair = 0;
const failures: string[] = [];

for (const persona of PERSONAS) {
  const colorAnalysis = analyzeColorSeason(persona.tones);

  for (const tradition of TRADITIONS) {
    for (const styleVibe of VIBES) {
      for (const { occasion, timeOfDay } of OCCASION_TIMES) {
        const preferences = { occasion, styleVibe, timeOfDay, tradition } as UserPreferences;
        checked += 1;

        const proofPair = pickGarmentProofPair({ catalog: weddingGuestCatalog, preferences, colorAnalysis });
        if (!proofPair) continue;
        withPair += 1;

        const where = `${persona.label} / ${tradition} / ${styleVibe} / ${occasion} / ${timeOfDay}`;

        if (proofPair.best.silhouette !== proofPair.worst.silhouette) {
          failures.push(`${where}: pair spans two silhouettes — the comparison is not controlled`);
        }
        if (proofPair.best.id === proofPair.worst.id) {
          failures.push(`${where}: pair is the same garment twice`);
        }

        const selectedOutfits = selectOutfits({
          catalog: weddingGuestCatalog,
          preferences,
          skinSignals,
          colorAnalysis,
          count: 3,
          excludeIds: [proofPair.worst.id],
        });

        if (selectedOutfits.some(({ item }) => item.id === proofPair.worst.id)) {
          failures.push(`${where}: worst garment "${proofPair.worst.id}" was shortlisted`);
        }
        if (selectedOutfits.length === 0) {
          failures.push(`${where}: excluding the worst garment emptied the shortlist`);
        }

        // The worst garment still gets a try-on, so simulate that its VTO
        // succeeded and confirm it cannot reach the scores or the recommendation.
        const vtoResults: VtoResult[] = [...selectedOutfits.map(({ item }) => item.id), proofPair.worst.id].map(
          (catalogItemId) => ({
            catalogItemId,
            status: "success" as const,
            resultImageUrl: `https://example.invalid/${catalogItemId}.jpg`,
            errorMessage: null,
          }),
        );

        const scores = scoreOutfits({
          items: selectedOutfits.map((outfit) => outfit.item),
          preferences,
          skinSignals,
          colorAnalysis,
          vtoResults,
        });

        if (scores.some((score) => score.catalogItemId === proofPair.worst.id)) {
          failures.push(`${where}: worst garment leaked into scores`);
        }
        if (pickRecommendedCatalogItemId(scores, vtoResults) === proofPair.worst.id) {
          failures.push(`${where}: worst garment was recommended`);
        }
      }
    }
  }
}

console.log(`Checked ${checked} preference combinations across ${PERSONAS.length} colourings.`);
console.log(`${withPair} produced a proof pair; ${checked - withPair} correctly produced none.`);

if (failures.length > 0) {
  console.error(`\n${failures.length} invariant violation(s):`);
  for (const failure of failures.slice(0, 25)) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("OK — the unflattering half never reaches the shortlist, scores, or recommendation.");
