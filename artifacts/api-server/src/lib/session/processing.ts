import type { GarmentSource, SessionStatusValue } from "../types";
import type { LiveSessionState, SessionPayload } from "./sessionToken";

/** The 4 sequential steps shown on the Processing screen, in order. */
export const PROCESSING_STEPS = [
  "Reading skin signals",
  "Selecting event-ready looks",
  "Generating try-ons",
  "Ranking the results",
] as const;

/**
 * Extra step shown only for Live Mode while the bonus outfit video is being
 * generated. Not included in `PROCESSING_STEPS` because Demo Mode must never
 * see it, and the shared `TOTAL_PROCESSING_MS` timing must not change.
 */
const LIVE_VIDEO_STEP = "Bringing your look to life" as const;

const STEP_DURATION_MS = 1800;
export const TOTAL_PROCESSING_MS = PROCESSING_STEPS.length * STEP_DURATION_MS;

export interface EffectiveState {
  status: SessionStatusValue;
  currentStep: number;
  /** The ordered step labels to display. May include the video step for Live Mode. */
  steps: readonly string[];
}

/**
 * Maps a Live Mode pipeline's current progress onto step indices.
 * Returns the step index and whether the bonus video step should be appended.
 */
function computeLiveStep(live: LiveSessionState, garmentSource: GarmentSource): { step: number; includeVideoStep: boolean } {
  if (!live.skinResolved) return { step: 0, includeVideoStep: false };

  if (garmentSource === "custom") {
    const vto = live.custom?.vto;
    if (!vto) return { step: 1, includeVideoStep: false }; // custom state not initialized yet

    const terminal = vto.status === "success" || vto.status === "error";
    if (!terminal) {
      return { step: vto.status === "running" ? 2 : 1, includeVideoStep: false };
    }

    const videoInProgress = live.video?.status === "queued" || live.video?.status === "running";
    if (videoInProgress) {
      return { step: PROCESSING_STEPS.length, includeVideoStep: true };
    }

    return { step: PROCESSING_STEPS.length - 1, includeVideoStep: false };
  }

  const vtoTasks = live.vtoTasks ?? [];
  if (vtoTasks.length === 0) return { step: 1, includeVideoStep: false }; // outfits not selected/VTO not started yet

  const allTerminal = vtoTasks.every((t) => t.status === "success" || t.status === "error");
  if (!allTerminal) {
    const anyStarted = vtoTasks.some((t) => t.status !== "queued");
    return { step: anyStarted ? 2 : 1, includeVideoStep: false };
  }

  // All VTO tasks are done. Check whether the video task is still in flight.
  const videoInProgress = live.video?.status === "queued" || live.video?.status === "running";
  if (videoInProgress) {
    // Step index 4 (the 5th slot) — only visible when includeVideoStep is true.
    return { step: PROCESSING_STEPS.length, includeVideoStep: true };
  }

  return { step: PROCESSING_STEPS.length - 1, includeVideoStep: false };
}

/**
 * Derives the current status/step for a session.
 *
 * Demo Mode has no real backend work to track, so its progress is simulated
 * purely from elapsed time since `analyzeStartedAt` — there is no
 * background job or timer running on the server, every poll recomputes this
 * from scratch, which is what lets the session stay fully stateless.
 *
 * Live Mode has real, unpredictable-duration YouCam tasks, so its progress
 * comes directly from `payload.live` instead (advanced by one status check
 * per outstanding task per poll — see `liveProcessing.ts`). `status` itself
 * is still set explicitly by the route/orchestration code for Live Mode
 * (not derived here) once all VTO tasks resolve.
 */
export function computeEffectiveState(payload: SessionPayload, nowMs: number): EffectiveState {
  if (payload.status === "created") {
    return { status: "created", currentStep: 0, steps: PROCESSING_STEPS };
  }

  if (payload.status === "ready" || payload.status === "error") {
    return { status: payload.status, currentStep: PROCESSING_STEPS.length - 1, steps: PROCESSING_STEPS };
  }

  // status === "processing"
  if (payload.mode === "live") {
    if (payload.live) {
      const { step, includeVideoStep } = computeLiveStep(payload.live, payload.garmentSource);
      const steps = includeVideoStep ? [...PROCESSING_STEPS, LIVE_VIDEO_STEP] : PROCESSING_STEPS;
      return { status: "processing", currentStep: step, steps };
    }
    return { status: "processing", currentStep: 0, steps: PROCESSING_STEPS };
  }

  if (!payload.analyzeStartedAt) {
    return { status: payload.status, currentStep: PROCESSING_STEPS.length - 1, steps: PROCESSING_STEPS };
  }

  const elapsed = nowMs - Date.parse(payload.analyzeStartedAt);

  if (elapsed >= TOTAL_PROCESSING_MS) {
    return { status: "ready", currentStep: PROCESSING_STEPS.length - 1, steps: PROCESSING_STEPS };
  }

  const currentStep = Math.max(0, Math.min(PROCESSING_STEPS.length - 1, Math.floor(elapsed / STEP_DURATION_MS)));
  return { status: "processing", currentStep, steps: PROCESSING_STEPS };
}
