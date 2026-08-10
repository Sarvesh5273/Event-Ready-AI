import React from 'react';
import type { DemoModeBannerProps } from '@/types/screen-props';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DemoModeBanner({ className }: DemoModeBannerProps) {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full bg-primary text-primary-foreground py-2 px-4 flex items-center justify-center gap-3 text-sm font-medium border-b border-primary/20 shadow-sm",
        className
      )}
      data-testid="demo-mode-banner"
    >
      <AlertCircle className="w-4 h-4 opacity-80" />
      <span>Demo Mode: using saved YouCam API results from a test session.</span>
    </motion.div>
  );
}
