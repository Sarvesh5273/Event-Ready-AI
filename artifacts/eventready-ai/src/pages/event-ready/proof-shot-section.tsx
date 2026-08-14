import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ResultsScreenProps } from '@/types/screen-props';
import { resolveDemoAssetUrl } from '@/lib/demoAssets';
import { cn } from '@/lib/utils';

type ProofShotData = NonNullable<ResultsScreenProps['report']['proofShot']>;
type ProofShotSide = ProofShotData['best'];

interface ProofShotSectionProps {
  proofShot: ResultsScreenProps['report']['proofShot'];
}

function SideCard({
  side,
  label,
  tone,
  maxPoints,
  testId,
}: {
  side: ProofShotSide;
  label: string;
  tone: 'best' | 'worst';
  maxPoints: number;
  testId: string;
}) {
  const percent = Math.round((side.colorPoints / maxPoints) * 100);

  return (
    <div className="flex-1 min-w-0" data-testid={testId}>
      <div
        className={cn(
          'relative aspect-[3/4] bg-card border p-2 shadow-lg',
          tone === 'best' ? 'border-primary/60' : 'border-border',
        )}
      >
        <div className="w-full h-full overflow-hidden bg-secondary">
          <img
            src={resolveDemoAssetUrl(side.tryOnImageUrl)}
            alt={`${side.name} tried on`}
            className="w-full h-full object-cover object-top"
            data-testid={`${testId}-image`}
          />
        </div>
        <div
          className={cn(
            'absolute top-5 left-5 px-3 py-1 text-xs font-bold uppercase tracking-widest border backdrop-blur-md',
            tone === 'best'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background/90 text-muted-foreground border-border',
          )}
        >
          {label}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2.5 mb-2">
          <span
            className="w-4 h-4 rounded-full border border-border/60 shrink-0"
            style={{ backgroundColor: side.colorHex }}
            aria-hidden="true"
          />
          <h4 className="font-serif text-lg text-foreground truncate">{side.name}</h4>
        </div>

        {/* The measurement, shown as a bar so the two sides can be compared
            at a glance rather than by reading two numbers. */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-1.5 flex-1 bg-secondary overflow-hidden">
            <div
              className={cn('h-full', tone === 'best' ? 'bg-primary' : 'bg-muted-foreground/40')}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground tabular-nums shrink-0">
            {side.colorPoints}/{maxPoints}
          </span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`${testId}-headline`}>
          {side.headline}
        </p>
      </div>
    </div>
  );
}

/**
 * The side-by-side colour proof.
 *
 * This is the part of the result the user can actually check. Everything else
 * asks them to believe a score; this shows them the same cut on their own body
 * in the colour the measurement liked most and the one it liked least, so the
 * claim either survives their own eyes or it doesn't.
 *
 * Renders nothing when the server could not assemble an honest pair.
 */
export function ProofShotSection({ proofShot }: ProofShotSectionProps) {
  if (!proofShot) return null;

  const silhouetteLabel = proofShot.silhouette.replace(/_/g, ' ');

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="mb-24"
      data-testid="proof-shot"
    >
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-6 border border-border/50">
          See it for yourself
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
          Same {silhouetteLabel}. Two colours.
        </h2>
        <p className="text-lg text-muted-foreground">
          Identical cut, identical photo, identical lighting — the only thing that changes is the colour. Whatever you
          see here is the colour doing it.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 max-w-3xl mx-auto">
        <SideCard
          side={proofShot.best}
          label="Your colour"
          tone="best"
          maxPoints={proofShot.maxPoints}
          testId="proof-shot-best"
        />

        <div className="hidden sm:flex self-center shrink-0 flex-col items-center gap-2 pt-8">
          <div className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">vs</span>
        </div>

        <SideCard
          side={proofShot.worst}
          label="Not your colour"
          tone="worst"
          maxPoints={proofShot.maxPoints}
          testId="proof-shot-worst"
        />
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8" data-testid="proof-shot-gap">
        A {proofShot.gap}-point gap out of {proofShot.maxPoints} on the palette measured from your face.
      </p>
    </motion.section>
  );
}
