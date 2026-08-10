import type { SessionStatusValue } from "../types";
import type { SessionPayload } from "./sessionToken";

/** The 4 sequential steps shown on the Processing screen, in order. */
export const PROCESSING_STEPS = [
  "Reading skin signals",
  "Selecting event-ready looks",
  "Generating try-ons",
  "Ranking the results",
] as const;

const STEP_DURATION_MS = 1800;
export const TOTAL_PROCESSING_MS = PROCESSING_STEPS.length * STEP_DURATION_MS;

export interface EffectiveState {
  status: SessionStatusValue;
  currentStep: number;
}

/**
 * Derives the "live" status/step for a session purely from elapsed time
 * since `analyzeStartedAt`. There is no background job or timer running on
 * the server — every poll recomputes this from scratch, which is what lets
 * the session stay fully stateless.
 */
export function computeEffectiveState(payload: SessionPayload, nowMs: number): EffectiveState {
  if (payload.status === "created") {
    return { status: "created", currentStep: 0 };
  }

  if (payload.status !== "processing" || !payload.analyzeStartedAt) {
    // "ready" or "error" are terminal states set explicitly by the route
    // handlers (live-mode errors immediately; demo-mode becomes ready once
    // elapsed time below passes the total).
    return { status: payload.status, currentStep: PROCESSING_STEPS.length - 1 };
  }

  const elapsed = nowMs - Date.parse(payload.analyzeStartedAt);

  if (elapsed >= TOTAL_PROCESSING_MS) {
    return { status: "ready", currentStep: PROCESSING_STEPS.length - 1 };
  }

  const currentStep = Math.max(0, Math.min(PROCESSING_STEPS.length - 1, Math.floor(elapsed / STEP_DURATION_MS)));
  return { status: "processing", currentStep };
}
