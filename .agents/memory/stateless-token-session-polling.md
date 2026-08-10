---
name: Stateless signed-token sessions + client polling race
description: When session state lives entirely in a client-echoed signed token (no server store), naively enabling status polling right after a state-changing mutation can permanently freeze progress.
---

Pattern: a backend with no database represents session state as an
HMAC-signed (or similarly signed) token that fully encodes the session's
state; the client must echo the latest token back on every call, and the
server derives "current" status from that token (e.g. from elapsed time
since a stored start timestamp) rather than any server-side mutable state.

**Failure mode observed:** if the client flips to a "processing" UI state
and enables interval-based status polling *immediately* after firing off the
mutation that starts processing (e.g. right after `POST /sessions` succeeds,
before `POST /sessions/:id/analyze` has resolved), a status poll can race
ahead and return using the pre-transition token. Because that response's
token encodes the *same* pre-transition state, applying it naively
overwrites the correct newer state once it arrives — and since there is no
mechanism to move state forward except by reprocessing an already-stale
token, the UI can freeze permanently at step 0 with polling continuing to
resend the stale token forever. This is a permanent deadlock, not a
transient flicker, and looks like a timer/animation bug at first glance,
not a race condition.

**Why:** stateless tokens make "the latest state" whatever the most
recently *applied* response says, not the most recently *received* one —
async responses can settle out of order.

**How to apply / fix:**
1. Don't enable polling (or transition the UI to "in progress") until the
   state-changing mutation that starts the process has actually resolved —
   don't just optimistically flip screens right after the mutation is fired.
2. Guard the poll-response handler so it can only move state *forward*
   (define a monotonic progress ordering over your status/step values and
   ignore any response that would move backwards), as defense in depth
   against any remaining out-of-order responses.
