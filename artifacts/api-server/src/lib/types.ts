// Shared TypeScript types for the EventReady AI domain. These mirror the
// shapes defined in `lib/api-spec/openapi.yaml`. Every API response is still
// validated against the generated Zod schemas at the route boundary — these
// types exist so the rule-engine/library code isn't written against `any`.

import type { ColorReport } from "./color/report";

export type { ColorReport };

export type StyleVibe = "classic" | "bold";
export type StyleVibeOrEither = "classic" | "bold" | "either";
export type SessionMode = "demo" | "live";
export type SessionStatusValue = "created" | "processing" | "ready" | "error";
import type { ColorVerdict } from "./color/match";

export type GarmentCategory = "full_body" | "upper_body" | "lower_body";
export type ColorFamily =
  | "navy"
  | "emerald"
  | "sage"
  | "black"
  | "rose"
  | "champagne"
  | "lavender"
  | "teal"
  | "burgundy"
  | "coral"
  | "mustard"
  | "ivory"
  | "terracotta";
export type Undertone = "cool" | "warm" | "neutral";
export type FabricFinish = "matte" | "soft_sheen" | "high_shine";
export type Silhouette =
  | "midi_dress"
  | "slip_dress"
  | "jumpsuit"
  | "blazer_set"
  | "maxi_dress"
  | "wrap_dress"
  | "saree"
  | "lehenga"
  | "anarkali"
  | "sharara"
  | "qipao"
  | "hanbok"
  | "ao_dai"
  | "abaya"
  | "kaftan";

/**
 * The dressing tradition a garment belongs to. Wedding guests do not all
 * dress Western, and the try-on model was verified to render draped and
 * layered garments (saree pallu, lehenga dupatta, hanbok chima, abaya)
 * correctly, so the catalog is not restricted to Western silhouettes.
 */
export type GarmentTradition = "western" | "indian" | "east_asian" | "middle_eastern";

/** A tradition filter for the shortlist, plus "any" for the whole catalog. */
export type TraditionPreference = GarmentTradition | "any";
export type SkinSignalLevel = "low" | "medium" | "high" | "unknown";
export type VtoTaskStatus = "queued" | "running" | "success" | "error";

/**
 * "catalog" recommends from the curated wedding-guest catalog (the original
 * flow). "custom" lets the user upload a garment they already have in mind
 * and get a skin/color compatibility read on it — Live Mode only, since
 * there's no pre-captured demo asset for an arbitrary upload.
 */
export type GarmentSource = "catalog" | "custom";

export type ReasonCode =
  | "wedding_guest_match"
  | "style_vibe_match"
  | "cool_tone_supports_redness"
  | "matte_finish_supports_oiliness"
  | "matte_finish_supports_texture"
  | "contrast_supports_tired_eye_area"
  | "soft_color_supports_low_radiance"
  | "bold_color_matches_vibe"
  | "classic_silhouette_matches_vibe"
  | "high_shine_camera_caution"
  | "high_shine_texture_caution"
  | "warm_tone_redness_caution"
  | "style_vibe_mismatch"
  // Personal-colour verdicts, derived by comparing the garment's measured
  // colour to the palette measured from the user's own face.
  | "palette_hero_color"
  | "palette_harmonious_color"
  | "palette_neutral_color"
  | "palette_clash_color"
  | "palette_washed_out_color"
  | "color_reading_unavailable";

export interface UserPreferences {
  occasion: "wedding_guest";
  styleVibe: StyleVibe;
  /**
   * Which dressing tradition to shortlist from. "any" spans the whole
   * catalog; anything else is a hard filter rather than a scoring nudge —
   * someone who came here for a saree does not want a jumpsuit ranked above
   * it because the jumpsuit scored two points better on finish.
   */
  tradition: TraditionPreference;
}

export interface CatalogItem {
  id: string;
  name: string;
  garmentCategory: GarmentCategory;
  tradition: GarmentTradition;
  imageUrl: string;
  /**
   * The garment's actual colour, sampled from its product photo rather than
   * typed in by hand. This is what the personal-colour engine scores against:
   * a measured colour can be compared to a measured complexion, whereas the
   * older `colorFamily`/`undertone` labels were our own opinion of the
   * garment and could not be computed for anything outside this catalog.
   */
  colorHex: string;
  styleVibe: StyleVibeOrEither;
  colorFamily: ColorFamily;
  undertone: Undertone;
  fabricFinish: FabricFinish;
  silhouette: Silhouette;
  occasionTags: string[];
}

export interface NormalizedSkinSignals {
  redness: SkinSignalLevel;
  oiliness: SkinSignalLevel;
  darkCircles: SkinSignalLevel;
  radiance: SkinSignalLevel;
  moisture: SkinSignalLevel;
  texture: SkinSignalLevel;
}

/** The six concerns YouCam AI Skin Analysis measures for us. */
export type SkinConcern = keyof NormalizedSkinSignals;

/** One measured concern and the mask showing where on the face it was found. */
export interface SkinConcernOverlay {
  concern: SkinConcern;
  level: SkinSignalLevel;
  maskUrl: string;
}

/**
 * The visual evidence behind the skin reading.
 *
 * `baseImageUrl` is YouCam's own normalised copy of the selfie. The masks are
 * aligned to that frame and to nothing else, so a client must never composite
 * them over the original upload.
 */
export interface SkinOverlaySet {
  baseImageUrl: string;
  overlays: SkinConcernOverlay[];
}

export interface OutfitCandidate {
  item: CatalogItem;
  selectionReasons: ReasonCode[];
}

export interface VtoResult {
  catalogItemId: string;
  status: VtoTaskStatus;
  resultImageUrl: string | null;
  errorMessage: string | null;
}

export interface OutfitScore {
  catalogItemId: string;
  confidenceScore: number;
  reasonCodes: ReasonCode[];
  cautionCodes: ReasonCode[];
  userFacingReasons: string[];
  userFacingCautions: string[];
}

export type VideoTaskStatus = "success" | "error" | "skipped";

/**
 * Optional bonus short clip animating the recommended outfit's successful
 * try-on image (YouCam AI Image to Video Generator). Live Mode only —
 * always `null` in Demo Mode, and only ever "skipped" if no outfit's
 * try-on succeeded to animate in the first place.
 */
export interface EventReadyVideo {
  status: VideoTaskStatus;
  videoUrl: string | null;
}

/**
 * Skin/color compatibility read for a garment the user uploaded themselves
 * (the "custom" flow). Deliberately a NARROWER signal than `OutfitScore`:
 * there's no occasion or style preference to check a self-picked
 * garment against, and fabric finish can't be reliably read from a photo,
 * so this only ever reflects color/undertone-driven skin fit + try-on
 * success. Keep it a distinct type (and distinct UI label) so it's never
 * confused with the fuller catalog confidence score.
 */
export interface CustomGarmentScore {
  confidenceScore: number;
  reasonCodes: ReasonCode[];
  cautionCodes: ReasonCode[];
  userFacingReasons: string[];
  userFacingCautions: string[];
}

/** Present on the report only when `flow` is "custom". */
export interface CustomGarmentResult {
  garmentCategory: GarmentCategory;
  colorFamily: ColorFamily;
  undertone: Undertone;
  /** Data URL of the user's own uploaded garment photo, for display. */
  imageUrl: string;
  vtoStatus: VtoTaskStatus;
  vtoResultImageUrl: string | null;
  vtoErrorMessage: string | null;
  /** Null only while try-on is still queued/running. */
  score: CustomGarmentScore | null;
}

export interface EventReadyReport {
  sessionId: string;
  mode: SessionMode;
  flow: GarmentSource;
  /** Empty string when `flow` is "custom" — nothing catalog-based to recommend. */
  recommendedCatalogItemId: string;
  skinSignals: NormalizedSkinSignals;
  /**
   * Where each concern was measured on the face, or null when no usable masks
   * came back. Also null for a session whose skin analysis failed and fell
   * back to neutral defaults — an unmeasured face never gets an illustrative
   * overlay.
   */
  skinOverlay: SkinOverlaySet | null;
  selectedOutfits: OutfitCandidate[];
  vtoResults: VtoResult[];
  scores: OutfitScore[];
  prepTips: string[];
  video: EventReadyVideo | null;
  /** Non-null only when `flow` is "custom". */
  customGarment: CustomGarmentResult | null;
  /**
   * The personal colour reading, or null when the colour-tones task returned
   * nothing usable. Null means no palette was measured — the UI must say so
   * rather than falling back to a default palette.
   */
  colorAnalysis: ColorReport | null;
  /**
   * The side-by-side colour proof, or null when one cannot be honestly
   * assembled. See `ProofShot`.
   */
  proofShot: ProofShot | null;
}

/** One half of the side-by-side proof: a real garment, tried on for real. */
export interface ProofShotSide {
  catalogItemId: string;
  name: string;
  /** Sampled from the product photo, not hand-labelled. */
  colorHex: string;
  colorFamily: ColorFamily;
  /** The try-on render on the user's own body. */
  tryOnImageUrl: string;
  colorPoints: number;
  verdict: ColorVerdict;
  headline: string;
}

/**
 * Two garments of the *same silhouette* — the best and worst colour match for
 * this person — rendered on their own body.
 *
 * This is what makes the recommendation checkable instead of merely asserted:
 * one variable changes, so whatever the viewer sees is attributable to colour
 * and nothing else. Null whenever that claim cannot be made honestly.
 */
export interface ProofShot {
  silhouette: Silhouette;
  /** Colour-points difference between the two halves. */
  gap: number;
  /** Top of the colour-points scale, so clients can render `gap` proportionally. */
  maxPoints: number;
  best: ProofShotSide;
  worst: ProofShotSide;
}
