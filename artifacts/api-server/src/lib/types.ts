// Shared TypeScript types for the EventReady AI domain. These mirror the
// shapes defined in `lib/api-spec/openapi.yaml`. Every API response is still
// validated against the generated Zod schemas at the route boundary — these
// types exist so the rule-engine/library code isn't written against `any`.

export type StyleVibe = "classic" | "bold";
export type StyleVibeOrEither = "classic" | "bold" | "either";
export type BudgetTier = "low" | "mid" | "high";
export type SessionMode = "demo" | "live";
export type SessionStatusValue = "created" | "processing" | "ready" | "error";
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
  | "burgundy";
export type Undertone = "cool" | "warm" | "neutral";
export type FabricFinish = "matte" | "soft_sheen" | "high_shine";
export type Silhouette =
  | "midi_dress"
  | "slip_dress"
  | "jumpsuit"
  | "blazer_set"
  | "maxi_dress"
  | "wrap_dress";
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
  | "budget_match"
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
  | "budget_mismatch"
  | "style_vibe_mismatch"
  // Personal-colour verdicts, derived by comparing the garment's measured
  // colour to the palette measured from the user's own face.
  | "palette_hero_color"
  | "palette_harmonious_color"
  | "palette_neutral_color"
  | "palette_clash_color"
  | "color_reading_unavailable";

export interface UserPreferences {
  occasion: "wedding_guest";
  styleVibe: StyleVibe;
  budgetTier: BudgetTier;
}

export interface CatalogItem {
  id: string;
  name: string;
  garmentCategory: GarmentCategory;
  imageUrl: string;
  /**
   * The garment's actual colour, sampled from its product photo rather than
   * typed in by hand. This is what the personal-colour engine scores against:
   * a measured colour can be compared to a measured complexion, whereas the
   * older `colorFamily`/`undertone` labels were our own opinion of the
   * garment and could not be computed for anything outside this catalog.
   */
  colorHex: string;
  priceTier: BudgetTier;
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
 * there's no occasion/style/budget preference to check a self-picked
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
  selectedOutfits: OutfitCandidate[];
  vtoResults: VtoResult[];
  scores: OutfitScore[];
  prepTips: string[];
  video: EventReadyVideo | null;
  /** Non-null only when `flow` is "custom". */
  customGarment: CustomGarmentResult | null;
}
