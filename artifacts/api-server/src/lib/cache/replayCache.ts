import crypto from "node:crypto";

/**
 * In-memory replay cache: avoids burning YouCam API units when the exact
 * same input (image bytes + task parameters) is submitted again — e.g. a
 * user retrying, or re-running the same demo photo twice during judging.
 *
 * Scope: process lifetime, single instance. That matches this app's
 * stateless-session, single-instance deployment; nothing here is meant to
 * survive a restart. Toggle with `ENABLE_REPLAY_CACHE` (default: on).
 *
 * Cache keys always hash the actual input bytes, so two different users'
 * uploads never collide, and a cache entry can never be replayed for a
 * different user's data by construction.
 */
export function isReplayCacheEnabled(): boolean {
  return process.env.ENABLE_REPLAY_CACHE !== "false";
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// Mirrors YouCam's own 24h result retention window for successes.
const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;
// Keep failures cached only briefly, so a transient outage doesn't poison
// retries for the rest of the day.
const FAILURE_TTL_MS = 60 * 1000;

export function sha256Hex(...parts: Array<Buffer | string>): string {
  const hash = crypto.createHash("sha256");
  for (const part of parts) hash.update(typeof part === "string" ? Buffer.from(part) : part);
  return hash.digest("hex");
}

export function getCached<T>(key: string): T | undefined {
  if (!isReplayCacheEnabled()) return undefined;
  const entry = store.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCachedSuccess<T>(key: string, value: T): void {
  if (!isReplayCacheEnabled()) return;
  store.set(key, { value, expiresAt: Date.now() + SUCCESS_TTL_MS });
}

export function setCachedFailure<T>(key: string, value: T): void {
  if (!isReplayCacheEnabled()) return;
  store.set(key, { value, expiresAt: Date.now() + FAILURE_TTL_MS });
}

/** Key for a Skin Analysis result: hash of the selfie bytes + requested concerns. */
export function skinCacheKey(selfieBytes: Buffer, dstActions: readonly string[]): string {
  return `skin:${sha256Hex(selfieBytes, JSON.stringify([...dstActions].sort()))}`;
}

/** Key for an Apparel VTO result: hash of the full-body photo + garment image + category. */
export function vtoCacheKey(fullBodyBytes: Buffer, garmentBytes: Buffer, garmentCategory: string): string {
  return `vto:${sha256Hex(fullBodyBytes, garmentBytes, garmentCategory)}`;
}
