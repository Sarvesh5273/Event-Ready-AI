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
import { weddingGuestCatalog } from "../../lib/catalog/weddingGuestCatalog";
import { normalizeSkinSignals } from "../../lib/scoring/skinSignals";
import { selectOutfits } from "../../lib/scoring/selectOutfits";
import { scoreOutfits } from "../../lib/scoring/scoreOutfits";
import {
  DEMO_RAW_SKIN_SCORES,
  DEMO_REPLAY_CATALOG_ITEM_IDS,
  DEMO_VTO_IMAGE_BY_CATALOG_ID,
  DEMO_PREP_TIPS,
} from "../../lib/demo/replay";

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
    // Live YouCam calls are Task 2 scope. We stub them here rather than
    // pretending to succeed: the request fails fast with an honest,
    // friendly message instead of hanging or returning fake results.
    const errored: SessionPayload = {
      ...payload,
      status: "error",
      analyzeStartedAt: null,
      errorMessage:
        "Live YouCam integration isn't available in this build yet. Switch to Demo Mode to see the full experience.",
    };
    req.log.warn({ sessionId: payload.sessionId }, "Live mode analyze requested — returning stub error");
    res.status(200).json(StartSessionAnalysisResponse.parse(buildSessionResponse(errored, Date.now())));
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

  const payload = verifySessionToken(header.data.token);
  if (!payload || payload.sessionId !== params.data.sessionId) {
    res.status(401).json({ error: "Invalid or expired session token." });
    return;
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

  if (payload.mode !== "demo") {
    // Defensive guard: live mode always errors before reaching "ready" in
    // this build, so this branch should be unreachable in practice.
    res.status(409).json({ error: "Live mode reports are not available in this build." });
    return;
  }

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

  const vtoResults = selectedOutfits.map(({ item }) => ({
    catalogItemId: item.id,
    status: "success" as const,
    resultImageUrl: DEMO_VTO_IMAGE_BY_CATALOG_ID[item.id] ?? null,
    errorMessage: null,
  }));

  const scores = scoreOutfits({
    items: selectedOutfits.map((outfit) => outfit.item),
    preferences: payload.preferences,
    skinSignals,
    vtoResults,
  });

  const recommended = [...scores].sort((a, b) => b.confidenceScore - a.confidenceScore)[0];

  const report = {
    sessionId: payload.sessionId,
    mode: payload.mode,
    recommendedCatalogItemId: recommended?.catalogItemId ?? selectedOutfits[0]?.item.id ?? "",
    skinSignals,
    selectedOutfits,
    vtoResults,
    scores,
    prepTips: DEMO_PREP_TIPS,
  };

  req.log.info({ sessionId: payload.sessionId }, "Built EventReady report");
  res.status(200).json(GetSessionReportResponse.parse(report));
});

export default router;
