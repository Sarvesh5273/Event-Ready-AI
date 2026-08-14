---
name: A fallback to "unmeasured" must destroy the handle to the real data
description: When a pipeline gives up on a measurement and substitutes neutral defaults, clear the task id / handle too — otherwise a later re-read resurrects real data and pairs it with the neutral verdict.
---

When a step gives up on an external measurement and substitutes neutral or
"unknown" defaults, it must also clear whatever handle would let a later stage
re-read the real result — the provider task id, job id, cache key, or URL.

**Why:** A status check can fail for transport reasons or time out while the
provider's job later succeeds. If the handle survives the fallback, a
downstream stage that re-reads it gets genuine data and renders it next to the
neutral values the pipeline already committed to. The output then shows real
evidence beside a verdict that was computed as if nothing had been measured —
the two halves of one response disagree, and the more convincing half is the
one that is wrong. This is worse than showing nothing, because the evidence
makes the false half look verified.

This bites specifically when the give-up path and the re-read path are written
at different times by different reasoning. The give-up path thinks "resolve
this step so the pipeline can proceed"; the re-read path thinks "the id is
here, so the data must be good." Neither is wrong alone.

**How to apply:** At every fallback site, ask what else in the system could
still reach the real result through state this branch is leaving behind. Clear
it in the same expression that sets the neutral value, so the two can never
drift apart. Prefer clearing the handle over adding a separate boolean flag:
one piece of state cannot desynchronise from itself. Cover *all* fallback
paths — provider-reported failure, transport exception, and timeout — not just
the obvious one; the timeout path is the one usually missed, and it is also
the one most likely to have a job that later succeeds.
