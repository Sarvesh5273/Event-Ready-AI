import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Catalog garment photos live in the frontend artifact's `public/` folder
 * (`artifacts/eventready-ai/public/demo/outfits/*.jpg`), not in this
 * package. We read them directly off disk (same monorepo checkout) rather
 * than fetching them over HTTP, since that works identically in dev and
 * production without depending on the frontend's public domain being
 * reachable from YouCam's servers.
 *
 * esbuild bundles this whole package into a single `dist/index.mjs` for the
 * real server (`artifacts/api-server/dist/index.mjs`), but this module is
 * also imported directly from source (e.g. `tsx`) in tests/scripts — those
 * two cases have different numbers of directories between this file and the
 * monorepo root. Rather than hardcode a directory count, walk upward until
 * we find `pnpm-workspace.yaml`, which only exists at the monorepo root.
 */
function findMonorepoRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`Could not locate monorepo root (pnpm-workspace.yaml) above ${startDir}`);
    }
    dir = parent;
  }
}

const monorepoRoot = findMonorepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const FRONTEND_PUBLIC_DIR = path.join(monorepoRoot, "artifacts/eventready-ai/public");

export interface GarmentImage {
  bytes: Buffer;
  contentType: string;
}

function guessContentType(filePath: string): string {
  return filePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
}

/** Reads a catalog item's `imageUrl` (e.g. `demo/outfits/x.jpg`) off disk. */
export async function readGarmentImage(relativeImageUrl: string): Promise<GarmentImage> {
  const filePath = path.join(FRONTEND_PUBLIC_DIR, relativeImageUrl);
  const bytes = await readFile(filePath);
  return { bytes, contentType: guessContentType(filePath) };
}
