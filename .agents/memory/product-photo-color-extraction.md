---
name: Extracting a garment's dominant colour from a product photo
description: Why colour-distance thresholds fail to separate a studio backdrop from a garment, and what actually works — border flood fill with adaptive tolerance plus largest-cluster estimation.
---

# The failure mode to watch for

A dominant-colour sampler that averages a centre crop silently blends the
studio backdrop into the result. It never errors — it just pulls every reading
toward neutral grey, so strongly coloured garments measure as muted. If that
colour then feeds a matching or scoring engine, the whole engine quietly
degrades and every item looks similarly mediocre.

**Why this is dangerous:** there is no failure signal. The only way to catch it
is to eyeball measured values against the actual images.

# What does not work

- **Global colour-distance rejection** (drop pixels close to a sampled corner
  colour). Studio backdrops are *graded*, not flat, so no single threshold both
  swallows the whole backdrop and spares a pale garment.
- **Mean or median of the surviving pixels.** A garment with contrasting trim
  (e.g. gold work on a dark base) is bimodal; the average lands between the two
  modes on a colour that appears nowhere in the garment.

# What works

1. **Border flood fill** to identify the backdrop. Comparing each pixel only to
   its *neighbour* lets the fill walk a gradient while still stopping at a
   garment edge — which is exactly what a global threshold cannot do.
2. **Adaptive fill tolerance.** Retry the fill at progressively tighter
   tolerances until the backdrop stops claiming an implausible share of the
   frame (>85%). Without this, a pale garment low in contrast against the
   backdrop gets swallowed, leaving only its shadowed folds and reading grey.
3. **k-means, then take the largest non-backdrop cluster** as the estimate. This
   resists the bimodal garment+trim case that defeats mean and median.
4. **Deterministic seeding** (e.g. by luminance spread) so measured values never
   drift between builds.

**How to apply:** validate any such extractor against a spread of images that
includes both saturated and pale garments — a sampler can look perfect on
strong colours while failing completely on pale ones. Treat measured colour
values as generated output: record in the data file that they are
machine-measured and must not be hand-edited, or someone will "fix" one by eye
and reintroduce inconsistency.

## Retailer photography is not measurable at all

The border-flood-fill extractor works on flat studio catalog shots but fails
outright on real retailer product photos: four dresses a retailer described as
emerald extracted as navy, teal, navy and black, with the garment occupying
only ~26–32% of the frame. Retailer photography uses moody lighting, styled
backdrops and models at varying scale.

**Why it matters:** the temptation is to score third-party listings the same
way you score your own catalog. Don't. Scoring an emerald gown as "black —
clashes" discredits the colour engine's real results elsewhere in the product.
Fall back to the retailer's own colour word and say plainly that the garment
was not measured.
