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

/**
 * Starts a Skin Analysis task against an already-uploaded selfie.
 *
 * Split out from `startYouCamSkinAnalysis` so a caller that needs several
 * tasks on the same photo — Skin Analysis and Facial Colour Tones both run
 * on the selfie — can upload it once and start both against the same
 * `file_id`, instead of pushing the same bytes to YouCam twice.
 */
export async function startYouCamSkinAnalysisWithFileId(fileId: string): Promise<StartSkinAnalysisResult> {
  const { task_id } = await youCamPost<CreateSkinTaskResponse>("/s2s/v2.0/task/skin-analysis", {
    src_file_id: fileId,
    dst_actions: [...SKIN_DST_ACTIONS],
    format: "json",
  });

  return { taskId: task_id };
}

/** Uploads the selfie and starts a Skin Analysis task. Does not wait for it to finish. */
export async function startYouCamSkinAnalysis(
  selfieBytes: Buffer,
  selfieContentType: string,
): Promise<StartSkinAnalysisResult> {
  const { fileId } = await uploadFileToYouCam(selfieBytes, selfieContentType, `selfie_${Date.now()}.jpg`);
  return startYouCamSkinAnalysisWithFileId(fileId);
}

/** One measured concern plus the mask showing where on the face it was found. */
export interface SkinConcernOverlay {
  concern: keyof RawSkinScores;
  maskUrl: string;
}

/** A face image and the concern masks that are aligned to it. */
export interface SkinOverlaySet {
  baseImageUrl: string;
  overlays: SkinConcernOverlay[];
}

/**
 * Pulls the segmentation masks out of a Skin Analysis response.
 *
 * Alongside the six scored concerns, YouCam returns a `resize_image` entry
 * whose mask URL is its own normalised copy of the selfie. The concern masks
 * are aligned to THAT image, not to the bytes we uploaded, so we return the
 * pair together and never let a caller composite a mask over the original
 * upload.
 *
 * Returns null when the response carries no usable masks — a missing overlay
 * is a missing overlay, and the UI says so rather than drawing an empty face.
 */
export function mapSkinAnalysisOutputToOverlays(output: YouCamSkinOutputItem[]): SkinOverlaySet | null {
  const baseImageUrl = output.find((item) => item.type === "resize_image")?.mask_urls?.[0];
  if (!baseImageUrl) return null;

  const overlays: SkinConcernOverlay[] = [];
  for (const item of output) {
    const concern = TYPE_TO_FIELD[item.type];
    const maskUrl = item.mask_urls?.[0];
    if (concern && maskUrl) overlays.push({ concern, maskUrl });
  }

  return overlays.length > 0 ? { baseImageUrl, overlays } : null;
}

interface SkinTaskStatusResponse {
  results?: { output: YouCamSkinOutputItem[] };
  task_status: "running" | "success" | "error";
}

export interface SkinAnalysisStatusResult {
  status: "running" | "success" | "error";
  rawScores?: RawSkinScores;
  rawOutput?: YouCamSkinOutputItem[];
  overlays?: SkinOverlaySet | null;
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
    return {
      status: "success",
      rawScores: mapSkinAnalysisOutputToRawScores(output),
      rawOutput: output,
      overlays: mapSkinAnalysisOutputToOverlays(output),
    };
  }

  if (result.task_status === "error") {
    return { status: "error", errorMessage: "YouCam Skin Analysis task failed." };
  }

  return { status: "running" };
}
