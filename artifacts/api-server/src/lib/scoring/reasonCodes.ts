import type { ReasonCode } from "../types";

/**
 * User-facing copy for every reason code. Written to the approved,
 * non-medical language from the build spec: outfit/styling framing only,
 * never diagnostic or clinical claims about the user's skin.
 */
export const REASON_COPY: Record<ReasonCode, string> = {
  wedding_guest_match: "A strong match for a wedding guest look.",
  style_vibe_match: "Fits the vibe you chose.",
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
  style_vibe_mismatch: "Leans a different direction than the vibe you chose.",
  palette_hero_color: "This is one of your palette's strongest colors.",
  palette_harmonious_color: "This color sits comfortably inside your palette.",
  palette_neutral_color: "This color is neither a standout nor a problem for your palette.",
  palette_clash_color: "This color pulls against your natural coloring.",
  palette_washed_out_color:
    "This color sits at almost exactly your own lightness, so it flattens your face rather than lifting it.",
  color_reading_unavailable: "We couldn't read your coloring from your photo, so this score reflects fit and style only.",
  evening_sheen_match: "The sheen on this fabric catches evening light instead of falling flat under it.",
  evening_matte_flat: "A matte weave reads quieter under evening light than a fabric with some sheen.",
  daytime_matte_match: "A lower-shine fabric sits comfortably in daylight.",
  daytime_shine_heavy: "This much shine is a bolder choice under direct daylight.",
};

/**
 * Display order for reason chips, lowest number shown first.
 *
 * The results screen only has room for the first few reasons, so this — not the
 * order the scoring rules happen to run in — decides what a user actually
 * reads. Measured, personal findings outrank generic restatements of what they
 * typed in: "this colour sits inside your palette" earns its place ahead of "a
 * strong match for a wedding guest look", which is true of every item in a
 * wedding-guest catalog and so tells them nothing.
 *
 * Exhaustive by type, like `REASON_COPY`, so a new code has to make this choice
 * explicitly rather than defaulting to the bottom of the list.
 */
export const REASON_DISPLAY_PRIORITY: Record<ReasonCode, number> = {
  // Measured colouring, and the honest admission when it couldn't be measured.
  // This is the one thing a styling quiz cannot tell them, so it leads.
  palette_hero_color: 0,
  palette_clash_color: 0,
  palette_washed_out_color: 0,
  color_reading_unavailable: 0,
  palette_harmonious_color: 1,
  palette_neutral_color: 2,
  // The lighting they chose, applied to a real fabric property.
  evening_sheen_match: 3,
  evening_matte_flat: 3,
  daytime_matte_match: 3,
  daytime_shine_heavy: 3,
  // Driven by measured skin signals.
  cool_tone_supports_redness: 4,
  matte_finish_supports_oiliness: 4,
  matte_finish_supports_texture: 4,
  contrast_supports_tired_eye_area: 4,
  soft_color_supports_low_radiance: 4,
  high_shine_camera_caution: 4,
  high_shine_texture_caution: 4,
  warm_tone_redness_caution: 4,
  // Specific observations about the garment against the chosen vibe.
  bold_color_matches_vibe: 5,
  classic_silhouette_matches_vibe: 5,
  // Generic restatements of the user's own input, lowest value.
  style_vibe_match: 6,
  style_vibe_mismatch: 6,
  wedding_guest_match: 7,
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
  washed_out: "palette_washed_out_color",
} as const satisfies Record<string, ReasonCode>;
