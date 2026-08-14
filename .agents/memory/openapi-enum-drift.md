---
name: OpenAPI enum drift silently breaks whole responses
description: Why adding a value to a hand-written TypeScript union without adding it to the OpenAPI enum passes typecheck but fails the entire API response at runtime.
---

When a server validates its own responses against a schema generated from an
OpenAPI spec, the spec enums and any hand-written TypeScript unions covering the
same domain are **two independent sources of truth**. Adding a value to the
union alone compiles cleanly and looks complete — then fails at runtime.

**Why this is worse than it sounds:** the failure is not graceful degradation of
the one new item. Response validation rejects the *entire* payload, so a single
unlisted enum value turns the whole endpoint into a 500 for any request whose
data happens to include it. Everything else keeps working, so the breakage looks
intermittent and data-dependent rather than like a schema problem.

**Why typecheck can't save you:** the generated types are produced *from* the
spec, so the spec is self-consistent; the drift lives between the spec and the
separate union. Both sides typecheck in isolation.

**How to apply:**
- When extending a domain enum, treat the spec as the primary edit and the local
  union as the follower — then regenerate.
- Data files (catalogs, seed data, fixtures) that feed validated responses are
  the usual source of unlisted values. A cheap script that asserts every row's
  enum-typed fields are members of the *generated* enums catches this class
  outright, and is worth keeping around rather than running once.
- Be especially suspicious when a feature works for pre-existing data and fails
  only for newly added data — that shape of bug is almost always enum drift.
