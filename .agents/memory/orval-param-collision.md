---
name: Orval codegen collision when an operation mixes path + query params
description: An OpenAPI operation with both a path param and a query param (same operation) can produce a duplicate-export TS error from Orval codegen; header params don't trigger it.
---

When an OpenAPI operation defines both a path parameter (e.g. `:id`) and a
query parameter on the *same* operation, Orval can emit a `Get*Params` (or
similarly named) type into both `generated/api.ts` and a per-operation file
under `generated/types/`, causing a duplicate-export TypeScript error
(observed as TS2308) after running codegen.

Path-only operations (no query params) do not trigger this; header params
combined with a path param also do not trigger it.

**Fix:** if an operation needs an auxiliary value alongside a path param and
hits this collision, move that value from a query param to a header param in
the OpenAPI spec. This keeps the RESTful path shape (e.g. `/resource/:id/status`)
and avoids the codegen collision, at the cost of the generated React Query
hook not exposing that value in its typed function signature — callers must
pass it manually via the hook's `options.request.headers` (the `customFetch`
mutator merges caller-supplied headers).

**How to apply:** if you hit a duplicate-export codegen error for `*Params`
types after adding a query param next to a path param, try converting the
query param to a header param before investigating further.
