---
name: Graceful fallbacks must record why
description: A pipeline that degrades gracefully must store a reason code at EVERY fallback site, including timeout sweeps and partial-cache paths, or the UI cannot tell a clean result from a failed one.
---

When a pipeline is designed to survive a failed upstream call by substituting
neutral defaults or dropping an optional result, the substitution must record a
short reason code alongside it.

**Why:** graceful degradation without a recorded reason is indistinguishable
from success. Downstream the result looks merely "absent", so the UI renders a
page with sections quietly missing and no explanation — which reads as a bug,
not as a deliberate refusal to invent data. The upstream error text is usually
discarded long before the UI, so the reason has to be captured at the moment of
fallback or it is gone.

**How to apply:**

- Enumerate fallback sites exhaustively before declaring the work done. The
  easy ones are the `catch` blocks next to each call. The ones consistently
  missed are:
  - **timeout / stall sweeps** — a separate function that resolves whatever is
    still pending after N minutes, far from the call sites.
  - **defensive "never started" branches** — resolving a task that has no task
    id.
  Both produce exactly the same degraded output as a real error, so both need
  a code (`timeout`, `task_unavailable`).
- **Never apply one failure code to several measurements at once.** Where a
  single shared step (an upload, an auth handshake) feeds two independent
  analyses, and either analysis may already be satisfied from cache, blaming
  the shared failure for both will claim a real cached measurement is
  unavailable. Set a code only for the analyses that actually had to fall back.
- Derive scope/severity from which codes are present, not from a single flag —
  then correct scope follows automatically once every site is covered.
- Keep the stored value a **short code**, and derive human-readable copy later
  at render or report-build time. Codes are cheap to carry through size-
  constrained transports; sentences are not.
- Guard with `?? existingCode` when setting, so a later generic sweep cannot
  overwrite a specific reason already recorded by the original failure.

**Verification without a test harness:** drive the derivation function directly
with a table of hand-built states — every code, an unrecognised code, the
"failed but no code recorded" case, and the fully-clean case — and assert the
clean case yields nothing. This catches false alarms, which are worse than a
missing notice.
