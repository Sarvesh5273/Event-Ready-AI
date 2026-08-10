/**
 * Static Demo Mode assets. These are fixed images shipped with the app
 * (see `public/demo/`), not returned by the API — they represent the
 * "already captured" selfie/full-body photo for the Maya demo persona.
 */
const base = import.meta.env.BASE_URL;

export const DEMO_PERSONA_NAME = "Maya";
export const DEMO_PERSONA_SELFIE_URL = `${base}demo/persona-selfie.jpg`;
export const DEMO_PERSONA_FULL_BODY_URL = `${base}demo/persona-full-body.jpg`;

/** Resolves a server-provided relative asset path (e.g. `demo/outfits/x.jpg`) against this app's base URL. */
export function resolveDemoAssetUrl(relativePath: string): string {
  return `${base}${relativePath}`;
}
