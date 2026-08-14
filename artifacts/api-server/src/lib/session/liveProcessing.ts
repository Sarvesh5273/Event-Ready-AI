import { logger } from "../logger";
import { weddingGuestCatalog } from "../catalog/weddingGuestCatalog";
import { NEUTRAL_SKIN_SIGNALS, normalizeSkinSignals, type RawSkinScores } from "../scoring/skinSignals";
import { selectOutfits } from "../scoring/selectOutfits";
import { pickRecommendedCatalogItemId, scoreOutfits } from "../scoring/scoreOutfits";
import { pickGarmentProofPair } from "../scoring/proofPair";
import { readGarmentImage } from "../youcam/garmentAssets";
import { extractGarmentColor } from "../youcam/garmentColor";
import { storeGarmentImage } from "./garmentImageStore";
import { SKIN_DST_ACTIONS, checkYouCamSkinAnalysisStatus, startYouCamSkinAnalysisWithFileId } from "../youcam/skinAnalysis";
import { checkYouCamSkinToneAnalysisStatus, startYouCamSkinToneAnalysis } from "../youcam/skinToneAnalysis";
import { uploadFileToYouCam } from "../youcam/client";
import { analyzeColorSeason, type FacialColorTones } from "../color/season";
import { checkYouCamClothesVtoStatus, startYouCamClothesVto } from "../youcam/clothesVto";
import { checkYouCamImageToVideoStatus, startYouCamImageToVideo } from "../youcam/imageToVideo";
import { getCached, setCachedSuccess, skinCacheKey, toneCacheKey, videoCacheKey, vtoCacheKey } from "../cache/replayCache";
import {
  clearPendingLiveUpload,
  peekPendingLiveUpload,
  storePendingLiveUpload,
} from "./liveUploadStore";
import type { CustomGarmentLiveState, LiveSessionState, LiveVideoState, LiveVtoTaskState, SessionPayload } from "./sessionToken";
import type { GarmentCategory, VtoResult } from "../types";

const OUTFIT_COUNT = 3;
/** Constant `catalogItemId` used for the single custom-garment VTO/video task. */
const CUSTOM_GARMENT_ID = "custom";

export interface StartLiveAnalysisInput {
  selfieBytes: Buffer;
  selfieContentType: string;
  fullBodyBytes: Buffer;
  fullBodyContentType: string;
  /** Present only when `payload.garmentSource === "custom"`. */
  garment?: {
    bytes: Buffer;
    contentType: string;
    category: GarmentCategory;
  };
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
    input.garment?.bytes,
    input.garment?.contentType,
  );

  let live: LiveSessionState = {
    skinResolved: false,
    skinTaskId: null,
    skinSignals: null,
    toneResolved: false,
    toneTaskId: null,
    tones: null,
    selectedOutfits: null,
    vtoTasks: null,
    custom: null,
    video: null,
  };

  live = await startSelfieTasks(payload.sessionId, live, input.selfieBytes, input.selfieContentType);

  if (payload.garmentSource === "custom" && input.garment) {
    // Stored separately from the token (see `garmentImageStore.ts`) and
    // served back via its own endpoint — never embedded here.
    storeGarmentImage(payload.sessionId, input.garment.bytes, input.garment.contentType);

    // Color extraction runs locally (no extra YouCam call) so it's safe to
    // do eagerly here rather than spreading it across polls.
    const { colorFamily, undertone, colorHex } = await extractGarmentColor(input.garment.bytes).catch((err) => {
      // A null `colorHex` means no colour judgement will be offered for this
      // garment at all. The family/undertone labels are descriptive only and
      // never feed the compatibility score, so a fallback label here cannot
      // put words in the analysis's mouth.
      logger.warn(
        { err, sessionId: payload.sessionId },
        "Garment colour extraction failed — no colour compatibility will be claimed for this garment",
      );
      return { colorFamily: "navy" as const, undertone: "neutral" as const, colorHex: null };
    });
    live = {
      ...live,
      custom: {
        garmentCategory: input.garment.category,
        colorFamily,
        undertone,
        colorHex,
        vto: { catalogItemId: CUSTOM_GARMENT_ID, status: "queued", taskId: null, resultImageUrl: null, errorMessage: null },
      },
    };
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
 * Starts both selfie-derived YouCam tasks — Skin Analysis (skin *concerns*)
 * and Facial Colour Tones (measured skin, hair and eye *colour*) — from a
 * single upload of the photo, since both read the same face.
 *
 * The two are independent, so one failing must not take the other down.
 * Skin concerns degrade to neutral signals. Colour tones degrade to null,
 * which downstream means "no personal-colour reading available" rather than
 * an error — see `checkToneTask` for why there is no neutral fallback for a
 * complexion.
 */
async function startSelfieTasks(
  sessionId: string,
  live: LiveSessionState,
  selfieBytes: Buffer,
  selfieContentType: string,
): Promise<LiveSessionState> {
  const cachedSkin = getCached<RawSkinScores>(skinCacheKey(selfieBytes, SKIN_DST_ACTIONS));
  const cachedTones = getCached<FacialColorTones>(toneCacheKey(selfieBytes));

  let next: LiveSessionState = { ...live };
  if (cachedSkin) next = { ...next, skinResolved: true, skinSignals: normalizeSkinSignals(cachedSkin) };
  if (cachedTones) next = { ...next, toneResolved: true, tones: cachedTones };
  if (cachedSkin && cachedTones) return next;

  let fileId: string;
  try {
    fileId = (await uploadFileToYouCam(selfieBytes, selfieContentType, `selfie_${Date.now()}.jpg`)).fileId;
  } catch (err) {
    logger.warn({ err, sessionId }, "Selfie upload to YouCam failed — continuing without skin or colour analysis");
    return { ...next, skinResolved: true, skinSignals: next.skinSignals ?? NEUTRAL_SKIN_SIGNALS, toneResolved: true };
  }

  if (!cachedSkin) {
    try {
      const { taskId } = await startYouCamSkinAnalysisWithFileId(fileId);
      next = { ...next, skinTaskId: taskId };
    } catch (err) {
      logger.warn({ err, sessionId }, "Failed to start YouCam Skin Analysis — falling back to neutral signals");
      next = { ...next, skinResolved: true, skinSignals: NEUTRAL_SKIN_SIGNALS };
    }
  }

  if (!cachedTones) {
    try {
      const { taskId } = await startYouCamSkinToneAnalysis(fileId);
      next = { ...next, toneTaskId: taskId };
    } catch (err) {
      logger.warn({ err, sessionId }, "Failed to start YouCam Facial Colour Tones — continuing without a palette");
      next = { ...next, toneResolved: true };
    }
  }

  return next;
}

/**
 * Advances a Live Mode session by exactly one step of real work per call.
 * Dispatches to the catalog (3-outfit) or custom (single-garment) pipeline
 * based on `garmentSource` — the two never run for the same session. Never
 * blocks waiting for a task to finish — safe and expected to be called from
 * every `/status` poll as well as once from `/analyze`.
 */
export async function advanceLiveSession(payload: SessionPayload): Promise<SessionPayload> {
  if (!payload.live) return payload;
  return payload.garmentSource === "custom" ? advanceCustomLiveSession(payload) : advanceCatalogLiveSession(payload);
}

async function advanceCatalogLiveSession(payload: SessionPayload): Promise<SessionPayload> {
  let live = resolveStalledSelfieTasks(payload, payload.live!);

  if (!live.skinResolved && live.skinTaskId) {
    live = await checkSkinTask(payload.sessionId, live);
  }

  if (!live.toneResolved && live.toneTaskId) {
    live = await checkToneTask(payload.sessionId, live);
  }

  // Outfit selection scores garments against the measured palette, so it has
  // to wait for both readings rather than just the skin concerns.
  if (live.skinResolved && live.toneResolved && !live.selectedOutfits) {
    live = selectLiveOutfits(payload, live);
  }

  if (live.selectedOutfits && live.vtoTasks) {
    const hasQueued = live.vtoTasks.some((t) => t.status === "queued");
    live = hasQueued
      ? await startQueuedVtoTasks(payload.sessionId, live)
      : await checkRunningVtoTasks(payload.sessionId, live);
  }

  const allVtoTerminal =
    live.vtoTasks !== null && live.vtoTasks.length > 0 && live.vtoTasks.every((t) => t.status === "success" || t.status === "error");

  // The bonus outfit video is deliberately NOT generated here. It is the
  // single most expensive call in the product, so it is only ever started
  // when the user explicitly asks for it on the results screen — see
  // `advanceVideoGeneration`. Reaching "ready" therefore no longer waits on
  // it, which also gets the user to their results noticeably sooner.
  if (allVtoTerminal) {
    clearPendingLiveUpload(payload.sessionId);
  }

  const next: SessionPayload = { ...payload, live };

  if (allVtoTerminal) {
    next.status = "ready";
  }

  return next;
}

/**
 * The "custom garment" mirror of `advanceCatalogLiveSession`: one VTO task
 * instead of three, and no outfit-selection or scoring step (there's
 * nothing to select — the user already supplied the one garment). The
 * bonus video step is otherwise identical, reusing `initVideoTask`'s
 * sibling `initCustomVideoTask` and the same `startVideoTask`/`checkVideoTask`
 * helpers (generalized to also look up the custom VTO result image).
 */
async function advanceCustomLiveSession(payload: SessionPayload): Promise<SessionPayload> {
  let live = resolveStalledSelfieTasks(payload, payload.live!);

  if (!live.skinResolved && live.skinTaskId) {
    live = await checkSkinTask(payload.sessionId, live);
  }

  if (!live.toneResolved && live.toneTaskId) {
    live = await checkToneTask(payload.sessionId, live);
  }

  // Unlike the catalog pipeline there is nothing to select, so the try-on —
  // by far the slowest step — starts as soon as the skin read lands rather
  // than waiting on the colour read running alongside it.
  if (live.skinResolved && live.custom) {
    live = live.custom.vto.status === "queued"
      ? await startCustomVtoTask(payload.sessionId, live)
      : live.custom.vto.status === "running"
        ? await checkCustomVtoTask(payload.sessionId, live)
        : live;
  }

  const vtoTerminal = live.custom !== null && (live.custom.vto.status === "success" || live.custom.vto.status === "error");

  if (vtoTerminal) {
    clearPendingLiveUpload(payload.sessionId);
  }

  const next: SessionPayload = { ...payload, live };

  if (vtoTerminal && live.toneResolved) {
    next.status = "ready";
  }

  return next;
}

/**
 * Advances the on-demand bonus video by exactly one step, mirroring how
 * `advanceLiveSession` treats every other YouCam task: init -> start ->
 * check, one network round trip per call, with all state living in the
 * signed token.
 *
 * Unlike the rest of the pipeline this is never called automatically. The
 * Image-to-Video call is the most expensive one in the product, so it runs
 * only when the user presses "Generate video" on the results screen, and
 * only for the one outfit the report actually recommends.
 */
export async function advanceVideoGeneration(payload: SessionPayload): Promise<SessionPayload> {
  if (!payload.live) return payload;

  let live = payload.live;
  if (!live.video) {
    live = payload.garmentSource === "custom" ? initCustomVideoTask(live) : initVideoTask(payload, live);
  }

  if (live.video?.status === "queued") {
    live = await startVideoTask(payload.sessionId, live);
  } else if (live.video?.status === "running") {
    live = await checkVideoTask(payload.sessionId, live);
  }

  return { ...payload, live };
}

async function startCustomVtoTask(sessionId: string, live: LiveSessionState): Promise<LiveSessionState> {
  const custom = live.custom;
  if (!custom || custom.vto.status !== "queued") return live;

  const pending = peekPendingLiveUpload(sessionId);
  if (!pending?.garmentBytes || !pending.garmentContentType) {
    logger.warn({ sessionId }, "No pending garment upload found — cannot start custom VTO task");
    return { ...live, custom: { ...custom, vto: { ...custom.vto, status: "error", errorMessage: "Your garment photo expired before try-on could start." } } };
  }

  try {
    const cacheKey = vtoCacheKey(pending.fullBodyBytes, pending.garmentBytes, custom.garmentCategory);
    const cached = getCached<{ resultImageUrl: string }>(cacheKey);
    if (cached) {
      return { ...live, custom: { ...custom, vto: { ...custom.vto, status: "success", resultImageUrl: cached.resultImageUrl } } };
    }

    const { taskId } = await startYouCamClothesVto(
      pending.fullBodyBytes,
      pending.fullBodyContentType,
      pending.garmentBytes,
      pending.garmentContentType,
      custom.garmentCategory,
    );
    return { ...live, custom: { ...custom, vto: { ...custom.vto, status: "running", taskId } } };
  } catch (err) {
    logger.warn({ err, sessionId }, "Failed to start YouCam Apparel VTO task for custom garment");
    return { ...live, custom: { ...custom, vto: { ...custom.vto, status: "error", errorMessage: "This try-on couldn't be generated right now." } } };
  }
}

async function checkCustomVtoTask(sessionId: string, live: LiveSessionState): Promise<LiveSessionState> {
  const custom = live.custom;
  if (!custom || custom.vto.status !== "running" || !custom.vto.taskId) return live;

  try {
    const result = await checkYouCamClothesVtoStatus(custom.vto.taskId);

    if (result.status === "success" && result.resultImageUrl) {
      const pending = peekPendingLiveUpload(sessionId);
      if (pending?.garmentBytes) {
        setCachedSuccess(vtoCacheKey(pending.fullBodyBytes, pending.garmentBytes, custom.garmentCategory), { resultImageUrl: result.resultImageUrl });
      }
      return { ...live, custom: { ...custom, vto: { ...custom.vto, status: "success", resultImageUrl: result.resultImageUrl } } };
    }

    if (result.status === "error") {
      return { ...live, custom: { ...custom, vto: { ...custom.vto, status: "error", errorMessage: result.errorMessage ?? "This try-on couldn't be generated." } } };
    }

    return live; // still running — check again next poll
  } catch (err) {
    logger.warn({ err, sessionId }, "Custom garment VTO status check errored");
    return { ...live, custom: { ...custom, vto: { ...custom.vto, status: "error", errorMessage: "This try-on couldn't be generated." } } };
  }
}

/** The custom-garment mirror of `initVideoTask` — always the single garment, no scoring needed to pick it. */
function initCustomVideoTask(live: LiveSessionState): LiveSessionState {
  const vto = live.custom?.vto;
  if (!vto || vto.status !== "success" || !vto.resultImageUrl) {
    return { ...live, video: { catalogItemId: null, status: "skipped", taskId: null, videoUrl: null, errorMessage: null } };
  }
  return { ...live, video: { catalogItemId: CUSTOM_GARMENT_ID, status: "queued", taskId: null, videoUrl: null, errorMessage: null } };
}

/** Resolves the successful try-on image to animate, for either the catalog or custom pipeline. */
function findVtoResultImageUrl(live: LiveSessionState, catalogItemId: string): string | null | undefined {
  if (catalogItemId === CUSTOM_GARMENT_ID) return live.custom?.vto.resultImageUrl;
  return (live.vtoTasks ?? []).find((t) => t.catalogItemId === catalogItemId)?.resultImageUrl;
}

/**
 * Decides which outfit (if any) the bonus video should animate, using the
 * exact same scoring + "only a successful try-on" rule the report builder
 * uses (`pickRecommendedCatalogItemId`), so the video is always of the
 * outfit the report actually recommends.
 */
function initVideoTask(payload: SessionPayload, live: LiveSessionState): LiveSessionState {
  const items = live.selectedOutfits ?? [];
  const vtoResults: VtoResult[] = (live.vtoTasks ?? []).map((t) => ({
    catalogItemId: t.catalogItemId,
    status: t.status === "queued" || t.status === "running" ? "error" : t.status,
    resultImageUrl: t.resultImageUrl,
    errorMessage: t.errorMessage,
  }));
  const scores = scoreOutfits({
    items: items.map((o) => o.item),
    preferences: payload.preferences,
    skinSignals: live.skinSignals ?? NEUTRAL_SKIN_SIGNALS,
    colorAnalysis: live.tones ? analyzeColorSeason(live.tones) : null,
    vtoResults,
  });

  const recommendedCatalogItemId = pickRecommendedCatalogItemId(scores, vtoResults);
  const recommendedImageUrl = recommendedCatalogItemId
    ? vtoResults.find((v) => v.catalogItemId === recommendedCatalogItemId)?.resultImageUrl ?? null
    : null;

  if (!recommendedCatalogItemId || !recommendedImageUrl) {
    // No outfit's try-on succeeded — nothing to animate.
    return {
      ...live,
      video: { catalogItemId: null, status: "skipped", taskId: null, videoUrl: null, errorMessage: null },
    };
  }

  return {
    ...live,
    video: { catalogItemId: recommendedCatalogItemId, status: "queued", taskId: null, videoUrl: null, errorMessage: null },
  };
}

async function startVideoTask(sessionId: string, live: LiveSessionState): Promise<LiveSessionState> {
  const video = live.video;
  if (!video || video.status !== "queued") return live;

  // video.catalogItemId is guaranteed set whenever status is "queued" (see initVideoTask/initCustomVideoTask).
  const srcImageUrl = findVtoResultImageUrl(live, video.catalogItemId!);
  if (!srcImageUrl) {
    return { ...live, video: { ...video, status: "error", errorMessage: "Try-on image was unexpectedly missing." } };
  }

  const cacheKey = videoCacheKey(srcImageUrl);
  const cached = getCached<{ videoUrl: string }>(cacheKey);
  if (cached) {
    return { ...live, video: { ...video, status: "success", videoUrl: cached.videoUrl } };
  }

  try {
    const { taskId } = await startYouCamImageToVideo(srcImageUrl);
    return { ...live, video: { ...video, status: "running", taskId } };
  } catch (err) {
    logger.warn({ err, sessionId, catalogItemId: video.catalogItemId }, "Failed to start YouCam Image to Video task");
    return { ...live, video: { ...video, status: "error", errorMessage: "The video couldn't be generated right now." } };
  }
}

async function checkVideoTask(sessionId: string, live: LiveSessionState): Promise<LiveSessionState> {
  const video = live.video;
  if (!video || video.status !== "running" || !video.taskId) return live;

  try {
    const result = await checkYouCamImageToVideoStatus(video.taskId);

    if (result.status === "success" && result.videoUrl) {
      const srcImageUrl = findVtoResultImageUrl(live, video.catalogItemId!);
      if (srcImageUrl) setCachedSuccess(videoCacheKey(srcImageUrl), { videoUrl: result.videoUrl });
      return { ...live, video: { ...video, status: "success", videoUrl: result.videoUrl } };
    }

    if (result.status === "error") {
      return { ...live, video: { ...video, status: "error", errorMessage: result.errorMessage ?? "The video couldn't be generated." } };
    }

    return live; // still running — check again next poll
  } catch (err) {
    logger.warn({ err, sessionId, catalogItemId: video.catalogItemId }, "Image to Video status check errored");
    return { ...live, video: { ...video, status: "error", errorMessage: "The video couldn't be generated." } };
  }
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

/**
 * Polls the Facial Colour Tones task.
 *
 * Note the asymmetry with `checkSkinTask`: that one falls back to neutral
 * skin-concern signals, but there is no honest neutral complexion to invent
 * here. Guessing one would hand the user a confidently wrong palette and a
 * "your best colours" verdict we never actually measured, which is worse
 * than having none. So a failure resolves the step with `tones` left null
 * and the report drops the personal-colour section instead of faking it.
 */
async function checkToneTask(sessionId: string, live: LiveSessionState): Promise<LiveSessionState> {
  try {
    const result = await checkYouCamSkinToneAnalysisStatus(live.toneTaskId!);

    if (result.status === "success" && result.tones) {
      const pending = peekPendingLiveUpload(sessionId);
      if (pending) setCachedSuccess(toneCacheKey(pending.selfieBytes), result.tones);
      return { ...live, toneResolved: true, tones: result.tones };
    }

    if (result.status === "error") {
      logger.warn(
        { sessionId, reason: result.errorMessage },
        "YouCam Facial Colour Tones failed — continuing without a palette",
      );
      return { ...live, toneResolved: true };
    }

    return live; // still running — check again next poll
  } catch (err) {
    logger.warn({ err, sessionId }, "Facial Colour Tones status check errored — continuing without a palette");
    return { ...live, toneResolved: true };
  }
}

/**
 * Longest we will wait for the selfie-derived tasks before giving up on
 * them. YouCam tasks normally resolve in seconds; one that has not finished
 * in two minutes is not going to.
 */
const SELFIE_TASK_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Stops the pipeline waiting forever on a selfie task that will never
 * resolve. Two distinct hazards:
 *
 * 1. No task and no result — the case for sessions whose tokens were signed
 *    before the colour step existed, whose `live` state has no tone fields
 *    at all. Both read as absent, so the step is simply treated as done.
 * 2. A task stuck `running` indefinitely. Polling alone has no upper bound,
 *    so without a deadline a single wedged provider task would leave the
 *    session spinning until the user gave up.
 *
 * The skin read degrades to neutral signals; the colour read degrades to no
 * palette at all, for the reasons in `checkToneTask`.
 */
function resolveStalledSelfieTasks(payload: SessionPayload, live: LiveSessionState): LiveSessionState {
  let next = live;

  if (!next.toneResolved && !next.toneTaskId) {
    next = { ...next, toneResolved: true };
  }

  const startedAt = payload.analyzeStartedAt ? Date.parse(payload.analyzeStartedAt) : NaN;
  const timedOut = Number.isFinite(startedAt) && Date.now() - startedAt > SELFIE_TASK_TIMEOUT_MS;
  if (!timedOut) return next;

  if (!next.skinResolved) {
    logger.warn({ sessionId: payload.sessionId }, "Skin Analysis timed out — falling back to neutral signals");
    next = { ...next, skinResolved: true, skinSignals: next.skinSignals ?? NEUTRAL_SKIN_SIGNALS };
  }
  if (!next.toneResolved) {
    logger.warn({ sessionId: payload.sessionId }, "Facial Colour Tones timed out — continuing without a palette");
    next = { ...next, toneResolved: true };
  }

  return next;
}

/**
 * Resolves the catalog item behind a VTO task.
 *
 * Not every try-on belongs to a shortlisted outfit. The unflattering half of
 * the proof pair is rendered deliberately and is kept out of
 * `selectedOutfits` precisely so it can never be scored or recommended, so
 * the lookup has to fall through to the full catalog or those tasks would
 * fail as "not found".
 */
function findCatalogItemForTask(live: LiveSessionState, catalogItemId: string) {
  return (
    (live.selectedOutfits ?? []).find((o) => o.item.id === catalogItemId)?.item ??
    weddingGuestCatalog.find((item) => item.id === catalogItemId)
  );
}

function selectLiveOutfits(payload: SessionPayload, live: LiveSessionState): LiveSessionState {
  const colorAnalysis = live.tones ? analyzeColorSeason(live.tones) : null;

  // The pair is chosen before the shortlist, because the shortlist depends on
  // it: the unflattering half has to be kept out of the recommendations.
  //
  // It is intentionally not persisted on the session. It is a pure function of
  // the catalog, the preferences and the measured tones — all of which the
  // report can already see — and live state is serialised into the session
  // token on every response, where payload size has bitten us before.
  // Recomputing is free; carrying it is not.
  const proofPair = pickGarmentProofPair({
    catalog: weddingGuestCatalog,
    preferences: payload.preferences,
    colorAnalysis,
  });

  const selectedOutfits = selectOutfits({
    catalog: weddingGuestCatalog,
    preferences: payload.preferences,
    skinSignals: live.skinSignals ?? NEUTRAL_SKIN_SIGNALS,
    colorAnalysis,
    count: OUTFIT_COUNT,
    // Otherwise the app could recommend the exact garment the proof shot is
    // about to label "not your colour".
    excludeIds: proofPair ? [proofPair.worst.id] : undefined,
  });

  // Try on the unflattering half of the pair as well. It is never shortlisted
  // and never recommended; it exists so the colour verdict can be checked
  // against the user's own body on a garment of identical cut.
  const vtoItemIds = selectedOutfits.map(({ item }) => item.id);
  for (const id of [proofPair?.best.id, proofPair?.worst.id]) {
    if (id && !vtoItemIds.includes(id)) vtoItemIds.push(id);
  }

  const vtoTasks: LiveVtoTaskState[] = vtoItemIds.map((catalogItemId) => ({
    catalogItemId,
    status: "queued",
    taskId: null,
    resultImageUrl: null,
    errorMessage: null,
  }));

  return { ...live, selectedOutfits, vtoTasks };
}

async function startQueuedVtoTasks(sessionId: string, live: LiveSessionState): Promise<LiveSessionState> {
  const pending = peekPendingLiveUpload(sessionId);

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

      const item = findCatalogItemForTask(live, task.catalogItemId);
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

  const vtoTasks = await Promise.all(
    (live.vtoTasks ?? []).map(async (task): Promise<LiveVtoTaskState> => {
      if (task.status !== "running" || !task.taskId) return task;

      try {
        const result = await checkYouCamClothesVtoStatus(task.taskId);

        if (result.status === "success" && result.resultImageUrl) {
          await cacheVtoSuccessBestEffort(pending, live, task.catalogItemId, result.resultImageUrl);
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
  live: LiveSessionState,
  catalogItemId: string,
  resultImageUrl: string,
): Promise<void> {
  if (!pending) return;
  const item = findCatalogItemForTask(live, catalogItemId);
  if (!item) return;
  try {
    const garment = await readGarmentImage(item.imageUrl);
    setCachedSuccess(vtoCacheKey(pending.fullBodyBytes, garment.bytes, item.garmentCategory), { resultImageUrl });
  } catch (err) {
    logger.debug({ err, catalogItemId }, "Best-effort VTO cache write failed — not fatal");
  }
}
