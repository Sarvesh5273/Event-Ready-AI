---
name: YouCam Skin Analysis score direction
description: YouCam's skin analysis scores are healthy-direction (higher = healthier); don't assume higher always means "more of the concern."
---

YouCam's (PerfectCorp) Skin Analysis API returns per-attribute scores where a
**higher number means healthier skin** (less of the concern), not more of
it. This is the opposite of what you'd naively assume from an attribute
named e.g. "redness" or "oiliness" score.

**Why:** confirmed against PerfectCorp's publicly documented sample response
shape/field names. An app whose internal convention is concern-direction
(higher = more redness/oiliness/etc., which drives UI language like "high
redness detected") must invert the raw score before mapping it into
internal levels — otherwise the UI's severity levels come out backwards
(a very healthy scan reads as "high concern").

**How to apply:** do the inversion (`100 - rawScore`, or equivalent) exactly
once, at the API boundary/mapping layer that translates the vendor response
into your internal representation. Keep internal threshold logic in
concern-direction terms unchanged — don't try to thread the sign flip
through downstream threshold code, it's easy to lose track of which
direction a given number is in once it's a few functions removed from the
API response.
