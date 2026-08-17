# EventReady AI — Devpost Submission Copy

> Copy each block into the matching Devpost field. Anything in `[BRACKETS]` is yours to fill —
> I don't have those facts. Everything else is ready to paste as-is.

---

# PAGE 1 — GENERAL INFO (public)

## Project name

```
EventReady AI
```

## Elevator pitch (200 char max)

```
Most beauty AI hands you a filter. EventReady AI hands you a verdict — it measures your skin, hair and eyes in CIELAB, grades any garment by ΔE, and tells you yes or no with a confidence score.
```

*(189 characters.)*

### Backups, if you want a different angle

```
Not a filter. A verdict. EventReady AI measures your colouring from one photo, grades any outfit by CIEDE2000 colour distance, and shows you the proof — the same face, two garments, side by side.
```

```
Upload one photo. EventReady AI measures skin, hair and eye colour in CIELAB, places you in a 12-season palette, and grades any garment yes or no — with the ΔE number that decided it.
```

---

# PAGE 2 — PROJECT DETAILS (public)

## About the project

*(Paste the whole block below into the Markdown editor.)*

```markdown
## Not a filter. A verdict.

Every virtual try-on I have ever used answers the wrong question. They show you
what a garment *looks* like on you. They never tell you whether it *works* on you.
You are left doing the hardest part yourself — squinting at a mirror, asking a
friend, guessing.

EventReady AI answers the question you actually had: **should I wear this?**

Upload one photo. It measures your skin, hair and eye colour, places you in a
12-season colour palette, and then grades any garment you point it at — yes or no,
with a confidence score and the actual colour-distance number that decided it.

## What it does

**1. It measures you — it doesn't guess.**
One photo goes to Perfect Corp's Skin Tone Analysis and Skin Analysis APIs. We pull
skin colour, hair colour and eye colour, convert everything into CIELAB, and treat
those as instrument readings rather than vibes.

**2. It classifies your season.**
Three axes — warm/cool, light/deep, muted/bright — resolve to one of the twelve
seasonal palettes. Every axis is shown as a meter with its measured value, so you can
see *why* you landed where you did rather than being handed a label.

**3. It grades garments by ΔE.**
Every garment colour is compared to your palette using CIEDE2000 — the perceptual
colour-difference standard, validated here against the Sharma et al. (2005) reference
pairs. A ΔE below the threshold is a match. Above it is not. The number is always shown.

**4. It shows you the proof.**
Perfect Corp's Cloth Virtual Try-On renders the same face wearing a best-match garment
and a deliberately off-palette one, side by side. The verdict is not something you have
to take on faith — you can see the difference. Image-to-Video then brings the winning
look to life.

**5. It grades garments we've never seen.**
Paste any product photo. We extract the true garment colour out of the retailer's
photography and run it through the same scoring engine.

## How we built it

- **Frontend** — React + TypeScript + Vite, Tailwind, Framer Motion, Radix primitives.
- **Backend** — Express + TypeScript, with an OpenAPI contract as the single source of
  truth. Zod schemas and the typed React client are both generated from it, so a
  backend shape change becomes a frontend type error rather than a runtime surprise.
- **Perfect Corp / YouCam APIs** — Skin Analysis, Skin Tone Analysis, Cloth Virtual
  Try-On, Image-to-Video, and the S2S file-upload pipeline, all async task-and-poll.
- **Colour engine** — hand-written CIELAB conversion, CIEDE2000, a 12-season palette
  model, and a k-means garment-colour extractor. No colour library; we needed to know
  exactly what every number meant.

## Challenges we ran into

**The scores were upside down.** YouCam Skin Analysis returns *healthy-direction*
scores — higher is better. We read them as concern-direction, so every early verdict was
inverted. The fix is one inversion at the API boundary; the lesson is to never let a
convention mismatch propagate past the edge of your system.

**HTTP 431, disguised as a hang.** We built a stateless signed session token and
embedded the uploaded image in it, then echoed it back as a request header. Past a
certain photo size the browser silently refused the request and the processing screen
just froze forever. Nothing in the logs said "header too large" — it presented as a
hang, not an error.

**Hair segmentation lied to us, confidently.** Some responses returned a "hair" swatch
that was actually skin or backdrop — around 40 L* too light, with no error and no low
confidence flag. We now cross-check the hair reading against the eyebrows and reject it
when it reads implausibly light.

**Our classifier had a warm bias — and it was an inclusivity bug.** Three separate traps
compounded: the skin hue neutral has to be lightness-corrected, hair warmth is carried
by chroma rather than hue angle, and every brown eye measures positive on b* so the
neutral point must sit *inside* the brown range. Uncorrected, the classifier mislabelled
deep skin tones systematically. That is not a rounding error, it is the app failing the
people it should serve best.

**Retailer photography is not measurably reliable.** Centre-crop averaging quietly blends
the backdrop into the garment colour. We ended up on border flood fill with adaptive
tolerance plus k-means largest-cluster — and a fallback to the retailer's own colour word
when the photo simply isn't measurable.

## Accomplishments we're proud of

**It works on everyone.** The colour engine was calibrated across a deliberate spread of
skin tones rather than the handful that happened to be convenient. Fixing the warm skew
was the single highest-value thing we did.

**It works on non-Western clothing.** Saree, lehenga, anarkali, qipao and abaya all render
correctly — pallu drape, dupatta, mandarin collar. The garment gallery leads with that on
purpose. Colour analysis has a long history of assuming a Western wardrobe, and it does
not have to.

**Every number is on screen.** Axis meters, ΔE values, confidence scores, and a plain-English
reason for every verdict — including when we couldn't measure something and said so. No
silent fallbacks.

## What we learned

Measurement and interpretation are different products, and users can tell. The moment we
stopped rendering a generated summary next to curated copy — and started showing the axis
meters with their real values — the whole app got more trustworthy, not less.

We also learned that a graceful fallback without a recorded reason is just a bug with good
manners. Every fallback path in the engine now carries a reason code, so "we couldn't
measure your hair" never gets quietly reported as "your hair is neutral."

## What's next

Full wardrobe scanning — grade everything you already own in one pass. Retailer
integration so ΔE sits on the product page next to the price. And extending the same
measure-then-verdict approach beyond colour, to fit and proportion.
```

## Built with (tags — 25 max)

Paste these one at a time:

```
typescript
react
vite
express
node.js
tailwindcss
framer-motion
radix-ui
tanstack-query
wouter
zod
openapi
orval
jimp
vitest
pnpm
perfect-corp
youcam
cielab
ciede2000
color-science
k-means
computer-vision
virtual-try-on
replit
```

## Try it out links

```
[YOUR LIVE URL — publish first, then paste here]
[YOUR PUBLIC GITHUB REPO URL]
```

## Image gallery

Devpost uses the **first image as your thumbnail** — it's what people see in the gallery
grid, so make it the strongest one. Suggested order:

1. **Hero / landing** — leads with "Not a filter. A verdict."
2. **The verdict screen** — the money shot: score, season, reasoning.
3. **The proof pair** — same face, best match vs. off-palette, side by side.
4. **Axis meters** — warm/cool, light/deep, muted/bright with measured values.
5. **"Every Style. Graded."** — the culturally diverse garment grid.
6. **Custom garment grading** — a pasted product photo being scored.

## Video demo link

```
[YOUTUBE OR VIMEO URL]
```

**Do not skip this** — Devpost submissions without a video are heavily penalised by judges,
and many hackathons disqualify outright. Keep it under 3 minutes. A structure that works:

- **0:00–0:20** — The problem. Every try-on shows you a filter; none give you an answer.
- **0:20–1:10** — Upload a photo, walk through the measurement, land on the season.
- **1:10–2:00** — The verdict and the proof pair. Say the ΔE number out loud.
- **2:00–2:30** — Paste a random product photo, grade it live.
- **2:30–2:50** — The diverse garment grid. Make the inclusivity point explicitly.

---

# PAGE 3 — ADDITIONAL INFO (private, judges only)

## Submitter type

```
[INDIVIDUAL or TEAM]
```

## Country

```
[YOUR COUNTRY]
```

## App status

```
[e.g. "Live demo, fully functional" — adjust to the truth once deployed]
```

## Project start date

```
[YOUR START DATE]
```

## Text description of features, functionality and value

```
EventReady AI turns outfit choice from a guess into a measurement.

WHAT IT DOES
A user uploads one photo. The app calls Perfect Corp's Skin Tone Analysis and Skin
Analysis APIs to measure skin, hair and eye colour, converts all readings into CIELAB,
and resolves three perceptual axes — warm/cool, light/deep, muted/bright — into one of
twelve seasonal colour palettes. Each axis is displayed as a meter showing its measured
value, so the classification is auditable rather than asserted.

Garments are then graded against that palette using CIEDE2000 perceptual colour
distance. Every garment gets a numeric score, a yes/no verdict, and a plain-English
reason. Users can also paste any product photo from any retailer; a k-means extraction
pipeline isolates the true garment colour from the photography and runs it through the
same engine.

Perfect Corp's Cloth Virtual Try-On then renders the proof: the user's own face wearing
a best-match garment beside a deliberately off-palette one. Image-to-Video animates the
winning look.

THE VALUE
Existing virtual try-on answers "what does this look like on me?" It does not answer
"should I wear this?" That second question is the one people actually have, and it is
the one that drives a purchase or a return. EventReady AI answers it with a number,
shows the number, and shows the visual proof behind it.

WHAT MAKES IT DIFFERENT
1. Auditable, not oracular. Every verdict exposes its inputs — measured LAB values,
   axis positions, ΔE distances, confidence. Nothing is a black box.
2. Honest failure. When a measurement can't be trusted, the app says so and records
   why, rather than substituting a neutral default and presenting it as a finding.
   Every fallback path carries a reason code.
3. Calibrated for everyone. The classifier was corrected for a systematic warm bias
   that mislabelled deep skin tones — a lightness-corrected skin hue neutral,
   chroma-based hair warmth, and an eye-colour neutral placed inside the brown range.
4. Not Western-only. Saree, lehenga, anarkali, qipao and abaya are all first-class,
   correctly rendered, and led with in the product.

TECHNICAL
React + TypeScript + Vite frontend; Express + TypeScript backend. An OpenAPI contract
is the single source of truth — Zod validators and the typed React query client are
both generated from it. The colour engine (CIELAB conversion, CIEDE2000, the season
model, k-means garment extraction) is written from scratch and validated against the
Sharma et al. (2005) CIEDE2000 reference pairs.
```

## Repository URL

```
[YOUR PUBLIC GITHUB REPO URL]
```

⚠️ Must be **public** before the deadline. Add a README and a LICENSE — judges check both,
and a bare repo reads as unfinished even when the code is strong.

---

## Q1 — "Was there a moment during the hackathon where the API surprised you?"

```
Three times, and each one changed how I built.

THE SCORES RUN THE OPPOSITE WAY TO INTUITION.
YouCam Skin Analysis returns healthy-direction scores — a high redness score means
skin that is doing well on redness, not skin that is red. I had assumed
concern-direction, which meant every early verdict in my app was silently inverted.
Nothing errored. The numbers looked completely plausible; they were just backwards.
The fix is a single inversion at the API boundary, and the discipline is to never let
a convention mismatch travel further into your system than the edge.

FAILED TASKS ARE REFUNDED.
Only successful tasks bill. I did not expect this, and it materially changed how I
worked — I could iterate hard on request shapes and edge cases without watching a
credit counter tick down on every failed experiment. For a hackathon, where most of
your API calls are you being wrong in new ways, that is a genuinely different
economics of building. More vendors should do it.

THE CLOTH VTO CATEGORY ENUM IS NOT WHAT IT LOOKS LIKE.
The enum reads full_body / upper_body / lower_body, which looks like a Western
garment taxonomy, and I nearly wrote off non-Western clothing on that basis. It turns
out to describe the body region a garment covers, not the cut of the garment. Once I
tested it properly, saree, lehenga, anarkali, qipao and abaya all rendered correctly —
pallu drape, dupatta, mandarin collars, all handled. The model is substantially more
culturally capable than the API surface suggests, and that gap cost me the better part
of a day I'd have spent building instead. It is the single easiest documentation win
available: say what the enum means, and show one non-Western example.
```

## Q2 — "Industries or use cases Perfect Corp's API could serve that nobody is talking about yet?"

```
DEEP SKIN TONES ARE A MARKET, NOT AN EDGE CASE.
Building this, I hit a systematic warm bias in colour-season classification that
mislabelled deep skin tones. It took three independent corrections to fix. That bias
is not unique to my code — it is inherent in naive LAB heuristics, which means most
tools in this category are quietly wrong for a large share of the population. Perfect
Corp already returns the measurement quality needed to do this properly. A published,
validated reference implementation for deep-tone colour analysis would be genuinely
category-defining, and there is a whole beauty and fashion market currently served by
tools that don't work well on them.

NON-WESTERN GARMENT CATEGORIES ARE ALREADY SUPPORTED AND ENTIRELY UNMARKETED.
The Cloth VTO model handles saree, lehenga, anarkali, qipao and abaya well. Nobody
appears to be talking about this. The Indian wedding-wear market alone is enormous,
overwhelmingly visual, and almost completely unserved by try-on technology. Same for
Gulf modest fashion and East Asian formalwear. The capability exists today; only the
positioning is missing.

RETURNS REDUCTION, NOT ENGAGEMENT.
Try-on is universally sold as an engagement feature. The much larger and duller prize
is colour-driven returns: "it didn't suit me" is a leading return reason in apparel,
and it is a measurable, preventable problem. A ΔE compatibility score sitting on the
product page next to the price is a logistics-cost intervention, and it gets budget
from a completely different department than marketing does.

ASSISTIVE AND CLINICAL ADJACENCIES.
Objective colour measurement from a phone photo is useful to colour-blind users
choosing clothing independently, and to dermatology triage where consistent
longitudinal skin measurement matters more than aesthetics. Both need measurement and
neither needs a filter — which is exactly what this API is best at.
```

## Q3 — "Where did you hit a wall technically? How did you work around it?"

```
FOUR WALLS. THE FIRST TWO WERE THE EXPENSIVE ONES BECAUSE NEITHER LOOKED LIKE AN ERROR.

1. HTTP 431, disguised as an infinite loading screen.
I built a stateless signed session token so the backend could stay storage-free, and
embedded the uploaded image in it as base64. The token was echoed back as an HTTP
header. Past a certain photo size, the request silently failed — the processing screen
just spun forever, with no error in the logs and nothing in the network tab that said
"your header is too large." I lost real time treating it as an async polling bug before
recognising a 431. The workaround was a proper server-side upload store with a
dedicated read endpoint, keeping only an opaque id in the token. The general lesson:
anything you echo back as a header has a hard size ceiling that fails as a hang, not as
an exception.

2. Hair segmentation returning a confident, wrong answer.
Some responses came back with a "hair" swatch that was actually skin or the backdrop —
roughly 40 L* too light. No error, no low-confidence flag, just a wrong number
presented identically to a right one, which then poisoned the entire season
classification downstream. There is no API-side signal to catch this. I added a
physical-plausibility cross-check: compare the hair reading against the eyebrow region
and reject it when the hair reads implausibly lighter. If a measurement can be
confidently wrong, you need a second, independent measurement to catch it.

3. A colour classifier with a systematic warm bias.
Every archetype I tested skewed warm and bright. It was not one bug, it was three
compounding ones: the skin hue neutral needs lightness correction (uncorrected, it
mislabels deep skin tones — an inclusivity failure, not just an accuracy one); hair
warmth is carried by chroma, not hue angle; and every brown eye measures positive on
b*, so the neutral point has to sit inside the brown range rather than at zero. I
found these only by validating across a deliberate spread of archetypes instead of the
one or two faces that were convenient, and by checking my CIEDE2000 implementation
against the Sharma et al. (2005) reference pairs. Single-case validation would have
shipped all three.

4. Retailer product photography is not measurably reliable.
For grading arbitrary garments, my first approach was centre-crop averaging, which
quietly blends the backdrop into the garment colour and yields plausible-looking
nonsense. The working approach is border flood fill with adaptive tolerance to remove
the background, then k-means with largest-cluster selection to find the dominant
garment colour. Even then, some photography is simply not measurable — heavy styling,
patterns, extreme lighting. Rather than guess, the app falls back to the retailer's own
colour word and records a reason code saying it did. Every fallback in the system
carries that reason code, because a graceful fallback that doesn't record why is just a
bug with good manners.
```

## Social posts link

```
[LINK TO YOUR X / LINKEDIN POST ABOUT THE PROJECT]
```

Tag Perfect Corp and use the hackathon hashtag — some prize tracks weight this.

---

# YOUR REMAINING CHECKLIST

| Item | Status |
|---|---|
| Public GitHub repo | ⬜ Yours |
| README + LICENSE in repo | ⬜ Yours |
| Deploy → live URL | ⬜ Yours |
| Update OG image URL to production domain after deploy | ⬜ Yours |
| Record + upload demo video | ⬜ Yours |
| 6 gallery screenshots | ⬜ Yours |
| Social post | ⬜ Yours |
| Submission copy | ✅ This file |
