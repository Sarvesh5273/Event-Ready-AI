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
  contrast_supports_tired_eye_area: "Richer contrast near the face keeps attention on the whole look.",
  soft_color_supports_low_radiance: "A softer palette gives the look a naturally polished glow.",
  bold_color_matches_vibe: "The bold color matches the vibe you chose.",
  classic_silhouette_matches_vibe: "The timeless silhouette matches the vibe you chose.",
  high_shine_camera_caution: "This fabric has more shine, which can catch bright event lighting differently than a matte finish.",
  warm_tone_redness_caution: "A cooler tone may sit a little more evenly than this warm tone under event lighting.",
  budget_mismatch: "Sits outside your selected budget.",
  style_vibe_mismatch: "Leans a different direction than the vibe you chose.",
};
