/**
 * One-off feasibility probe: does YouCam's Apparel VTO (cloth-v4) render
 * non-Western formalwear (saree, lehenga, anarkali, qipao, abaya) well
 * enough to build a "garment tradition" feature on?
 *
 * Costs 2 YouCam units per garment. Run with:
 *   pnpm --filter @workspace/api-server exec tsx scripts/vto-probe.ts
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { startYouCamClothesVto, checkYouCamClothesVtoStatus } from "../src/lib/youcam/clothesVto";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const PROBE_DIR = path.join(ROOT, "attached_assets/vto_probe");
const OUT_DIR = path.join(PROBE_DIR, "results");
const FULL_BODY = path.join(ROOT, "artifacts/eventready-ai/public/demo/persona-full-body.jpg");

const GARMENTS = [
  { id: "saree-teal-v2", label: "Indian saree (draped)" },
  { id: "lehenga-coral", label: "Indian lehenga (2-piece + dupatta)" },
  { id: "anarkali-navy", label: "Anarkali salwar kameez" },
  { id: "qipao-burgundy", label: "Chinese qipao / cheongsam" },
  { id: "abaya-champagne", label: "Abaya / formal kaftan" },
];

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 4 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const fullBody = await readFile(FULL_BODY);

  console.log(`Starting ${GARMENTS.length} VTO tasks (2 units each = ${GARMENTS.length * 2} units)\n`);

  const tasks = await Promise.all(
    GARMENTS.map(async (g) => {
      const garmentBytes = await readFile(path.join(PROBE_DIR, `${g.id}.jpg`));
      try {
        const { taskId } = await startYouCamClothesVto(
          fullBody,
          "image/jpeg",
          garmentBytes,
          "image/jpeg",
          "full_body",
        );
        console.log(`  started ${g.id} -> ${taskId}`);
        return { ...g, taskId, status: "running" as string, resultImageUrl: "", errorMessage: "" };
      } catch (err) {
        console.log(`  FAILED TO START ${g.id}: ${(err as Error).message}`);
        return { ...g, taskId: "", status: "error", resultImageUrl: "", errorMessage: (err as Error).message };
      }
    }),
  );

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline && tasks.some((t) => t.status === "running")) {
    await sleep(POLL_INTERVAL_MS);
    for (const t of tasks) {
      if (t.status !== "running") continue;
      try {
        const res = await checkYouCamClothesVtoStatus(t.taskId);
        if (res.status === "success" && res.resultImageUrl) {
          t.status = "success";
          t.resultImageUrl = res.resultImageUrl;
          console.log(`  ✓ ${t.id}`);
        } else if (res.status === "error") {
          t.status = "error";
          t.errorMessage = res.errorMessage ?? "unknown";
          console.log(`  ✗ ${t.id}: ${t.errorMessage}`);
        }
      } catch (err) {
        t.status = "error";
        t.errorMessage = (err as Error).message;
        console.log(`  ✗ ${t.id}: ${t.errorMessage}`);
      }
    }
  }

  console.log("\nDownloading results...");
  for (const t of tasks) {
    if (t.status !== "success") continue;
    const res = await fetch(t.resultImageUrl);
    await writeFile(path.join(OUT_DIR, `${t.id}.jpg`), Buffer.from(await res.arrayBuffer()));
  }

  console.log("\n=== PROBE RESULT ===");
  for (const t of tasks) {
    console.log(`${t.status === "success" ? "PASS" : "FAIL"}  ${t.label.padEnd(34)} ${t.status === "success" ? `results/${t.id}.jpg` : t.errorMessage}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
