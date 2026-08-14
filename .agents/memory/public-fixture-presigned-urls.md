---
name: Sanitise presigned URLs out of captured API fixtures
description: Recorded API responses committed into a served public/ directory routinely carry presigned S3 URLs with AWS credential ids and signatures; strip them at capture time, not later.
---

A captured third-party API response saved into a publicly served directory
(`public/`, `static/`, anything the web server hands out) must have its
presigned URLs stripped before it is written.

**Why:** Media-processing APIs return results as presigned S3 links whose query
strings carry an AWS credential identifier, a signature, and an expiry. Two
separate problems follow. First, committing them publishes credential material
and trips security scanners. Second, they expire — often within the hour — so a
demo that reads them breaks shortly after it is recorded, usually right before
it is demonstrated.

Both problems have the same fix, which is why it is worth doing once at the
source: download the referenced assets into the repo and rewrite the URLs in
the fixture to those local paths.

**How to apply:** Sanitise inside the capture script, in the same statement
that writes the file — not as a cleanup pass afterwards. A cleanup pass only
fixes the copy that exists today and silently stops applying the next time
someone re-runs the capture. Keep the scores, ids, and provenance exactly as
returned so the fixture stays honest evidence of a real call, and record a
short note in the file saying the URLs were rewritten and why. It is still fine
for the script to print the live URLs to the console — that is how you fetch
the assets — as long as they never reach a written artefact.
