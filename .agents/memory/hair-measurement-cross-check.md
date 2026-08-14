---
name: Hair colour measurements need an eyebrow cross-check
description: Why a returned hair swatch cannot be trusted on its own, and how to detect a failed hair segmentation.
---

A face-analysis API can return a confident hair colour that is not hair at all.
Hair has a soft, translucent edge against the background, so the segmentation
drifts onto forehead skin, a rim-lit highlight, or the backdrop. The result is
not noisy — it is a clean, plausible swatch of the wrong thing. In one observed
case a near-black-haired person was reported with mid-auburn hair roughly 40 L*
too light, which flipped the derived season and collapsed the measured contrast
to zero.

**Rule:** treat a hair swatch as untrusted when it measures much lighter than
the eyebrows (~18 L* was the working threshold). Fall back to the eyebrows as
the depth/contrast anchor and drop hair from any temperature vote. Never
substitute an invented hair colour.

**Why:** brows are small, opaque, always inside the face crop, and share
pigment with the hair, so they track natural hair depth closely and almost
never catch background. The check is deliberately one-directional — hair
*darker* than brows is ordinary. Bleached or greying hair also reads much
lighter than the brows, and routing that to "read depth from the brows" is the
correct answer there too, since colour analysis works from natural depth
rather than dye.

**How to apply:** wherever hair feeds depth, contrast, or temperature. Surface
the rejection in any UI that displays the raw swatches — showing a measurement
the engine silently discarded is worse than not showing it, because the user
can see their own hair and will catch the contradiction.
