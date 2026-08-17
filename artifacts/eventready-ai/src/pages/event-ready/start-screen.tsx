import React, { useRef, useState } from 'react';
import type { StartScreenProps } from '@/types/screen-props';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, X, Heart } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Visual system — LuxeMira-style layout, EventReady content          */
/*  White / near-black base, neon lime interactive accent,             */
/*  bordeaux reserved for EventReady brand moments                     */
/* ------------------------------------------------------------------ */

const WHITE = '#FFFFFF';
const OFFWHITE = '#F8F5F0';
const TICKER_BG = '#F0EDE8';
const INK = '#0D0D0D';
const LIME = '#C1FF4D';
const WINE = '#7C1F33';

const N1 = '#D4CFC9';
const N2 = '#B8B0A6';
const N3 = '#8B7F76';
const WARM_BLOCK = '#E8E2D8';
const TERRACOTTA = '#C96A52';
const RUST = '#9C3D26';
const OLIVE = '#5E6135';
const AMBER = '#D99C38';
const SIENNA = '#B85B42';
const CHOCOLATE = '#3A231C';
const FOREST = '#2A4B36';
const MUSTARD = '#C79F3F';
const DARKWARM1 = '#2A2420';
const DARKWARM2 = '#1A1510';

const MONO = "'Space Mono', ui-monospace, SFMono-Regular, monospace";

const inkAlpha = (a: number) => `rgba(13,13,13,${a})`;
const limeAlpha = (a: number) => `rgba(193,255,77,${a})`;

const TRUE_AUTUMN = [
  { name: 'Warm Terracotta', hex: TERRACOTTA },
  { name: 'Deep Rust', hex: RUST },
  { name: 'Olive', hex: OLIVE },
  { name: 'Golden Amber', hex: AMBER },
  { name: 'Burnt Sienna', hex: SIENNA },
  { name: 'Dark Chocolate', hex: CHOCOLATE },
  { name: 'Forest Green', hex: FOREST },
  { name: 'Mustard', hex: MUSTARD },
];

const GARMENTS: { name: string; gradient: string }[] = [
  { name: 'Terracotta Wrap Dress', gradient: `linear-gradient(160deg, ${TERRACOTTA}, ${CHOCOLATE})` },
  { name: 'Rust Midi Skirt', gradient: `linear-gradient(160deg, ${RUST}, ${CHOCOLATE})` },
  { name: 'Olive Blazer', gradient: `linear-gradient(160deg, ${OLIVE}, ${FOREST})` },
  { name: 'Amber Maxi Dress', gradient: `linear-gradient(160deg, ${AMBER}, ${RUST})` },
  { name: 'Sienna Trench Coat', gradient: `linear-gradient(160deg, ${SIENNA}, ${CHOCOLATE})` },
  { name: 'Forest Slip Dress', gradient: `linear-gradient(160deg, ${FOREST}, ${CHOCOLATE})` },
  { name: 'Mustard Knit Cardigan', gradient: `linear-gradient(160deg, ${MUSTARD}, ${RUST})` },
  { name: 'Chocolate Tailored Trousers', gradient: `linear-gradient(160deg, ${CHOCOLATE}, #000000)` },
];

export function StartScreen({ onStart, onUseDemoPersona, onStartCustom }: StartScreenProps) {
  return (
    <div className="flex flex-col font-sans" style={{ backgroundColor: WHITE, color: INK }}>
      <GrainOverlay />
      <Nav onStart={onStart} onUseDemoPersona={onUseDemoPersona} onStartCustom={onStartCustom} />
      <Hero onStart={onStart} onUseDemoPersona={onUseDemoPersona} onStartCustom={onStartCustom} />
      <TickerStrip />
      <Statement />
      <PaletteMatch onStart={onStart} />
      <TryOnExperience onUseDemoPersona={onUseDemoPersona} />
      <GarmentGrid />
      <MeasurementData />
      <FinalCTA onStart={onStart} onUseDemoPersona={onUseDemoPersona} onStartCustom={onStartCustom} />
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small primitives                                                   */
/* ------------------------------------------------------------------ */

const GrainOverlay = () => (
  <div
    className="fixed inset-0 pointer-events-none z-[60] opacity-[0.025] mix-blend-overlay"
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
    }}
  />
);

/** Abstract mannequin mark used in every placeholder — never a photo. */
const SilhouetteMark: React.FC<{ className?: string; opacity?: number; color?: string }> = ({
  className = '',
  opacity = 0.16,
  color = INK,
}) => (
  <svg viewBox="0 0 100 160" className={className} style={{ opacity }} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="22" r="14" fill={color} />
    <path
      d="M50 38 C24 38 14 58 14 90 L14 150 C14 155 18 159 24 159 L76 159 C82 159 86 155 86 150 L86 90 C86 58 76 38 50 38Z"
      fill={color}
    />
  </svg>
);

/** Gradient-fill placeholder standing in for photography, with a subtle diagonal texture. */
const PlaceholderBlock: React.FC<{
  gradient: string;
  className?: string;
  children?: React.ReactNode;
  showMark?: boolean;
  markOpacity?: number;
  markColor?: string;
}> = ({ gradient, className = '', children, showMark = true, markOpacity = 0.16, markColor = INK }) => (
  <div className={`overflow-hidden ${className}`} style={{ background: gradient }}>
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 16px)',
      }}
    />
    {showMark && (
      <SilhouetteMark
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[58%]"
        opacity={markOpacity}
        color={markColor}
      />
    )}
    {children}
  </div>
);

const SectionTag: React.FC<{
  children: React.ReactNode;
  tone?: 'lime' | 'dark' | 'outline';
  outlineOnDark?: boolean;
  className?: string;
}> = ({ children, tone = 'outline', outlineOnDark = false, className = '' }) => {
  const toneStyle: React.CSSProperties =
    tone === 'lime'
      ? { backgroundColor: LIME, color: INK }
      : tone === 'dark'
        ? { backgroundColor: INK, color: WHITE }
        : {
            backgroundColor: 'transparent',
            color: outlineOnDark ? WHITE : INK,
            border: `1.5px solid ${outlineOnDark ? 'rgba(255,255,255,0.32)' : inkAlpha(0.2)}`,
          };
  return (
    <span className={`inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 ${className}`} style={toneStyle}>
      <span className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: WINE }} />
      <span className="font-sans uppercase whitespace-nowrap" style={{ fontSize: '0.6875rem', letterSpacing: '0.16em', fontWeight: 700 }}>
        {children}
      </span>
    </span>
  );
};

const FilterChip: React.FC<{ label: string; active?: boolean; dark?: boolean; onClick?: () => void }> = ({
  label,
  active,
  dark,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="rounded-full px-4 py-2 font-sans transition-all"
    style={{
      fontSize: '0.75rem',
      fontWeight: 700,
      backgroundColor: active ? LIME : 'transparent',
      color: active ? INK : dark ? 'rgba(255,255,255,0.75)' : inkAlpha(0.65),
      border: active ? '1.5px solid transparent' : `1.5px solid ${dark ? 'rgba(255,255,255,0.28)' : inkAlpha(0.22)}`,
    }}
  >
    {label}
  </button>
);

/** Scroll-triggered reveal — transform/opacity only, skipped for reduced motion. */
const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  1 — NAVIGATION                                                      */
/* ------------------------------------------------------------------ */

const Nav: React.FC<{ onStart: () => void; onUseDemoPersona: () => void; onStartCustom: () => void }> = ({
  onStart,
  onUseDemoPersona,
  onStartCustom,
}) => (
  <header
    className="sticky top-0 z-50 border-b"
    style={{ backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', borderColor: inkAlpha(0.08) }}
  >
    <div className="mx-auto max-w-[1680px] flex items-center justify-between px-6 md:px-10 py-4">
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rotate-45 shrink-0" style={{ backgroundColor: LIME, border: `1px solid ${INK}` }} />
        <span className="font-sans font-extrabold tracking-tight" style={{ fontSize: '1.1875rem', color: INK }}>
          EventReady <span style={{ color: WINE }}>AI</span>
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-9">
        <button
          onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          className="font-sans transition-opacity hover:opacity-55"
          style={{ fontSize: '0.875rem', fontWeight: 600, color: INK }}
        >
          How It Works
        </button>
        <button
          onClick={onUseDemoPersona}
          className="font-sans transition-opacity hover:opacity-55"
          style={{ fontSize: '0.875rem', fontWeight: 600, color: INK }}
        >
          Try Demo
        </button>
        <button
          onClick={onStartCustom}
          className="font-sans transition-opacity hover:opacity-55"
          style={{ fontSize: '0.875rem', fontWeight: 600, color: INK }}
        >
          Check an Outfit
        </button>
      </nav>

      <button
        onClick={onStart}
        className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 transition-transform hover:-translate-y-0.5"
        style={{ backgroundColor: LIME, color: INK }}
      >
        <span className="font-sans font-bold whitespace-nowrap" style={{ fontSize: '0.8125rem' }}>
          <span className="hidden sm:inline">Start My Styling</span>
          <span className="sm:hidden">Start Styling</span>
        </span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  </header>
);

/* ------------------------------------------------------------------ */
/*  2 — HERO                                                            */
/* ------------------------------------------------------------------ */

const Hero = ({ onStart, onUseDemoPersona, onStartCustom }: StartScreenProps) => {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

  return (
    <section ref={ref} className="relative min-h-[100dvh] flex flex-col justify-center" style={{ backgroundColor: WHITE }}>
      <div className="px-6 md:px-10 lg:px-16 pt-16 pb-12 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT — copy */}
          <div className="lg:col-span-7">
            <h1 className="leading-[0.86] tracking-[-0.04em] mb-7">
              <span className="block font-sans" style={{ fontSize: 'clamp(3rem,7.2vw,6.75rem)', fontWeight: 800, color: INK }}>
                Your Colour
              </span>
              <span className="block font-serif italic" style={{ fontSize: 'clamp(3rem,7.2vw,6.75rem)', fontWeight: 600, color: WINE }}>
                Measured.
              </span>
              <span className="block font-sans" style={{ fontSize: 'clamp(3rem,7.2vw,6.75rem)', fontWeight: 800, color: INK }}>
                Verified.
              </span>
            </h1>

            <div
              className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-7"
              style={{ border: `1.5px solid ${limeAlpha(0.9)}`, backgroundColor: limeAlpha(0.16) }}
            >
              <span className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: WINE }} />
              <span className="font-sans uppercase" style={{ fontSize: '0.6875rem', letterSpacing: '0.14em', fontWeight: 700, color: INK }}>
                12-Season · CIELAB · Precision
              </span>
            </div>

            <p className="font-sans leading-relaxed mb-10 max-w-md" style={{ fontSize: '1.0625rem', color: inkAlpha(0.64), fontWeight: 300 }}>
              Upload one photo. EventReady measures your skin, hair and eye colour from a single photo.
            </p>

            <div className="flex flex-col gap-3 max-w-md mb-8">
              <button
                onClick={onStart}
                data-testid="button-start-flow"
                className="group inline-flex items-center justify-between rounded-full px-7 py-4 transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: LIME, color: INK }}
              >
                <span className="font-sans font-bold" style={{ fontSize: '0.9375rem' }}>
                  Start My Styling
                </span>
                <span className="inline-block transition-transform group-hover:translate-x-1" aria-hidden="true">
                  →
                </span>
              </button>

              <button
                onClick={onUseDemoPersona}
                data-testid="button-use-demo-persona"
                className="group inline-flex items-center justify-between rounded-full px-7 py-4 border transition-colors hover:bg-black/[0.03]"
                style={{ borderColor: inkAlpha(0.3), color: INK }}
              >
                <span className="font-sans font-semibold" style={{ fontSize: '0.875rem' }}>
                  Try Demo — No photos needed
                </span>
                <span className="inline-block transition-transform group-hover:translate-x-1" aria-hidden="true">
                  ↗
                </span>
              </button>
            </div>

            <button onClick={onStartCustom} data-testid="button-start-custom" className="group block text-left">
              <span className="block font-sans mb-1" style={{ fontSize: '0.875rem', color: inkAlpha(0.6) }}>
                Already have something in mind?
              </span>
              <span
                className="font-sans font-semibold underline underline-offset-4 decoration-1 group-hover:decoration-2 transition-all"
                style={{ fontSize: '0.875rem', color: INK, textDecorationColor: WINE }}
              >
                Check it before you buy
              </span>
            </button>
          </div>

          {/* RIGHT — hero portrait */}
          <div className="lg:col-span-5">
            <motion.div style={prefersReducedMotion ? undefined : { y }} className="relative aspect-[3/4] w-full overflow-hidden">
              <img
                src="/images/hero-portrait.jpg"
                alt="Event-ready styling in True Autumn palette"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute top-4 right-4">
                <span
                  className="inline-flex items-center rounded-full px-3.5 py-1.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)' }}
                >
                  <span className="font-sans" style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', color: INK }}>
                    True Autumn · Season
                  </span>
                </span>
              </div>
              <div
                className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-2 px-4 py-3"
                style={{ backgroundColor: 'rgba(13,13,13,0.86)' }}
              >
                <span className="uppercase" style={{ fontFamily: MONO, fontSize: '0.625rem', letterSpacing: '0.06em', color: LIME }}>
                  ΔE 0.4
                </span>
                <span className="uppercase" style={{ fontFamily: MONO, fontSize: '0.625rem', letterSpacing: '0.06em', color: WHITE }}>
                  MATCH 98/100
                </span>
                <span className="uppercase" style={{ fontFamily: MONO, fontSize: '0.625rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)' }}>
                  MEASURED
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Below the split */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-t mt-14 pt-8"
          style={{ borderColor: inkAlpha(0.1) }}
        >
          <div className="flex items-center gap-4">
            <div className="flex -space-x-1.5">
              {TRUE_AUTUMN.slice(0, 5).map((s) => (
                <span key={s.hex} className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: s.hex, borderColor: WHITE }} />
              ))}
            </div>
            <span className="font-sans" style={{ fontSize: '0.8125rem', color: inkAlpha(0.55) }}>
              12-season palette colours
            </span>
          </div>
          <span className="uppercase" style={{ fontFamily: MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color: inkAlpha(0.5) }}>
            Measured, not guessed.
          </span>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  3 — TICKER STRIP                                                    */
/* ------------------------------------------------------------------ */

const TickerStrip = () => {
  const prefersReducedMotion = useReducedMotion();
  const items = [
    'Colour science',
    '12-season classification',
    'CIELAB measurement',
    'Same-silhouette proof',
    'A verdict, not a guess',
    'ΔE-graded compatibility',
  ];
  const row = [...items, ...items];

  return (
    <section className="overflow-hidden border-y" style={{ backgroundColor: TICKER_BG, borderColor: inkAlpha(0.1) }}>
      <div className="flex items-center py-4">
        <motion.div
          className="flex shrink-0 items-center gap-8 pr-8"
          animate={prefersReducedMotion ? undefined : { x: ['0%', '-50%'] }}
          transition={prefersReducedMotion ? undefined : { duration: 28, ease: 'linear', repeat: Infinity }}
        >
          {row.map((t, i) => (
            <div key={i} className="flex items-center gap-8 shrink-0">
              <span className="uppercase whitespace-nowrap font-sans" style={{ letterSpacing: '0.14em', fontSize: '0.8125rem', color: INK, fontWeight: 700 }}>
                {t}
              </span>
              <span className="w-2 h-2 rotate-45 shrink-0" style={{ backgroundColor: WINE }} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  4 — STATEMENT / BRAND SECTION                                       */
/* ------------------------------------------------------------------ */

const Statement = () => (
  <section id="how-it-works" style={{ backgroundColor: WHITE }}>
    <div className="px-6 md:px-10 lg:px-16 py-20 md:py-28">
      <Reveal>
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Large dark block — 60% */}
          <div className="lg:w-[60%] relative flex flex-col justify-between p-8 md:p-14" style={{ backgroundColor: INK, minHeight: '420px' }}>
            <SectionTag tone="outline" outlineOnDark>
              Brand Principle
            </SectionTag>
            <div className="mt-10 lg:mt-0">
              <p className="font-sans leading-[1.05] tracking-[-0.02em] mb-6" style={{ fontSize: 'clamp(2rem,4.2vw,3.75rem)', fontWeight: 700, color: WHITE }}>
                Clear colour science puts your outfit where it matters.
              </p>
              <p className="font-serif italic leading-relaxed max-w-md" style={{ fontSize: '1.125rem', fontWeight: 500, color: LIME }}>
                Not on the algorithm. Not on a filter. On you.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-10">
              <span className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: LIME }} />
              <span className="font-sans uppercase" style={{ fontSize: '0.6875rem', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)' }}>
                EventReady AI · Colour Method
              </span>
            </div>
          </div>

          {/* Right column — 40% */}
          <div className="lg:w-[40%] flex flex-col gap-3">
            <div className="relative flex-1 overflow-hidden" style={{ minHeight: '200px' }}>
              <img
                src="/images/science-face.jpg"
                alt="Skin tone analysis"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>
            <div className="relative flex-1 overflow-hidden" style={{ minHeight: '200px' }}>
              <img
                src="/images/science-outfit.jpg"
                alt="Best match garment"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute bottom-5 left-5">
                <span className="inline-flex items-center rounded-full px-3.5 py-1.5" style={{ backgroundColor: LIME, color: INK }}>
                  <span className="font-sans uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.14em', fontWeight: 700 }}>
                    Best Match Verified
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  5 — PALETTE MATCH / DISCOVERY                                       */
/* ------------------------------------------------------------------ */

const PaletteMatch: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const thumbs = [TERRACOTTA, OLIVE, AMBER];
  return (
    <section style={{ backgroundColor: OFFWHITE }}>
      <div className="px-6 md:px-10 lg:px-16 py-20 md:py-28 grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
        <Reveal className="lg:col-span-5">
          <SectionTag tone="outline" className="mb-6">
            Discovery
          </SectionTag>
          <h2 className="leading-[0.92] tracking-[-0.03em] mb-8">
            <span className="block font-sans" style={{ fontWeight: 300, fontSize: 'clamp(2.5rem,5.5vw,4.25rem)', color: INK }}>
              Find Your
            </span>
            <span className="block font-sans" style={{ fontWeight: 800, fontSize: 'clamp(2.5rem,5.5vw,4.25rem)', color: INK }}>
              Palette Match.
            </span>
          </h2>

          <button
            onClick={onStart}
            className="group w-full flex items-center justify-between px-6 py-5 mb-8 border transition-colors hover:border-black"
            style={{ borderColor: inkAlpha(0.25), backgroundColor: WHITE }}
          >
            <span className="font-sans" style={{ fontSize: '1rem', color: inkAlpha(0.45) }}>
              Your palette match...
            </span>
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-1"
              style={{ backgroundColor: LIME }}
            >
              <ArrowRight className="w-4 h-4" style={{ color: INK }} />
            </span>
          </button>

          <div className="grid grid-cols-3 gap-3">
            {[
              { src: '/images/palette-thumb-terracotta.jpg', alt: 'Terracotta palette' },
              { src: '/images/palette-thumb-olive.jpg', alt: 'Olive palette' },
              { src: '/images/palette-thumb-amber.jpg', alt: 'Amber palette' },
            ].map((img, i) => (
              <div key={i} className="relative aspect-[3/4] overflow-hidden">
                <img src={img.src} alt={img.alt} className="absolute inset-0 w-full h-full object-cover object-top" />
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-7">
          <div className="relative overflow-hidden" style={{ height: 'min(60vh, 640px)' }}>
            <img
              src="/images/palette-main.jpg"
              alt="True Autumn full body palette match"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)' }} />
              <div className="absolute top-5 right-5">
                <span
                  className="inline-flex items-center rounded-full px-4 py-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(6px)' }}
                >
                  <span className="font-sans" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.03em', color: INK }}>
                    True Autumn · Best Match
                  </span>
                </span>
              </div>
              <div className="absolute bottom-5 left-5">
                <button
                  onClick={onStart}
                  className="group inline-flex items-center gap-2 rounded-full px-5 py-3 transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: LIME, color: INK }}
                >
                  <span className="font-sans font-bold" style={{ fontSize: '0.8125rem' }}>
                    Explore Matches
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
        </Reveal>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  6 — TRY-ON EXPERIENCE                                               */
/* ------------------------------------------------------------------ */

const TryOnExperience: React.FC<{ onUseDemoPersona: () => void }> = ({ onUseDemoPersona }) => {
  const [filter, setFilter] = useState<'best' | 'avoid' | 'all'>('best');
  const [verdict, setVerdict] = useState<'yes' | 'no' | null>(null);
  const [selected, setSelected] = useState(0);
  const active = TRUE_AUTUMN[selected];

  return (
    <section id="try-on" style={{ backgroundColor: INK, color: WHITE }}>
      <div className="px-6 md:px-10 lg:px-16 pt-20 md:pt-28 pb-14">
        <Reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <SectionTag tone="outline" outlineOnDark className="mb-5">
              The Try-On Studio
            </SectionTag>
            <h2 className="font-sans tracking-[-0.03em] leading-[0.96]" style={{ fontSize: 'clamp(1.875rem,4vw,3rem)', fontWeight: 700 }}>
              Find Your Palette Match
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <FilterChip label="Best Match" active={filter === 'best'} dark onClick={() => setFilter('best')} />
            <FilterChip label="Avoid" active={filter === 'avoid'} dark onClick={() => setFilter('avoid')} />
            <FilterChip label="All" active={filter === 'all'} dark onClick={() => setFilter('all')} />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="grid lg:grid-cols-2 gap-3 mb-10">
          <div className="relative aspect-[3/4] lg:aspect-auto lg:h-[64vh]">
            <div className="absolute inset-0" style={{ background: `linear-gradient(165deg, ${DARKWARM1}, ${DARKWARM2})` }}>
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{ backgroundColor: active.hex, opacity: 0.38, mixBlendMode: 'soft-light' }}
              />
              <div
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 16px)',
                }}
              />
              <SilhouetteMark className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[62%]" color={WHITE} opacity={0.22} />
              <div className="absolute top-5 left-5 font-sans uppercase" style={{ fontSize: '0.6875rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)' }}>
                Preview · {active.name}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-7 md:p-10 border" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
            <div>
              <span className="font-sans block mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)' }}>
                Image requirement: full-body photo
              </span>
              <p className="font-sans leading-relaxed mb-8" style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.72)', fontWeight: 300 }}>
                Swipe or pick a shade below — the render updates instantly so you can compare fit and colour before you commit.
              </p>
              <div className="flex items-center gap-3 mb-10">
                <button
                  onClick={() => setVerdict('yes')}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 border transition-colors"
                  style={{ borderColor: verdict === 'yes' ? LIME : 'rgba(255,255,255,0.3)', color: verdict === 'yes' ? LIME : WHITE }}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="font-sans font-semibold" style={{ fontSize: '0.8125rem' }}>
                    Yes
                  </span>
                </button>
                <button
                  onClick={() => setVerdict('no')}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 border transition-colors"
                  style={{ borderColor: verdict === 'no' ? '#E0556A' : 'rgba(255,255,255,0.3)', color: verdict === 'no' ? '#E0556A' : WHITE }}
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="font-sans font-semibold" style={{ fontSize: '0.8125rem' }}>
                    No
                  </span>
                </button>
                {verdict && (
                  <span className="font-sans" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                    {verdict === 'yes' ? 'Saved to your shortlist.' : 'Noted — showing fewer like this.'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onUseDemoPersona}
              className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 w-full sm:w-auto transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: LIME, color: INK }}
            >
              <span className="font-sans font-bold" style={{ fontSize: '0.875rem' }}>
                Try with AI
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.16} className="flex items-center gap-3 overflow-x-auto pb-2">
          {TRUE_AUTUMN.map((s, i) => (
            <button
              key={s.hex}
              onClick={() => setSelected(i)}
              className="relative shrink-0 w-20 h-20 transition-transform hover:-translate-y-1"
              style={{
                background: `linear-gradient(160deg, ${s.hex}, ${INK})`,
                outline: selected === i ? `2px solid ${LIME}` : '2px solid transparent',
                outlineOffset: '2px',
              }}
              aria-label={`Preview ${s.name}`}
            >
              {selected === i && <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full" style={{ backgroundColor: LIME }} />}
            </button>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  7 — GARMENT CARDS GRID                                              */
/* ------------------------------------------------------------------ */

const GarmentGrid = () => {
  const [curated, setCurated] = useState(true);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const dotColors = [LIME, WINE, INK];

  const toggleFav = (i: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const visible = curated ? GARMENTS.slice(0, 4) : GARMENTS;

  return (
    <section id="garments" style={{ backgroundColor: WHITE }}>
      <div className="px-6 md:px-10 lg:px-16 py-20 md:py-28">
        <Reveal className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-12">
          <h2 className="font-sans tracking-[-0.03em]" style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', fontWeight: 700, color: INK }}>
            Garments Graded For You
          </h2>
          <div className="flex items-center gap-3">
            {curated ? (
              <>
                <span className="inline-flex items-center rounded-full px-4 py-2" style={{ backgroundColor: LIME, color: INK }}>
                  <span className="font-sans font-bold" style={{ fontSize: '0.75rem' }}>
                    Best for your palette
                  </span>
                </span>
                <button onClick={() => setCurated(false)} className="font-sans" style={{ fontSize: '0.75rem', color: inkAlpha(0.5) }}>
                  Remove filter ×
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurated(true)}
                className="inline-flex items-center rounded-full px-4 py-2 border"
                style={{ borderColor: inkAlpha(0.25) }}
              >
                <span className="font-sans font-semibold" style={{ fontSize: '0.75rem', color: INK }}>
                  Show best matches only
                </span>
              </button>
            )}
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
          {visible.map((g, i) => (
            <Reveal key={g.name} delay={i * 0.05}>
              <div className="group relative mb-4 overflow-hidden" style={{ height: '300px' }}>
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]" style={{ background: g.gradient }}>
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: 'repeating-linear-gradient(135deg, #000 0px, #000 1px, transparent 1px, transparent 16px)' }}
                  />
                  <SilhouetteMark className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[55%]" color={WHITE} opacity={0.2} />
                </div>
                <button
                  onClick={() => toggleFav(i)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                  aria-label={`Favourite ${g.name}`}
                >
                  <Heart className="w-4 h-4" style={{ color: favorites.has(i) ? WINE : INK, fill: favorites.has(i) ? WINE : 'none' }} />
                </button>
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-sans" style={{ fontSize: '0.9375rem', fontWeight: 600, color: INK }}>
                  {g.name}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                {dotColors.map((c, di) => (
                  <span key={di} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  8 — MEASUREMENT DATA                                                */
/* ------------------------------------------------------------------ */

const MeasurementData = () => (
  <section id="measurement-data" style={{ backgroundColor: OFFWHITE }}>
    <div className="px-6 md:px-10 lg:px-16 py-20 md:py-28">
      <Reveal>
        <SectionTag tone="lime" className="mb-6">
          About The Analysis
        </SectionTag>
        <h2 className="font-sans tracking-[-0.03em] mb-14 max-w-2xl" style={{ fontSize: 'clamp(2rem,4.5vw,3.5rem)', fontWeight: 700, color: INK }}>
          Measurement Data
        </h2>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column — large card + hex panel */}
        <div className="flex flex-col gap-8">
          <Reveal>
            <article className="border" style={{ borderColor: inkAlpha(0.14), backgroundColor: WHITE }}>
              <div className="relative overflow-hidden" style={{ height: '340px' }}>
                <img
                  src="/images/measurement-skin.jpg"
                  alt="Skin channel measurement"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.2) 100%)' }} />
                <span className="absolute top-4 left-4 inline-flex items-center rounded-full px-3 py-1.5" style={{ backgroundColor: 'rgba(13,13,13,0.82)' }}>
                  <span className="font-sans uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.14em', color: WHITE, fontWeight: 700 }}>
                    Skin Channel
                  </span>
                </span>
              </div>
              <div className="p-7">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <h3 className="font-sans" style={{ fontSize: '1.25rem', fontWeight: 700, color: INK }}>
                    Skin: L* 79.4 · #E6B99E
                  </h3>
                  <span className="w-6 h-6 border shrink-0" style={{ backgroundColor: '#E6B99E', borderColor: inkAlpha(0.2) }} />
                </div>
                <p className="font-sans leading-relaxed" style={{ fontSize: '0.9375rem', color: inkAlpha(0.62), fontWeight: 300 }}>
                  Measured from your photo. Lightness and undertone extracted directly in CIELAB space — the anchor
                  value everything else compares against.
                </p>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border" style={{ borderColor: inkAlpha(0.14) }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: INK }}>
                <span className="uppercase" style={{ fontFamily: MONO, fontSize: '0.625rem', letterSpacing: '0.16em', color: LIME, fontWeight: 700 }}>
                  Instrument Output
                </span>
                <span className="uppercase" style={{ fontFamily: MONO, fontSize: '0.625rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}>
                  ΔE 0.4
                </span>
              </div>
              <div>
                {[
                  { l: 'Skin', v: '#E6B99E' },
                  { l: 'Hair', v: '#4A3B32' },
                  { l: 'Eye', v: '#5C4D3C' },
                ].map((row, idx) => (
                  <div
                    key={row.l}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: idx < 2 ? `1px solid ${inkAlpha(0.1)}` : 'none', backgroundColor: WHITE }}
                  >
                    <span className="font-sans" style={{ fontSize: '0.8125rem', color: inkAlpha(0.6) }}>
                      {row.l}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border" style={{ backgroundColor: row.v, borderColor: inkAlpha(0.2) }} />
                      <span style={{ fontFamily: MONO, fontSize: '0.8125rem', fontWeight: 700, color: INK }}>{row.v}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right column — two supporting cards */}
        <div className="flex flex-col gap-8">
          <Reveal delay={0.14}>
            <article className="flex border" style={{ borderColor: inkAlpha(0.14), backgroundColor: WHITE }}>
              <div className="w-28 sm:w-36 h-32 shrink-0" style={{ background: `linear-gradient(160deg, #4A3B32, ${CHOCOLATE})` }} />
              <div className="p-6">
                <h3 className="font-sans mb-2" style={{ fontSize: '1.0625rem', fontWeight: 700, color: INK }}>
                  Hair: L* 31.6 · #4A3B32
                </h3>
                <p className="font-sans leading-relaxed" style={{ fontSize: '0.875rem', color: inkAlpha(0.6), fontWeight: 300 }}>
                  Depth anchor. Sets the contrast ceiling your whole palette is built around.
                </p>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.2}>
            <article className="flex border" style={{ borderColor: inkAlpha(0.14), backgroundColor: WHITE }}>
              <div className="w-28 sm:w-36 h-32 shrink-0 flex flex-wrap">
                {TRUE_AUTUMN.slice(0, 4).map((s) => (
                  <span key={s.hex} className="w-1/2 h-1/2" style={{ backgroundColor: s.hex }} />
                ))}
              </div>
              <div className="p-6">
                <h3 className="font-sans mb-2" style={{ fontSize: '1.0625rem', fontWeight: 700, color: INK }}>
                  Season: True Autumn
                </h3>
                <p className="font-sans leading-relaxed" style={{ fontSize: '0.875rem', color: inkAlpha(0.6), fontWeight: 300 }}>
                  Classification result. Warm, muted, deep — the 12-season group your measurements landed in.
                </p>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  9 — CTA SECTION                                                     */
/* ------------------------------------------------------------------ */

const FinalCTA = ({ onStart, onUseDemoPersona, onStartCustom }: StartScreenProps) => (
  <section id="final-cta" style={{ backgroundColor: WHITE }}>
    <div className="px-6 md:px-10 lg:px-16 py-20 md:py-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <Reveal>
        <SectionTag tone="outline" className="mb-6">
          Your Verdict
        </SectionTag>
        <h2 className="font-sans tracking-[-0.04em] leading-[0.94] mb-7" style={{ fontSize: 'clamp(2.5rem,5.5vw,4.5rem)', fontWeight: 800, color: INK }}>
          Ready for your verdict?
        </h2>
        <p className="font-sans leading-relaxed mb-10 max-w-md" style={{ fontSize: '1.0625rem', color: inkAlpha(0.62), fontWeight: 300 }}>
          One photo. A measured palette. Garments graded, not guessed. See exactly which colours work before you
          spend a cent.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={onStart}
            data-testid="button-start-flow-final"
            className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: LIME, color: INK }}
          >
            <span className="font-sans font-bold" style={{ fontSize: '0.875rem' }}>
              Explore Collections
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onUseDemoPersona}
            data-testid="button-use-demo-persona-final"
            className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 border transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: inkAlpha(0.28), color: INK }}
          >
            <span className="font-sans font-semibold" style={{ fontSize: '0.8125rem' }}>
              Try Demo — No photos needed
            </span>
          </button>
        </div>

        <button onClick={onStartCustom} data-testid="button-start-custom-final" className="group block text-left">
          <span className="block font-sans mb-1" style={{ fontSize: '0.9375rem', color: inkAlpha(0.7) }}>
            Already have something in mind?
          </span>
          <span
            className="font-sans font-semibold underline underline-offset-4 decoration-1 group-hover:decoration-2 transition-all"
            style={{ fontSize: '0.9375rem', color: INK, textDecorationColor: WINE }}
          >
            Check it before you buy
          </span>
        </button>
      </Reveal>

      <Reveal delay={0.12} className="grid grid-cols-2 gap-3">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src="/images/cta-off-palette.jpg"
            alt="Off-palette outfit example"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />
          <span className="absolute bottom-4 left-4 font-sans uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.85)' }}>
            Off-Palette
          </span>
        </div>
        <div className="relative aspect-[3/4] mt-8 overflow-hidden">
          <img
            src="/images/cta-match.jpg"
            alt="True Autumn perfect match"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)' }} />
          <span className="absolute bottom-4 left-4 font-sans uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.85)' }}>
            True Autumn Match
          </span>
        </div>
      </Reveal>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  10 — FOOTER                                                         */
/* ------------------------------------------------------------------ */

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <footer style={{ backgroundColor: INK, color: WHITE }}>
      <div className="px-6 md:px-10 lg:px-16 pt-20 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-16 border-b" style={{ borderColor: 'rgba(255,255,255,0.14)' }}>
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: LIME }} />
              <span className="font-sans font-extrabold" style={{ fontSize: '1rem' }}>
                EventReady AI
              </span>
            </div>
            <p className="font-sans leading-relaxed" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', fontWeight: 300 }}>
              214 Grand Street, Floor 3
              <br />
              New York, NY 10013
            </p>
          </div>

          <div>
            <span className="block font-sans uppercase mb-5" style={{ fontSize: '0.6875rem', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)' }}>
              Pages
            </span>
            <ul className="space-y-3 font-sans" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>
              {['About', 'Features', 'Pricing', 'Terms', 'Careers', 'Blog', 'Support'].map((p) => (
                <li key={p}>
                  <a href="#" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>
                    {p}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="block font-sans uppercase mb-5" style={{ fontSize: '0.6875rem', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)' }}>
              Method
            </span>
            <ul className="space-y-3 font-sans" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>
              {['Colour Science', '12-Season Guide', 'ΔE Scoring', 'API for Stylists'].map((p) => (
                <li key={p}>
                  <a href="#" className="hover:text-white transition-colors" style={{ color: 'inherit' }}>
                    {p}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="block font-sans uppercase mb-5" style={{ fontSize: '0.6875rem', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)' }}>
              Stay Measured
            </span>
            {subscribed ? (
              <p className="font-sans" style={{ fontSize: '0.875rem', color: LIME }}>
                Thanks — we will be in touch.
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center border-b pb-2" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Your Email"
                  className="flex-1 min-w-0 bg-transparent outline-none font-sans placeholder:text-white/40"
                  style={{ fontSize: '0.875rem', color: WHITE }}
                />
                <button type="submit" className="font-sans font-bold shrink-0" style={{ fontSize: '0.75rem', color: LIME }}>
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="py-12 md:py-16 overflow-hidden">
          <span
            className="block font-sans font-extrabold tracking-[-0.04em] whitespace-nowrap"
            style={{ fontSize: 'clamp(2.25rem,12vw,9rem)', color: WHITE, lineHeight: 1 }}
          >
            EventReady AI <span style={{ color: LIME }}>®</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.14)' }}>
          <span className="uppercase" style={{ fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
            Style Guide · Changelog · Password/Product · License
          </span>
          <span className="uppercase" style={{ fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
            © {new Date().getFullYear()} EventReady AI
          </span>
        </div>
      </div>
    </footer>
  );
};

export default StartScreen;
