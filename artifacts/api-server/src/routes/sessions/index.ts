import { Router, type IRouter } from "express";
import {
  CreateSessionBody,
  CreateSessionResponse,
  StartSessionAnalysisParams,
  StartSessionAnalysisBody,
  StartSessionAnalysisResponse,
  GetSessionStatusParams,
  GetSessionStatusHeader,
  GetSessionStatusResponse,
  GetSessionReportParams,
  GetSessionReportHeader,
  GetSessionReportResponse,
} from "@workspace/api-zod";
import { createSessionPayload, signSessionToken, verifySessionToken, type SessionPayload } from "../../lib/session/sessionToken";
import { PROCESSING_STEPS, computeEffectiveState } from "../../lib/session/processing";
import { advanceLiveSession, startLiveAnalysis } from "../../lib/session/liveProcessing";
import { weddingGuestCatalog } from "../../lib/catalog/weddingGuestCatalog";
import { normalizeSkinSignals } from "../../lib/scoring/skinSignals";
import { selectOutfits } from "../../lib/scoring/selectOutfits";
import { pickRecommendedCatalogItemId, scoreOutfits } from "../../lib/scoring/scoreOutfits";
import { isLiveModeAvailable } from "../../lib/youcam/client";
import {
  DEMO_RAW_SKIN_SCORES,
  DEMO_REPLAY_CATALOG_ITEM_IDS,
  DEMO_VTO_IMAGE_BY_CATALOG_ID,
  DEMO_VIDEO_URL,
} from "../../lib/demo/replay";
import { PREP_TIPS } from "../../lib/content/prepTips";
import type { EventReadyReport, VtoResult } from "../../lib/types";

const router: IRouter = Router();

/** Builds the wire shape shared by createSession/startSessionAnalysis/getSessionStatus. */
function buildSessionResponse(payload: SessionPayload, nowMs: number) {
  const effective = computeEffectiveState(payload, nowMs);
  return {
    sessionId: payload.sessionId,
    sessionToken: signSessionToken(payload),
    mode: payload.mode,
    preferences: payload.preferences,
    status: effective.status,
    currentStep: effective.currentStep,
    steps: [...PROCESSING_STEPS],
    errorMessage: payload.errorMessage,
  };
}

router.post("/sessions", async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const payload = createSessionPayload(parsed.data.mode, parsed.data.preferences);

  req.log.info({ sessionId: payload.sessionId, mode: payload.mode }, "Created EventReady session");
  res.status(201).json(CreateSessionResponse.parse(buildSessionResponse(payload, Date.now())));
});

router.post("/sessions/:sessionId/analyze", async (req, res): Promise<void> => {
  const params = StartSessionAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = StartSessionAnalysisBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const payload = verifySessionToken(body.data.sessionToken);
  if (!payload || payload.sessionId !== params.data.sessionId) {
    res.status(401).json({ error: "Invalid or expired session token." });
    return;
  }

  if (payload.mode === "live") {
    if (!isLiveModeAvailable()) {
      const errored: SessionPayload = {
        ...payload,
        status: "error",
        analyzeStartedAt: null,
        errorMessage: "Live Mode isn't available right now. Switch to Demo Mode to see the full experience.",
      };
      req.log.warn({ sessionId: payload.sessionId }, "Live mode analyze requested but YouCam is not configured");
      res.status(200).json(StartSessionAnalysisResponse.parse(buildSessionResponse(errored, Date.now())));
      return;
    }

    if (!body.data.selfieImage || !body.data.fullBodyImage) {
      res.status(400).json({ error: "Live Mode requires both selfieImage and fullBodyImage." });
      return;
    }

    try {
      const started = await startLiveAnalysis(payload, {
        selfieBytes: Buffer.from(body.data.selfieImage.base64Data, "base64"),
        selfieContentType: body.data.selfieImage.contentType,
        fullBodyBytes: Buffer.from(body.data.fullBodyImage.base64Data, "base64"),
        fullBodyContentType: body.data.fullBodyImage.contentType,
      });
      req.log.info({ sessionId: payload.sessionId }, "Started live YouCam analysis pipeline");
      res.status(200).json(StartSessionAnalysisResponse.parse(buildSessionResponse(started, Date.now())));
    } catch (err) {
      req.log.error({ err, sessionId: payload.sessionId }, "Failed to start live analysis");
      const errored: SessionPayload = {
        ...payload,
        status: "error",
        analyzeStartedAt: null,
        errorMessage: "Something went wrong starting your analysis. Please try again.",
      };
      res.status(200).json(StartSessionAnalysisResponse.parse(buildSessionResponse(errored, Date.now())));
    }
    return;
  }

  const started: SessionPayload = {
    ...payload,
    status: "processing",
    analyzeStartedAt: new Date().toISOString(),
    errorMessage: null,
  };

  req.log.info({ sessionId: payload.sessionId }, "Started demo analysis pipeline");
  res.status(200).json(StartSessionAnalysisResponse.parse(buildSessionResponse(started, Date.now())));
});

router.get("/sessions/:sessionId/status", async (req, res): Promise<void> => {
  const params = GetSessionStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const header = GetSessionStatusHeader.safeParse({ token: req.get("token") });
  if (!header.success) {
    res.status(400).json({ error: "Missing session token header." });
    return;
  }

  let payload = verifySessionToken(header.data.token);
  if (!payload || payload.sessionId !== params.data.sessionId) {
    res.status(401).json({ error: "Invalid or expired session token." });
    return;
  }

  // Live Mode has no background job — every poll does exactly one round of
  // real work (at most one status check per outstanding YouCam task).
  if (payload.mode === "live" && payload.live && payload.status === "processing") {
    try {
      payload = await advanceLiveSession(payload);
    } catch (err) {
      req.log.error({ err, sessionId: payload.sessionId }, "Failed to advance live session");
    }
  }

  res.status(200).json(GetSessionStatusResponse.parse(buildSessionResponse(payload, Date.now())));
});

router.get("/sessions/:sessionId/report", async (req, res): Promise<void> => {
  const params = GetSessionReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const header = GetSessionReportHeader.safeParse({ token: req.get("token") });
  if (!header.success) {
    res.status(400).json({ error: "Missing session token header." });
    return;
  }

  const payload = verifySessionToken(header.data.token);
  if (!payload || payload.sessionId !== params.data.sessionId) {
    res.status(401).json({ error: "Invalid or expired session token." });
    return;
  }

  const effective = computeEffectiveState(payload, Date.now());
  if (effective.status !== "ready") {
    res.status(409).json({ error: `Report is not ready yet (status: ${effective.status}).` });
    return;
  }

  const report: EventReadyReport = payload.mode === "demo" ? buildDemoReport(payload) : buildLiveReport(payload);

  req.log.info({ sessionId: payload.sessionId, mode: payload.mode }, "Built EventReady report");
  res.status(200).json(GetSessionReportResponse.parse(report));
});

function buildDemoReport(payload: SessionPayload): EventReadyReport {
  const skinSignals = normalizeSkinSignals(DEMO_RAW_SKIN_SCORES);
  const replayCatalog = weddingGuestCatalog.filter((item) =>
    (DEMO_REPLAY_CATALOG_ITEM_IDS as readonly string[]).includes(item.id),
  );

  const selectedOutfits = selectOutfits({
    catalog: replayCatalog,
    preferences: payload.preferences,
    skinSignals,
    count: replayCatalog.length,
  });

  const vtoResults: VtoResult[] = selectedOutfits.map(({ item }) => ({
    catalogItemId: item.id,
    status: "success",
    resultImageUrl: DEMO_VTO_IMAGE_BY_CATALOG_ID[item.id] ?? null,
    errorMessage: null,
  }));

  const scores = scoreOutfits({
    items: selectedOutfits.map((outfit) => outfit.item),
    preferences: payload.preferences,
    skinSignals,
    vtoResults,
  });

  const recommendedCatalogItemId = pickRecommendedCatalogItemId(scores, vtoResults) ?? selectedOutfits[0]?.item.id ?? "";

  return {
    sessionId: payload.sessionId,
    mode: payload.mode,
    recommendedCatalogItemId,
    skinSignals,
    selectedOutfits,
    vtoResults,
    scores,
    prepTips: PREP_TIPS,
    // Pre-baked demo video generated once offline via the YouCam
    // Image-to-Video API for the bold-emerald-jumpsuit VTO image.
    // Always shown in Demo Mode (it showcases the API feature regardless
    // of which outfit is ranked #1 by the scoring engine).
    // Served as a static public asset — zero API cost at runtime.
    video: { status: "success" as const, videoUrl: DEMO_VIDEO_URL },
  };
}

function buildLiveReport(payload: SessionPayload): EventReadyReport {
  const live = payload.live;
  if (!live || !live.skinSignals || !live.selectedOutfits || !live.vtoTasks) {
    throw new Error(`Live session ${payload.sessionId} reached "ready" without a complete pipeline state.`);
  }

  const vtoResults: VtoResult[] = live.vtoTasks.map((task) => ({
    catalogItemId: task.catalogItemId,
    status: task.status,
    resultImageUrl: task.resultImageUrl,
    errorMessage: task.errorMessage,
  }));

  const scores = scoreOutfits({
    items: live.selectedOutfits.map((outfit) => outfit.item),
    preferences: payload.preferences,
    skinSignals: live.skinSignals,
    vtoResults,
  });

  // Only recommend an outfit whose try-on actually succeeded — never point
  // the user at a hero image that couldn't be generated. Also the exact
  // same rule `liveProcessing.ts` used to decide which outfit's video to
  // generate, so the two are always in agreement.
  const recommendedCatalogItemId =
    pickRecommendedCatalogItemId(scores, vtoResults) ?? live.selectedOutfits[0]?.item.id ?? "";

  return {
    sessionId: payload.sessionId,
    mode: payload.mode,
    recommendedCatalogItemId,
    skinSignals: live.skinSignals,
    selectedOutfits: live.selectedOutfits,
    vtoResults,
    scores,
    prepTips: PREP_TIPS,
    // By the time the report is fetched (`status === "ready"`), the video
    // task is guaranteed to be terminal — see `advanceLiveSession`'s
    // `videoTerminal` gate — so `live.video` here is always non-null and
    // never "queued"/"running".
    video: live.video
      ? { status: live.video.status === "success" || live.video.status === "error" ? live.video.status : "skipped", videoUrl: live.video.videoUrl }
      : null,
  };
}

export default router;
