# EventReady AI — Product & Design Context

Everything needed to design or generate UI/UX for this product. All values, copy and structure below are read from the live codebase, not invented.

---

## 1. What the product is

**EventReady AI** is a wedding-guest outfit decision assistant.

A user uploads a close-up selfie and a full-body photo. The app measures the actual colour of their skin, hair, eyes and eyebrows, classifies them into a 12-season colour palette, then puts real garments on their real body and ranks which one actually suits them — with reasons.

**One-line positioning:** *Not a filter. A verdict.*

**The wedge:** other tools render you in an outfit. This one decides which outfit. Rendering is table stakes; the judgement is the product.

**Core promise:** the recommendation is measured, not guessed — and when it can't be measured, the product says so instead of inventing an answer.

### Who it's for
Someone invited to a wedding who has three tabs open and cannot decide. They are not a stylist. They do not know what "undertone" means. They want to be told what to wear and why, in a way they can verify with their own eyes.

### The three things that make it different
1. **Measurement before verdict.** Real hex values pulled from the user's face are shown *before* any recommendation, so the boundary between what was measured and what was inferred is visible.
2. **A controlled comparison.** The same garment cut, on the same photo, in the best and worst colour — so the claim survives the user's own eyes or it doesn't.
3. **Honest refusal.** No colour reading → no invented palette. The UI degrades to fit/style/fabric and says so.

---

## 2. Brand foundations

### Concept
**Deep Bordeaux & Soft Champagne** — editorial fashion magazine, not a SaaS dashboard. Think a printed lookbook: sharp corners, generous whitespace, serif display headings, wide-tracked uppercase labels, colour swatches treated as evidence.

### Colour tokens

**Light mode (default)**

| Token | HSL | Hex | Use |
|---|---|---|---|
| `background` | `34 38% 95%` | `#F7F3ED` | Soft champagne page base |
| `foreground` | `351 40% 15%` | `#36171C` | Deep bordeaux text |
| `card` | `34 40% 98%` | `#FCFAF8` | Card / panel surface |
| `border` | `34 20% 85%` | `#E0DAD1` | All hairline rules |
| `primary` | `351 40% 15%` | `#36171C` | Buttons, active states, accents |
| `primary-foreground` | `34 38% 95%` | `#F7F3ED` | Text on primary |
| `secondary` / `muted` / `accent` | `34 20% 88%` | `#E7E1DA` | Image wells, pills, inactive fills |
| `muted-foreground` | `351 20% 45%` | `#8A5C63` | Secondary copy |
| `destructive` | `0 84% 60%` | `#F03E3E` | Errors only |

**Dark mode**

| Token | HSL | Hex |
|---|---|---|
| `background` | `351 40% 10%` | `#240F12` |
| `foreground` | `34 38% 95%` | `#F7F3ED` |
| `card` | `351 40% 14%` | `#32151A` |
| `border` | `351 30% 20%` | `#422428` |
| `primary` | `34 38% 95%` | `#F7F3ED` (inverts) |

The palette is **two hues only** — a bordeaux (351°) and a champagne (34°). Nothing else. Any new colour on screen should be user data (a measured swatch, a palette colour, a garment), never decoration.

### Typography

| Role | Family | Weights |
|---|---|---|
| Display / all headings | **Playfair Display** (serif) | 400, 500, 600, 700 + italics |
| Body / UI | **Outfit** (sans) | 300, 400, 500, 600 |
| Metadata / hex values | Menlo, monospace | — |

Global rule: **every `h1`–`h6` is serif with `tracking-tight`.** Body is Outfit.

**Scale in use**
- Hero h1: `text-5xl md:text-7xl`
- Results h1: `text-4xl md:text-5xl`
- Section h2: `text-3xl md:text-4xl`
- Card h3/h4: `text-xl` – `text-2xl md:text-3xl`
- Body: `text-sm` – `text-lg`
- **Eyebrow labels:** `text-xs font-semibold uppercase tracking-widest` — the signature detail, used above almost every section
- Micro labels: `text-[10px]` / `text-[11px]` uppercase tracking-wider

### Geometry & depth

- **`--radius: 0rem`.** Sharp corners everywhere — deliberate, commented in source as "Editorial chic". The only round things are: the eyebrow pill (`rounded-full`), decorative blurred glows, small circular icon wells, and the amber measurement-notice banner (`rounded-2xl`).
- Borders are **1px hairlines** in `border`. They do the structural work that radius and shadow normally would.
- Shadows are **bordeaux-tinted**, not neutral grey: `rgba(54, 20, 24, α)`. Used sparingly — mainly `shadow-xl` on the hero try-on frame and `shadow-lg` on proof cards.
- **No gradients as decoration.** The only gradient usage is large, heavily blurred single-colour glows (`blur-[120px]`) behind the hero and processing screens, plus one `bg-gradient-to-t` scrim on the landing showcase image.

### Signature visual devices
- **Image-in-frame:** images sit in `bg-card border p-2` with an inner `bg-secondary` well — a 8px matte, like a mounted print.
- **Left-border callout:** `border-l-2 border-border pl-3/4` for caveats and disclaimers.
- **Swatch grids:** bare colour squares with 1px borders and a tiny caption beneath.
- **Aspect ratios:** `3/4` for try-ons and proof cards, `4/5` for alternative cards, `1/1` for the skin overlay.
- **Rhythm:** sections `mb-24`, groups `mb-14`, headings `mb-8`/`mb-10`. Very generous. Grid gaps 5/6/8/10.

### Motion
Framer Motion throughout. The vocabulary is small and consistent:
- Entrance: fade + rise (`opacity 0→1`, `y 20→0`), 0.6–0.8s
- Staggered lists: `delay: idx * 0.1` or `* 0.2`
- Image hover: `scale-105` over 700ms
- `AnimatePresence` for the skin-overlay crossfade and expanding rows
- Processing screen: a slow 40s rotating blurred glow so the wait feels alive

No custom keyframes. No bounce, no spring overshoot, no parallax.

---

## 3. Screen flow

```
Landing → Preferences → Photo Upload → Processing → Results
                                    ↘ (error) → Retry / Demo
```

A second branch exists: **custom garment check** ("Already picked something?") which runs Landing → Preferences → Upload (+ garment photo) → Processing → a different results screen.

---

## 4. Screen-by-screen specification

All copy below is **verbatim from the codebase**. Keep it unless deliberately rewriting.

### 4.1 Landing (`start-screen`)

Full-height centred column, `max-w-5xl`. Blurred `secondary/30` and `primary/5` circles float behind. A `max-w-3xl` showcase image card sits below the fold line with a gradient scrim.

- Eyebrow pill: **Concierge Styling**
- H1, three lines: **Your personal** / **wedding guest** / **stylist**
- Body: *"We measure your skin, hair and eye color from a single photo, then find the shades that genuinely suit you — and show you the difference on your own body."*
- Primary button: **Start my styling**
- Secondary button: **Use demo persona**
- Text link: **Already picked something? Check it before you buy**

### 4.2 Preferences (`preferences-screen`)

`max-w-2xl`, three stacked sections in `space-y-12`, fixed bottom footer with `backdrop-blur-xl`.

Selected option cards: `border-primary bg-primary/5 shadow-sm`. Unselected: `border-border bg-card hover:bg-secondary/20`.

- H1: **How do you want to show up?**
- Intro: *"Your colors come from your photo. This is the one thing we can't measure — the mood you're going for."*

**Section — Style Vibe** (2-col cards)
- **Classic Elegance** — *"Timeless silhouettes, refined colors, and understated sophistication."*
- **Bold & Statement** — *"Striking patterns, modern cuts, and colors that stand out in a crowd."*

**Section — When is it?**
- Helper: *"Daylight and evening light treat fabric differently, so this changes which finishes we favour."*
- **Daytime** — *"Ceremony, brunch or anything under open daylight."*
- **Evening** — *"Reception, dinner or anything after the light drops."*

**Section — What are you wearing?** (flex-wrap pills)
- Helper: *"Your colour analysis works the same either way — this just decides which pieces we shortlist."*
- Options: **Open to anything** · **Western** · **Indian** · **East Asian** · **Middle Eastern**
- Demo-only note: *"The demo persona replays a fixed set of pre-rendered Western looks, so this filter won't change her results. Run it with your own photo to see the other traditions."*

**Footer:** helper reads *"Next: Photo upload"* (or *"Using demo photos next"*); button **Continue**.

### 4.3 Photo upload (`photo-upload-screen`)

- Header button (standard flow only): **Skip with Demo Persona**
- H1: **Upload your photos** (custom flow: **Upload your photos & garment**)
- Body: *"We need a close-up to analyze your complexion, and a full-body shot to preview the outfits on you."*
- Slot 1 label **Close-up Selfie** — empty state: *"Tap to upload"* / *"Clear lighting, natural face"*
- Slot 2 label **Full-body Photo** — empty state: *"Tap to upload"* / *"Head to toe, form-fitting clothes"*
- Filled state hover: **Change photo**
- Custom flow adds: **The garment you're considering** (*"A product photo or a flat lay works well"*) and **What kind of piece is it?** → **Full outfit / dress** · **Top** · **Bottom**
- Footer helper: *"Upload both photos to continue"* → *"Ready to process"*
- Footer button: **Analyze & Style** (submitting: spinner + *"Processing..."*)

### 4.4 Processing (`processing-screen`)

`max-w-md` centred. A slowly rotating 800px blurred glow behind. Steps render as a vertical timeline (alternating left/right on desktop) with a gradient connector line; completed steps get a check, the active step pulses and appends an animated `...`.

- H2: **Curating your look**
- The four real steps: **Reading skin signals** → **Selecting event-ready looks** → **Generating try-ons** → **Ranking the results**

**Error state:** destructive icon well, H2 **Unable to process**, the error message, then **Try Demo Mode instead** and **Go back**.

### 4.5 Results (`results-screen`)

`max-w-6xl`, `pt-16 pb-24`. Order is deliberate and load-bearing — evidence before verdict.

**0. Measurement notice** (conditional, above everything — it changes how the whole page should be read)
Amber `rounded-2xl border-amber-300/60 bg-amber-50/70` aside, dynamic title and detail, optional **Retake your photo** button, and a mono line *"YouCam reported: {code}"*.

**1. Header**
- Eyebrow with star icon: **Your Curation**
- H1: **The Perfect Match**
- Body: *"Based on the colouring measured from your photo, your style, and the occasion."* — degrades to *"Based on your style and the occasion — we couldn't read your colouring from this photo."*

**2. Palette reveal** — the evidence, split into two bordered halves

*Top half (measurement):*
- Eyebrow: **Measured from your photo**
- Sub-caption: *"Read by the YouCam Facial Colour Tones API."*
- Row of 56px swatches: **Skin**, **Hair**, (**Brows** — only when hair was rejected, captioned *"Used for depth instead"*), **Eyes**. Each shows a mono uppercase hex and an optional colour name. Rejected swatches render at 40% opacity with a **Not used** chip and struck-through text.
- Rejection explainer: *"The hair swatch came back lighter than the brows. That usually means the segmentation caught skin or background rather than hair, so we left it out of the reading and took your depth from the brows instead."*

*Bottom half (interpretation):*
- Eyebrow: **Your Palette**
- H2: the season label (e.g. *True Autumn*)
- Tagline, then the disclaimer in a left-border callout: *"This is a suggested palette, not a measured undertone. We infer it from the colours above using our own colour-analysis model — it is not a professional colour analysis, and because it reads a single photo with no lighting calibration, a different photo can give a different answer."*
- Rationale paragraph
- **Three axis meters** (`Cool↔Warm`, `Deep↔Light`, `Muted↔Clear`) — a 1px rule with a centre tick and a 10px dot. Deliberately a *position on a scale*, never a sentence, so it cannot appear to contradict the season name.
- Confidence line: *"Strongest signal: {trait} — {n}% confidence in this call"*
- **Wear these** — 8-up swatch grid, hover `scale-105`
- Best neutral row: *"Your best neutral is {name} — pair it with anything above."*
- **These fight your colouring** — smaller swatches at 70% opacity

*Unavailable state:* eyebrow **The Reading**, then *"We couldn't read your colouring from this photo, so there's no palette below — the recommendations are based on fit, style and fabric only."* plus *"A straight-on photo in even, natural light usually works."*

**3. Proof shot** — the strongest screen in the product
- Eyebrow: **See it for yourself**
- H2: **Same {silhouette}. Two colours.**
- Body: *"Identical cut, identical photo, identical lighting — the only thing that changes is the colour. Whatever you see here is the colour doing it."*
- Two `3/4` cards side by side, labelled **Your colour** (bordeaux badge) and **Not your colour** (muted badge), separated by a circular arrow well and a **vs** label.
- Each card: colour dot + garment name, a thin score bar with `{points}/{max}`, and a one-line headline.
- Closing line: *"A {gap}-point gap out of {max} on the palette measured from your face."*

**4. Skin read**
- Eyebrow with face-scan icon: **Where we looked**
- H2: **The reading came from your skin, not a guess.**
- Body: *"Six things were measured on your face. Tap any one to see exactly where it was found — and what it changed about the outfit."*
- Left: a square framed photo with coloured detection masks crossfading over it (`mixBlendMode: screen`), badged **YouCam AI Skin Analysis**.
- Right: a divided list of six concerns, each a toggle row with a level chip; the active row expands to explain what it changed.
- Footnote: *"Highlighted regions are returned by YouCam AI Skin Analysis and drawn over its own normalised copy of your photo — nothing here is illustrative."*

**5. Hero recommendation** — 12-col grid, `5` image / `7` details
- Framed `3/4` try-on with a floating **Match / {n}%** badge top-right
- Eyebrow: **Featured Piece**, then the outfit name as an h2
- **Why it works** — up to three reasons, each with a circular check. *(Reasons are priority-sorted server-side so the colour verdict is never truncated away.)*
- Optional caution box with an info icon
- Bottom stat row divided by vertical rules: **Color Palette** · **Silhouette** · **Fabric Finish**
- Degraded state overlay: *"Try-on preview unavailable for this piece — showing the catalog photo instead."*

**6. Outfit video**
- Eyebrow: **See It In Motion**
- Body: *"Turn your try-on into a short clip you can actually picture yourself in."*
- Button: **Generate video** → running label **Bringing your look to life…** with helper *"This usually takes about a minute."* → failure shows **Try again**
- Never auto-starts. Always an explicit click.
- Skipped state: *"There's no try-on image to animate for this look, so we can't build a clip this time."*

**7. Shop your palette**
- Eyebrow: **Where to find it**, H2 **Shop your palette**
- Intro names the shop count and stresses *"across N independent shops, not one sponsored storefront."*
- Grouped by palette colour: swatch + name + hex, a **Retailer colour** label showing the matched colour word, then a 2/3-col grid of real listings, then **More in this colour** search pills.
- Provenance footer, headed **How these were matched.** — states plainly that the garments were *not* measured and that listings may have sold out.

**8. Event Prep + Alternatives** — 3-col grid
- Left (`bg-primary`, inverted, with a blurred white glow): H3 **Event Prep**, numbered `01`, `02`… tips divided by translucent rules.
- Right (2 cols): H3 **Other strong matches**, two `4/5` cards with a score chip and a single-line reason.

**9. Footer:** **Start a new session** with a rotate icon.

### 4.6 Custom garment results

Same shell, different framing.
- Eyebrow **Your Garment**, H1 **Is it right for you?**
- Intro: *"A read on how this piece works with the colouring measured from your photo."* (degrades to fit/style/fabric only)
- Score label reads **Fit** rather than Match
- Section eyebrow **Skin & Color Compatibility**, h2 `{colorFamily} · {undertone} undertone`
- Video title: **Your garment, brought to life**

---

## 5. Voice and copy rules

**Register:** a well-informed friend who happens to be a stylist. Warm, plain, specific. British spellings appear in newer copy (*colour*, *favour*) — keep consistent within a screen.

**Non-negotiable rules:**
1. **Never claim more certainty than exists.** Every inference carries its caveat inline, positioned *before* the user acts on it — never buried at the foot of the page.
2. **Separate measurement from interpretation.** "Measured from your photo" and "Your Palette" are different sections with different framing for a reason. Never blur them.
3. **Explain degradation, don't hide it.** Every failure state says what's missing and what the result now covers instead.
4. **No medical or diagnostic language.** Skin signals are styling inputs. Never a diagnosis.
5. **Never claim the retail listings were measured.** They are leads matched by colour word, and the UI says so.

**Words to avoid:** perfect for you, guaranteed, flawless, AI-powered, revolutionary, seamless.

---

## 6. States every screen must handle

Failure states are a first-class part of this UI, not an afterthought — the product's credibility rests on them.

| State | Behaviour |
|---|---|
| No colour reading | Palette section replaced with an explanation; headers reword; scoring falls back to fit/style/fabric |
| Hair reading rejected | Swatch dims, gets a **Not used** chip, brows swatch appears, explainer renders |
| Try-on failed | Catalog photo shown with an overlay stating the substitution |
| No proof pair possible | Entire proof section renders nothing rather than showing a weak comparison |
| Video unavailable | Section explains why; no dead button |
| No shop listings | Section renders nothing |
| Measurement degraded | Amber banner above everything, with the raw API code |

---

## 7. Technical constraints

- React + Vite + TypeScript, Tailwind v4 with inline `@theme` (no `tailwind.config`)
- Framer Motion for all animation; Lucide for icons
- shadcn/ui primitives exist in `src/components/ui/` but the event-ready screens **do not use them** — every screen is hand-built with raw elements and Tailwind
- Mobile-first; `md:` and `lg:` breakpoints carry the layout shifts
- Accessibility already handled in places worth preserving: axis meters expose their reading as `aria-label` text, overlay toggles use `aria-pressed`, decorative swatches are `aria-hidden`

---

## 8. Known gap worth fixing

`index.html` still ships the scaffold defaults:

```
<meta name="description" content="EventReady AI — built on Replit. Update this description to reflect the app." />
<meta property="og:description" content="EventReady AI — built on Replit. Update this description to reflect the app." />
```

Anyone sharing the link — including judges — gets boilerplate in the preview card. There is also no `og:image`.

Suggested replacement:
- **Title:** `EventReady AI — Not a filter. A verdict.`
- **Description:** `Upload one photo. EventReady measures your skin, hair and eye colour, finds the shades that genuinely suit you, and shows you the difference on your own body.`
