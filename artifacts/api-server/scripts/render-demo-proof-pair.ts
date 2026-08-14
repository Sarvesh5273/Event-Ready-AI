/**
 * Renders the demo persona's proof pair once, offline.
 *
 * Demo Mode must show the same side-by-side that Live Mode produces, but
 * without spending credits on every visitor. This calls the real YouCam Cloth
 * VTO endpoint for the two wrap dresses in the demo persona's proof pair and
 * bakes the results into the public demo assets, exactly how the three
 * existing replay renders were produced.
 *
 * Idempotent: skips anything already on disk, so re-running costs nothing.
 *
 *   cd scripts && pnpm exec tsx ../artifacts/api-server/scripts/render-demo-proof-pair.ts
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkYouCamClothesVtoStatus, startYouCamClothesVto } from "../src/lib/youcam/clothesVto";

/**
 * Walks up to the workspace root rather than assuming a fixed number of
 * parent hops — the script runs from a different cwd than it lives in.
 */
function findRepoRoot(from: string): string {
  let dir = path.resolve(from);
  while (!existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not locate pnpm-workspace.yaml above " + from);
    dir = parent;
  }
  return dir;
}

const publicDir = path.join(findRepoRoot(process.cwd()), "artifacts/eventready-ai/public");

/**
 * Every garment Demo Mode needs a real render for.
 *
 * Demo Mode draws its proof pair only from items that appear here, so this
 * list is what decides whether the side-by-side can be shown at all. When the
 * colour engine changes its verdicts the widest-gap pair can move to a
 * silhouette that was never rendered, and the proof section then silently
 * disappears rather than failing loudly — which is exactly how the kaftan pair
 * came to be added. Anything listed here that is already on disk is skipped,
 * so extending the list only ever costs credits for the new items.
 */
const CATALOG_IDS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["rose-wrap-low", "navy-wrap-dress", "bold-emerald-kaftan", "classic-lilac-kaftan"];

const person = await readFile(path.join(publicDir, "demo/persona-full-body.jpg"));
console.log(`persona full-body photo: ${person.length} bytes`);

for (const catalogItemId of CATALOG_IDS) {
  const outPath = path.join(publicDir, "demo/replay", `vto-${catalogItemId}.jpg`);
  if (existsSync(outPath)) {
    console.log(`${catalogItemId}: already rendered, skipping`);
    continue;
  }

  const garment = await readFile(path.join(publicDir, "demo/outfits", `${catalogItemId}.jpg`));
  const { taskId } = await startYouCamClothesVto(person, "image/jpeg", garment, "image/jpeg", "full_body");
  console.log(`${catalogItemId}: task ${taskId}`);

  let saved = false;
  for (let attempt = 0; attempt < 60 && !saved; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const result = await checkYouCamClothesVtoStatus(taskId);

    if (result.status === "success" && result.resultImageUrl) {
      const response = await fetch(result.resultImageUrl);
      if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, bytes);
      console.log(`\n  saved ${path.relative(publicDir, outPath)} (${bytes.length} bytes)`);
      saved = true;
    } else if (result.status === "error") {
      console.error(`\n  FAILED: ${result.errorMessage ?? "unknown error"}`);
      break;
    } else {
      process.stdout.write(".");
    }
  }

  if (!saved && !existsSync(outPath)) console.error(`  ${catalogItemId}: gave up waiting`);
}

console.log("done");
