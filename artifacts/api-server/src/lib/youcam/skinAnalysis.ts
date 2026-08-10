import { YouCamNotImplementedError } from "./types";

/**
 * Stub for YouCam's Skin Analysis API. Real integration (auth, image
 * upload, polling for results) is out of scope for this build — see Task 2
 * ("EventReady AI — YouCam Live Integration"). Callers should catch
 * `YouCamNotImplementedError` and fall back to a friendly "try Demo Mode"
 * message rather than crashing the request.
 */
export async function runYouCamSkinAnalysis(_selfieImage: unknown): Promise<never> {
  throw new YouCamNotImplementedError(
    "Live Skin Analysis isn't available yet in this build.",
  );
}
