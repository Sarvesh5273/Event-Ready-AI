# EventReady AI

### Not a filter. A verdict.

Every virtual try-on answers the wrong question. They show you what a garment *looks* like on you. They never tell you whether it *works* on you.

EventReady AI answers the question you actually had: **should I wear this?**

Upload one photo. It measures your skin, hair and eye colour, places you in a 12-season colour palette, and grades any garment — yes or no, with a confidence score and the colour-distance number that decided it.

Built for the **YouCam / Perfect Corp API Hackathon**.

---

## What it does

**1. Measures you — doesn't guess.**
One photo goes to Perfect Corp's Skin Tone Analysis and Skin Analysis APIs. Skin, hair and eye colour come back, get converted to CIELAB, and are treated as instrument readings rather than vibes.

**2. Classifies your season.**
Three axes — warm/cool, light/deep, muted/bright — resolve to one of twelve seasonal palettes. Every axis renders as a meter showing its measured value, so you can see *why* you landed where you did instead of being handed a label.

**3. Grades garments by ΔE.**
Garment colours are compared to your palette using CIEDE2000, the perceptual colour-difference standard. Below the threshold is a match, above it isn't. The number is always on screen.

**4. Shows the proof.**
Perfect Corp's Cloth Virtual Try-On renders the same face wearing a best-match garment beside a deliberately off-palette one. Image-to-Video animates the winner.

**5. Grades garments it has never seen.**
Paste any retailer product photo. A k-means extraction pipeline isolates the true garment colour from the photography and runs it through the same engine.

---

## Why it's different

**Auditable, not oracular.** Every verdict exposes its inputs — measured LAB values, axis positions, ΔE distances, confidence. No black box.

**Honest failure.** When a measurement can't be trusted, the app says so and records *why*. Every fallback path carries a reason code, so "we couldn't measure your hair" never silently becomes "your hair is neutral."

**Calibrated for everyone.** The classifier was corrected for a systematic warm bias that mislabelled deep skin tones. That was an inclusivity bug, not a rounding error.

**Not Western-only.** Saree, lehenga, anarkali, qipao and abaya are first-class and correctly rendered — pallu drape, dupatta, mandarin collar.

---

## Perfect Corp / YouCam APIs used

| API | Used for |
|---|---|
| `POST /s2s/v2.0/file` | Signed upload of user photos |
| `POST /s2s/v2.0/task/skin-tone-analysis` | Skin, hair and eye colour measurement |
| `POST /s2s/v2.0/task/skin-analysis` | Skin condition signals (redness, radiance, texture, moisture, oiliness, dark circles) |
| `POST /s2s/v2.0/task/{cloth-vto}` | Cloth Virtual Try-On — the proof pair |
| `POST /s2s/v2.0/task/image-to-video/youcam` | Animating the winning look |

All are async task-and-poll.

---

## Tech

**Frontend** — React 19, TypeScript, Vite, Tailwind, Framer Motion, Radix primitives, TanStack Query, Wouter.

**Backend** — Express 5, TypeScript, Drizzle, Pino, Jimp.

**Contract** — an OpenAPI spec is the single source of truth. Zod validators and the typed React client are both generated from it, so a backend shape change surfaces as a frontend type error instead of a runtime surprise.

**Colour engine** — CIELAB conversion, CIEDE2000, the 12-season palette model and the k-means garment extractor are all written from scratch. No colour library; we needed to know exactly what every number meant. Validated against the Sharma et al. (2005) CIEDE2000 reference pairs.

Monorepo managed with pnpm workspaces.

---

## Running locally

```bash
pnpm install

# Frontend
pnpm --filter @workspace/eventready-ai run dev

# Backend
pnpm --filter @workspace/api-server run dev
```

**Environment variables**

| Variable | Purpose |
|---|---|
| `YOUCAM_API_KEY` | Perfect Corp / YouCam S2S credential |
| `SESSION_SECRET` | Signing key for session tokens |
| `PORT` | Port for each service (injected by Replit) |
| `BASE_PATH` | Artifact base path for routing (injected by Replit) |

There is a fully cached demo persona, so the app is explorable end to end without an API key — use **Skip with Demo** on the upload screen.

---

## Layout

```
artifacts/
  eventready-ai/     React frontend
  api-server/        Express API + colour engine
    src/lib/color/     CIELAB, CIEDE2000, season model, palettes
    src/lib/scoring/   Garment scoring, reason codes, proof pair
    src/lib/youcam/    Perfect Corp API clients
```

---

## Engineering notes

Four findings from the build that were not obvious going in.

**Skin Analysis scores run healthy-direction.** A high redness score means skin doing *well* on redness, not skin that is red. Reading it as concern-direction silently inverts every verdict, with no error and entirely plausible-looking numbers. Invert exactly once, at the API boundary.

**HTTP 431 presents as a hang, not an error.** Embedding a base64 image in a signed session token echoed back as a request header exceeds the header size limit past a certain photo size. The browser fails silently and the processing screen spins forever. Fixed with a server-side upload store and an opaque id in the token.

**Hair segmentation can be confidently wrong.** Some responses return a "hair" swatch that is actually skin or backdrop — roughly 40 L* too light, with no error and no low-confidence flag. Caught with a physical-plausibility cross-check against the eyebrow region.

**Retailer photography is not measurably reliable.** Centre-crop averaging blends the backdrop into the garment colour and yields plausible nonsense. Border flood fill with adaptive tolerance, then k-means largest-cluster, then — when the photo simply isn't measurable — fall back to the retailer's own colour word and record a reason code saying so.

---

## License

MIT — see [LICENSE](LICENSE).
