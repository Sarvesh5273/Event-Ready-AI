import React from 'react';
import type { PreferencesScreenProps } from '@/types/screen-props';
import { StyleVibe, BudgetTier } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PreferencesScreen({
  styleVibe,
  budgetTier,
  onStyleVibeChange,
  onBudgetTierChange,
  onContinue,
  onBack,
  wantsDemoPersona
}: PreferencesScreenProps) {
  
  const vibeOptions = [
    { id: StyleVibe.classic, label: 'Classic Elegance', description: 'Timeless silhouettes, refined colors, and understated sophistication.' },
    { id: StyleVibe.bold, label: 'Bold & Statement', description: 'Striking patterns, modern cuts, and colors that stand out in a crowd.' }
  ];

  const budgetOptions = [
    { id: BudgetTier.low, label: 'Under $150', description: 'Accessible & stylish' },
    { id: BudgetTier.mid, label: '$150 - $350', description: 'Premium quality' },
    { id: BudgetTier.high, label: 'Over $350', description: 'Luxury investment' }
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
          <h1 className="text-4xl font-serif mb-2">Set your preferences</h1>
          <p className="text-muted-foreground text-lg mb-12">
            Tell us what you're looking for, so we can curate the perfect selection.
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

            {/* Budget Tier Selection */}
            <section>
              <h2 className="text-xl font-medium mb-4">Budget Range</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {budgetOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => onBudgetTierChange(option.id as BudgetTier)}
                    data-testid={`select-budget-${option.id}`}
                    className={cn(
                      "text-center p-5 border transition-all duration-300",
                      budgetTier === option.id
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "border-border bg-card hover:border-primary/40 text-foreground"
                    )}
                  >
                    <div className={cn(
                      "font-medium text-lg mb-1",
                      budgetTier === option.id ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {option.label}
                    </div>
                    <div className={cn(
                      "text-xs",
                      budgetTier === option.id ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
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
