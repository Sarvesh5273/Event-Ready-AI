---
name: Pre-rendered demo fixtures are coupled to scoring logic
description: Why a scoring change can silently delete a demo feature that depends on baked assets.
---

When a demo mode replays pre-rendered assets, the set of baked renders is an
implicit constraint on what the demo can show. Change the scoring engine and
the winning selection can move to items that were never rendered.

The dangerous case is a feature that is *conditional* — e.g. a side-by-side
comparison that only appears when two same-category items differ by more than
a minimum score gap. When scoring shifts, the feature does not error; it
silently renders nothing, and the demo quietly loses its centrepiece.

**Why:** the fixture set was chosen under the old scoring behaviour and nothing
ties the two together.

**How to apply:** after any scoring change, exercise the demo across *every*
user-facing filter combination and assert the conditional sections are still
populated, not merely that the request succeeded. Filters that partition the
catalog (such as a regional/tradition filter) each need their own fixture
coverage — one combination passing says nothing about the others. Keep the
render script's item list broad enough to cover each filter branch, and make it
skip anything already on disk so extending it is cheap.
