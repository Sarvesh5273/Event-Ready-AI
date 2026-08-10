import type { ReasonCode } from "../types";

/**
 * User-facing copy for every reason code. Written to the approved,
 * non-medical language from the build spec: outfit/styling framing only,
 * never diagnostic or clinical claims about the user's skin.
 */
export const REASON_COPY: Record<ReasonCode, string> = {
  wedding_guest_match: "A strong match for a wedding guest look.",
  style_vibe_match: "Fits the vibe you chose.",
  budget_match: "In your selected price range.",
  cool_tone_supports_redness: "Cooler tones create a calm, balanced look on camera.",
  matte_finish_supports_oiliness: "A lower-shine fabric stays camera-stable under bright event lighting.",
  matte_finish_supports_texture: "A lower-shine fabric is more forgiving of skin texture under bright event lighting.",
  contrast_supports_tired_eye_area: "Richer contrast near the face keeps attention on the whole look.",
  soft_color_supports_low_radiance: "A softer palette gives the look a naturally polished glow.",
  bold_color_matches_vibe: "The bold color matches the vibe you chose.",
  classic_silhouette_matches_vibe: "The timeless silhouette matches the vibe you chose.",
  high_shine_camera_caution: "This fabric has more shine, which can catch bright event lighting differently than a matte finish.",
  high_shine_texture_caution: "This fabric's shine can draw more attention to skin texture under bright event lighting.",
  warm_tone_redness_caution: "A cooler tone may sit a little more evenly than this warm tone under event lighting.",
  budget_mismatch: "Sits outside your selected budget.",
  style_vibe_mismatch: "Leans a different direction than the vibe you chose.",
  palette_hero_color: "This is one of your palette's strongest colors.",
  palette_harmonious_color: "This color sits comfortably inside your palette.",
  palette_neutral_color: "This color is neither a standout nor a problem for your palette.",
  palette_clash_color: "This color pulls against your natural coloring.",
  color_reading_unavailable: "We couldn't read your coloring from your photo, so this score reflects fit and style only.",
};

/**
 * Reason chip for each verdict `judgeGarmentColor` can return. Shared by
 * shortlisting and final scoring so the two can never describe the same
 * garment's colour differently.
 */
export const COLOR_VERDICT_REASON = {
  hero: "palette_hero_color",
  harmonious: "palette_harmonious_color",
  neutral: "palette_neutral_color",
  clash: "palette_clash_color",
} as const satisfies Record<string, ReasonCode>;
