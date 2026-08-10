import type { GarmentCategory } from "../types";
import { uploadFileToYouCam, youCamGet, youCamPost } from "./client";

/**
 * The AI Clothes task endpoint name. PerfectCorp has iterated this family of
 * endpoints (cloth-v2/v3/v4); the currently-documented working example is
 * cloth-v4 (see https://docs.perfectcorp.com/reference/ai_clothes/v3.0).
 * Kept as an env override in case a given API key/account is provisioned
 * against a different version.
 */
function getClothTaskName(): string {
  return process.env.YOUCAM_CLOTH_TASK_NAME || "cloth-v4";
}

interface CreateClothTaskResponse {
  task_id: string;
}

export interface StartClothesVtoResult {
  taskId: string;
}

/**
 * Uploads the user's full-body photo and a garment reference image, then
 * starts an Apparel VTO task. Does not wait for it to finish. The two
 * uploads never mix across users: `fullBodyBytes` always comes from the
 * requesting session's own upload (see `liveUploadStore.ts`), never from
 * another session or the demo persona.
 */
export async function startYouCamClothesVto(
  fullBodyBytes: Buffer,
  fullBodyContentType: string,
  garmentBytes: Buffer,
  garmentContentType: string,
  garmentCategory: GarmentCategory,
): Promise<StartClothesVtoResult> {
  const [{ fileId: srcFileId }, { fileId: refFileId }] = await Promise.all([
    uploadFileToYouCam(fullBodyBytes, fullBodyContentType, `fullbody_${Date.now()}.jpg`),
    uploadFileToYouCam(garmentBytes, garmentContentType, `garment_${Date.now()}.jpg`),
  ]);

  const { task_id } = await youCamPost<CreateClothTaskResponse>(`/s2s/v2.0/task/${getClothTaskName()}`, {
    src_file_id: srcFileId,
    ref_file_id: refFileId,
    garment_category: garmentCategory,
  });

  return { taskId: task_id };
}

interface ClothTaskStatusResponse {
  error?: string | null;
  results?: { url: string };
  task_status: "running" | "success" | "error";
}

export interface ClothesVtoStatusResult {
  status: "running" | "success" | "error";
  resultImageUrl?: string;
  errorMessage?: string;
}

/**
 * One-shot status check for a running Apparel VTO task — exactly one HTTP
 * call per invocation, never a blocking poll loop.
 */
export async function checkYouCamClothesVtoStatus(taskId: string): Promise<ClothesVtoStatusResult> {
  const result = await youCamGet<ClothTaskStatusResponse>(`/s2s/v2.0/task/${getClothTaskName()}/${taskId}`);

  if (result.task_status === "success" && result.results?.url) {
    return { status: "success", resultImageUrl: result.results.url };
  }

  if (result.task_status === "error") {
    return { status: "error", errorMessage: result.error ?? "YouCam Apparel Try-On task failed." };
  }

  return { status: "running" };
}
