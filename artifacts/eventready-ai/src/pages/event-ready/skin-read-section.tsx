import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace } from 'lucide-react';
import type { ResultsScreenProps } from '@/types/screen-props';
import { resolveDemoAssetUrl } from '@/lib/demoAssets';
import { cn } from '@/lib/utils';

type Report = ResultsScreenProps['report'];
type SkinOverlay = NonNullable<Report['skinOverlay']>;
type SkinConcernOverlay = SkinOverlay['overlays'][number];
type Concern = SkinConcernOverlay['concern'];
type Level = SkinConcernOverlay['level'];

interface SkinReadSectionProps {
  skinOverlay: Report['skinOverlay'];
  skinSignals: Report['skinSignals'];
}

/**
 * What each measurement is called, and — more importantly — what it actually
 * changed downstream. A concern the recommendation never consults would be
 * decoration, so every row here names the decision it feeds.
 */
const CONCERN_COPY: Record<Concern, { label: string; effect: string }> = {
  redness: {
    label: 'Redness',
    effect: 'Rules out colours that push warmth into an already-flushed complexion.',
  },
  oiliness: {
    label: 'Oiliness',
    effect: 'Decides matte versus shine — the fabric finish that photographs well on you.',
  },
  darkCircles: {
    label: 'Under-eye shadow',
    effect: 'Favours necklines and shades that lift light towards the eye.',
  },
  radiance: {
    label: 'Radiance',
    effect: 'Low radiance is met with soft, luminous colour rather than flat, heavy tones.',
  },
  moisture: {
    label: 'Moisture',
    effect: 'Sets the skin-prep timing in your notes for the day.',
  },
  texture: {
    label: 'Texture',
    effect: 'Sets how much the fabric should catch light up close.',
  },
};

const LEVEL_STYLES: Record<Level, string> = {
  high: 'bg-primary/15 text-primary border-primary/40',
  medium: 'bg-secondary text-secondary-foreground border-border',
  low: 'bg-transparent text-muted-foreground border-border/60',
  unknown: 'bg-transparent text-muted-foreground/70 border-border/40',
};

const LEVEL_RANK: Record<Level, number> = { high: 3, medium: 2, low: 1, unknown: 0 };

/**
 * The Skin AI half of the reading, shown as evidence rather than as a number.
 *
 * YouCam returns a segmentation mask per concern — a binary image, coloured
 * region on a black field — aligned to its own normalised copy of the selfie.
 * Compositing with `mix-blend-mode: screen` drops the black and leaves only
 * the detected region, so the user sees exactly where the measurement landed
 * instead of being asked to accept "oiliness: medium" on faith.
 *
 * Renders nothing when no usable masks came back. A face we could not measure
 * gets no illustrative overlay.
 */
export function SkinReadSection({ skinOverlay, skinSignals }: SkinReadSectionProps) {
  const overlays = skinOverlay?.overlays ?? [];

  // Open on the most pronounced finding — that is the one that did the most
  // work in the recommendation, so it is the one worth showing first.
  const initialConcern = React.useMemo(() => {
    if (overlays.length === 0) return null;
    return overlays.reduce((best, o) => (LEVEL_RANK[o.level] > LEVEL_RANK[best.level] ? o : best)).concern;
  }, [overlays]);

  const [active, setActive] = React.useState<Concern | null>(initialConcern);

  React.useEffect(() => {
    setActive(initialConcern);
  }, [initialConcern]);

  if (!skinOverlay || overlays.length === 0) return null;

  const activeOverlay = overlays.find((o) => o.concern === active) ?? null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      id="skin-read"
      className="mb-24 scroll-mt-6"
      data-testid="skin-read"
    >
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-6 border border-border/50">
          <ScanFace className="w-3.5 h-3.5" />
          Where we looked
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
          The reading came from your skin, not a guess.
        </h2>
        <p className="text-lg text-muted-foreground">
          Six things were measured on your face. Tap any one to see exactly where it was found — and what it changed
          about the outfit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto items-start">
        {/* The evidence */}
        <div className="relative aspect-square bg-card border border-border p-2 shadow-lg">
          <div className="relative w-full h-full overflow-hidden bg-secondary">
            <img
              src={resolveDemoAssetUrl(skinOverlay.baseImageUrl)}
              alt="The photo the skin measurement was taken from"
              className="w-full h-full object-cover"
              data-testid="skin-read-base-image"
            />

            <AnimatePresence mode="wait">
              {activeOverlay && (
                <motion.img
                  key={activeOverlay.concern}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  src={resolveDemoAssetUrl(activeOverlay.maskUrl)}
                  alt={`${CONCERN_COPY[activeOverlay.concern].label} detected on the face`}
                  /* The mask is a coloured region on black; `screen` turns the
                     black transparent so only the detected area shows. */
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ mixBlendMode: 'screen' }}
                  data-testid="skin-read-mask"
                />
              )}
            </AnimatePresence>
          </div>

          <div className="absolute top-5 left-5 px-3 py-1 text-xs font-bold uppercase tracking-widest border backdrop-blur-md bg-background/90 text-muted-foreground border-border">
            YouCam AI Skin Analysis
          </div>
        </div>

        {/* The measurements */}
        <div>
          <div className="flex flex-col divide-y divide-border/60 border-y border-border/60">
            {overlays.map((overlay) => {
              const copy = CONCERN_COPY[overlay.concern];
              const isActive = overlay.concern === active;

              return (
                <button
                  key={overlay.concern}
                  type="button"
                  onClick={() => setActive(isActive ? null : overlay.concern)}
                  aria-pressed={isActive}
                  className={cn(
                    'group text-left py-3.5 px-3 -mx-3 transition-colors',
                    isActive ? 'bg-secondary/60' : 'hover:bg-secondary/30',
                  )}
                  data-testid={`skin-read-concern-${overlay.concern}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {copy.label}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border shrink-0',
                        LEVEL_STYLES[skinSignals[overlay.concern] ?? overlay.level],
                      )}
                    >
                      {skinSignals[overlay.concern] ?? overlay.level}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm text-muted-foreground leading-relaxed overflow-hidden"
                      >
                        <span className="block pt-2">{copy.effect}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground/80 mt-5 leading-relaxed">
            Highlighted regions are returned by YouCam AI Skin Analysis and drawn over its own normalised copy of your
            photo — nothing here is illustrative.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
