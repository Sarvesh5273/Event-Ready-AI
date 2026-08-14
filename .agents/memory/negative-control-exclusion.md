---
name: Negative controls must be excluded from the positive path
description: When a feature deliberately surfaces a "worst" option as a control, that item must be explicitly excluded from recommendations/scoring — overlap is likelier than it looks.
---

Any feature that deliberately shows the user a *bad* option as a comparison
control must explicitly exclude that item from every positive surface —
shortlist, scores, and the recommendation — rather than assuming the ranking
will keep them apart.

**Why:** the two selections usually run on different criteria. A "worst"
chosen on one dimension (e.g. pure colour fit) can still win the blended
ranking that also weighs style, occasion and finish. The overlap becomes
*likely*, not merely possible, once a hard filter shrinks the eligible pool —
picking 3 out of 6 leaves little room for the worst item to fall outside the
top 3. The failure is silent in code and loud in the UI: the app recommends a
garment while the panel directly beneath labels the same garment "not your
colour", which destroys the credibility of a product whose entire claim is
that it measures instead of flatters.

**How to apply:** compute the control pair *before* the shortlist, then pass
its losing id in as an exclusion. Order matters — deduplicating afterwards
only fixes the try-on queue, not the ranking. Guard it with a script that
sweeps every preference combination across several personas, because a single
demo persona will not reproduce it.
