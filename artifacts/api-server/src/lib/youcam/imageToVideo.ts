import { logger } from "../logger";
import { youCamFetchRaw, youCamPost } from "./client";

/**
 * YouCam AI Image to Video Generator (v2.0) — turns a single still image
 * into a short animated clip. See
 * https://docs.perfectcorp.com/reference/ai_video_generator/v2.0.
 *
 * This is a separate task family from AI Clothes (`clothesVto.ts`). Its
 * status-check response is documented as returning `{ url }` directly
 * rather than the `{status, data}` envelope the rest of the s2s v2.0 API
 * uses, so responses are parsed defensively below instead of going through
 * the shared `youCamGet` envelope helper.
 */
const VIDEO_TASK_PATH = "/s2s/v2.0/task/image-to-video/youcam";

interface CreateVideoTaskResponse {
  task_id: string;
}

export interface StartImageToVideoResult {
  taskId: string;
}

/**
 * Starts an Image-to-Video task directly from an already-hosted result
 * image URL (e.g. a successful Apparel VTO `resultImageUrl`) — no
 * re-upload needed. Kept short (5s, 720p) to bound API unit cost: this
 * generates a single bonus clip for the top-recommended outfit only, never
 * for every outfit.
 */
export async function startYouCamImageToVideo(srcImageUrl: string): Promise<StartImageToVideoResult> {
  const { task_id } = await youCamPost<CreateVideoTaskResponse>(VIDEO_TASK_PATH, {
    resolution: "720",
    dst_duration: 5,
    prompt: "Subtle, natural turn and smile, elegant wedding-guest styling, smooth motion, clean background.",
    model: "youcam-video-v2",
    src_file_url: srcImageUrl,
  });
  return { taskId: task_id };
}

export interface ImageToVideoStatusResult {
  status: "running" | "success" | "error";
  videoUrl?: string;
  errorMessage?: string;
}

/**
 * One-shot status check for a running Image-to-Video task — exactly one
 * HTTP call per invocation, never a blocking poll loop. Tolerant of a few
 * plausible response shapes since the documented envelope for this newer
 * endpoint is thin and inconsistent with the rest of the s2s v2.0 API.
 */
export async function checkYouCamImageToVideoStatus(taskId: string): Promise<ImageToVideoStatusResult> {
  const res = await youCamFetchRaw(`${VIDEO_TASK_PATH}/${taskId}`, { method: "GET" });
  const text = await res.text();
  let body: Record<string, unknown> | undefined;
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
  } catch {
    body = undefined;
  }

  if (res.ok) {
    const data = (body?.["data"] as Record<string, unknown> | undefined) ?? body;
    const url =
      (data?.["url"] as string | undefined) ??
      ((data?.["results"] as Record<string, unknown> | undefined)?.["url"] as string | undefined);
    if (url) return { status: "success", videoUrl: url };

    if (data?.["task_status"] === "error") {
      return {
        status: "error",
        errorMessage: (data["error"] as string | undefined) ?? "YouCam video generation task failed.",
      };
    }

    // No URL and no explicit error yet — still processing.
    return { status: "running" };
  }

  const message = (body?.["error"] as string | undefined) ?? `YouCam Image to Video status check failed with status ${res.status}`;
  logger.warn({ status: res.status, taskId }, "YouCam Image to Video status check returned an error");
  return { status: "error", errorMessage: message };
}
