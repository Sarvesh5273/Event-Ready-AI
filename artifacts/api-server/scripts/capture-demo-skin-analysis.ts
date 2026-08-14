/**
 * Captures a REAL YouCam Skin Analysis response for the demo persona selfie.
 *
 * Demo Mode's skin scores were previously reproduced by hand from the public
 * API reference because no API key existed when they were written (see the
 * `_provenance` block in the file this script overwrites). That made Demo
 * Mode's *scores* synthetic even though its try-on renders were real, which
 * we cannot honestly describe as replayed YouCam output. This captures the
 * genuine response once and bakes it in.
 *
 * Also answers whether the SD-tier response carries `mask_urls` (the concern
 * overlay images), which we currently discard.
 *
 * Idempotent-ish: refuses to overwrite an already-real capture unless FORCE=1.
 *
 *   cd scripts && pnpm exec tsx ../artifacts/api-server/scripts/capture-demo-skin-analysis.ts
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { uploadFileToYouCam, youCamGet, youCamPost } from "../src/lib/youcam/client";
import { SKIN_DST_ACTIONS, mapSkinAnalysisOutputToRawScores } from "../src/lib/youcam/skinAnalysis";

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
const outPath = path.join(publicDir, "demo/replay/skin-result-raw.json");

const existing = existsSync(outPath) ? JSON.parse(await readFile(outPath, "utf8")) : null;
if (existing?._provenance?.capturedAt && process.env.FORCE !== "1") {
  console.log("Already a real capture (capturedAt set). Re-run with FORCE=1 to replace.");
  process.exit(0);
}

async function credit(): Promise<unknown> {
  try {
    return await youCamGet<unknown>("/s2s/v1.0/client/credit");
  } catch (err) {
    return `unavailable: ${(err as Error).message}`;
  }
}

console.log("credit before:", JSON.stringify(await credit()));

// SELFIE lets us trial crops against the face-size requirement without
// editing the script; failed tasks cost no units, so iterating is free.
const selfiePath = process.env.SELFIE
  ? path.resolve(process.env.SELFIE)
  : path.join(publicDir, "demo/persona-selfie.jpg");
const selfie = await readFile(selfiePath);
console.log(`selfie: ${selfiePath} (${selfie.length} bytes)`);

const { fileId } = await uploadFileToYouCam(selfie, "image/jpeg", "persona-selfie.jpg");
const { task_id } = await youCamPost<{ task_id: string }>("/s2s/v2.0/task/skin-analysis", {
  src_file_id: fileId,
  dst_actions: [...SKIN_DST_ACTIONS],
  format: "json",
});
console.log("task:", task_id);

let data: any = null;
for (let attempt = 0; attempt < 60; attempt += 1) {
  await new Promise((r) => setTimeout(r, 3000));
  const result = await youCamGet<any>(`/s2s/v2.0/task/skin-analysis/${task_id}`);
  if (result?.task_status === "success") { data = result; break; }
  if (result?.task_status === "error") {
    console.error("FAILED:", JSON.stringify(result));
    process.exit(1);
  }
  process.stdout.write(".");
}
console.log();

if (!data) { console.error("gave up waiting"); process.exit(1); }

const output = data?.results?.output ?? [];
console.log(`\noutput items: ${output.length}`);
for (const item of output) {
  console.log(" -", item.type, "ui:", item.ui_score, "raw:", item.raw_score, "masks:", (item.mask_urls ?? []).length);
  for (const u of (item.mask_urls ?? []).slice(0, 1)) console.log("      mask:", String(u).slice(0, 130));
}

console.log("\nderived RawSkinScores (concern-direction):", JSON.stringify(mapSkinAnalysisOutputToRawScores(output), null, 2));

// This file lands in the app's `public/` directory and is therefore served to
// anyone. YouCam hands back masks as presigned S3 links carrying AWS
// credential identifiers and request signatures, so they are swapped for the
// paths of the baked copies before anything is written. They expire within the
// hour anyway — the committed images are the durable artefact, not the links.
const sanitized = JSON.parse(JSON.stringify(data)) as typeof data;
for (const item of sanitized?.results?.output ?? []) {
  if (!item.mask_urls?.length) continue;
  item.mask_urls = [`demo/replay/skin-masks/${item.type}.jpg`];
}

await writeFile(outPath, JSON.stringify({
  _provenance: {
    source: "PerfectCorp YouCam AI Skin Analysis (SD tier)",
    url: "https://docs.perfectcorp.com/reference/ai_skin_analysis/v2.1",
    note: "Real captured response for public/demo/persona-selfie.jpg, recorded by scripts/capture-demo-skin-analysis.ts.",
    capturedAt: new Date().toISOString(),
    dstActions: [...SKIN_DST_ACTIONS],
  },
  _sanitized:
    "mask_urls have been rewritten to the baked copies in demo/replay/skin-masks/. " +
    "The originals are presigned S3 URLs containing AWS credentials and signatures, and this file is served publicly. " +
    "Scores and provenance are exactly as returned by the API.",
  status: 200,
  data: sanitized,
}, null, 2) + "\n");
console.log("\nmask URLs printed above are presigned and expire — download them now if you need fresh copies.");
console.log("\nwrote", path.relative(publicDir, outPath));
console.log("credit after:", JSON.stringify(await credit()));
