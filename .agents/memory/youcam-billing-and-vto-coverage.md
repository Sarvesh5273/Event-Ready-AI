---
name: YouCam billing behaviour and VTO garment coverage
description: Two empirical findings about the YouCam API that its docs don't state — failed tasks are refunded, and Cloth VTO handles non-Western draped garments despite a Western-only category enum.
---

# Failed tasks are refunded

Only *successful* tasks bill against the credit ledger. A task that errors out is
refunded, so the ledger balance after a failed run is unchanged.

**Why:** measured directly against the account ledger across repeated runs, not
documented. It changes the economics of testing substantially — an
experiment that fails costs nothing, so exploratory probing is far cheaper
than the per-call sticker price suggests.

**How to apply:** don't ration experiments out of fear of burning credits on
failures. Budget for *successful* calls only. Do still ration deliberate
successful runs (a full pipeline run is tens of units).

# Cloth VTO handles non-Western garments

The Cloth VTO endpoint exposes a Western-shaped category enum
(`full_body` / `upper_body` / `lower_body`), which looks like it would fail on
draped or layered non-Western clothing. It does not.

Probed with saree, lehenga, anarkali, qipao and abaya, all submitted as
`full_body`. All rendered correctly, including details that a naive
garment-warp would be expected to mangle: saree pallu drape, lehenga dupatta,
anarkali over palazzo, qipao mandarin collar and frog closures.

**Why:** the enum describes the *body region covered*, not the garment's
cultural cut, so it is far less limiting than it appears.

**How to apply:** don't treat the category enum as a reason to exclude
non-Western garments from a catalog, and don't build a special-case pipeline
for them. Map by covered body region and submit normally.
