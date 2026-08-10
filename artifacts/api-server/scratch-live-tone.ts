import { readFileSync } from "node:fs";
import { uploadFileToYouCam } from "./src/lib/youcam/client";
import { startYouCamSkinToneAnalysis, checkYouCamSkinToneAnalysisStatus } from "./src/lib/youcam/skinToneAnalysis";
import { analyzeColorSeason, describeAxes } from "./src/lib/color/season";
import { judgeGarmentColor, pickProofPair } from "./src/lib/color/match";

const path = "/home/runner/workspace/artifacts/eventready-ai/public/demo/persona-selfie.jpg";
const bytes = readFileSync(path);
console.log(`selfie: ${path} (${(bytes.length / 1024).toFixed(0)} KB)`);

const { fileId } = await uploadFileToYouCam(bytes, "image/jpeg", "selfie.jpg");
console.log("uploaded, file_id:", fileId);

const { taskId } = await startYouCamSkinToneAnalysis(fileId);
console.log("tone task:", taskId);

for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const s = await checkYouCamSkinToneAnalysisStatus(taskId);
  process.stdout.write(`  poll ${i + 1}: ${s.status}\n`);
  if (s.status === "success" && s.tones) {
    console.log("\nMEASURED:", JSON.stringify(s.tones, null, 2));
    const a = analyzeColorSeason(s.tones);
    if (!a) { console.log("analysis returned null"); break; }
    console.log(`\n=> ${a.seasonLabel} (dominant ${a.dominantTrait}, confidence ${a.confidence})`);
    console.log(`   ${describeAxes(a.axes)}  [temp ${a.axes.temperature.toFixed(2)} value ${a.axes.value.toFixed(2)} chroma ${a.axes.chroma.toFixed(2)}]`);
    console.log(`   ${a.tagline}`);
    const pair = pickProofPair(a);
    console.log(`   proof pair: ${pair?.best.name} (${pair?.best.hex}) vs ${pair?.worst.name} (${pair?.worst.hex})`);
    console.log("   hero:", a.heroColors.map((c) => c.name).join(", "));
    console.log("\n   catalog colours judged against this person:");
    for (const g of [
      { hex: "#1B2A41", label: "classic navy midi" }, { hex: "#046A38", label: "emerald maxi" },
      { hex: "#6E1423", label: "burgundy wrap" }, { hex: "#E8D5A8", label: "champagne satin" },
      { hex: "#9CAF88", label: "sage blazer" }, { hex: "#C3B2D9", label: "lavender slip" },
    ]) {
      const m = judgeGarmentColor(g.hex, a);
      console.log(`     ${g.label.padEnd(20)} ${String(m?.points).padStart(2)}pts  ${m?.verdict.padEnd(11)} ${m?.headline}`);
    }
    break;
  }
  if (s.status === "error") { console.log("ERROR:", s.errorMessage); break; }
}
