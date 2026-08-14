import type { OutfitVideoProps } from '@/types/screen-props';
import { resolveDemoAssetUrl } from '@/lib/demoAssets';
import { motion } from 'framer-motion';
import { Play, Loader2, RefreshCw } from 'lucide-react';

interface OutfitVideoSectionProps extends OutfitVideoProps {
  /** Headline shown above the player, e.g. "Emerald Maxi Dress, brought to life". */
  title: string;
  /** Prefix for `data-testid` so the catalog and custom flows stay distinguishable. */
  testIdPrefix: string;
}

/**
 * The bonus "see it move" clip, behind an explicit button.
 *
 * Generating the video is by far the most expensive call in the pipeline, so
 * it is never kicked off automatically — the user asks for it, and nothing
 * here polls until they have. Demo Mode returns a pre-baked clip through the
 * same button at no cost, which keeps this the only video path in the UI.
 */
export function OutfitVideoSection({
  title,
  testIdPrefix,
  video,
  onGenerateVideo,
  isGeneratingVideo,
  videoError,
}: OutfitVideoSectionProps) {
  const status = video?.status ?? 'idle';
  const isRunning = isGeneratingVideo || status === 'queued' || status === 'running';
  const failureMessage = videoError ?? (status === 'error' ? video?.errorMessage : null);
  // "skipped" means there was no successful try-on image to animate, so there
  // is nothing a retry could fix — don't offer a button that can't work.
  const isSkipped = status === 'skipped';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-24 text-center"
      data-testid={`${testIdPrefix}-video-section`}
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-6 border border-border/50">
        <Play className="w-3.5 h-3.5" />
        See It In Motion
      </div>
      <h3 className="text-2xl md:text-3xl font-serif mb-8 text-foreground">{title}</h3>

      {status === 'success' && video?.videoUrl ? (
        <div className="max-w-sm mx-auto aspect-[3/4] bg-card border border-border p-2 shadow-xl">
          <div className="w-full h-full overflow-hidden bg-secondary">
            <video
              src={resolveDemoAssetUrl(video.videoUrl)}
              autoPlay
              muted
              loop
              playsInline
              controls
              className="w-full h-full object-cover"
              data-testid={`${testIdPrefix}-video`}
            />
          </div>
        </div>
      ) : isSkipped ? (
        <p className="max-w-sm mx-auto text-muted-foreground leading-relaxed" data-testid={`${testIdPrefix}-video-skipped`}>
          There's no try-on image to animate for this look, so we can't build a clip this time.
        </p>
      ) : (
        <div className="max-w-sm mx-auto">
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Turn your try-on into a short clip you can actually picture yourself in.
          </p>
          <button
            onClick={onGenerateVideo}
            disabled={isRunning}
            data-testid={`${testIdPrefix}-generate-video`}
            className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-primary text-primary-foreground font-medium hover-elevate transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Bringing your look to life…
              </>
            ) : failureMessage ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Try again
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Generate video
              </>
            )}
          </button>

          {isRunning && (
            <p className="text-sm text-muted-foreground mt-4" data-testid={`${testIdPrefix}-video-progress`}>
              This usually takes about a minute.
            </p>
          )}

          {failureMessage && !isRunning && (
            <p className="text-sm text-destructive mt-4" data-testid={`${testIdPrefix}-video-error`}>
              {failureMessage}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
