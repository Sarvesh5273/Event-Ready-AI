---
name: Building a baked index of real retailer listings
description: How to generate a committed shopping index with agent-side web search when the running app has no search access — including the search gotchas that silently ruin quality.
---

Agent-side search tools are not reachable from the user's running app. When a
feature needs real third-party listings and there is no runtime search
integration, generate the index yourself and commit it. Same user-visible
result, and it cannot fail live on camera — strictly better for a demo.

**Search gotchas that silently degrade quality:**

- The `image` field comes back only when `contents` is requested. Probing
  without it looks exactly like "this provider has no images" and will send
  you down a wrong path.
- Do **not** restrict to a curated list of big-retailer domains. Doing so
  collapsed most results onto a single site; unrestricted search returned far
  better variety, including the specialist boutiques that make the result feel
  real rather than affiliate-farmed.
- Semantic search returns loosely-related items. Requiring the **retailer's own
  title to contain the colour word** is a cheap, honest filter — it both fixes
  wrong-colour matches and matches the framing you should be presenting anyway
  (you are trusting their colour label, not measuring the garment).
- Filter out category and collection pages explicitly; they pass most
  product-shaped heuristics. Plural "…Dresses" endings and `/collections/` URL
  segments catch most of them.
- Prices are mostly missing or are unrelated numbers scraped off the page.
  Do not show prices unless you can verify them.

**Always copy the images locally** rather than hot-linking: retailers block
cross-origin requests, and a blocked image blanks the whole section. Expect
~10% of image URLs to 403/404 at download time, so generate more candidates
per bucket than you intend to show and build the fixture from what actually
landed on disk.

**Deep links:** a `403` from curl usually means bot protection, not a broken
URL, so curl is a poor validator for retailer search links. Ship only URL
patterns you are confident in and let the verified product links carry the
feature.
