import type { RawSkinScores } from "../scoring/skinSignals";
import { PREP_TIPS } from "../content/prepTips";

/**
 * Fixed Demo Mode replay data for the "Maya" persona. Everything here is
 * baked ahead of time (no live YouCam calls): the raw skin scores stand in
 * for a captured Skin Analysis response, and the 3 catalog items below are
 * the only ones with a pre-rendered try-on image, so Demo Mode always
 * selects from just these three. Live user preferences (style vibe, budget)
 * still run through the real `selectOutfits`/`scoreOutfits` rule engine
 * against this fixed data — only the underlying photos are canned.
 */
export const DEMO_PERSONA_NAME = "Maya";

export const DEMO_REPLAY_CATALOG_ITEM_IDS = [
  "bold-emerald-jumpsuit",
  "soft-sage-slip",
  "champagne-satin-gown",
] as const;

export const DEMO_RAW_SKIN_SCORES: RawSkinScores = {
  redness: 74,
  oiliness: 70,
  darkCircles: 40,
  radiance: 30,
  moisture: 55,
  texture: 45,
};

export const DEMO_VTO_IMAGE_BY_CATALOG_ID: Record<string, string> = {
  "bold-emerald-jumpsuit": "demo/replay/vto-bold-emerald-jumpsuit.jpg",
  "soft-sage-slip": "demo/replay/vto-soft-sage-slip.jpg",
  "champagne-satin-gown": "demo/replay/vto-champagne-satin-gown.jpg",
};

/** @deprecated use `PREP_TIPS` from `../content/prepTips` directly — kept as a re-export for backward compatibility. */
export const DEMO_PREP_TIPS = PREP_TIPS;

export const DEMO_PERSONA_SELFIE_IMAGE_URL = "demo/persona-selfie.jpg";
export const DEMO_PERSONA_FULL_BODY_IMAGE_URL = "demo/persona-full-body.jpg";
