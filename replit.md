# EventReady AI

A Wedding Guest outfit decision assistant: users pick a style vibe and budget, provide a selfie + full-body photo (or use a fixed "Demo Mode" persona), and get back one recommended try-on outfit with an explainable confidence score plus a few comparison options — all styling-focused, never medical/diagnostic language.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the shared API server (mounted at `/api`, all artifacts can call it directly)
- `pnpm --filter @workspace/eventready-ai run dev` — run the EventReady AI frontend (previewPath `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from `lib/api-spec/openapi.yaml`
- Required env: `SESSION_SECRET` — HMAC key signing the stateless session tokens (no database is used by this app)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, stateless (no DB) — sessions are HMAC-signed tokens the client echoes back on every call
- Frontend: React + Vite (`artifacts/eventready-ai`), wouter, TanStack Query, shadcn/ui
- Validation: Zod
- API codegen: Orval (from OpenAPI spec) → `lib/api-client-react` (React Query hooks) and `lib/api-zod`

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the 4 EventReady API endpoints (`/sessions`, `/sessions/:id/analyze`, `/sessions/:id/status`, `/sessions/:id/report`)
- `artifacts/api-server/src/routes/sessions/` — the 4 route handlers
- `artifacts/api-server/src/lib/scoring/` — the outfit selection + confidence-scoring rule engine (`selectOutfits`, `scoreOutfits`, `skinSignals`, `reasonCodes`)
- `artifacts/api-server/src/lib/catalog/weddingGuestCatalog.ts` — the 12-item curated outfit catalog
- `artifacts/api-server/src/lib/demo/replay.ts` — fixed Demo Mode data (persona, skin scores, replayed VTO images)
- `artifacts/api-server/src/lib/session/` — stateless session token signing + elapsed-time-derived processing state
- `artifacts/eventready-ai/public/demo/` — all demo images (12 catalog outfits, persona selfie/full-body, 3 replayed try-on outputs)
- `artifacts/eventready-ai/src/hooks/use-event-ready-flow.ts` — owns the 5-screen flow, session lifecycle, and status-polling loop
- `artifacts/eventready-ai/src/types/screen-props.ts` — prop contracts for the 5 screen components

## Architecture decisions

- **No database.** Sessions are stateless: an HMAC-SHA256-signed token (using `SESSION_SECRET`) carries all session state; `/status` and `/report` derive `status`/`currentStep` purely from elapsed time since analysis started, so there's nothing to persist or clean up.
- **Demo Mode is a first-class mode, not a mock.** `mode: "demo"` replays a fixed skin-analysis result and 3 pre-baked try-on images for a fixed "Maya" persona, but outfit selection/scoring still runs live against whatever style vibe + budget the user actually picked — only the *inputs* (skin signals, available try-on images) are fixed, not the scoring logic.
- **Live Mode is an honest stub.** `mode: "live"` immediately returns an `error` status directing the user to Demo Mode — there is no real YouCam API integration yet (planned as a separate follow-on task). It never fakes a successful analysis.
- **Confidence score is an explainable v0 heuristic**, not ML: `occasionFit(0-25) + styleVibe(0-20) + budget(0-15) + skinOutfitFit(0-25) + vtoSuccess(0-10) − cautionPenalty(0-20)`, clamped 0-100, with every contributing factor mapped to a fixed, non-medical, user-facing reason string.

## Product

- Single flow: Start → Preferences (style vibe + budget) → Photo Upload (or "Use demo persona") → Processing (4 sequential steps, polled every 3s) → Results (recommended outfit with confidence score + reason chips, 2-3 comparison outfits, prep tips).
- Demo Mode banner is always visible while using the demo persona.
- Mobile-responsive, image-first, no dashboards/charts/medical language anywhere.

## User preferences

_None recorded yet._

## Gotchas

- The generated `useGetSessionStatus`/`useGetSessionReport` hooks do not expose the `token` header in their typed function signature (Orval doesn't surface header params on query hooks) — pass it manually via `options.request.headers.token`.
- Regenerate API hooks after any `lib/api-spec/openapi.yaml` change: `pnpm --filter @workspace/api-spec run codegen`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
