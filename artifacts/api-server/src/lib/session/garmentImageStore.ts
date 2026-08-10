/**
 * Holds a Live Mode custom-garment upload's raw image bytes so the results
 * screen can display it, served via a dedicated binary endpoint
 * (`GET /sessions/:sessionId/garment-image`) rather than ever being
 * embedded in the signed session token.
 *
 * The token is echoed back as an HTTP request header on every `/status`
 * poll — a base64'd garment photo easily runs to hundreds of KB, which
 * blows well past typical HTTP header size limits (431 Request Header
 * Fields Too Large) once inflated ~33% by base64 and folded into the
 * token. This store exists specifically to keep raw image bytes out of
 * that round-trip.
 *
 * Deliberately separate from `liveUploadStore` (which is cleared as soon
 * as the VTO pipeline finishes) because the garment photo must still be
 * servable after that point, for as long as the results screen might
 * request it — hence its own, longer TTL.
 */
interface StoredGarmentImage {
  bytes: Buffer;
  contentType: string;
  expiresAt: number;
}

const store = new Map<string, StoredGarmentImage>();
const TTL_MS = 30 * 60 * 1000;

function sweepExpired(): void {
  const now = Date.now();
  for (const [sessionId, entry] of store) {
    if (entry.expiresAt <= now) store.delete(sessionId);
  }
}

export function storeGarmentImage(sessionId: string, bytes: Buffer, contentType: string): void {
  sweepExpired();
  store.set(sessionId, { bytes, contentType, expiresAt: Date.now() + TTL_MS });
}

export function getGarmentImage(sessionId: string): { bytes: Buffer; contentType: string } | undefined {
  const entry = store.get(sessionId);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) store.delete(sessionId);
    return undefined;
  }
  return entry;
}
