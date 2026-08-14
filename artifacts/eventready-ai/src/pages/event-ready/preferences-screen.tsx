import React from 'react';
import type { PreferencesScreenProps } from '@/types/screen-props';
import { StyleVibe, TraditionPreference } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PreferencesScreen({
  styleVibe,
  onStyleVibeChange,
  tradition,
  onTraditionChange,
  onContinue,
  onBack,
  wantsDemoPersona
}: PreferencesScreenProps) {
  
  const vibeOptions = [
    { id: StyleVibe.classic, label: 'Classic Elegance', description: 'Timeless silhouettes, refined colors, and understated sophistication.' },
    { id: StyleVibe.bold, label: 'Bold & Statement', description: 'Striking patterns, modern cuts, and colors that stand out in a crowd.' }
  ];

  const traditionOptions = [
    { id: TraditionPreference.any, label: 'Open to anything' },
    { id: TraditionPreference.western, label: 'Western' },
    { id: TraditionPreference.indian, label: 'Indian' },
    { id: TraditionPreference.east_asian, label: 'East Asian' },
    { id: TraditionPreference.middle_eastern, label: 'Middle Eastern' }
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="px-6 py-8 flex items-center">
        <button 
          onClick={onBack}
          data-testid="button-back"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-4xl font-serif mb-2">How do you want to show up?</h1>
          <p className="text-muted-foreground text-lg mb-12">
            Your colors come from your photo. This is the one thing we can't measure — the mood you're going for.
          </p>

          <div className="space-y-12">
            {/* Style Vibe Selection */}
            <section>
              <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Style Vibe
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vibeOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => onStyleVibeChange(option.id as StyleVibe)}
                    data-testid={`select-vibe-${option.id}`}
                    className={cn(
                      "text-left p-6 border transition-all duration-300 relative overflow-hidden group",
                      styleVibe === option.id 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border bg-card hover:border-primary/40 hover:bg-secondary/20"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-serif text-xl">{option.label}</span>
                      {styleVibe === option.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <Check className="w-5 h-5 text-primary" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {/* Dressing tradition — a hard filter on what we shortlist, not a nudge. */}
            <section>
              <h2 className="text-xl font-medium mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                What are you wearing?
              </h2>
              <p className="text-muted-foreground mb-4">
                Your colour analysis works the same either way — this just decides which pieces we shortlist.
              </p>
              <div className="flex flex-wrap gap-3">
                {traditionOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => onTraditionChange(option.id)}
                    data-testid={`select-tradition-${option.id}`}
                    className={cn(
                      "px-5 py-3 border transition-all duration-300 text-sm font-medium inline-flex items-center gap-2",
                      tradition === option.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-secondary/20"
                    )}
                  >
                    {tradition === option.id && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex">
                        <Check className="w-4 h-4 text-primary" />
                      </motion.span>
                    )}
                    {option.label}
                  </button>
                ))}
              </div>
              {wantsDemoPersona && (
                <p className="text-sm text-muted-foreground mt-4 border-l-2 border-border pl-3" data-testid="tradition-demo-note">
                  The demo persona replays a fixed set of pre-rendered Western looks, so this filter won't change her
                  results. Run it with your own photo to see the other traditions.
                </p>
              )}
            </section>
          </div>
        </motion.div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t border-border z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground hidden sm:block">
            {wantsDemoPersona ? "Using demo photos next" : "Next: Photo upload"}
          </div>
          <button
            onClick={onContinue}
            data-testid="button-continue-preferences"
            className="w-full sm:w-auto h-12 px-8 bg-primary text-primary-foreground font-medium hover-elevate transition-all ml-auto"
          >
            Continue
          </button>
        </div>
      </footer>
    </div>
  );
}
