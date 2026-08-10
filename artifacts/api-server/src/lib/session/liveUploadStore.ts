/**
 * Transient, in-memory holding area for a Live Mode session's uploaded photo
 * bytes. The signed session token cannot hold raw image bytes (see
 * `sessionToken.ts`), but:
 *  - the selfie bytes are needed again once Skin Analysis resolves, to
 *    write the replay cache entry (keyed on `sha256(selfieBytes + params)`);
 *  - the full-body bytes are needed again once outfits are selected, to
 *    start the 3 Apparel VTO tasks — which happens on a later `/status`
 *    poll, well after the original `/analyze` request has returned.
 *
 * This bridges that gap for a single server instance without ever putting
 * image bytes in the token or a database. Entries are cleared as soon as
 * the whole Live Mode pipeline finishes (all VTO tasks terminal) and expire
 * on their own after `TTL_MS` as a safety net for abandoned sessions.
 */
interface PendingLiveUpload {
  selfieBytes: Buffer;
  selfieContentType: string;
  fullBodyBytes: Buffer;
  fullBodyContentType: string;
  expiresAt: number;
}

const store = new Map<string, PendingLiveUpload>();
const TTL_MS = 15 * 60 * 1000;

function sweepExpired(): void {
  const now = Date.now();
  for (const [sessionId, entry] of store) {
    if (entry.expiresAt <= now) store.delete(sessionId);
  }
}

export function storePendingLiveUpload(
  sessionId: string,
  selfieBytes: Buffer,
  selfieContentType: string,
  fullBodyBytes: Buffer,
  fullBodyContentType: string,
): void {
  sweepExpired();
  store.set(sessionId, {
    selfieBytes,
    selfieContentType,
    fullBodyBytes,
    fullBodyContentType,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function peekPendingLiveUpload(sessionId: string): PendingLiveUpload | undefined {
  const entry = store.get(sessionId);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) store.delete(sessionId);
    return undefined;
  }
  return entry;
}

export function clearPendingLiveUpload(sessionId: string): void {
  store.delete(sessionId);
}
