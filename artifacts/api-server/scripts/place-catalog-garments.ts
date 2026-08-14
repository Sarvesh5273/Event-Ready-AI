/**
 * Copies the generated non-Western garment shots into the frontend's public
 * catalog folder and reports each one's measured dominant colour, using the
 * *same* extractor the running product uses on user-uploaded garments — so
 * the catalog's `colorHex` values are sampled from the real product photo
 * rather than typed in by hand, and any weakness in the extractor shows up
 * here rather than silently skewing recommendations.
 *
 * Run with: cd scripts && pnpm exec tsx ../artifacts/api-server/scripts/place-catalog-garments.ts
 */
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { analyzeGarmentColors, extractGarmentColor } from "../src/lib/youcam/garmentColor";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const OUT_DIR = path.join(ROOT, "artifacts/eventready-ai/public/demo/outfits");

/** [sourceFile, finalCatalogId] */
const PLACEMENTS: Array<[string, string]> = [
  // --- Indian ---
  ["vto_probe/saree-teal-v2.jpg", "classic-teal-saree"],
  ["vto_probe/lehenga-coral.jpg", "bold-coral-lehenga"],
  ["vto_probe/anarkali-navy.jpg", "classic-navy-anarkali"],
  ["vto_probe/catalog/saree-mustard.jpg", "bold-mustard-saree"],
  ["vto_probe/catalog/lehenga-ivory.jpg", "classic-ivory-lehenga"],
  ["vto_probe/catalog/sharara-emerald.jpg", "bold-emerald-sharara"],
  // --- East Asian ---
  ["vto_probe/qipao-burgundy.jpg", "bold-burgundy-qipao"],
  ["vto_probe/catalog/hanbok-blush.jpg", "classic-blush-hanbok"],
  ["vto_probe/catalog/qipao-jade.jpg", "soft-jade-qipao"],
  ["vto_probe/catalog/aodai-champagne.jpg", "classic-champagne-aodai"],
  ["vto_probe/catalog/hanbok-indigo.jpg", "bold-indigo-hanbok"],
  ["vto_probe/catalog/qipao-blush.jpg", "classic-blush-qipao"],
  // --- Middle Eastern ---
  ["vto_probe/abaya-champagne.jpg", "classic-champagne-abaya"],
  ["vto_probe/catalog/kaftan-emerald.jpg", "bold-emerald-kaftan"],
  ["vto_probe/catalog/abaya-dustyrose.jpg", "classic-rose-abaya"],
  ["vto_probe/catalog/kaftan-navy.jpg", "classic-navy-kaftan"],
  ["vto_probe/catalog/abaya-terracotta.jpg", "bold-terracotta-abaya"],
  ["vto_probe/catalog/kaftan-lilac.jpg", "classic-lilac-kaftan"],
];

const VERBOSE = process.argv.includes("--clusters");
const hex = (c: [number, number, number]) =>
  `#${c.map((n) => Math.round(n).toString(16).padStart(2, "0")).join("")}`;

await mkdir(OUT_DIR, { recursive: true });

for (const [src, id] of PLACEMENTS) {
  const to = path.join(OUT_DIR, `${id}.jpg`);
  await copyFile(path.join(ROOT, "attached_assets", src), to);
  const bytes = await readFile(to);
  const { colorHex, colorFamily, undertone } = await extractGarmentColor(bytes);
  console.log(`${id.padEnd(26)} ${colorHex ?? "null"}  ${colorFamily.padEnd(11)} ${undertone}`);

  if (VERBOSE) {
    const { garmentShare, usedFallback, clusters } = await analyzeGarmentColors(bytes);
    console.log(`    garment ${(garmentShare * 100).toFixed(1)}% of frame${usedFallback ? "  (FELL BACK to whole frame)" : ""}`);
    for (const c of [...clusters].sort((a, b) => b.share - a.share)) {
      console.log(`    ${hex(c.centroid)}  ${(c.share * 100).toFixed(1).padStart(5)}%`);
    }
  }
}

// Re-report the existing Western catalog through the same extractor, so a
// change to it can be checked against the hand-checked values already in
// `weddingGuestCatalog.ts` rather than being trusted blind.
console.log("\n--- existing western catalog, re-measured ---");
const { weddingGuestCatalog } = await import("../src/lib/catalog/weddingGuestCatalog");
console.log(`${"id".padEnd(26)} ${"cluster".padEnd(9)} ${"median".padEnd(9)} hand-checked`);
for (const item of weddingGuestCatalog) {
  const file = path.join(ROOT, "artifacts/eventready-ai/public", item.imageUrl);
  const bytes = await readFile(file);
  const { colorHex } = await extractGarmentColor(bytes);
  const { median } = await analyzeGarmentColors(bytes);
  console.log(`${item.id.padEnd(26)} ${(colorHex ?? "null").padEnd(9)} ${(median ? hex(median) : "null").padEnd(9)} ${item.colorHex}`);
}
