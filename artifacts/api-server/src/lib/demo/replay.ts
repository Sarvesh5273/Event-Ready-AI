import type { FacialColorTones } from "../color/season";
import type { RawSkinScores } from "../scoring/skinSignals";
import { PREP_TIPS } from "../content/prepTips";

/**
 * Fixed Demo Mode replay data for the "Maya" persona. Everything here is
 * baked ahead of time (no live YouCam calls): the raw skin scores stand in
 * for a captured Skin Analysis response, and the 3 catalog items below are
 * the only ones with a pre-rendered try-on image, so Demo Mode always
 * selects from just these three. Live user preferences (style vibe)
 * still run through the real `selectOutfits`/`scoreOutfits` rule engine
 * against this fixed data — only the underlying photos are canned.
 */
export const DEMO_PERSONA_NAME = "Maya";

export const DEMO_REPLAY_CATALOG_ITEM_IDS = [
  "bold-emerald-jumpsuit",
  "soft-sage-slip",
  "champagne-satin-gown",
] as const;

/**
 * Concern-direction skin scores for the demo persona, derived from a REAL
 * captured YouCam Skin Analysis response — see
 * `public/demo/replay/skin-result-raw.json`, recorded by
 * `scripts/capture-demo-skin-analysis.ts`.
 *
 * These were previously hand-written from the API reference because no key
 * was available when Demo Mode was built, which made the numbers plausible
 * but fictional. They are now the genuine measurement, which is why they
 * read much healthier than the placeholders did (real redness 15, not 74).
 * Do not hand-tune them: re-run the capture script instead.
 */
export const DEMO_RAW_SKIN_SCORES: RawSkinScores = {
  redness: 15,
  oiliness: 45,
  darkCircles: 33,
  radiance: 6,
  moisture: 36,
  texture: 4,
};

/**
 * A real recorded YouCam Facial Colour Tones response for the demo persona
 * selfie (`public/demo/persona-selfie.jpg`) — captured from a live call, not
 * invented, exactly like `DEMO_RAW_SKIN_SCORES` above. Replaying it keeps
 * Demo Mode's palette identical to what Live Mode produces for the same
 * photo, so the two modes can never tell the user different things about the
 * same face.
 */
export const DEMO_FACIAL_TONES: FacialColorTones = {
  skinColor: "#a68063",
  hairColor: "#B56637",
  hairColorName: "Auburn",
  eyeColor: "#5e3d29",
  eyeColorName: "Brown",
  lipColor: "#d37770",
  eyebrowColor: "#3e3834",
};

/**
 * Every try-on render that exists for the demo persona.
 *
 * The first three back the shortlist. The last two are the proof pair — the
 * same wrap-dress cut in the colour her measured palette likes most and the
 * one it likes least — and exist so Demo Mode can show the side-by-side
 * without a live call. All five were produced by the same YouCam Cloth VTO
 * endpoint Live Mode uses, so nothing here is an illustration.
 *
 * Demo Mode derives its proof pair from exactly this set: it can only prove
 * what it has real renders for.
 */
export const DEMO_VTO_IMAGE_BY_CATALOG_ID: Record<string, string> = {
  "bold-emerald-jumpsuit": "demo/replay/vto-bold-emerald-jumpsuit.jpg",
  "soft-sage-slip": "demo/replay/vto-soft-sage-slip.jpg",
  "champagne-satin-gown": "demo/replay/vto-champagne-satin-gown.jpg",
  "rose-wrap-low": "demo/replay/vto-rose-wrap-low.jpg",
  "navy-wrap-dress": "demo/replay/vto-navy-wrap-dress.jpg",
  // The demo persona reads True Autumn, and the widest same-silhouette colour
  // gap available to her is emerald against lilac — a 28-point spread where
  // the lilac washes out against her skin rather than merely mismatching it.
  // Without these two the proof section has no pair to draw and disappears.
  "bold-emerald-kaftan": "demo/replay/vto-bold-emerald-kaftan.jpg",
  "classic-lilac-kaftan": "demo/replay/vto-classic-lilac-kaftan.jpg",
  // Proof pairs are filtered by tradition, so the kaftans above cover "any"
  // and non-western traditions but leave a western visitor with no pair at
  // all. This is the western half: burgundy against the rose wrap dress.
  "burgundy-wrap-midi": "demo/replay/vto-burgundy-wrap-midi.jpg",
};

/** @deprecated use `PREP_TIPS` from `../content/prepTips` directly — kept as a re-export for backward compatibility. */
export const DEMO_PREP_TIPS = PREP_TIPS;

export const DEMO_PERSONA_SELFIE_IMAGE_URL = "demo/persona-selfie.jpg";
export const DEMO_PERSONA_FULL_BODY_IMAGE_URL = "demo/persona-full-body.jpg";

/**
 * The demo persona's skin overlay assets, captured in the same run as
 * `DEMO_RAW_SKIN_SCORES` by `scripts/capture-demo-skin-analysis.ts`.
 *
 * YouCam serves masks as short-lived S3 links, so the images are committed
 * here rather than referenced remotely — a demo that depends on an expiring
 * URL is a demo that breaks the week after it is recorded.
 *
 * The base image is YouCam's own normalised copy of the selfie. The masks are
 * aligned to that frame and to nothing else, which is why Demo Mode shows it
 * rather than `DEMO_PERSONA_SELFIE_IMAGE_URL`.
 */
export const DEMO_SKIN_OVERLAY_BASE_IMAGE_URL = "demo/replay/skin-masks/resize_image.jpg";

export const DEMO_SKIN_OVERLAY_MASK_URL_BY_CONCERN: Record<keyof RawSkinScores, string> = {
  redness: "demo/replay/skin-masks/redness.jpg",
  oiliness: "demo/replay/skin-masks/oiliness.jpg",
  darkCircles: "demo/replay/skin-masks/dark_circle_v2.jpg",
  radiance: "demo/replay/skin-masks/radiance.jpg",
  moisture: "demo/replay/skin-masks/moisture.jpg",
  texture: "demo/replay/skin-masks/texture.jpg",
};

/**
 * Pre-baked demo video for the bold-emerald-jumpsuit outfit — generated once
 * offline via the YouCam Image-to-Video API against the canned VTO image.
 * Served as a static public asset, so Demo Mode always has a video without
 * any live API cost.
 */
export const DEMO_VIDEO_URL = "demo/replay/video-bold-emerald-jumpsuit.mp4";

/** Catalog item whose VTO image was used to generate DEMO_VIDEO_URL. */
export const DEMO_VIDEO_CATALOG_ITEM_ID = "bold-emerald-jumpsuit";
