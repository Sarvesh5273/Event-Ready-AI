import { uploadFileToYouCam, youCamGet, youCamPost } from "./client";
import type { RawSkinScores } from "../scoring/skinSignals";

/**
 * Skin concerns we request from YouCam AI Skin Analysis (SD tier — see
 * https://docs.perfectcorp.com/reference/ai_skin_analysis/v2.1). These are
 * the six concerns `normalizeSkinSignals()` understands; SD and HD concern
 * names cannot be mixed in a single request, so we stick to SD throughout.
 */
export const SKIN_DST_ACTIONS = ["redness", "oiliness", "dark_circle_v2", "radiance", "moisture", "texture"] as const;

/** Maps YouCam's `dst_actions` concern names onto our internal `RawSkinScores` field names. */
const TYPE_TO_FIELD: Record<string, keyof RawSkinScores> = {
  redness: "redness",
  oiliness: "oiliness",
  dark_circle_v2: "darkCircles",
  dark_circle: "darkCircles",
  radiance: "radiance",
  moisture: "moisture",
  texture: "texture",
};

interface YouCamSkinOutputItem {
  type: string;
  ui_score: number;
  raw_score: number;
  mask_urls?: string[];
}

/**
 * Converts a raw YouCam Skin Analysis result into our internal
 * `RawSkinScores` convention.
 *
 * IMPORTANT direction flip: YouCam's `raw_score` is HEALTHY-direction — per
 * the docs, "a higher score indicates healthier and more aesthetically
 * pleasing skin condition." Every other part of this app (the demo replay
 * data, `normalizeSkinSignals()`, `scoreOutfits.ts`) was built around the
 * opposite convention — a CONCERN-direction score, where higher means more
 * of that concern (e.g. redness: 74 means "a lot of redness", which is what
 * triggers a cool-tone recommendation). This is the calibration point
 * required by Task 2 step 6: we invert here, once, at the API boundary, so
 * every downstream consumer keeps working against the same scale it always
 * has.
 */
export function mapSkinAnalysisOutputToRawScores(output: YouCamSkinOutputItem[]): RawSkinScores {
  const raw: RawSkinScores = {};
  for (const item of output) {
    const field = TYPE_TO_FIELD[item.type];
    if (!field) continue;
    raw[field] = Math.round(100 - item.raw_score);
  }
  return raw;
}

interface CreateSkinTaskResponse {
  task_id: string;
}

export interface StartSkinAnalysisResult {
  taskId: string;
}

/** Uploads the selfie and starts a Skin Analysis task. Does not wait for it to finish. */
export async function startYouCamSkinAnalysis(
  selfieBytes: Buffer,
  selfieContentType: string,
): Promise<StartSkinAnalysisResult> {
  const { fileId } = await uploadFileToYouCam(selfieBytes, selfieContentType, `selfie_${Date.now()}.jpg`);

  const { task_id } = await youCamPost<CreateSkinTaskResponse>("/s2s/v2.0/task/skin-analysis", {
    src_file_id: fileId,
    dst_actions: [...SKIN_DST_ACTIONS],
    format: "json",
  });

  return { taskId: task_id };
}

interface SkinTaskStatusResponse {
  results?: { output: YouCamSkinOutputItem[] };
  task_status: "running" | "success" | "error";
}

export interface SkinAnalysisStatusResult {
  status: "running" | "success" | "error";
  rawScores?: RawSkinScores;
  rawOutput?: YouCamSkinOutputItem[];
  errorMessage?: string;
}

/**
 * One-shot status check for a running Skin Analysis task — makes exactly
 * one HTTP call and returns immediately with whatever YouCam currently
 * reports. Callers are responsible for calling this again on the next poll
 * tick; this function must never loop or block waiting for completion.
 */
export async function checkYouCamSkinAnalysisStatus(taskId: string): Promise<SkinAnalysisStatusResult> {
  const result = await youCamGet<SkinTaskStatusResponse>(`/s2s/v2.0/task/skin-analysis/${taskId}`);

  if (result.task_status === "success") {
    const output = result.results?.output ?? [];
    return { status: "success", rawScores: mapSkinAnalysisOutputToRawScores(output), rawOutput: output };
  }

  if (result.task_status === "error") {
    return { status: "error", errorMessage: "YouCam Skin Analysis task failed." };
  }

  return { status: "running" };
}
