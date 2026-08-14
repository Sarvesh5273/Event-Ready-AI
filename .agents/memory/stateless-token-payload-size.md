---
name: Stateless signed-token sessions + raw payload size
description: Never embed raw/base64 binary data (images, files) inside a signed session token that the client echoes back as an HTTP header — it silently blows past header size limits.
---

Pattern: a backend with no database represents session state as a signed
token (e.g. HMAC-SHA256) that fully encodes session state; the client
stores it and echoes it back on every request, typically as a custom HTTP
header (e.g. `token`) rather than a cookie.

**Failure mode observed:** a feature needed to carry a user-uploaded image
through the session so it could be displayed later. It seemed convenient to
base64-encode the image and add it as a field on the token's payload. This
works for the *first* request (the one that sets it) but breaks every
subsequent request that echoes the token back: base64 inflates size ~33%,
and a normal phone photo easily produces a token of hundreds of KB to low
MB. Once that token is sent back as a request header, it exceeds typical
HTTP header size limits (commonly ~8-16KB depending on server/proxy),
producing **HTTP 431 Request Header Fields Too Large**. Downstream effects
cascade confusingly: proxies may return 502, and once the token gets
truncated/mangled it can fail signature/shape validation entirely,
producing an unrelated-looking "missing session token" error. From the
client's perspective this looks like a stuck/frozen processing screen, not
an obvious payload-size bug.

**Why:** stateless-token architectures make it tempting to put "whatever
this session needs later" directly on the payload, since that's the only
place session state lives. But the token round-trips over HTTP headers on
every single poll — it must stay small (bytes/low KB), not scale with
uploaded content.

**How to apply / fix:**
1. Never put raw binary data, base64-encoded files/images, or anything
   whose size scales with user input directly into a signed session token.
2. Keep an existing (or add a new) server-side, in-memory store keyed by
   session ID for the raw bytes, with its own TTL independent of the
   token's lifecycle — don't reuse a store that gets cleared earlier in the
   pipeline than the data is needed (e.g. a store cleared once a processing
   step finishes, when the data is still needed for later display).
3. Serve that data back through a small dedicated endpoint (e.g.
   `GET /resource/:id/image`) rather than inlining it in a JSON response
   that itself gets echoed into a future token. If the consumer is a plain
   `<img src>` (which can't attach custom headers), pass the auth/session
   token as a query parameter on that one read-only endpoint instead.
4. It is not only binary data. A handful of *URLs* will do it too: presigned
   links run ~400 characters each, so under ten of them add several KB and
   land in the same 431. When the token already holds a provider task/job id,
   re-read the URLs from the provider when the response is actually built
   instead of carrying them. Status re-reads are typically free and
   un-billed, so this trades nothing for an unbounded field removed. Check
   first whether the re-read can resurrect data a fallback already declared
   unusable — see `unmeasured-fallback-must-clear-handles.md`.
