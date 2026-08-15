import { YouCamApiError } from '../youcam/types';
import type { LiveSessionState } from './sessionToken';
import type { MeasurementNotice } from '../types';

/**
 * Turns a YouCam failure into something the user can act on.
 *
 * The live pipeline is deliberately forgiving: if the selfie tasks fail it
 * substitutes neutral skin signals and drops the palette rather than killing
 * the session. That is the right behaviour — a rejected photo should not lose
 * the try-on work — but on its own it is silent, and a results page with no
 * palette and no explanation reads as broken rather than as honest.
 *
 * So the *reason* travels alongside the fallback. Only a short code lives in
 * the session token (it is echoed as an HTTP header on every poll, and this
 * token has tripped HTTP 431 before), and the human-readable copy is derived
 * here at report-build time where size costs nothing.
 */

/**
 * Extracts a compact, storable reason code from a thrown error.
 * Prefers YouCam's own code; falls back to the HTTP status so a service
 * fault is still distinguishable from a rejected photo.
 */
export function measurementCodeFromError(err: unknown): string {
  if (err instanceof YouCamApiError) {
    return err.errorCode ?? `http_${err.status}`;
  }
  return 'unknown';
}

interface NoticeCopy {
  reason: string;
  action: string;
  retakeHelps: boolean;
}

/**
 * Matched on substrings rather than exact equality: YouCam documents these
 * codes inconsistently and has more of them than are listed here, so an
 * unrecognised code must still produce sensible copy instead of nothing.
 */
const CODE_COPY: ReadonlyArray<{ match: string; copy: NoticeCopy }> = [
  {
    match: 'face_too_small',
    copy: {
      reason: 'your face was too small in the photo for a reliable colour reading',
      action: 'Retake it closer — head and shoulders filling most of the frame.',
      retakeHelps: true,
    },
  },
  {
    match: 'no_face',
    copy: {
      reason: "we couldn't find a face in the photo",
      action: 'Retake it facing the camera, with your whole face visible.',
      retakeHelps: true,
    },
  },
  {
    match: 'multiple_face',
    copy: {
      reason: 'the photo has more than one face in it',
      action: 'Retake it with just you in frame.',
      retakeHelps: true,
    },
  },
  {
    match: 'no_skin_color',
    copy: {
      reason: "the analysis came back without a usable reading of your skin",
      action: 'Retake it in even, natural light — no strong filters or shadows.',
      retakeHelps: true,
    },
  },
  {
    match: 'timeout',
    copy: {
      reason: 'the measurement took too long and timed out',
      action: 'This is usually temporary — try again in a moment.',
      retakeHelps: false,
    },
  },
  {
    match: 'image',
    copy: {
      reason: "the photo couldn't be read",
      action: 'Try a standard JPEG or PNG photo taken on your phone.',
      retakeHelps: true,
    },
  },
];

const FALLBACK: NoticeCopy = {
  reason: "the colour measurement didn't complete",
  action: 'This is usually temporary — try again in a moment.',
  retakeHelps: false,
};

function copyForCode(code: string): NoticeCopy {
  const lower = code.toLowerCase();
  return CODE_COPY.find((entry) => lower.includes(entry.match))?.copy ?? FALLBACK;
}

/**
 * Builds the notice for a finished live session, or null when everything the
 * user cares about was actually measured.
 *
 * A missing palette is the serious case: it silently removes the personal
 * colour reading, the proof shot and the shopping section all at once, so it
 * takes priority in the copy even if the skin read also failed.
 */
export function buildMeasurementNotice(live: LiveSessionState | null | undefined): MeasurementNotice | null {
  if (!live) return null;

  const paletteMissing = live.tones === null;
  const toneCode = live.toneFailureCode ?? null;
  const skinCode = live.skinFailureCode ?? null;

  if (!paletteMissing && !skinCode) return null;

  if (paletteMissing) {
    const code = toneCode ?? 'unknown';
    const { reason, action, retakeHelps } = copyForCode(code);
    return {
      code,
      scope: skinCode ? 'both' : 'palette',
      title: "We couldn't measure your colouring",
      detail:
        `We stopped because ${reason}. Rather than guess a palette, we left it out — ` +
        `every colour verdict here comes from a real measurement of your face. ${action}`,
      retakeHelps,
    };
  }

  const code = skinCode ?? 'unknown';
  const { reason, action, retakeHelps } = copyForCode(code);
  return {
    code,
    scope: 'skin',
    title: 'Your skin reading is unavailable',
    detail:
      `Your colour palette came through, but the skin analysis stopped because ${reason}. ` +
      `Fabric and finish tips that depend on it are left out rather than guessed. ${action}`,
    retakeHelps,
  };
}
