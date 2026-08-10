---
name: YouCam Image-to-Video status endpoint shape
description: How to safely poll YouCam's AI Image-to-Video Generator task status when the docs under-specify the "still running" response shape.
---

The Image-to-Video task family (`POST/GET /s2s/v2.0/task/image-to-video/youcam`) is
a different, less-documented endpoint family than AI Clothes (Apparel VTO) and
Skin Analysis. docs.perfectcorp.com only shows a `{ url }` 200 response for the
status-check endpoint — there is no documented "still processing" shape, unlike
the Apparel VTO status endpoint which has an explicit `task_status`/`results.url`
envelope. The same doc gap appears on a sibling endpoint (face-swap-vid status),
so it's a documentation pattern for this API family, not a one-off omission.

**Confirmed by live testing (Aug 2026):** creating a task via `POST .../youcam`
returns `{status, data: {task_id}}` (matches the standard envelope other s2s
v2.0 endpoints use), and the real status-check response — once the video is
ready — does carry a usable image URL that a defensive parser can extract
(checking `body.url`, `body.data.url`, `body.results.url`, and
`body.data.results.url`, in that order). Real-world "still running" responses
were not observed directly, so treat "200 with no URL and no explicit
`task_status: "error"`" as still-running rather than throwing.

**Why:** the docs are genuinely incomplete for this endpoint, so treating any
unrecognized-but-still-2xx shape as fatal would crash the pipeline on jitter
you can't control from PerfectCorp. Defensive multi-shape parsing plus a
"still running" fallback kept the pipeline robust and it worked against the
real API on the first live end-to-end try.

**How to apply:** when polling this endpoint (or a sibling one with the same
thin docs, e.g. face-swap-vid), don't reuse a strict single-shape envelope
parser that throws on missing fields — parse defensively and default
ambiguous-but-non-error responses to "running".
