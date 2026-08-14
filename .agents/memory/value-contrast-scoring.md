---
name: Value-contrast scoring must not punish excess separation
description: How to score garment-vs-skin lightness contrast without breaking flattering high-contrast combinations.
---

Scoring garment colour by hue proximity alone gets visibly wrong answers. A
garment sitting at the wearer's own lightness has no edge at the neckline and
flattens the face however well-chosen the hue, while an off-palette colour with
the right depth can look sharp and deliberate.

**Rule:** contrast must contribute its *own* additive points, not a multiplier
on the hue score. A capped multiplier cannot overturn a large hue-score gap, so
the wrong garment still wins.

**Rule:** model separation as a floor with diminishing returns — never a target
band with a symmetric penalty. Too little separation is a real, visible failure;
too much usually is not. A symmetric "ideal separation" curve scored black at
zero on a fair high-contrast face and white at zero on deep skin, which are two
of the most reliably flattering combinations there are. Only a genuinely
low-contrast person pays anything for excess, and that should be a soft partial
penalty scaled by how little contrast they carry.

**Why:** the failure is asymmetric in reality, so the scoring function must be
asymmetric too.

**How to apply:** validate any change on a spread of archetypes — fair/low
contrast, fair/high contrast, deep skin, olive/medium, and a dyed-hair case —
and spot-check neutral extremes (white, black, blush, navy, camel) for each.
Single-persona tuning hides exactly this class of bug.

## A failure verdict must cap its own score

When you add a new "this is bad" verdict, cap the points it can carry in the
same commit. A washed-out garment kept its full hue score and lost only the
contrast term, so a textbook palette colour at the wearer's own lightness
landed mid-table while the copy told the user it flattened their face — and it
could still be shortlisted.

**Rule:** a verdict and its number must agree. Gate the harsh label on a score
ceiling, and cap the score of anything carrying that label. Check the reverse
direction too: a mid-scoring colour should not inherit a harsh label merely
because its nearest neighbour sits on an avoid list.

**How to apply:** assert it — for every (archetype × garment) pair, no failure
verdict above its cap and no top verdict below a floor. This catches the
contradiction that reading the code does not.

## There is no honest default for a measurement

Substituting a neutral mid value for an unmeasured quantity looks harmless and
is not: a stand-in "medium contrast" silently decided how much separation every
garment needed for a wearer whose contrast was never read, and contributed real
points to every score.

**Rule:** make the unmeasured value null and have consumers *drop* that term,
re-weighting what was actually measured, rather than filling the gap. Carry the
null through the client DTO so the UI can say what it does not know.

**Why:** in a product whose claim is measurement over guesswork, a fabricated
default is the exact failure the product exists to avoid — and it is invisible,
because a plausible number never looks like a missing one.
