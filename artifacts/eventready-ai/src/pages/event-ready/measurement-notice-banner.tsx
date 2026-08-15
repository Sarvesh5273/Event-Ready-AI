import React from 'react';
import { motion } from 'framer-motion';
import { Camera, ScanLine } from 'lucide-react';
import type { ResultsScreenProps } from '@/types/screen-props';

interface MeasurementNoticeBannerProps {
  notice: ResultsScreenProps['report']['measurementNotice'];
  onStartOver: () => void;
}

/**
 * Explains a measurement the app declined to make.
 *
 * This sits at the very top of the results, above everything derived from the
 * face, because it changes how the rest of the page should be read. A missing
 * palette silently removes the colour reading, the proof shot and the shopping
 * section at once — without this banner that looks like three broken features
 * instead of one honest refusal.
 *
 * It is deliberately styled as a statement rather than an error toast: not
 * inventing a palette is the product working correctly, so it should not look
 * like a crash.
 */
export function MeasurementNoticeBanner({ notice, onStartOver }: MeasurementNoticeBannerProps) {
  if (!notice) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="measurement-notice"
      data-notice-scope={notice.scope}
      className="rounded-2xl border border-amber-300/60 bg-amber-50/70 px-5 py-5 sm:px-6 sm:py-6"
    >
      <div className="flex gap-4">
        <span
          aria-hidden
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
        >
          <ScanLine className="h-4 w-4" strokeWidth={1.75} />
        </span>

        <div className="min-w-0 space-y-2.5">
          <h2
            className="font-serif text-lg text-foreground sm:text-xl"
            data-testid="measurement-notice-title"
          >
            {notice.title}
          </h2>

          <p
            className="text-sm leading-relaxed text-muted-foreground"
            data-testid="measurement-notice-detail"
          >
            {notice.detail}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            {notice.retakeHelps && (
              <button
                type="button"
                onClick={onStartOver}
                data-testid="measurement-notice-retake"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-widest text-background transition-opacity hover:opacity-85"
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={2} />
                Retake your photo
              </button>
            )}

            {/* Shown on purpose. The exact upstream code is the difference
                between "this app is broken" and "the measurement was rejected,
                and here is what rejected it". */}
            <code
              className="font-mono text-[11px] text-muted-foreground/80"
              data-testid="measurement-notice-code"
            >
              YouCam reported: {notice.code}
            </code>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
