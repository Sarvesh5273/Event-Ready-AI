---
name: Never render a raw measurement summary beside a curated interpretation
description: Why the colour reveal shows axis meters instead of a generated "your colouring reads X" sentence
---

When a feature computes numeric axes and *also* maps them to a named category
with hand-written marketing copy, do not display a generated prose summary of
the axes next to that copy. Render the axes as positions on a scale instead.

**Why:** The category copy and the axis summary are two independent
descriptions of the same person, and they will eventually disagree in wording
even when both are correct. A user measured as warm-dominant but sitting at the
softer end of the chroma axis was classified True Spring — whose curated
tagline is "warm and clear" — while the generated summary said "warm, light and
muted". Both statements were accurate; side by side on screen they read as a
broken product. Being at the soft end of a clear season is normal and not a
classifier bug, so "fixing" it by recalibrating thresholds would have been
chasing a presentation problem into the model.

**How to apply:** Any time you have `axes` (continuous) plus a `label` +
`tagline` (discrete, curated), show the axes as markers on labelled scales
(Cool↔Warm, Deep↔Light, Muted↔Clear). A marker states the measurement without
competing with the verdict, and it exposes more of the underlying reading than
a sentence does — which is the more convincing artefact anyway. Reserve prose
for the interpretation only. Keep the prose summary in the API response if
other consumers want it; just don't put it next to the label in the UI.
