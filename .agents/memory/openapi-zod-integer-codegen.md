---
name: OpenAPI `integer` breaks the zod codegen
description: Using `type: integer` in the OpenAPI spec makes Orval emit a zod v4-only helper that the pinned zod 3 does not have, failing codegen.
---

Do not use `type: integer` in the OpenAPI spec. Use `type: number` and say
"whole number" in the `description` instead.

**Why:** the Orval zod generator turns `type: integer` into `zod.int()`, which
only exists in zod v4. The project is pinned to zod 3, so codegen itself fails
with `TS2339: Property 'int' does not exist on type 'typeof zod'` pointing at
the *generated* file — which looks like a corrupt build artifact rather than a
spec problem, so the instinct is to re-run codegen or clear caches instead of
editing the spec.

**How to apply:** whenever adding a numeric field to the spec. If codegen ever
fails inside `generated/api.ts` on a missing zod helper, grep the spec for the
JSON-Schema keyword that produced it before touching anything else — the fault
is almost always a spec keyword the pinned zod version cannot express.
