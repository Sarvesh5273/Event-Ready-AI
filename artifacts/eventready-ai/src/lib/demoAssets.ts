/**
 * Static Demo Mode assets. These are fixed images shipped with the app
 * (see `public/demo/`), not returned by the API — they represent the
 * "already captured" selfie/full-body photo for the Maya demo persona.
 */
const base = import.meta.env.BASE_URL;

export const DEMO_PERSONA_NAME = "Maya";
export const DEMO_PERSONA_SELFIE_URL = `${base}demo/persona-selfie.jpg`;
export const DEMO_PERSONA_FULL_BODY_URL = `${base}demo/persona-full-body.jpg`;

/**
 * Resolves a server-provided asset path for display.
 *
 * Two shapes come through this same field depending on mode:
 * - Demo Mode / catalog images: relative paths bundled with this app
 *   (e.g. `demo/outfits/x.jpg`), which need this app's base URL prefixed.
 * - Live Mode VTO results: absolute URLs returned directly by YouCam
 *   (e.g. `https://...`), which must be used exactly as given — prefixing
 *   them with the base URL would turn them into an invalid same-origin
 *   path like `/https://...` and the try-on image would fail to load.
 */
export function resolveDemoAssetUrl(assetPath: string): string {
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(assetPath)) {
    return assetPath;
  }
  return `${base}${assetPath}`;
}
