/**
 * Guards the catalog against drifting away from the published API schema.
 *
 * The report endpoint validates its own response against the generated Zod
 * schema, so a catalog value that isn't in the OpenAPI enum doesn't degrade
 * one item — it fails the entire report with a 500. That is exactly what
 * happened when the catalog gained non-Western silhouettes (saree, qipao,
 * abaya…) and new colour families while `openapi.yaml` still listed only the
 * original Western set: every affected session would have broken, and nothing
 * in the build caught it because the server's own TypeScript types had been
 * updated in step.
 *
 * Run after touching the catalog or the schema:
 *   cd scripts && pnpm exec tsx ../artifacts/api-server/scripts/check-catalog-schema.ts
 */
import { weddingGuestCatalog } from "../src/lib/catalog/weddingGuestCatalog";
import {
  Silhouette,
  ColorFamily,
  GarmentTradition,
  FabricFinish,
  StyleVibeOrEither,
} from "../../../lib/api-client-react/src/generated/api.schemas";

const allowed = {
  silhouette: new Set<string>(Object.values(Silhouette)),
  colorFamily: new Set<string>(Object.values(ColorFamily)),
  tradition: new Set<string>(Object.values(GarmentTradition)),
  fabricFinish: new Set<string>(Object.values(FabricFinish)),
};

let failures = 0;

for (const item of weddingGuestCatalog) {
  const problems: string[] = [];
  for (const [field, values] of Object.entries(allowed)) {
    const value = (item as unknown as Record<string, unknown>)[field];
    if (typeof value !== "string" || !values.has(value)) {
      problems.push(`${field}=${String(value)}`);
    }
  }
  // `occasionTags` is deliberately free-form (not a schema enum), so there is
  // nothing to validate there.
  if (!new Set<string>(Object.values(StyleVibeOrEither)).has(item.styleVibe)) {
    problems.push(`styleVibe=${item.styleVibe}`);
  }
  if (problems.length > 0) {
    failures += 1;
    console.error(`FAIL ${item.id}: not in the published schema — ${problems.join(", ")}`);
  }
}

const byTradition: Record<string, number> = {};
for (const item of weddingGuestCatalog) {
  byTradition[item.tradition] = (byTradition[item.tradition] ?? 0) + 1;
}

if (failures > 0) {
  console.error(`\n${failures} catalog item(s) would break the report endpoint. Update lib/api-spec/openapi.yaml and re-run codegen.`);
  process.exit(1);
}

console.log(`OK — all ${weddingGuestCatalog.length} catalog items match the published schema.`);
console.log(`     by tradition: ${JSON.stringify(byTradition)}`);
