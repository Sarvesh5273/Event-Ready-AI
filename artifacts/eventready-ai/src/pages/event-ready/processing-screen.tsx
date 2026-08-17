import React, { useEffect, useState } from 'react';
import type { ProcessingScreenProps } from '@/types/screen-props';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from './page-header';

const LIME = '#C1FF4D';
const INK = '#0D0D0D';

export function ProcessingScreen({
  steps,
  currentStep,
  errorMessage,
  onRetryWithDemoPersona,
  onBack
}: ProcessingScreenProps) {
  
  // Local state to stagger the appearance of steps if they jump instantly
  const [visibleStep, setVisibleStep] = useState(0);

  useEffect(() => {
    // If the server jumps ahead, we quickly catch up visually
    if (currentStep > visibleStep) {
      const timer = setTimeout(() => {
        setVisibleStep(prev => Math.min(prev + 1, currentStep));
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentStep, visibleStep]);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative">
      
      <PageHeader onBack={onBack} />

      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-md z-10">
        
        {errorMessage ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-destructive/20 p-8 text-center"
            data-testid="processing-error-state"
          >
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Unable to process</h2>
            <p className="text-muted-foreground mb-8">
              {errorMessage}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={onRetryWithDemoPersona}
                data-testid="button-retry-demo"
                className="w-full h-12 bg-primary text-primary-foreground font-medium hover-elevate transition-all"
              >
                Try Demo Mode instead
              </button>
              <button
                onClick={onBack}
                data-testid="button-back-error"
                className="w-full h-12 bg-transparent border border-border text-foreground font-medium hover:bg-secondary/50 transition-all flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go back
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="p-8" data-testid="processing-active-state">
            <h2 className="text-3xl font-serif mb-12 text-center">Curating your look</h2>
            
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                const isPending = index > currentStep;
                
                return (
                  <motion.div 
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: isPending ? 0.3 : 1, 
                      x: 0,
                    }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn(
                      "relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active",
                      "pl-12 md:pl-0" // indent on mobile to make room for line
                    )}
                    data-testid={`processing-step-${index}`}
                  >
                    
                    {/* Icon indicator */}
                    <div className={cn(
                      "absolute left-0 md:left-1/2 -translate-x-[2px] md:-translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background z-10 transition-colors duration-500",
                      isCompleted ? "border-primary text-primary" : 
                      isActive ? "border-primary text-primary animate-pulse" : 
                      "border-border text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-3 h-3 fill-current" />
                      )}
                    </div>
                    
                    {/* Text content */}
                    <div className="md:w-1/2 md:px-8">
                      <div className={cn(
                        "font-medium text-lg transition-colors duration-300",
                        isActive ? "text-foreground" : "text-muted-foreground",
                        "md:text-right group-odd:md:text-left" // alternate alignment on desktop
                      )}>
                        {step}
                        {isActive && (
                          <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="ml-1"
                          >
                            ...
                          </motion.span>
                        )}
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      </div>
      </div>{/* end flex-1 */}
    </div>
  );
}
