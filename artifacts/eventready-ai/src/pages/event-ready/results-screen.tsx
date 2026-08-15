import React from 'react';
import type { ResultsScreenProps } from '@/types/screen-props';
import { resolveDemoAssetUrl } from '@/lib/demoAssets';
import { motion } from 'framer-motion';
import { RotateCcw, Check, Info, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomGarmentResultsScreen } from './custom-garment-results-screen';
import { MeasurementNoticeBanner } from './measurement-notice-banner';
import { OutfitVideoSection } from './outfit-video-section';
import { PaletteReveal } from './palette-reveal';
import { ProofShotSection } from './proof-shot-section';
import { ShopYourPaletteSection } from './shop-your-palette-section';
import { SkinReadSection } from './skin-read-section';

export function ResultsScreen({
  report,
  isDemoMode,
  onStartOver,
  video,
  onGenerateVideo,
  isGeneratingVideo,
  videoError,
}: ResultsScreenProps) {

  if (report.flow === 'custom') {
    return (
      <CustomGarmentResultsScreen
        report={report}
        onStartOver={onStartOver}
        video={video}
        onGenerateVideo={onGenerateVideo}
        isGeneratingVideo={isGeneratingVideo}
        videoError={videoError}
      />
    );
  }

  // Find hero outfit
  const heroOutfit = report.selectedOutfits.find(o => o.item.id === report.recommendedCatalogItemId);
  const heroVto = report.vtoResults.find(v => v.catalogItemId === report.recommendedCatalogItemId);
  const heroScore = report.scores.find(s => s.catalogItemId === report.recommendedCatalogItemId);
  
  // Find alternatives
  const altOutfits = report.selectedOutfits.filter(o => o.item.id !== report.recommendedCatalogItemId);

  if (!heroOutfit || !heroScore) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-destructive font-medium">Error: Could not render recommendation data.</p>
        <button onClick={onStartOver} className="px-4 py-2 bg-secondary text-foreground">Start Over</button>
      </div>
    );
  }

  const heroImageUrl = heroVto?.resultImageUrl
    ? resolveDemoAssetUrl(heroVto.resultImageUrl)
    : resolveDemoAssetUrl(heroOutfit.item.imageUrl);
  const heroTryOnUnavailable = Boolean(heroVto) && heroVto?.status !== "success";

  return (
    <div className="min-h-[100dvh] bg-background pt-16 pb-24 font-sans">
      
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Above the header on purpose: this changes how everything below it
            should be read, so it cannot sit further down the page. */}
        {report.measurementNotice && (
          <div className="mb-10">
            <MeasurementNoticeBanner notice={report.measurementNotice} onStartOver={onStartOver} />
          </div>
        )}

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16 text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-6 border border-border/50">
            <Star className="w-3.5 h-3.5" />
            Your Curation
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">The Perfect Match</h1>
          <p className="text-lg text-muted-foreground">
            {report.colorAnalysis
              ? 'Based on the colouring measured from your photo, your style, and the occasion.'
              : "Based on your style and the occasion — we couldn't read your colouring from this photo."}
          </p>
        </motion.div>

        {/* The colour reading comes before the outfit because it is the
            evidence the recommendation rests on. */}
        <PaletteReveal analysis={report.colorAnalysis} />

        {/* And the proof comes before the recommendation for the same reason:
            it is the one part of the result the user can verify themselves,
            so it has to land before we ask them to trust a score. */}
        <ProofShotSection proofShot={report.proofShot} />

        {/* The skin read closes the evidence run because it is what turns a
            colour verdict into a garment verdict — fabric finish and the prep
            notes below both come from here. */}
        <SkinReadSection skinOverlay={report.skinOverlay} skinSignals={report.skinSignals} />

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-24">
          
          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
            data-testid="hero-outfit-image"
          >
            <div className="aspect-[3/4] bg-card border border-border p-2 shadow-xl relative group">
              <div className="w-full h-full overflow-hidden bg-secondary">
                <img 
                  src={heroImageUrl} 
                  alt={heroOutfit.item.name} 
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              
              {/* Score Badge */}
              <div className="absolute top-6 right-6 bg-background/90 backdrop-blur-md px-4 py-2 border border-border shadow-sm flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Match</span>
                <span className="text-2xl font-serif text-primary leading-none">{heroScore.confidenceScore}%</span>
              </div>

              {heroTryOnUnavailable && (
                <div
                  className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur-md px-4 py-2 border border-border shadow-sm text-center"
                  data-testid="hero-tryon-unavailable"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    Try-on preview unavailable for this piece — showing the catalog photo instead.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-7 flex flex-col justify-center"
            data-testid="hero-outfit-details"
          >
            <div className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Featured Piece
            </div>
            <h2 className="text-3xl md:text-4xl font-serif mb-8 text-foreground">{heroOutfit.item.name}</h2>
            
            <div className="space-y-6 mb-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Why it works</h3>
              <ul className="space-y-4">
                {heroScore.userFacingReasons.slice(0, 3).map((reason, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + (idx * 0.1) }}
                    className="flex items-start gap-3"
                    data-testid={`hero-reason-${idx}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-lg text-foreground leading-relaxed">{reason}</span>
                  </motion.li>
                ))}
              </ul>

              {heroScore.userFacingCautions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-6 bg-secondary/50 border border-border p-4 flex gap-3"
                  data-testid="hero-caution"
                >
                  <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{heroScore.userFacingCautions[0]}</p>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-border pt-8 mt-auto">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Color Palette</div>
                <div className="capitalize font-medium">{heroOutfit.item.colorFamily}</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex-1 text-center">
                <div className="text-sm text-muted-foreground mb-1">Silhouette</div>
                <div className="capitalize font-medium">{heroOutfit.item.silhouette.replace('_', ' ')}</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex-1 text-right">
                <div className="text-sm text-muted-foreground mb-1">Fabric Finish</div>
                <div className="capitalize font-medium">{heroOutfit.item.fabricFinish.replace('_', ' ')}</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bonus video — generated on request, never automatically. */}
        <OutfitVideoSection
          title={`${heroOutfit.item.name}, brought to life`}
          testIdPrefix="hero-outfit"
          video={video}
          onGenerateVideo={onGenerateVideo}
          isGeneratingVideo={isGeneratingVideo}
          videoError={videoError}
        />

        {/* The verdict is only useful if she can act on it, so the buying
            step sits directly after the recommendation rather than at the
            very bottom under the prep notes. */}
        <ShopYourPaletteSection shopping={report.shopping} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
          
          {/* Prep Tips */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1 bg-primary text-primary-foreground p-8 relative overflow-hidden"
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

          {/* Alternatives */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-serif mb-8 pl-4 lg:pl-0">Other strong matches</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {altOutfits.map((alt, idx) => {
                const altVto = report.vtoResults.find(v => v.catalogItemId === alt.item.id);
                const altScore = report.scores.find(s => s.catalogItemId === alt.item.id);
                const imageUrl = altVto?.resultImageUrl
                  ? resolveDemoAssetUrl(altVto.resultImageUrl)
                  : resolveDemoAssetUrl(alt.item.imageUrl);
                const altTryOnUnavailable = Boolean(altVto) && altVto?.status !== "success";

                return (
                  <motion.div 
                    key={alt.item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    className="group border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors"
                    data-testid={`alt-outfit-${idx}`}
                  >
                    <div className="aspect-[4/5] bg-secondary overflow-hidden relative">
                      <img 
                        src={imageUrl} 
                        alt={alt.item.name} 
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                      {altScore && (
                        <div className="absolute top-3 right-3 bg-background/90 px-2.5 py-1 text-xs font-bold border border-border">
                          {altScore.confidenceScore}%
                        </div>
                      )}
                      {altTryOnUnavailable && (
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-background/95 px-3 py-1.5 text-center"
                          data-testid={`alt-tryon-unavailable-${idx}`}
                        >
                          <p className="text-[11px] font-medium text-muted-foreground">Try-on unavailable</p>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h4 className="font-serif text-lg mb-2 text-foreground">{alt.item.name}</h4>
                      {altScore && altScore.userFacingReasons[0] && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {altScore.userFacingReasons[0]}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
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
