import crypto from "node:crypto";
import type {
  ColorFamily,
  GarmentCategory,
  GarmentSource,
  NormalizedSkinSignals,
  OutfitCandidate,
  SessionMode,
  SessionStatusValue,
  Undertone,
  UserPreferences,
  VtoTaskStatus,
} from "../types";

/** Per-outfit Apparel VTO task state, tracked independently for each of the 3 selected outfits. */
export interface LiveVtoTaskState {
  catalogItemId: string;
  status: VtoTaskStatus;
  taskId: string | null;
  resultImageUrl: string | null;
  errorMessage: string | null;
}

/**
 * Bonus Image-to-Video task state for the single recommended outfit, run
 * after all Apparel VTO tasks resolve. "skipped" means no outfit's try-on
 * succeeded, so there was nothing to animate.
 */
export type LiveVideoStatus = "queued" | "running" | "success" | "error" | "skipped";

export interface LiveVideoState {
  catalogItemId: string | null;
  status: LiveVideoStatus;
  taskId: string | null;
  videoUrl: string | null;
  errorMessage: string | null;
}

/**
 * Live Mode "custom garment" state: the single-item alternative to
 * `selectedOutfits`/`vtoTasks` above, populated only when the session's
 * `garmentSource` is "custom". `vto.catalogItemId` is always the constant
 * "custom" so the shared VTO/video task-state shape can be reused as-is.
 */
export interface CustomGarmentLiveState {
  garmentCategory: GarmentCategory;
  colorFamily: ColorFamily;
  undertone: Undertone;
  vto: LiveVtoTaskState;
}

/**
 * Live Mode pipeline state. Only ever populated for `mode: "live"` sessions.
 * Deliberately holds no raw image bytes and no YouCam API key — just task
 * ids, statuses, and normalized results, all safe to round-trip through a
 * signed token the browser can see. `selectedOutfits`/`vtoTasks` are used
 * for the "catalog" garment source; `custom` is used for the "custom" one —
 * exactly one of the two is ever populated for a given session.
 */
export interface LiveSessionState {
  /** True once Skin Analysis has resolved (success OR graceful fallback) and outfits are selected. */
  skinResolved: boolean;
  skinTaskId: string | null;
  skinSignals: NormalizedSkinSignals | null;
  selectedOutfits: OutfitCandidate[] | null;
  vtoTasks: LiveVtoTaskState[] | null;
  custom: CustomGarmentLiveState | null;
  /** Null until all VTO tasks are terminal — see `liveProcessing.ts`. */
  video: LiveVideoState | null;
}

/**
 * Stateless, HMAC-signed session tokens. There is no database for this
 * product — the entire session lives inside the signed token that the
 * client echoes back on every call. Demo Mode progress is derived from
 * elapsed wall-clock time; Live Mode progress is derived from `live` below,
 * which is advanced by one real YouCam status check per outstanding task,
 * per poll (see `./liveProcessing.ts`). Either way, no mutable state lives
 * on the server, so any server instance can verify and advance any token.
 *
 * Deliberately excludes the custom-garment photo itself (see
 * `garmentImageStore.ts`) — embedding raw/base64 image bytes here would
 * make this token, which is echoed back as a request header on every poll,
 * large enough to trip HTTP header size limits.
 */
export interface SessionPayload {
  sessionId: string;
  mode: SessionMode;
  preferences: UserPreferences;
  /** Always "catalog" for Demo Mode sessions — see `createSessionPayload`. */
  garmentSource: GarmentSource;
  status: SessionStatusValue;
  createdAt: string;
  analyzeStartedAt: string | null;
  errorMessage: string | null;
  live: LiveSessionState | null;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is required to sign EventReady session tokens.",
    );
  }
  return secret;
}

function sign(payloadB64: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

export function signSessionToken(payload: SessionPayload): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const payloadB64 = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  let expected: string;
  try {
    expected = sign(payloadB64);
  } catch {
    return null;
  }

  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

export function createSessionPayload(
  mode: SessionMode,
  preferences: UserPreferences,
  garmentSource: GarmentSource = "catalog",
): SessionPayload {
  return {
    sessionId: crypto.randomUUID(),
    mode,
    preferences,
    // Demo Mode only ever replays the fixed catalog-flow persona — there's
    // no pre-captured demo asset for an arbitrary custom-garment upload.
    garmentSource: mode === "demo" ? "catalog" : garmentSource,
    status: "created",
    createdAt: new Date().toISOString(),
    analyzeStartedAt: null,
    errorMessage: null,
    live: null,
  };
}
