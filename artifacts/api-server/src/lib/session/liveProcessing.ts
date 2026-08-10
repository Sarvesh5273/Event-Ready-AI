import { logger } from "../logger";
import { weddingGuestCatalog } from "../catalog/weddingGuestCatalog";
import { NEUTRAL_SKIN_SIGNALS, normalizeSkinSignals, type RawSkinScores } from "../scoring/skinSignals";
import { selectOutfits } from "../scoring/selectOutfits";
import { readGarmentImage } from "../youcam/garmentAssets";
import { SKIN_DST_ACTIONS, checkYouCamSkinAnalysisStatus, startYouCamSkinAnalysis } from "../youcam/skinAnalysis";
import { checkYouCamClothesVtoStatus, startYouCamClothesVto } from "../youcam/clothesVto";
import { getCached, setCachedSuccess, skinCacheKey, vtoCacheKey } from "../cache/replayCache";
import {
  clearPendingLiveUpload,
  peekPendingLiveUpload,
  storePendingLiveUpload,
} from "./liveUploadStore";
import type { LiveSessionState, LiveVtoTaskState, SessionPayload } from "./sessionToken";

const OUTFIT_COUNT = 3;

export interface StartLiveAnalysisInput {
  selfieBytes: Buffer;
  selfieContentType: string;
  fullBodyBytes: Buffer;
  fullBodyContentType: string;
}

/**
 * Kicks off Live Mode processing for a freshly-created session: stashes the
 * uploaded photo bytes (needed again later — see `liveUploadStore.ts`),
 * starts (or replays from cache) the Skin Analysis task, then immediately
 * cascades forward via `advanceLiveSession` in case a cache hit already
 * resolved it. Never blocks on a YouCam task finishing.
 */
export async function startLiveAnalysis(payload: SessionPayload, input: StartLiveAnalysisInput): Promise<SessionPayload> {
  storePendingLiveUpload(
    payload.sessionId,
    input.selfieBytes,
    input.selfieContentType,
    input.fullBodyBytes,
    input.fullBodyContentType,
  );

  let live: LiveSessionState = {
    skinResolved: false,
    skinTaskId: null,
    skinSignals: null,
    selectedOutfits: null,
    vtoTasks: null,
  };

  const cached = getCached<RawSkinScores>(skinCacheKey(input.selfieBytes, SKIN_DST_ACTIONS));
  if (cached) {
    live = { ...live, skinResolved: true, skinSignals: normalizeSkinSignals(cached) };
  } else {
    try {
      const { taskId } = await startYouCamSkinAnalysis(input.selfieBytes, input.selfieContentType);
      live = { ...live, skinTaskId: taskId };
    } catch (err) {
      logger.warn(
        { err, sessionId: payload.sessionId },
        "Failed to start YouCam Skin Analysis — falling back to neutral signals",
      );
      live = { ...live, skinResolved: true, skinSignals: NEUTRAL_SKIN_SIGNALS };
    }
  }

  const next: SessionPayload = {
    ...payload,
    status: "processing",
    analyzeStartedAt: new Date().toISOString(),
    errorMessage: null,
    live,
  };

  return advanceLiveSession(next);
}

/**
 * Advances a Live Mode session by exactly one step of real work per call:
 * at most one Skin Analysis status check, then (once resolved) at most one
 * "start" or one status check per outstanding VTO task. Never blocks
 * waiting for a task to finish — safe and expected to be called from every
 * `/status` poll as well as once from `/analyze`.
 */
export async function advanceLiveSession(payload: SessionPayload): Promise<SessionPayload> {
  if (!payload.live) return payload;
  let live = payload.live;

  if (!live.skinResolved && live.skinTaskId) {
    live = await checkSkinTask(payload.sessionId, live);
  }

  if (live.skinResolved && !live.selectedOutfits) {
    live = selectLiveOutfits(payload, live);
  }

  if (live.selectedOutfits && live.vtoTasks) {
    const hasQueued = live.vtoTasks.some((t) => t.status === "queued");
    live = hasQueued
      ? await startQueuedVtoTasks(payload.sessionId, live)
      : await checkRunningVtoTasks(payload.sessionId, live);
  }

  const next: SessionPayload = { ...payload, live };

  const allVtoTerminal =
    live.vtoTasks !== null && live.vtoTasks.length > 0 && live.vtoTasks.every((t) => t.status === "success" || t.status === "error");
  if (allVtoTerminal) {
    next.status = "ready";
    clearPendingLiveUpload(payload.sessionId);
  }

  return next;
}

async function checkSkinTask(sessionId: string, live: LiveSessionState): Promise<LiveSessionState> {
  try {
    const result = await checkYouCamSkinAnalysisStatus(live.skinTaskId!);

    if (result.status === "success" && result.rawScores) {
      const pending = peekPendingLiveUpload(sessionId);
      if (pending) {
        setCachedSuccess(skinCacheKey(pending.selfieBytes, SKIN_DST_ACTIONS), result.rawScores);
      }
      return { ...live, skinResolved: true, skinSignals: normalizeSkinSignals(result.rawScores) };
    }

    if (result.status === "error") {
      logger.warn({ sessionId }, "YouCam Skin Analysis task failed — falling back to neutral signals");
      return { ...live, skinResolved: true, skinSignals: NEUTRAL_SKIN_SIGNALS };
    }

    return live; // still running — check again next poll
  } catch (err) {
    logger.warn({ err, sessionId }, "Skin Analysis status check errored — falling back to neutral signals");
    return { ...live, skinResolved: true, skinSignals: NEUTRAL_SKIN_SIGNALS };
  }
}

function selectLiveOutfits(payload: SessionPayload, live: LiveSessionState): LiveSessionState {
  const selectedOutfits = selectOutfits({
    catalog: weddingGuestCatalog,
    preferences: payload.preferences,
    skinSignals: live.skinSignals ?? NEUTRAL_SKIN_SIGNALS,
    count: OUTFIT_COUNT,
  });

  const vtoTasks: LiveVtoTaskState[] = selectedOutfits.map(({ item }) => ({
    catalogItemId: item.id,
    status: "queued",
    taskId: null,
    resultImageUrl: null,
    errorMessage: null,
  }));

  return { ...live, selectedOutfits, vtoTasks };
}

async function startQueuedVtoTasks(sessionId: string, live: LiveSessionState): Promise<LiveSessionState> {
  const pending = peekPendingLiveUpload(sessionId);
  const items = live.selectedOutfits ?? [];

  if (!pending) {
    logger.warn({ sessionId }, "No pending photo upload found — cannot start VTO tasks");
    const vtoTasks = (live.vtoTasks ?? []).map((task) =>
      task.status === "queued"
        ? { ...task, status: "error" as const, errorMessage: "Your photo upload expired before try-on could start." }
        : task,
    );
    return { ...live, vtoTasks };
  }

  const vtoTasks = await Promise.all(
    (live.vtoTasks ?? []).map(async (task): Promise<LiveVtoTaskState> => {
      if (task.status !== "queued") return task;

      const item = items.find((o) => o.item.id === task.catalogItemId)?.item;
      if (!item) {
        return { ...task, status: "error", errorMessage: "Outfit could not be found in the catalog." };
      }

      try {
        const garment = await readGarmentImage(item.imageUrl);
        const cacheKey = vtoCacheKey(pending.fullBodyBytes, garment.bytes, item.garmentCategory);
        const cached = getCached<{ resultImageUrl: string }>(cacheKey);
        if (cached) {
          return { ...task, status: "success", resultImageUrl: cached.resultImageUrl };
        }

        const { taskId } = await startYouCamClothesVto(
          pending.fullBodyBytes,
          pending.fullBodyContentType,
          garment.bytes,
          garment.contentType,
          item.garmentCategory,
        );
        return { ...task, status: "running", taskId };
      } catch (err) {
        logger.warn({ err, sessionId, catalogItemId: item.id }, "Failed to start YouCam Apparel VTO task");
        return { ...task, status: "error", errorMessage: "This try-on couldn't be generated right now." };
      }
    }),
  );

  return { ...live, vtoTasks };
}

async function checkRunningVtoTasks(sessionId: string, live: LiveSessionState): Promise<LiveSessionState> {
  const pending = peekPendingLiveUpload(sessionId);
  const items = live.selectedOutfits ?? [];

  const vtoTasks = await Promise.all(
    (live.vtoTasks ?? []).map(async (task): Promise<LiveVtoTaskState> => {
      if (task.status !== "running" || !task.taskId) return task;

      try {
        const result = await checkYouCamClothesVtoStatus(task.taskId);

        if (result.status === "success" && result.resultImageUrl) {
          await cacheVtoSuccessBestEffort(pending, items, task.catalogItemId, result.resultImageUrl);
          return { ...task, status: "success", resultImageUrl: result.resultImageUrl };
        }

        if (result.status === "error") {
          return { ...task, status: "error", errorMessage: result.errorMessage ?? "This try-on couldn't be generated." };
        }

        return task; // still running — check again next poll
      } catch (err) {
        logger.warn({ err, sessionId, catalogItemId: task.catalogItemId }, "VTO status check errored");
        return { ...task, status: "error", errorMessage: "This try-on couldn't be generated." };
      }
    }),
  );

  return { ...live, vtoTasks };
}

async function cacheVtoSuccessBestEffort(
  pending: ReturnType<typeof peekPendingLiveUpload>,
  items: NonNullable<LiveSessionState["selectedOutfits"]>,
  catalogItemId: string,
  resultImageUrl: string,
): Promise<void> {
  if (!pending) return;
  const item = items.find((o) => o.item.id === catalogItemId)?.item;
  if (!item) return;
  try {
    const garment = await readGarmentImage(item.imageUrl);
    setCachedSuccess(vtoCacheKey(pending.fullBodyBytes, garment.bytes, item.garmentCategory), { resultImageUrl });
  } catch (err) {
    logger.debug({ err, catalogItemId }, "Best-effort VTO cache write failed — not fatal");
  }
}
