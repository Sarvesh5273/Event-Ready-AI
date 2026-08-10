import { youCamGet, youCamPost } from "./client";
import type { FacialColorTones } from "../color/season";

/**
 * YouCam AI Facial Colour Tones Analyzer.
 * https://docs.perfectcorp.com/reference/ai_skin_tone_analysis
 *
 * This is the API that makes the personal-colour engine honest: it returns
 * *measured* hex values for skin, hair, eyes, lips and eyebrows. Skin, hair
 * and eye colour are the three readings a human colour analyst takes, so
 * everything downstream is derived from real data about the person rather
 * than inferred from unrelated signals.
 *
 * Note this is a different task to AI Skin Analysis, which returns skin
 * *concern* scores (redness, oiliness, texture...) and says nothing about
 * colour. The app uses both, for different purposes.
 */

interface CreateToneTaskResponse {
  task_id: string;
}

export interface StartSkinToneAnalysisResult {
  taskId: string;
}

/**
 * Starts a Facial Colour Tones task against an already-uploaded selfie.
 *
 * Takes a `fileId` rather than raw bytes so the caller can upload the selfie
 * once and run both this and Skin Analysis against it — the same photo, two
 * tasks, one upload.
 *
 * `face_angle_strictness_level` is relaxed to "low" deliberately. The
 * default ("high") rejects slightly turned or tilted faces, which is most
 * real selfies; a rejected photo produces no reading at all, whereas a
 * marginally off-angle one still produces a usable colour measurement.
 */
export async function startYouCamSkinToneAnalysis(fileId: string): Promise<StartSkinToneAnalysisResult> {
  const { task_id } = await youCamPost<CreateToneTaskResponse>("/s2s/v2.0/task/skin-tone-analysis", {
    src_file_id: fileId,
    face_angle_strictness_level: "low",
  });

  return { taskId: task_id };
}

/** Raw colour block as returned by YouCam. Every field is optional in practice. */
interface YouCamColorBlock {
  skin_color?: string;
  hair_color?: string;
  hair_color_name?: string;
  eye_color?: string;
  eye_color_name?: string;
  lip_color?: string;
  eyebrow_color?: string;
}

interface ToneTaskStatusResponse {
  task_status: "running" | "success" | "error";
  results?: { color?: YouCamColorBlock };
  error?: string;
}

export interface SkinToneAnalysisStatusResult {
  status: "running" | "success" | "error";
  tones?: FacialColorTones;
  errorMessage?: string;
}

/** Normalises YouCam's colour block, defaulting every absent field to null. */
export function mapColorBlockToTones(color: YouCamColorBlock | undefined): FacialColorTones {
  return {
    skinColor: color?.skin_color ?? null,
    hairColor: color?.hair_color ?? null,
    hairColorName: color?.hair_color_name ?? null,
    eyeColor: color?.eye_color ?? null,
    eyeColorName: color?.eye_color_name ?? null,
    lipColor: color?.lip_color ?? null,
    eyebrowColor: color?.eyebrow_color ?? null,
  };
}

/**
 * One-shot status check. Makes exactly one HTTP call and returns whatever
 * YouCam currently reports — the caller polls again on the next tick. This
 * must never loop or block, because it runs inside a request handler.
 */
export async function checkYouCamSkinToneAnalysisStatus(
  taskId: string,
): Promise<SkinToneAnalysisStatusResult> {
  const result = await youCamGet<ToneTaskStatusResponse>(`/s2s/v2.0/task/skin-tone-analysis/${taskId}`);

  if (result.task_status === "success") {
    const tones = mapColorBlockToTones(result.results?.color);

    // A "success" with no skin colour is useless downstream — surface it as
    // an error so the caller falls back instead of analysing a null face.
    if (!tones.skinColor) {
      return { status: "error", errorMessage: "Facial colour analysis returned no skin colour." };
    }

    return { status: "success", tones };
  }

  if (result.task_status === "error") {
    return {
      status: "error",
      errorMessage: result.error ?? "YouCam Facial Colour Tones task failed.",
    };
  }

  return { status: "running" };
}
