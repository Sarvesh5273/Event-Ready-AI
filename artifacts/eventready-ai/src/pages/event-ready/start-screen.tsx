import React from 'react';
import type { StartScreenProps } from '@/types/screen-props';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, User } from 'lucide-react';
import { DEMO_PERSONA_NAME, DEMO_PERSONA_FULL_BODY_URL } from '@/lib/demoAssets';

export function StartScreen({ onStart, onUseDemoPersona }: StartScreenProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 z-10 w-full max-w-5xl mx-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-8 border border-border/50">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            Concierge Styling
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-[1.1] text-foreground">
            Your personal <br className="hidden md:block" />
            <span className="italic text-primary">wedding guest</span> stylist
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed">
            Discover the perfect outfit curated just for you. We analyze your style vibe, complexion, and budget to find your ultimate look.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
            <button
              onClick={onStart}
              data-testid="button-start-flow"
              className="group relative w-full sm:w-auto inline-flex h-14 items-center justify-center overflow-hidden bg-primary px-8 font-medium text-primary-foreground hover-elevate transition-all duration-300"
            >
              <span className="mr-2">Start my styling</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            
            <button
              onClick={onUseDemoPersona}
              data-testid="button-use-demo-persona"
              className="group relative w-full sm:w-auto inline-flex h-14 items-center justify-center overflow-hidden border border-border bg-transparent px-8 font-medium text-foreground hover:bg-secondary/50 transition-colors duration-300"
            >
              <User className="w-4 h-4 mr-2 opacity-70" />
              <span>Use demo persona</span>
            </button>
          </div>
        </motion.div>

        {/* Visual Showcase */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 relative w-full max-w-3xl"
        >
          <div className="aspect-[21/9] bg-card border border-border/50 p-2 shadow-2xl overflow-hidden">
            <div className="w-full h-full bg-secondary relative overflow-hidden flex items-center justify-center">
               <img 
                 src={DEMO_PERSONA_FULL_BODY_URL} 
                 alt="Styling Inspiration" 
                 className="absolute inset-0 w-full h-full object-cover object-top opacity-50 mix-blend-multiply"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
