import { logger } from "../logger";
import { YouCamApiError, YouCamNotConfiguredError } from "./types";

/**
 * Thin authenticated HTTP client for the YouCam (PerfectCorp) S2S API.
 * `YOUCAM_API_KEY` is read here and only here — it is never forwarded to
 * the browser and never stored inside a session token. See
 * https://docs.perfectcorp.com/develop/quick_start_guide for the documented
 * auth/upload/task flow this module implements.
 */
const DEFAULT_BASE_URL = "https://yce-api-01.makeupar.com";

export function isYouCamConfigured(): boolean {
  return Boolean(process.env.YOUCAM_API_KEY);
}

/** Operator kill-switch: force Demo Mode even when a real API key is configured. */
export function isDemoModeForced(): boolean {
  return process.env.ENABLE_DEMO_MODE === "true";
}

export function isLiveModeAvailable(): boolean {
  return isYouCamConfigured() && !isDemoModeForced();
}

function getApiKey(): string {
  const key = process.env.YOUCAM_API_KEY;
  if (!key) throw new YouCamNotConfiguredError();
  return key;
}

function getBaseUrl(): string {
  const configured = process.env.YOUCAM_API_BASE_URL;
  return (configured && configured.replace(/\/$/, "")) || DEFAULT_BASE_URL;
}

interface YouCamEnvelope<T> {
  status: number;
  data?: T;
  error?: string;
  error_code?: string;
}

async function parseEnvelope<T>(res: Response, path: string): Promise<YouCamEnvelope<T>> {
  const text = await res.text();
  let body: YouCamEnvelope<T> | undefined;
  try {
    body = text ? (JSON.parse(text) as YouCamEnvelope<T>) : undefined;
  } catch {
    // fall through — non-JSON body, handled below
  }

  if (!res.ok) {
    const message = body?.error ?? `YouCam API request to ${path} failed with status ${res.status}`;
    throw new YouCamApiError(message, res.status, body?.error_code);
  }

  if (!body) {
    throw new YouCamApiError(`YouCam API returned an unparseable response from ${path}`, res.status);
  }

  return body;
}

async function youCamRequest<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const envelope = await parseEnvelope<T>(res, path);
  if (envelope.data === undefined) {
    throw new YouCamApiError(`YouCam API response from ${path} had no "data" field`, res.status);
  }
  return envelope.data;
}

export async function youCamGet<T>(path: string): Promise<T> {
  return youCamRequest<T>(path, { method: "GET" });
}

export async function youCamPost<T>(path: string, body: unknown): Promise<T> {
  return youCamRequest<T>(path, { method: "POST", body: JSON.stringify(body) });
}

interface FileApiUploadRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
}

interface FileApiFileEntry {
  content_type: string;
  file_name: string;
  file_id: string;
  requests: FileApiUploadRequest[];
}

interface FileApiResponse {
  files: FileApiFileEntry[];
}

export interface YouCamUploadedFile {
  fileId: string;
}

/**
 * Implements the two-step YouCam File API upload: (1) request a pre-signed
 * upload URL + `file_id`, (2) PUT the raw bytes to that URL. The `file_id`
 * from step 1 is what gets passed as `src_file_id`/`ref_file_id` to the AI
 * Task APIs (Skin Analysis, Apparel VTO).
 */
export async function uploadFileToYouCam(
  bytes: Buffer,
  contentType: string,
  fileName: string,
): Promise<YouCamUploadedFile> {
  const initResponse = await youCamPost<FileApiResponse>("/s2s/v2.0/file", {
    files: [{ content_type: contentType, file_name: fileName, file_size: bytes.length }],
  });

  const file = initResponse.files[0];
  const uploadRequest = file?.requests[0];
  if (!file || !uploadRequest) {
    throw new YouCamApiError("YouCam File API response was missing an upload URL", 502);
  }

  // The pre-signed URL is on a different host (S3) — do not send our
  // Authorization header to it, only the headers YouCam told us to send.
  const uploadRes = await fetch(uploadRequest.url, {
    method: uploadRequest.method,
    headers: uploadRequest.headers,
    body: bytes,
  });

  if (!uploadRes.ok) {
    logger.error({ status: uploadRes.status, fileName }, "Failed to upload image bytes to YouCam storage");
    throw new YouCamApiError(`Failed to upload "${fileName}" to YouCam storage (${uploadRes.status})`, uploadRes.status);
  }

  return { fileId: file.file_id };
}
