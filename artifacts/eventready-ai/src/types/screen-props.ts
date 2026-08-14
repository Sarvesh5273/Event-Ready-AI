import type {
  StyleVibe,
  TraditionPreference,
  EventReadyReport,
  GarmentCategory,
  SessionVideo,
} from "@workspace/api-client-react";

export interface StartScreenProps {
  onStart: () => void;
  onUseDemoPersona: () => void;
  /** "Already have something in mind?" — jumps straight to the custom-garment upload flow. */
  onStartCustom: () => void;
}

export interface PreferencesScreenProps {
  styleVibe: StyleVibe;
  onStyleVibeChange: (vibe: StyleVibe) => void;
  tradition: TraditionPreference;
  onTraditionChange: (tradition: TraditionPreference) => void;
  onContinue: () => void;
  onBack: () => void;
  /** True when the user already chose "Use demo persona" — continuing skips the photo step. */
  wantsDemoPersona: boolean;
}

export interface PhotoUploadScreenProps {
  /** "custom" adds a third (garment) upload + category picker and hides the demo-persona shortcut. */
  flow: "catalog" | "custom";
  selfiePreviewUrl: string | null;
  fullBodyPreviewUrl: string | null;
  onSelfieSelected: (file: File | null) => void;
  onFullBodySelected: (file: File | null) => void;
  onUseDemoPersona: () => void;
  onContinue: () => void;
  onBack: () => void;
  /** Disable the Continue button until the required photos (and, for "custom", the garment photo) are chosen. */
  canContinue: boolean;
  isSubmitting: boolean;
  /** Custom flow only. */
  garmentPreviewUrl: string | null;
  onGarmentSelected: (file: File | null) => void;
  garmentCategory: GarmentCategory;
  onGarmentCategoryChange: (category: GarmentCategory) => void;
}

export interface ProcessingScreenProps {
  steps: string[];
  currentStep: number;
  /** Present when the (stubbed) live pipeline has already failed — e.g. Live Mode. */
  errorMessage: string | null;
  onRetryWithDemoPersona: () => void;
  onBack: () => void;
}

/**
 * The bonus outfit video is generated only when the user asks for it (it is
 * the most expensive call in the pipeline), so results screens receive its
 * state and trigger rather than reading a video off the report.
 */
export interface OutfitVideoProps {
  video: SessionVideo | null;
  onGenerateVideo: () => void;
  isGeneratingVideo: boolean;
  videoError: string | null;
}

export interface ResultsScreenProps extends OutfitVideoProps {
  report: EventReadyReport;
  isDemoMode: boolean;
  onStartOver: () => void;
}

export interface DemoModeBannerProps {
  className?: string;
}
