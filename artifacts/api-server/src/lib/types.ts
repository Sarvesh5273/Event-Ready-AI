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

export type ReasonCode =
  | "wedding_guest_match"
  | "style_vibe_match"
  | "budget_match"
  | "cool_tone_supports_redness"
  | "matte_finish_supports_oiliness"
  | "contrast_supports_tired_eye_area"
  | "soft_color_supports_low_radiance"
  | "bold_color_matches_vibe"
  | "classic_silhouette_matches_vibe"
  | "high_shine_camera_caution"
  | "warm_tone_redness_caution"
  | "budget_mismatch"
  | "style_vibe_mismatch";

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

export interface EventReadyReport {
  sessionId: string;
  mode: SessionMode;
  recommendedCatalogItemId: string;
  skinSignals: NormalizedSkinSignals;
  selectedOutfits: OutfitCandidate[];
  vtoResults: VtoResult[];
  scores: OutfitScore[];
  prepTips: string[];
  video: EventReadyVideo | null;
}
