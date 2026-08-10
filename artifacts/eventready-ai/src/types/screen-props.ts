import type { StyleVibe, BudgetTier, EventReadyReport } from "@workspace/api-client-react";

export interface StartScreenProps {
  onStart: () => void;
  onUseDemoPersona: () => void;
}

export interface PreferencesScreenProps {
  styleVibe: StyleVibe;
  budgetTier: BudgetTier;
  onStyleVibeChange: (vibe: StyleVibe) => void;
  onBudgetTierChange: (tier: BudgetTier) => void;
  onContinue: () => void;
  onBack: () => void;
  /** True when the user already chose "Use demo persona" — continuing skips the photo step. */
  wantsDemoPersona: boolean;
}

export interface PhotoUploadScreenProps {
  selfiePreviewUrl: string | null;
  fullBodyPreviewUrl: string | null;
  onSelfieSelected: (file: File | null) => void;
  onFullBodySelected: (file: File | null) => void;
  onUseDemoPersona: () => void;
  onContinue: () => void;
  onBack: () => void;
  /** Disable the Continue button until both photos are chosen. */
  canContinue: boolean;
  isSubmitting: boolean;
}

export interface ProcessingScreenProps {
  steps: string[];
  currentStep: number;
  /** Present when the (stubbed) live pipeline has already failed — e.g. Live Mode. */
  errorMessage: string | null;
  onRetryWithDemoPersona: () => void;
  onBack: () => void;
}

export interface ResultsScreenProps {
  report: EventReadyReport;
  isDemoMode: boolean;
  onStartOver: () => void;
}

export interface DemoModeBannerProps {
  className?: string;
}
