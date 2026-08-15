---
name: A scoring input isn't done when scores change — it's done when it's visible
description: Adding a new scoring term or intake preference; why "the numbers moved" is a false finish line, and how truncated reason lists silently bury the most important output.
---

A new scoring term is only finished when the user can *read* its effect. Two
separate things have to be true, and the first one passing hides the second:

1. The term changes the ranking (not just the numbers).
2. The reason it produced actually survives to the screen.

**Why:** a term was added, verified against the full catalog (every item's score
changed, top-3 membership swapped), and still came back as a UI test failure —
the results screen renders only the first three reasons, and reason codes were
pushed in rule-execution order, so the new one was always last and always cut.
The same truncation had been silently hiding the *colour verdict*, which is the
product's entire differentiator, behind three lines of boilerplate that are true
of every item in the catalog ("a strong match for a wedding guest look").

**How to apply:**
- When any list of generated strings feeds a UI that slices it (`.slice(0, n)`,
  `[0]`, `line-clamp`), the emission order is a product decision. Give it an
  explicit priority map keyed exhaustively by the union type, so a new code has
  to choose a rank instead of defaulting to the bottom.
- Rank by how specific the claim is: measured/personal findings first, generic
  restatements of the user's own input last. A reason that is true of every item
  discriminates nothing and should never win a visible slot.
- Sort stably so rule order still breaks ties within a tier.
- To prove a new term matters, diff scores across the *whole* catalog and check
  whether top-N *membership* changes — not just whether some number moved. Then
  confirm in the browser, because passing the first check tells you nothing
  about the second.

**Related:** an intake question that does not change the output is fake
personalization. The bar for adding one is that it moves real points, and that
the user can see it move.
