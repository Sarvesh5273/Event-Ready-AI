import React from 'react';
import { motion } from 'framer-motion';
import type { EventReadyReport } from '@workspace/api-client-react';

interface PaletteRevealProps {
  analysis: EventReadyReport['colorAnalysis'];
}

/**
 * Plain-language position of a marker on an axis.
 *
 * The marker's meaning is otherwise carried purely by where it sits on the
 * line, which assistive technology cannot convey — so the same reading is
 * published as text on the axis element.
 */
function describeAxisPosition(left: string, right: string, value: number): string {
  const clamped = Math.max(-1, Math.min(1, value));
  const pct = Math.round(Math.abs(clamped) * 100);
  if (pct < 15) {
    return `balanced between ${left.toLowerCase()} and ${right.toLowerCase()}`;
  }
  return `${pct}% toward ${(clamped > 0 ? right : left).toLowerCase()}`;
}

/**
 * One measured axis, drawn as a position on a scale rather than described in
 * words.
 *
 * A sentence like "warm, light and muted" reads as a competing description of
 * the season and can appear to contradict it — a True Spring sitting at the
 * softer end of Spring is still a True Spring, but "muted" next to a palette
 * described as "clear" just looks broken. A marker on a scale states the same
 * measurement without arguing with the verdict, and shows more of the
 * underlying reading while doing it.
 */
function AxisMeter({ left, right, value }: { left: string; right: string; value: number }) {
  const clamped = Math.max(-1, Math.min(1, value));
  const pct = ((clamped + 1) / 2) * 100;
  return (
    <div>
      <div
        className="flex justify-between text-[11px] uppercase tracking-wider text-muted-foreground mb-2.5"
        aria-hidden="true"
      >
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <div
        className="relative h-px bg-border"
        role="img"
        aria-label={`${left} to ${right} scale: ${describeAxisPosition(left, right, clamped)}.`}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-2 bg-border" />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * The colour reading, shown before the outfit because it is the evidence the
 * recommendation rests on.
 *
 * The measured swatches come first deliberately: they are the part the API
 * actually read off the user's face, and putting them ahead of the season
 * verdict makes the boundary between measurement and interpretation visible
 * instead of asking the user to take the verdict on faith. The qualification
 * that the season is inferred sits directly under the season name for the same
 * reason — placing it at the foot of the panel would mean every confident
 * claim is read before the caveat that limits it.
 */
export function PaletteReveal({ analysis }: PaletteRevealProps) {
  if (!analysis) {
    return (
      <div
        className="mb-24 border border-border bg-card px-6 py-8 text-center"
        data-testid="palette-unavailable"
      >
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          The Reading
        </div>
        <p className="text-base text-foreground max-w-xl mx-auto leading-relaxed">
          We couldn't read your colouring from this photo, so there's no palette below — the
          recommendations are based on fit, style and fabric only.
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          A straight-on photo in even, natural light usually works.
        </p>
      </div>
    );
  }

  // flatMap rather than filter so `hex` narrows to a plain string — the
  // measured fields are nullable and a null hex must drop the swatch
  // entirely rather than render an empty box.
  const hairRejected = analysis.hairReadingRejected;

  const measured = [
    { label: 'Skin', hex: analysis.measured.skinColor, detail: null as string | null, rejected: false },
    {
      label: 'Hair',
      hex: analysis.measured.hairColor,
      detail: analysis.measured.hairColorName,
      rejected: hairRejected,
    },
    // The brows only appear when they are actually carrying the depth
    // reading. Showing them on every result would add a swatch that changed
    // nothing; showing them here explains what replaced the discarded hair.
    ...(hairRejected && analysis.measured.eyebrowColor
      ? [
          {
            label: 'Brows',
            hex: analysis.measured.eyebrowColor,
            detail: 'Used for depth instead',
            rejected: false,
          },
        ]
      : []),
    { label: 'Eyes', hex: analysis.measured.eyeColor, detail: analysis.measured.eyeColorName, rejected: false },
  ].flatMap((m) => (m.hex ? [{ label: m.label, hex: m.hex, detail: m.detail, rejected: m.rejected }] : []));

  const confidencePct = Math.round(analysis.confidence * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="mb-24"
      data-testid="palette-reveal"
    >
      <div className="border border-border bg-card">

        {/* Measurement — what the API actually read */}
        {measured.length > 0 && (
          <div className="border-b border-border px-6 py-8 md:px-10">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Measured from your photo
            </div>
            <div className="text-xs text-muted-foreground/80 mb-6">
              Read by the YouCam Facial Colour Tones API.
            </div>
            <div className="flex flex-wrap gap-8">
              {measured.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center gap-4"
                  data-testid={`measured-${m.label.toLowerCase()}`}
                >
                  <div
                    className={`w-14 h-14 border border-border/60 shrink-0 ${m.rejected ? 'opacity-40' : ''}`}
                    style={{ backgroundColor: m.hex }}
                    aria-hidden="true"
                  />
                  <div className="leading-tight">
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                      {m.label}
                      {m.rejected && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5">
                          Not used
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs text-muted-foreground font-mono uppercase ${m.rejected ? 'line-through opacity-70' : ''}`}
                    >
                      {m.hex}
                    </div>
                    {m.detail && (
                      <div
                        className={`text-xs text-muted-foreground mt-0.5 ${m.rejected ? 'line-through opacity-70' : ''}`}
                      >
                        {m.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {hairRejected && (
              <p
                className="text-xs text-muted-foreground/90 mt-6 max-w-2xl leading-relaxed border-l-2 border-border pl-3"
                data-testid="hair-reading-rejected"
              >
                The hair swatch came back lighter than the brows. That usually means the
                segmentation caught skin or background rather than hair, so we left it out of the
                reading and took your depth from the brows instead.
              </p>
            )}
          </div>
        )}

        {/* Interpretation — ours, not the API's */}
        <div className="px-6 py-10 md:px-10">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Your Palette
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-3" data-testid="season-label">
            {analysis.seasonLabel}
          </h2>
          <p className="text-lg text-foreground/90 max-w-2xl leading-relaxed mb-5">{analysis.tagline}</p>

          <p
            className="text-sm text-muted-foreground border-l-2 border-border pl-4 max-w-2xl leading-relaxed mb-6"
            data-testid="palette-disclaimer"
          >
            This is a suggested palette, not a measured undertone. We infer it from the colours
            above using our own colour-analysis model — it is not a professional colour analysis,
            and because it reads a single photo with no lighting calibration, a different photo can
            give a different answer.
          </p>

          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed mb-8">
            {analysis.rationale}
          </p>

          <div className="grid sm:grid-cols-3 gap-x-10 gap-y-6 max-w-2xl mb-6" data-testid="palette-axes">
            <AxisMeter left="Cool" right="Warm" value={analysis.axes.temperature} />
            <AxisMeter left="Deep" right="Light" value={analysis.axes.value} />
            <AxisMeter left="Muted" right="Clear" value={analysis.axes.chroma} />
          </div>
          <div className="text-sm text-muted-foreground mb-10" data-testid="palette-confidence">
            Strongest signal:{' '}
            <span className="text-foreground font-medium">{analysis.dominantTrait}</span> — {confidencePct}%
            confidence in this call
          </div>

          {/* Hero colours */}
          <div className="mb-10">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Wear these
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3" data-testid="hero-colors">
              {analysis.heroColors.map((color) => (
                <div key={color.hex} className="group">
                  <div
                    className="aspect-square border border-border/60 mb-2 transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />
                  <div className="text-[11px] leading-tight text-muted-foreground">{color.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Best neutral */}
          <div className="flex items-center gap-4 mb-10 pb-10 border-b border-border">
            <div
              className="w-10 h-10 border border-border/60 shrink-0"
              style={{ backgroundColor: analysis.bestNeutral.hex }}
              aria-hidden="true"
            />
            <div className="text-sm text-muted-foreground">
              Your best neutral is{' '}
              <span className="text-foreground font-medium">{analysis.bestNeutral.name}</span> — pair it
              with anything above.
            </div>
          </div>

          {/* Avoid */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              These fight your colouring
            </div>
            <div className="flex flex-wrap gap-4" data-testid="avoid-colors">
              {analysis.avoidColors.map((color) => (
                <div key={color.hex} className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 border border-border/60 opacity-70"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-muted-foreground">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
