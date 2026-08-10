import crypto from "node:crypto";
import type { SessionMode, SessionStatusValue, UserPreferences } from "../types";

/**
 * Stateless, HMAC-signed session tokens. There is no database for this
 * product — the entire session lives inside the signed token that the
 * client echoes back on every call. Processing progress is derived from
 * elapsed wall-clock time (see `./processing.ts`), never from server-side
 * mutable state, so any server instance can verify any token.
 */
export interface SessionPayload {
  sessionId: string;
  mode: SessionMode;
  preferences: UserPreferences;
  status: SessionStatusValue;
  createdAt: string;
  analyzeStartedAt: string | null;
  errorMessage: string | null;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is required to sign EventReady session tokens.",
    );
  }
  return secret;
}

function sign(payloadB64: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

export function signSessionToken(payload: SessionPayload): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;

  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const payloadB64 = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  let expected: string;
  try {
    expected = sign(payloadB64);
  } catch {
    return null;
  }

  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

export function createSessionPayload(mode: SessionMode, preferences: UserPreferences): SessionPayload {
  return {
    sessionId: crypto.randomUUID(),
    mode,
    preferences,
    status: "created",
    createdAt: new Date().toISOString(),
    analyzeStartedAt: null,
    errorMessage: null,
  };
}
