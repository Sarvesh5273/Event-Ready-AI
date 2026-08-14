---
name: Colour-family buckets and how to label them
description: Coarse RGB colour-family matching collapses distinct palette colours together and goes hue-blind at low lightness; never head such a bucket with your own measured colour name.
---

## Nearest-colour-family matching is hue-blind at low lightness

A plain Euclidean nearest-neighbour over a small set of RGB reference colours
misclassifies dark and desaturated colours badly, because at low lightness the
channel differences that encode hue are numerically small next to the
differences that encode brightness.

Observed: olive lands nearer terracotta than sage; forest green lands nearer
teal than emerald; a golden honey lands nearer coral than mustard — each by a
margin of only a few units, so the winner is essentially arbitrary.

Second consequence: **several palette colours routinely collapse onto one
family.** An autumn palette put three of its eight hero colours into a single
bucket. Any feature that iterates "the first N palette colours" and looks up a
bucket per colour will therefore produce near-duplicate sections competing for
one set of items, and whichever loses renders empty.

**How to apply:** when mapping palette colours onto coarse buckets, deduplicate
by *bucket* and scan the whole palette for N distinct ones, rather than taking
the first N colours by position. Drop a bucket that yields nothing instead of
rendering an empty heading. Perceptual distance (CIEDE2000 in LAB) is the real
fix, but if the same matcher also drives scoring, changing it is a much larger
blast radius than the labelling problem that surfaced it — fix the label first.

## Never head a third-party bucket with your own measured value

If items are selected by a coarse bucket but the heading shows the precise
value that *mapped into* that bucket, the heading reads as a description of
the items. "Forest Green" above three unmistakably teal garments is a visible
false claim, even though every individual step was defensible.

**Why:** the measured value belongs to the user; the items were filed by a
third party under their own vocabulary. Presenting one as the caption of the
other silently transfers your measurement's authority onto data you never
measured.

**How to apply:** show both, and name the join. Keep the measured value as the
heading (it is the user's), and put the third-party bucket word beside it
("Retailer colour: teal"). The user can then see the mapping and judge it,
which is strictly more informative than hiding the seam.
