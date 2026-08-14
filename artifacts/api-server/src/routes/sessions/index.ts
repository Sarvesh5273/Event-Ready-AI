import { analyzeColorSeason } from "../../lib/color/season";
import { toColorReport } from "../../lib/color/report";
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
  StartSessionVideoParams,
  StartSessionVideoHeader,
  StartSessionVideoResponse,
  GetSessionVideoParams,
  GetSessionVideoHeader,
  GetSessionVideoResponse,
} from "@workspace/api-zod";
import { createSessionPayload, signSessionToken, verifySessionToken, type SessionPayload } from "../../lib/session/sessionToken";
import { PROCESSING_STEPS, computeEffectiveState } from "../../lib/session/processing";
import { advanceLiveSession, advanceVideoGeneration, startLiveAnalysis } from "../../lib/session/liveProcessing";
import { weddingGuestCatalog } from "../../lib/catalog/weddingGuestCatalog";
import { normalizeSkinSignals } from "../../lib/scoring/skinSignals";
import { selectOutfits } from "../../lib/scoring/selectOutfits";
import { pickRecommendedCatalogItemId, scoreOutfits } from "../../lib/scoring/scoreOutfits";
import { pickGarmentProofPair, toProofShot } from "../../lib/scoring/proofPair";
import { isLiveModeAvailable } from "../../lib/youcam/client";
import {
  DEMO_FACIAL_TONES,
  DEMO_RAW_SKIN_SCORES,
  DEMO_REPLAY_CATALOG_ITEM_IDS,
  DEMO_VTO_IMAGE_BY_CATALOG_ID,
  DEMO_VIDEO_URL,
} from "../../lib/demo/replay";
import { PREP_TIPS } from "../../lib/content/prepTips";
import { scoreCustomGarment } from "../../lib/scoring/customGarmentScore";
import { getGarmentImage } from "../../lib/session/garmentImageStore";
import type { CustomGarmentResult, EventReadyReport, VtoResult } from "../../lib/types";

const router: IRouter = Router();

/** Builds the wire shape shared by createSession/startSessionAnalysis/getSessionStatus. */
function buildSessionResponse(payload: SessionPayload, nowMs: number) {
  const effective = computeEffectiveState(payload, nowMs);
  return {
    sessionId: payload.sessionId,
    sessionToken: signSessionToken(payload),
    mode: payload.mode,
    preferences: payload.preferences,
    garmentSource: payload.garmentSource,
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

  const payload = createSessionPayload(parsed.data.mode, parsed.data.preferences, parsed.data.garmentSource);

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

    if (payload.garmentSource === "custom" && (!body.data.garmentImage || !body.data.garmentCategory)) {
      res.status(400).json({ error: "The custom garment flow requires both garmentImage and garmentCategory." });
      return;
    }

    try {
      const started = await startLiveAnalysis(payload, {
        selfieBytes: Buffer.from(body.data.selfieImage.base64Data, "base64"),
        selfieContentType: body.data.selfieImage.contentType,
        fullBodyBytes: Buffer.from(body.data.fullBodyImage.base64Data, "base64"),
        fullBodyContentType: body.data.fullBodyImage.contentType,
        garment:
          payload.garmentSource === "custom" && body.data.garmentImage && body.data.garmentCategory
            ? {
                bytes: Buffer.from(body.data.garmentImage.base64Data, "base64"),
                contentType: body.data.garmentImage.contentType,
                category: body.data.garmentCategory,
              }
            : undefined,
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

/** Wire shape for both video endpoints: task state + the token carrying it. */
function buildVideoResponse(payload: SessionPayload) {
  const video = payload.live?.video;
  return {
    sessionToken: signSessionToken(payload),
    status: video?.status ?? "idle",
    videoUrl: video?.videoUrl ?? null,
    errorMessage: video?.errorMessage ?? null,
  };
}

/** Shared token + session checks for the two video endpoints. */
function authorizeVideoRequest(
  token: string | undefined,
  sessionId: string,
): { payload: SessionPayload } | { error: string; status: number } {
  const payload = verifySessionToken(token);
  if (!payload || payload.sessionId !== sessionId) {
    return { error: "Invalid or expired session token.", status: 401 };
  }
  return { payload };
}

router.post("/sessions/:sessionId/video", async (req, res): Promise<void> => {
  const params = StartSessionVideoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const header = StartSessionVideoHeader.safeParse({ token: req.get("token") });
  if (!header.success) {
    res.status(400).json({ error: "Missing session token header." });
    return;
  }

  const auth = authorizeVideoRequest(header.data.token, params.data.sessionId);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  // Demo Mode replays a video generated offline once — no task, no cost.
  if (auth.payload.mode === "demo") {
    res.status(200).json(
      StartSessionVideoResponse.parse({
        sessionToken: signSessionToken(auth.payload),
        status: "success",
        videoUrl: DEMO_VIDEO_URL,
        errorMessage: null,
      }),
    );
    return;
  }

  // A failed attempt is retryable: clearing the terminal error state lets a
  // second press start a genuinely new task instead of replaying the old
  // failure forever. Only POST does this — GET still cannot initiate work,
  // so polling remains incapable of spending a credit. "skipped" is left
  // alone: it means there was no try-on image to animate, so there is
  // nothing a retry could do.
  const retryable =
    auth.payload.live?.video?.status === "error"
      ? { ...auth.payload, live: { ...auth.payload.live, video: null } }
      : auth.payload;

  try {
    const advanced = await advanceVideoGeneration(retryable);
    req.log.info({ sessionId: advanced.sessionId, status: advanced.live?.video?.status }, "Started on-demand outfit video");
    res.status(200).json(StartSessionVideoResponse.parse(buildVideoResponse(advanced)));
  } catch (err) {
    req.log.error({ err, sessionId: auth.payload.sessionId }, "Failed to start on-demand outfit video");
    res.status(200).json(
      StartSessionVideoResponse.parse({
        sessionToken: signSessionToken(auth.payload),
        status: "error",
        videoUrl: null,
        errorMessage: "The video couldn't be generated right now.",
      }),
    );
  }
});

router.get("/sessions/:sessionId/video", async (req, res): Promise<void> => {
  const params = GetSessionVideoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const header = GetSessionVideoHeader.safeParse({ token: req.get("token") });
  if (!header.success) {
    res.status(400).json({ error: "Missing session token header." });
    return;
  }

  const auth = authorizeVideoRequest(header.data.token, params.data.sessionId);
  if ("error" in auth) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  // Demo Mode's clip was generated offline and always exists, so this reports
  // "success" even before POST — the "idle until started" rule exists purely to
  // protect paid Live Mode tasks, and there is nothing to protect here. The UI
  // still routes Demo through the same button, because it only polls after POST.
  if (auth.payload.mode === "demo") {
    res.status(200).json(
      GetSessionVideoResponse.parse({
        sessionToken: signSessionToken(auth.payload),
        status: "success",
        videoUrl: DEMO_VIDEO_URL,
        errorMessage: null,
      }),
    );
    return;
  }

  // Polling must never *initiate* a paid task — only advance one the user
  // already started with POST. Without this guard a stray poll (or a
  // refresh) would silently spend an Image-to-Video credit.
  if (!auth.payload.live?.video) {
    res.status(200).json(GetSessionVideoResponse.parse(buildVideoResponse(auth.payload)));
    return;
  }

  try {
    const advanced = await advanceVideoGeneration(auth.payload);
    res.status(200).json(GetSessionVideoResponse.parse(buildVideoResponse(advanced)));
  } catch (err) {
    req.log.error({ err, sessionId: auth.payload.sessionId }, "Failed to advance on-demand outfit video");
    res.status(200).json(GetSessionVideoResponse.parse(buildVideoResponse(auth.payload)));
  }
});

// Serves the raw bytes of a Live Mode custom-garment upload for display on
// the results screen. Deliberately outside the OpenAPI/zod-typed surface —
// it's consumed directly as an `<img src>`, which can't attach the `token`
// header the other endpoints use, so the token travels as a query param
// here instead. See `garmentImageStore.ts` for why the image never lives
// inside the session token itself.
router.get("/sessions/:sessionId/garment-image", async (req, res): Promise<void> => {
  const sessionId = typeof req.params.sessionId === "string" ? req.params.sessionId : "";
  const tokenParam = req.query.token;
  const token = typeof tokenParam === "string" ? tokenParam : (req.get("token") ?? undefined);

  const payload = verifySessionToken(token);
  if (!payload || payload.sessionId !== sessionId || payload.garmentSource !== "custom") {
    res.status(404).end();
    return;
  }

  const image = getGarmentImage(sessionId);
  if (!image) {
    res.status(404).end();
    return;
  }

  res.setHeader("Cache-Control", "private, max-age=1800");
  res.type(image.contentType);
  res.send(image.bytes);
});

function buildDemoReport(payload: SessionPayload): EventReadyReport {
  const skinSignals = normalizeSkinSignals(DEMO_RAW_SKIN_SCORES);
  const replayCatalog = weddingGuestCatalog.filter((item) =>
    (DEMO_REPLAY_CATALOG_ITEM_IDS as readonly string[]).includes(item.id),
  );

  // Demo Mode replays a real recorded colour reading for the demo persona,
  // so it exercises exactly the same shortlist-and-score path as Live Mode.
  const colorAnalysis = analyzeColorSeason(DEMO_FACIAL_TONES);

  // Demo Mode can only prove what it has real renders for, so the pair is
  // drawn from the pre-rendered set rather than the whole catalog. Chosen
  // before the shortlist for the same reason as Live Mode — see
  // `selectLiveOutfits`.
  const proofPair = pickGarmentProofPair({
    catalog: weddingGuestCatalog.filter((item) => item.id in DEMO_VTO_IMAGE_BY_CATALOG_ID),
    preferences: payload.preferences,
    colorAnalysis,
  });

  const selectedOutfits = selectOutfits({
    catalog: replayCatalog,
    preferences: payload.preferences,
    skinSignals,
    colorAnalysis,
    count: replayCatalog.length,
    excludeIds: proofPair ? [proofPair.worst.id] : undefined,
  });

  const vtoItemIds = selectedOutfits.map(({ item }) => item.id);
  for (const id of [proofPair?.best.id, proofPair?.worst.id]) {
    if (id && !vtoItemIds.includes(id)) vtoItemIds.push(id);
  }

  const vtoResults: VtoResult[] = vtoItemIds.map((catalogItemId) => ({
    catalogItemId,
    status: "success",
    resultImageUrl: DEMO_VTO_IMAGE_BY_CATALOG_ID[catalogItemId] ?? null,
    errorMessage: null,
  }));

  const scores = scoreOutfits({
    items: selectedOutfits.map((outfit) => outfit.item),
    preferences: payload.preferences,
    skinSignals,
    colorAnalysis,
    vtoResults,
  });

  const recommendedCatalogItemId = pickRecommendedCatalogItemId(scores, vtoResults) ?? selectedOutfits[0]?.item.id ?? "";

  return {
    sessionId: payload.sessionId,
    mode: payload.mode,
    flow: "catalog",
    recommendedCatalogItemId,
    skinSignals,
    selectedOutfits,
    vtoResults,
    scores,
    prepTips: PREP_TIPS,
    // Null so Demo Mode shows the same "Generate video" affordance as Live
    // Mode rather than a second, auto-playing UI path. Pressing it serves
    // the pre-baked demo clip instantly — see the video endpoints above.
    video: null,
    customGarment: null,
    colorAnalysis: colorAnalysis ? toColorReport(colorAnalysis) : null,
    proofShot: toProofShot(proofPair, vtoResults),
  };
}

function buildLiveReport(payload: SessionPayload): EventReadyReport {
  const live = payload.live;
  if (!live || !live.skinSignals) {
    throw new Error(`Live session ${payload.sessionId} reached "ready" without a complete pipeline state.`);
  }

  const videoStatus: "success" | "error" | "skipped" | null = live.video
    ? live.video.status === "success" || live.video.status === "error"
      ? live.video.status
      : "skipped"
    : null;
  const video = live.video && videoStatus ? { status: videoStatus, videoUrl: live.video.videoUrl } : null;

  if (payload.garmentSource === "custom") {
    if (!live.custom) {
      throw new Error(`Live custom-garment session ${payload.sessionId} reached "ready" without custom garment state.`);
    }

    const vtoTerminal = live.custom.vto.status === "success" || live.custom.vto.status === "error";
    const colorAnalysis = live.tones ? analyzeColorSeason(live.tones) : null;
    const score = vtoTerminal
      ? scoreCustomGarment(live.custom.colorHex, colorAnalysis, live.skinSignals, live.custom.vto.status)
      : null;

    // Re-signing here is deterministic (same payload -> same HMAC) and
    // matches the token already issued for this response, so the client
    // can use it as-is without a second round trip.
    const imageUrl = `/api/sessions/${payload.sessionId}/garment-image?token=${encodeURIComponent(signSessionToken(payload))}`;

    const customGarment: CustomGarmentResult = {
      garmentCategory: live.custom.garmentCategory,
      colorFamily: live.custom.colorFamily,
      undertone: live.custom.undertone,
      imageUrl,
      vtoStatus: live.custom.vto.status,
      vtoResultImageUrl: live.custom.vto.resultImageUrl,
      vtoErrorMessage: live.custom.vto.errorMessage,
      score,
    };

    return {
      sessionId: payload.sessionId,
      mode: payload.mode,
      flow: "custom",
      recommendedCatalogItemId: "",
      skinSignals: live.skinSignals,
      selectedOutfits: [],
      vtoResults: [],
      scores: [],
      prepTips: PREP_TIPS,
      video,
      customGarment,
      colorAnalysis: colorAnalysis ? toColorReport(colorAnalysis) : null,
      // The proof compares two catalog garments of one silhouette. A custom
      // upload is a single garment with no same-cut sibling to compare it
      // against, so there is nothing honest to show here.
      proofShot: null,
    };
  }

  if (!live.selectedOutfits || !live.vtoTasks) {
    throw new Error(`Live session ${payload.sessionId} reached "ready" without a complete pipeline state.`);
  }

  const vtoResults: VtoResult[] = live.vtoTasks.map((task) => ({
    catalogItemId: task.catalogItemId,
    status: task.status,
    resultImageUrl: task.resultImageUrl,
    errorMessage: task.errorMessage,
  }));

  const colorAnalysis = live.tones ? analyzeColorSeason(live.tones) : null;

  const scores = scoreOutfits({
    items: live.selectedOutfits.map((outfit) => outfit.item),
    preferences: payload.preferences,
    skinSignals: live.skinSignals,
    colorAnalysis,
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
    flow: "catalog",
    recommendedCatalogItemId,
    skinSignals: live.skinSignals,
    selectedOutfits: live.selectedOutfits,
    vtoResults,
    scores,
    prepTips: PREP_TIPS,
    // Almost always null: video is generated on request, so a session reaches
    // "ready" long before one exists. Kept only so a report fetched after the
    // user has already generated one still carries it. The results screen
    // drives off the video endpoints, not this field.
    video,
    customGarment: null,
    colorAnalysis: colorAnalysis ? toColorReport(colorAnalysis) : null,
    // Recomputed rather than carried on the session — see `selectLiveOutfits`
    // for why this is deterministic and why the token stays small.
    proofShot: toProofShot(
      pickGarmentProofPair({
        catalog: weddingGuestCatalog,
        preferences: payload.preferences,
        colorAnalysis,
      }),
      vtoResults,
    ),
  };
}

export default router;
