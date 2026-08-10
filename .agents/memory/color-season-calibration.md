---
name: Personal colour season classification — calibration traps
description: Three measurement traps that make a LAB-based seasonal colour classifier read systematically warm, and how to check for them.
---

# Calibrating a facial-colour season classifier

A classifier that scores skin/hair/eye colour into warm-vs-cool axes will read
**systematically warm** unless three specific traps are avoided. The symptom is
easy to miss: individual results look plausible one at a time, and the bias only
shows up when you run a spread of archetypes and count the families.

## Rule: always validate with a spread, never with single cases

Run a fixed set of ~7 archetype inputs spanning fair/deep and warm/cool, and
assert that the output covers all four season families. A run that produces zero
cool results is a calibration bug, not bad luck.

**Why:** each of the traps below produces individually believable answers. Only
the distribution reveals them.

## Trap 1 — skin hue neutral must be lightness-corrected

The warm/cool split for skin cannot be a fixed hue angle. Measured skin hue
climbs with lightness, so a fixed threshold marks deep skin as cool and fair skin
as warm regardless of actual undertone.

**Why:** this is an inclusivity failure, not just an accuracy one — it
mis-serves deep skin tones by construction, and vendors in this space care
about exactly that.

**How to apply:** make the neutral line a function of L\*, then verify the
boundary sits between your measured cool and warm samples *at the same
lightness*. Print the measured hue for every sample before choosing the
constants; do not estimate them by hand.

## Trap 2 — hair warmth is carried by chroma, not hue angle

Auburn hair measures a *lower* hue angle than ash brown, so ranking hair warmth
by hue orders it backwards. Saturation is the real signal: warm hair is
chromatic, cool/ash hair is not.

**How to apply:** score hair warmth from chroma. Let near-black hair abstain
(weight → 0) rather than voting, since its hue and chroma are both meaningless
at that lightness. But check what abstention does to high-contrast faces — if
hair abstains and skin leans slightly warm, a strong cool eye signal can get
diluted into a false warm verdict.

## Trap 3 — brown eyes all measure positive on the blue-yellow axis

Splitting eye warmth at b\* = 0 casts a warm vote for every brown-eyed person,
because *all* brown eyes are positive there. A neutral dark brown lands around
b\* ≈ 12; a genuinely golden amber around b\* ≈ 34.

**How to apply:** put the neutral point *inside* the brown range (around
b\* ≈ 8–10 rising to ≈ 30), so the axis discriminates between browns rather
than between brown and blue. Use the blue-yellow axis directly rather than hue
angle, because eye colour crosses the colour wheel and a linear hue ramp wraps
incoherently.

## Verification worth keeping

CIEDE2000 implementations are easy to get subtly wrong. The Sharma et al. (2005)
published reference pairs are the standard check — all of them should match
exactly, not approximately. Getting this right first means later disagreements
are calibration problems, not maths problems.
