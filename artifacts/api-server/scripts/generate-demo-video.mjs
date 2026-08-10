/**
 * One-off script: generates a pre-baked demo video for the bold-emerald-jumpsuit
 * VTO image using the YouCam Image-to-Video API, then downloads and saves it as a
 * static asset alongside the other demo replay assets.
 *
 * Run once (requires YOUCAM_API_KEY in env):
 *   YOUCAM_API_KEY=xxx node artifacts/api-server/scripts/generate-demo-video.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const YOUCAM_BASE_URL = "https://yce-api-01.makeupar.com";
const VIDEO_TASK_PATH = "/s2s/v2.0/task/image-to-video/youcam";

const API_KEY = process.env.YOUCAM_API_KEY;
if (!API_KEY) {
  console.error("YOUCAM_API_KEY is not set");
  process.exit(1);
}

// The VTO image is served publicly by the running eventready-ai Vite dev server
const DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
if (!DEV_DOMAIN) {
  console.error("REPLIT_DEV_DOMAIN is not set");
  process.exit(1);
}

const SRC_IMAGE_URL = `https://${DEV_DOMAIN}/demo/replay/vto-bold-emerald-jumpsuit.jpg`;
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../../eventready-ai/public/demo/replay/video-bold-emerald-jumpsuit.mp4"
);

function authHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function startVideo() {
  console.log(`Starting Image-to-Video task with src: ${SRC_IMAGE_URL}`);
  const res = await fetch(`${YOUCAM_BASE_URL}${VIDEO_TASK_PATH}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      resolution: "720",
      dst_duration: 5,
      prompt:
        "Subtle, natural turn and smile, elegant wedding-guest styling, smooth motion, clean background.",
      model: "youcam-video-v2",
      src_file_url: SRC_IMAGE_URL,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Start task failed ${res.status}: ${text}`);
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON start response: ${text}`);
  }

  // Try both envelope styles
  const taskId = body?.data?.task_id ?? body?.task_id;
  if (!taskId) {
    throw new Error(`No task_id in response: ${text}`);
  }

  console.log(`Task started: ${taskId}`);
  return taskId;
}

async function checkStatus(taskId) {
  const res = await fetch(`${YOUCAM_BASE_URL}${VIDEO_TASK_PATH}/${taskId}`, {
    method: "GET",
    headers: authHeaders(),
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = undefined;
  }

  if (res.ok) {
    const data = body?.["data"] ?? body;
    const url =
      data?.["url"] ??
      data?.["results"]?.["url"];

    if (url) return { status: "success", videoUrl: url };

    if (data?.["task_status"] === "error") {
      return {
        status: "error",
        errorMessage: data["error"] ?? "Task failed",
      };
    }

    return { status: "running" };
  }

  return {
    status: "error",
    errorMessage: body?.["error"] ?? `Status check failed ${res.status}`,
  };
}

async function downloadFile(url, destPath) {
  console.log(`Downloading video from: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
  console.log(`Saved to: ${destPath} (${buffer.length} bytes)`);
}

async function main() {
  const taskId = await startVideo();

  // Poll every 10 seconds, up to 10 minutes
  const maxAttempts = 60;
  const pollIntervalMs = 10_000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt}/${maxAttempts}...`);
    const result = await checkStatus(taskId);

    if (result.status === "success") {
      console.log(`Video ready: ${result.videoUrl}`);
      await downloadFile(result.videoUrl, OUTPUT_PATH);
      console.log("Done! Update replay.ts and buildDemoReport to reference:");
      console.log("  demo/replay/video-bold-emerald-jumpsuit.mp4");
      return;
    }

    if (result.status === "error") {
      throw new Error(`Task failed: ${result.errorMessage}`);
    }

    // Still running — wait before next poll
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  throw new Error("Timed out waiting for video generation after 10 minutes");
}

main().catch((err) => {
  console.error("Script failed:", err.message);
  process.exit(1);
});
