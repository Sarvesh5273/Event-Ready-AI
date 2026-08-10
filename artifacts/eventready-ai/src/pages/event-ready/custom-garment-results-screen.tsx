import React from 'react';
import type { EventReadyReport } from '@workspace/api-client-react';
import { resolveDemoAssetUrl } from '@/lib/demoAssets';
import { motion } from 'framer-motion';
import { RotateCcw, Check, Info, Shirt, Play } from 'lucide-react';
import { PaletteReveal } from './palette-reveal';

interface CustomGarmentResultsScreenProps {
  report: EventReadyReport;
  onStartOver: () => void;
}

/**
 * Results view for the "upload your own garment" flow — a single
 * skin/color compatibility read for the piece the user is considering,
 * rather than a ranked list of catalog outfits. Uses the same rule engine
 * as the catalog flow (via `scoreCustomGarment` on the backend), just with
 * a narrower point budget and its own "Skin & Color Compatibility" label
 * so it's never confused with the catalog confidence score.
 */
export function CustomGarmentResultsScreen({ report, onStartOver }: CustomGarmentResultsScreenProps) {
  const garment = report.customGarment;

  if (!garment) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-destructive font-medium">Error: Could not render your garment result.</p>
        <button onClick={onStartOver} className="px-4 py-2 bg-secondary text-foreground">Start Over</button>
      </div>
    );
  }

  const tryOnSucceeded = garment.vtoStatus === 'success' && Boolean(garment.vtoResultImageUrl);
  const heroImageUrl = tryOnSucceeded ? resolveDemoAssetUrl(garment.vtoResultImageUrl as string) : garment.imageUrl;

  return (
    <div className="min-h-[100dvh] bg-background pt-16 pb-24 font-sans">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-6 border border-border/50">
            <Shirt className="w-3.5 h-3.5" />
            Your Garment
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">Is it right for you?</h1>
          <p className="text-lg text-muted-foreground">
            {report.colorAnalysis
              ? 'A read on how this piece works with the colouring measured from your photo.'
              : "A read on this piece — we couldn't read your colouring, so this covers fit, style and fabric only."}
          </p>
        </motion.div>

        {/* The same colour reading the catalog flow shows. The compatibility
            verdict below is judged against this palette, so it has to be
            visible here too rather than asserted without evidence. */}
        <PaletteReveal analysis={report.colorAnalysis} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
            data-testid="custom-garment-image"
          >
            <div className="aspect-[3/4] bg-card border border-border p-2 shadow-xl relative group">
              <div className="w-full h-full overflow-hidden bg-secondary">
                <img
                  src={heroImageUrl}
                  alt="Your garment"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  onLoad={() => {
                    console.log('[CustomGarmentResults] hero image loaded OK:', heroImageUrl?.slice(0, 120));
                  }}
                  onError={() => {
                    console.error('[CustomGarmentResults] hero image FAILED to load:', heroImageUrl?.slice(0, 120));
                  }}
                />
              </div>

              {garment.score && (
                <div className="absolute top-6 right-6 bg-background/90 backdrop-blur-md px-4 py-2 border border-border shadow-sm flex flex-col items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Fit</span>
                  <span className="text-2xl font-serif text-primary leading-none">{garment.score.confidenceScore}%</span>
                </div>
              )}

              {!tryOnSucceeded && (
                <div
                  className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur-md px-4 py-2 border border-border shadow-sm text-center"
                  data-testid="custom-garment-tryon-unavailable"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    Try-on preview unavailable for this piece — showing your uploaded photo instead.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-7 flex flex-col justify-center"
            data-testid="custom-garment-details"
          >
            <div className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Skin & Color Compatibility
            </div>
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-foreground capitalize">
              {garment.colorFamily.replace('_', ' ')} · {garment.undertone} undertone
            </h2>

            {garment.score ? (
              <div className="space-y-6 mb-10">
                {garment.score.userFacingReasons.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Why it works</h3>
                    <ul className="space-y-4">
                      {garment.score.userFacingReasons.map((reason, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + idx * 0.1 }}
                          className="flex items-start gap-3"
                          data-testid={`custom-garment-reason-${idx}`}
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="text-lg text-foreground leading-relaxed">{reason}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </>
                )}

                {garment.score.userFacingCautions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-6 bg-secondary/50 border border-border p-4 flex gap-3"
                    data-testid="custom-garment-caution"
                  >
                    <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      {garment.score.userFacingCautions.map((caution, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">{caution}</p>
                      ))}
                    </div>
                  </motion.div>
                )}

                {garment.score.userFacingReasons.length === 0 && garment.score.userFacingCautions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex gap-3 py-2"
                    data-testid="custom-garment-skin-analysis-unavailable"
                  >
                    <Info className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground/70 leading-relaxed italic">
                      We couldn't read your skin signals from this photo — this score reflects color compatibility only.
                    </p>
                  </motion.div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground mb-10">
                We couldn't generate a compatibility read for this piece. You can still see the try-on below.
              </p>
            )}

            {garment.vtoErrorMessage && !tryOnSucceeded && (
              <p className="text-sm text-muted-foreground">{garment.vtoErrorMessage}</p>
            )}
          </motion.div>
        </div>

        {report.video?.status === 'success' && report.video.videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24 text-center"
            data-testid="custom-garment-video-section"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-6 border border-border/50">
              <Play className="w-3.5 h-3.5" />
              See It In Motion
            </div>
            <h3 className="text-2xl md:text-3xl font-serif mb-8 text-foreground">Your garment, brought to life</h3>
            <div className="max-w-sm mx-auto aspect-[3/4] bg-card border border-border p-2 shadow-xl">
              <div className="w-full h-full overflow-hidden bg-secondary">
                <video
                  src={resolveDemoAssetUrl(report.video.videoUrl)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                  data-testid="custom-garment-video"
                />
              </div>
            </div>
          </motion.div>
        )}

        {report.prepTips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-primary text-primary-foreground p-8 relative overflow-hidden max-w-2xl mx-auto"
            data-testid="prep-tips"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[30px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <h3 className="text-2xl font-serif mb-8 relative z-10">Event Prep</h3>
            <ul className="space-y-6 relative z-10">
              {report.prepTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-4 border-b border-white/10 pb-6 last:border-0 last:pb-0" data-testid={`prep-tip-${idx}`}>
                  <span className="text-sm font-serif opacity-60 mt-0.5">0{idx + 1}</span>
                  <p className="text-sm leading-relaxed opacity-90">{tip}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <div className="mt-24 pt-8 border-t border-border flex justify-center">
          <button
            onClick={onStartOver}
            data-testid="button-start-over"
            className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start a new session
          </button>
        </div>
      </div>
    </div>
  );
}
