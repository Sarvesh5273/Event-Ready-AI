import React from 'react';
import { ArrowLeft } from 'lucide-react';

/* Shared top nav bar used on every inner screen — matches the landing page header */

const LIME = '#C1FF4D';
const INK = '#0D0D0D';

interface PageHeaderProps {
  onBack?: () => void;
  backDisabled?: boolean;
  rightSlot?: React.ReactNode;
}

export function PageHeader({ onBack, backDisabled, rightSlot }: PageHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-10 h-14 border-b"
      style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(0,0,0,0.08)' }}
    >
      {/* Left: back button or logo spacer */}
      <div className="flex items-center gap-4 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            disabled={backDisabled}
            data-testid="button-back"
            aria-label="Go back"
            className="flex items-center justify-center w-8 h-8 border transition-colors hover:bg-black hover:text-white disabled:opacity-40 shrink-0"
            style={{ borderColor: 'rgba(0,0,0,0.15)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        {/* Logo mark */}
        <a
          href="/"
          className="flex items-center gap-2 shrink-0 no-underline"
          style={{ color: INK }}
          onClick={(e) => { e.preventDefault(); onBack?.(); }}
        >
          <span
            className="w-5 h-5 rotate-45 border"
            style={{ borderColor: LIME, backgroundColor: 'transparent' }}
          />
          <span className="font-bold text-sm tracking-tight hidden sm:block" style={{ color: INK }}>
            EventReady<span style={{ color: LIME }}>AI</span>
          </span>
        </a>
      </div>

      {/* Center: status label */}
      <span
        className="text-[11px] font-mono uppercase tracking-widest hidden md:block"
        style={{ color: 'rgba(0,0,0,0.35)' }}
      >
        MEASURED. NOT GUESSED.
      </span>

      {/* Right slot */}
      <div className="flex items-center gap-3">
        {rightSlot}
      </div>
    </header>
  );
}
