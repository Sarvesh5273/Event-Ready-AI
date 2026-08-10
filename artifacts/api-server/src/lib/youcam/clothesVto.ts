import { YouCamNotImplementedError } from "./types";

/**
 * Stub for YouCam's Apparel Virtual Try-On API. Real integration is out of
 * scope for this build — see Task 2 ("EventReady AI — YouCam Live
 * Integration"). Callers should catch `YouCamNotImplementedError` and fall
 * back to a friendly "try Demo Mode" message rather than crashing the
 * request.
 */
export async function runYouCamApparelVto(
  _fullBodyImage: unknown,
  _garmentImageUrl: string,
): Promise<never> {
  throw new YouCamNotImplementedError(
    "Live Apparel Try-On isn't available yet in this build.",
  );
}
