---
name: Discovering what the YouCam API actually offers
description: How to enumerate YouCam capabilities and costs reliably, and which of its own endpoints will mislead you.
---

# Finding out what the YouCam API can do

## Read the docs, do not recall them

YouCam doc pages are fetchable as plain markdown by appending `.md` to the
documentation URL. Do this before designing around assumed capabilities.

**Why:** the surface is considerably wider than the headline features, and
guessing at it leads to building a weaker product than the API supports. A
premise that looks impossible from the marketing pages may be directly
supported by a task endpoint you have not found yet.

**How to apply:** when a feature seems to require data the API "doesn't
return", search the task-endpoint list before redesigning around the gap or
faking the data locally.

## The feature-cost endpoint is not an inventory

The credit/feature-cost endpoint returns only a subset of SKUs (photo editing
and hair), and omits the analysis, try-on and video task families entirely.

**Why:** treating it as the catalogue of available features will cause you to
conclude that capabilities you rely on do not exist, and it cannot be used to
budget those calls.

**How to apply:** get the balance from the credit endpoint and derive per-call
cost empirically by taking a balance reading before and after a known run.

## Units, tasks and polling

Units are consumed on task *success*, not submission, but polling is still
mandatory: a task left unpolled past its retention window times out and is
charged anyway. Polling itself is free.

Beware that anyone testing a live deployment — including hackathon judges —
spends the balance on your key, so budget headroom for that separately from
development.

## Facial Colour Tones rejects imperfect face framing

The tone endpoint fails the whole task on head pose, returning reasons like
`error_face_angle_left_tilt` rather than degrading to a lower-confidence read.

**Why it matters:** a tilted or angled selfie produces no colour measurement at
all, so any feature built on it disappears for that user. When a UI that
depends on tones appears "missing" during testing, check the provider error in
the server log before assuming the wiring is broken — honest degradation and a
genuine bug look identical from the browser.

**How to apply:** test selfies must be straight-on and evenly lit. Treat a
tone failure as an expected branch worth exercising deliberately, not an edge
case.
