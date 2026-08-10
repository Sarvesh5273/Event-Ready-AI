import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * Dev/verification fixture — serves a minimal 1×1 transparent PNG via a
 * root-relative `/api/_fixture/garment-image` URL.
 *
 * Purpose: lets the mockup sandbox (served at `/__mockup`) confirm that
 * `<img src="/api/...">` tags correctly reach the API server through the
 * shared path-based proxy, without needing a real session token.  The
 * production garment-image endpoint (`GET /sessions/:id/garment-image`)
 * uses the same Content-Type / binary-response path — this fixture
 * exercises the routing layer only.
 *
 * Not mounted in production (NODE_ENV check in routes/index.ts).
 */

// Minimal 1×1 transparent PNG (68 bytes, RFC-valid, browser-renderable).
const ONE_PX_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

router.get("/_fixture/garment-image", (_req, res): void => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Fixture", "1");
  res.type("image/png");
  res.send(ONE_PX_PNG);
});

export default router;
