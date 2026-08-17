import React, { useRef } from 'react';
import type { StartScreenProps } from '@/types/screen-props';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Crosshair, Gauge, ScanLine, ShieldCheck, Check, X } from 'lucide-react';
import { DEMO_PERSONA_FULL_BODY_URL } from '@/lib/demoAssets';

/* ------------------------------------------------------------------ */
/*  Visual system                                                      */
/*  Warm neutral foundation + bordeaux (sparingly) + cool cyan data    */
/* ------------------------------------------------------------------ */

const INK = '#181210'; // near-black warm
const PAPER = '#F5F0EB'; // warm white
const PAPER_2 = '#EDE6DE'; // slightly deeper warm neutral
const WINE = '#7C1F33'; // bordeaux accent (sparingly)
const CYAN = '#1FC8D6'; // cool instrument accent for data UI
const CYAN_DIM = '#0E8A96';

const TRUE_AUTUMN = [
  { name: 'Warm Terracotta', hex: '#C96A52' },
  { name: 'Deep Rust', hex: '#9C3D26' },
  { name: 'Olive', hex: '#5E6135' },
  { name: 'Golden Amber', hex: '#D99C38' },
  { name: 'Burnt Sienna', hex: '#B85B42' },
  { name: 'Dark Chocolate', hex: '#3A231C' },
  { name: 'Forest Green', hex: '#2A4B36' },
  { name: 'Mustard', hex: '#C79F3F' },
];

export function StartScreen(props: StartScreenProps) {
  return (
    <div className="flex flex-col font-sans" style={{ backgroundColor: PAPER, color: INK }}>
      <Hero {...props} />
      <ClaimStrip />
      <Process />
      <Measurement />
      <PaletteAnatomy />
      <Proof />
      <Trust />
      <FinalCTA {...props} />
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small primitives                                                   */
/* ------------------------------------------------------------------ */

const Eyebrow: React.FC<{ children: React.ReactNode; accent?: string; className?: string }> = ({
  children,
  accent = WINE,
  className = '',
}) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <span className="h-px w-7" style={{ backgroundColor: accent }} />
    <span
      className="uppercase font-mono"
      style={{ letterSpacing: '0.28em', fontSize: '0.6875rem', color: accent, fontWeight: 600 }}
    >
      {children}
    </span>
  </div>
);

/** Floating measurement reticle pinned onto a photo surface. */
const Reticle: React.FC<{
  top: string;
  left: string;
  label: string;
  value: string;
  valueColor?: string;
  align?: 'top' | 'bottom';
}> = ({ top, left, label, value, valueColor = CYAN, align = 'top' }) => (
  <div className="absolute pointer-events-none" style={{ top, left }}>
    <div className="relative w-10 h-10 flex items-center justify-center">
      <span className="absolute inset-0 border" style={{ borderColor: 'rgba(245,240,235,0.55)' }} />
      <span className="absolute left-1/2 top-0 -translate-x-1/2 h-3 w-px" style={{ backgroundColor: 'rgba(245,240,235,0.55)' }} />
      <span className="absolute left-1/2 bottom-0 -translate-x-1/2 h-3 w-px" style={{ backgroundColor: 'rgba(245,240,235,0.55)' }} />
      <span className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-px" style={{ backgroundColor: 'rgba(245,240,235,0.55)' }} />
      <span className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-px" style={{ backgroundColor: 'rgba(245,240,235,0.55)' }} />
      <span className="w-1 h-1" style={{ backgroundColor: valueColor }} />
      <span
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono backdrop-blur-md px-2 py-1 border"
        style={{
          [align === 'top' ? 'bottom' : 'top']: 'calc(100% + 6px)',
          backgroundColor: 'rgba(24,18,16,0.62)',
          borderColor: 'rgba(31,200,214,0.35)',
          fontSize: '0.625rem',
          letterSpacing: '0.14em',
          color: PAPER,
        } as React.CSSProperties}
      >
        <span style={{ color: 'rgba(245,240,235,0.55)' }}>{label} </span>
        <span style={{ color: valueColor }}>{value}</span>
      </span>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  1 — HERO : full-bleed image, measurement overlay, sans display     */
/* ------------------------------------------------------------------ */

const Hero = ({ onStart, onUseDemoPersona, onStartCustom }: StartScreenProps) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const prefersReducedMotion = useReducedMotion();

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-[100dvh] overflow-hidden" style={{ backgroundColor: INK }}>
      {/* Image surface — structurally ready for a scroll-scrubbed video later */}
      <motion.div
        style={prefersReducedMotion ? {} : { y, scale }}
        className="absolute inset-0 origin-top"
      >
        <img
          src={DEMO_PERSONA_FULL_BODY_URL}
          alt="Styled woman in a warm-toned occasion outfit, measured by EventReady AI"
          className="w-full h-full object-cover object-[center_18%]"
        />
        {/* Warm-to-ink gradient so left-aligned text reads on any imagery */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(100deg, rgba(24,18,16,0.92) 0%, rgba(24,18,16,0.72) 38%, rgba(24,18,16,0.18) 70%, rgba(24,18,16,0.05) 100%)' }}
        />
        {/* Instrument grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.16]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(31,200,214,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(31,200,214,0.25) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            mixBlendMode: 'screen',
          }}
        />
      </motion.div>

      {/* Measurement reticles overlaid onto the figure */}
      <motion.div style={prefersReducedMotion ? {} : { opacity: overlayOpacity }} className="absolute inset-0 pointer-events-none">
        <Reticle top="22%" left="58%" label="SKIN_L*" value="#E6B99E" align="bottom" />
        <Reticle top="14%" left="64%" label="HAIR_L*" value="#4A3B32" />
        <Reticle top="33%" left="70%" label="EYE_L*" value="#5C4D3C" align="bottom" />
        <Reticle top="64%" left="55%" label="GARMENT" value="#B85B42" valueColor="#D99C38" />
      </motion.div>

      {/* Content overlay */}
      <motion.div
        style={prefersReducedMotion ? {} : { opacity: overlayOpacity }}
        className="relative z-10 min-h-[100dvh] flex flex-col justify-between px-6 md:px-12 lg:px-20 py-8 md:py-10"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crosshair className="w-4 h-4" style={{ color: CYAN }} />
            <span className="font-mono uppercase" style={{ letterSpacing: '0.3em', fontSize: '0.6875rem', color: PAPER }}>
              EventReady AI
            </span>
          </div>
          <span className="font-mono uppercase hidden sm:block" style={{ letterSpacing: '0.24em', fontSize: '0.625rem', color: 'rgba(245,240,235,0.5)' }}>
            CIELAB · 12-Season · v2.4
          </span>
        </div>

        {/* Main block */}
        <div className="max-w-2xl">
          <Eyebrow accent={CYAN} className="mb-8">
            Measured. Not guessed.
          </Eyebrow>

          <h1
            className="font-sans leading-[0.98] tracking-[-0.03em] mb-7"
            style={{ fontSize: 'clamp(2.75rem, 7vw, 5.75rem)', fontWeight: 600, color: PAPER }}
          >
            Not a filter.
            <br />
            <span className="font-serif italic" style={{ fontWeight: 500, color: WINE }}>
              A verdict.
            </span>
          </h1>

          <p
            className="font-sans leading-relaxed mb-10 max-w-xl"
            style={{ fontSize: '1.0625rem', color: 'rgba(245,240,235,0.72)', fontWeight: 300 }}
          >
            Upload one photo. EventReady measures your skin, hair and eye colour in CIELAB,
            classifies your 12-season palette, then proves the result on your own body —
            same silhouette, best versus worst colour, side by side.
          </p>

          {/* CTAs — all three, primary dominant */}
          <div className="flex flex-col gap-3 max-w-md">
            <button
              onClick={onStart}
              data-testid="button-start-flow"
              className="group flex items-center justify-between px-7 py-5 transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: WINE, color: PAPER, boxShadow: '0 10px 30px -12px rgba(124,31,51,0.7)' }}
            >
              <span className="font-mono uppercase" style={{ letterSpacing: '0.18em', fontSize: '0.8125rem', fontWeight: 600 }}>
                Start My Styling
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onUseDemoPersona}
              data-testid="button-use-demo-persona"
              className="group flex items-center justify-between px-7 py-5 border transition-all hover:bg-white/[0.04]"
              style={{ borderColor: 'rgba(245,240,235,0.28)', color: PAPER }}
            >
              <span className="font-mono uppercase" style={{ letterSpacing: '0.16em', fontSize: '0.75rem', fontWeight: 500 }}>
                Try Demo — No photos needed
              </span>
              <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={onStartCustom}
              data-testid="button-start-custom"
              className="group text-left transition-colors pt-2"
              style={{ color: 'rgba(245,240,235,0.62)' }}
            >
              <span className="block text-sm font-light mb-1">
                Already have something in mind?
              </span>
              <span
                className="font-mono uppercase underline underline-offset-[6px] decoration-1 group-hover:decoration-2 transition-all"
                style={{ letterSpacing: '0.14em', fontSize: '0.75rem', textDecorationColor: CYAN, color: PAPER }}
              >
                Check it before you buy
              </span>
            </button>
          </div>
        </div>

        {/* Bottom instrument readout bar */}
        <div
          className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t pt-5 font-mono uppercase"
          style={{ borderColor: 'rgba(245,240,235,0.16)', letterSpacing: '0.18em', fontSize: '0.625rem', color: 'rgba(245,240,235,0.5)' }}
        >
          <span style={{ color: CYAN }}>● LIVE SCAN</span>
          <span>ΔE&nbsp;0.4</span>
          <span>SEASON&nbsp;TRUE&nbsp;AUTUMN</span>
          <span className="hidden md:inline">MATCH&nbsp;98/100</span>
          <span className="ml-auto hidden lg:inline">SCROLL TO INSPECT →</span>
        </div>
      </motion.div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  2 — CLAIM STRIP : horizontal marquee, warm neutral, light          */
/* ------------------------------------------------------------------ */

const ClaimStrip = () => {
  const prefersReducedMotion = useReducedMotion();
  const items = [
    'Colour science, not AI vibes',
    'CIELAB measurement',
    '12-season classification',
    'Same-silhouette proof',
    'A verdict, not a guess',
    'ΔE-graded compatibility',
  ];
  const row = [...items, ...items];

  return (
    <section className="overflow-hidden border-y" style={{ backgroundColor: PAPER_2, borderColor: 'rgba(24,18,16,0.1)' }}>
      <div className="flex items-center py-4">
        <motion.div
          className="flex shrink-0 items-center gap-8 pr-8"
          animate={prefersReducedMotion ? {} : { x: ['0%', '-50%'] }}
          transition={prefersReducedMotion ? {} : { duration: 26, ease: 'linear', repeat: Infinity }}
        >
          {row.map((t, i) => (
            <div key={i} className="flex items-center gap-8 shrink-0">
              <span
                className="font-mono uppercase whitespace-nowrap"
                style={{ letterSpacing: '0.22em', fontSize: '0.75rem', color: INK, fontWeight: 500 }}
              >
                {t}
              </span>
              <span className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: WINE }} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  3 — PROCESS : asymmetric bento, MEASURE dominates, DARK            */
/* ------------------------------------------------------------------ */

const Process = () => {
  const steps = [
    { n: '01', key: 'MEASURE', title: 'Skin · hair · eye extraction', body: 'CIELAB values pulled from a single photo, lighting artifacts factored out. Empirical data — not an opinion.', Icon: ScanLine },
    { n: '02', key: 'INTERPRET', title: '12-season classification', body: 'Your metrics mapped against established seasonal colour theory to find the one palette that sharpens your contrast.', Icon: Gauge },
    { n: '03', key: 'COMPARE', title: 'Garment evaluation', body: 'Every candidate colour graded by ΔE distance from your palette. A score, not a hunch.', Icon: Crosshair },
    { n: '04', key: 'VERDICT', title: 'Proof shot + verdict', body: 'The same silhouette rendered in best vs worst palette colour. You see the evidence before you decide.', Icon: Check },
  ];
  const DominantIcon = steps[0].Icon;

  return (
    <section className="relative" style={{ backgroundColor: INK, color: PAPER }}>
      <div className="px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <Eyebrow accent={CYAN} className="mb-6">
              The Methodology
            </Eyebrow>
            <h2
              className="font-sans leading-[0.98] tracking-[-0.03em] max-w-xl"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', fontWeight: 600 }}
            >
              Four stages. No stage is a guess.
            </h2>
          </div>
          <p className="font-sans font-light max-w-sm" style={{ fontSize: '0.9375rem', color: 'rgba(245,240,235,0.6)' }}>
            Each stage hands the next a measurement, not a mood. The pipeline is auditable end to end.
          </p>
        </div>

        {/* Asymmetric grid: MEASURE dominates the left, three stack on the right */}
        <div className="grid lg:grid-cols-12 gap-px" style={{ backgroundColor: 'rgba(245,240,235,0.12)' }}>
          {/* Dominant cell */}
          <div className="lg:col-span-7 relative overflow-hidden p-8 md:p-12 lg:p-14 min-h-[360px] lg:min-h-[520px] flex flex-col justify-between" style={{ backgroundColor: INK }}>
            <div className="absolute inset-0 opacity-30">
              <img src={DEMO_PERSONA_FULL_BODY_URL} alt="" className="w-full h-full object-cover object-[center_20%] grayscale-[35%]" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(24,18,16,0.85), rgba(24,18,16,0.35))' }} />
            </div>
            <div className="relative flex items-center justify-between">
              <span className="font-mono" style={{ fontSize: '0.6875rem', letterSpacing: '0.28em', color: CYAN }}>{steps[0].key}</span>
              <span className="font-sans" style={{ fontSize: '3.5rem', fontWeight: 300, color: 'rgba(245,240,235,0.18)', lineHeight: 1 }}>{steps[0].n}</span>
            </div>
            <div className="relative">
              <DominantIcon className="w-6 h-6 mb-5" style={{ color: CYAN }} />
              <h3 className="font-sans mb-4" style={{ fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 600, letterSpacing: '-0.02em' }}>{steps[0].title}</h3>
              <p className="font-sans font-light max-w-md leading-relaxed" style={{ fontSize: '1rem', color: 'rgba(245,240,235,0.7)' }}>{steps[0].body}</p>
            </div>
          </div>

          {/* Stacked cells */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-px" style={{ backgroundColor: 'rgba(245,240,235,0.12)' }}>
            {steps.slice(1).map((s) => {
              const Icon = s.Icon;
              return (
              <div key={s.n} className="relative p-7 md:p-9 flex flex-col justify-between min-h-[150px] lg:min-h-[170px]" style={{ backgroundColor: INK }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono" style={{ fontSize: '0.6875rem', letterSpacing: '0.28em', color: CYAN }}>{s.key}</span>
                  <span className="font-sans" style={{ fontSize: '1.75rem', fontWeight: 300, color: 'rgba(245,240,235,0.18)', lineHeight: 1 }}>{s.n}</span>
                </div>
                <div>
                  <Icon className="w-5 h-5 mb-3" style={{ color: CYAN }} />
                  <h3 className="font-sans mb-2" style={{ fontSize: '1.1875rem', fontWeight: 600, letterSpacing: '-0.01em' }}>{s.title}</h3>
                  <p className="font-sans font-light leading-relaxed" style={{ fontSize: '0.875rem', color: 'rgba(245,240,235,0.62)' }}>{s.body}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  4 — MEASUREMENT : instrument readouts, split, LIGHT neutral        */
/* ------------------------------------------------------------------ */

const Measurement = () => {
  const reads = [
    { label: 'SKIN', metric: 'L* 79.4 / a* 18.2', hex: '#E6B99E' },
    { label: 'HAIR', metric: 'L* 31.6 / a* 12.0', hex: '#4A3B32' },
    { label: 'EYE', metric: 'L* 38.1 / a* 14.7', hex: '#5C4D3C' },
  ];

  return (
    <section className="relative" style={{ backgroundColor: PAPER }}>
      <div className="grid lg:grid-cols-2">
        {/* Visual side (left on desktop) */}
        <div className="relative min-h-[60vh] lg:min-h-[760px] overflow-hidden order-2 lg:order-1" style={{ backgroundColor: PAPER_2 }}>
          <img src={DEMO_PERSONA_FULL_BODY_URL} alt="Measurement subject" className="absolute inset-0 w-full h-full object-cover object-[center_22%]" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(245,240,235,0) 55%, rgba(245,240,235,0.85) 100%)' }} />
          {/* reticles on the visual */}
          <Reticle top="26%" left="42%" label="SKIN" value="#E6B99E" align="bottom" />
          <Reticle top="12%" left="50%" label="HAIR" value="#4A3B32" />
          <Reticle top="38%" left="58%" label="EYE" value="#5C4D3C" align="bottom" />
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between font-mono uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.22em', color: INK }}>
            <span style={{ color: CYAN_DIM }}>● CAPTURE OK</span>
            <span>ΔE 0.4 · 95% CONF</span>
          </div>
        </div>

        {/* Instrument panel side (right) */}
        <div className="order-1 lg:order-2 px-6 md:px-12 lg:px-16 py-20 lg:py-24 flex flex-col justify-center" style={{ backgroundColor: PAPER }}>
          <Eyebrow accent={WINE} className="mb-6">
            Measured from your photo
          </Eyebrow>
          <h2 className="font-sans leading-[1.02] tracking-[-0.03em] mb-6" style={{ fontSize: 'clamp(1.875rem,3.5vw,2.75rem)', fontWeight: 600 }}>
            What the sensor returns.
          </h2>
          <p className="font-sans font-light leading-relaxed mb-10 max-w-md" style={{ fontSize: '1rem', color: 'rgba(24,18,16,0.66)' }}>
            Three channels, three exact hex values, factored out of lighting bias. This is empirical
            data — the raw input everything else is built on.
          </p>

          {/* Readouts */}
          <div className="border" style={{ borderColor: 'rgba(24,18,16,0.14)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b font-mono uppercase" style={{ borderColor: 'rgba(24,18,16,0.14)', backgroundColor: INK, color: PAPER, fontSize: '0.625rem', letterSpacing: '0.24em' }}>
              <span style={{ color: CYAN }}>● INSTRUMENT OUTPUT</span>
              <span style={{ opacity: 0.6 }}>CH 03</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(24,18,16,0.12)' }}>
              {reads.map((r) => (
                <div key={r.label} className="flex items-center justify-between px-4 py-5" style={{ borderBottom: '1px solid rgba(24,18,16,0.12)' }}>
                  <div className="flex items-center gap-4">
                    <span className="w-7 h-7 border" style={{ backgroundColor: r.hex, borderColor: 'rgba(24,18,16,0.2)' }} />
                    <div>
                      <div className="font-mono uppercase" style={{ fontSize: '0.6875rem', letterSpacing: '0.24em', color: 'rgba(24,18,16,0.5)' }}>{r.label}</div>
                      <div className="font-mono" style={{ fontSize: '0.75rem', color: INK }}>{r.metric}</div>
                    </div>
                  </div>
                  <span className="font-mono" style={{ fontSize: '1rem', color: CYAN_DIM, fontWeight: 600 }}>{r.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Procedural transition → classification */}
          <div className="flex items-center gap-4 my-8">
            <span className="h-px flex-1" style={{ backgroundColor: 'rgba(24,18,16,0.18)' }} />
            <ArrowRight className="w-4 h-4" style={{ color: WINE }} />
            <span className="font-mono uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', color: 'rgba(24,18,16,0.5)' }}>INTERPRET</span>
            <span className="h-px flex-1" style={{ backgroundColor: 'rgba(24,18,16,0.18)' }} />
          </div>

          {/* Classification result */}
          <div className="flex items-stretch border" style={{ borderColor: 'rgba(24,18,16,0.14)' }}>
            <div className="px-5 py-6 flex flex-col justify-center" style={{ backgroundColor: WINE, color: PAPER }}>
              <span className="font-mono uppercase mb-1" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', opacity: 0.7 }}>Classification</span>
              <span className="font-sans" style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em' }}>True Autumn</span>
            </div>
            <div className="flex-1 px-5 py-6 flex flex-col justify-center" style={{ backgroundColor: PAPER }}>
              <span className="font-mono uppercase mb-1" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', color: 'rgba(24,18,16,0.5)' }}>Your Palette</span>
              <span className="font-sans font-light" style={{ fontSize: '0.9375rem', color: 'rgba(24,18,16,0.72)' }}>
                The interpretation of the measurement — not the measurement itself.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  5 — PALETTE ANATOMY : asymmetric swatch grid, warm neutral          */
/* ------------------------------------------------------------------ */

const PaletteAnatomy = () => {
  return (
    <section className="relative" style={{ backgroundColor: PAPER_2 }}>
      <div className="px-6 md:px-12 lg:px-20 py-24 md:py-28">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
          <div className="max-w-xl">
            <Eyebrow accent={WINE} className="mb-5">
              Anatomy of a Palette
            </Eyebrow>
            <h2 className="font-sans leading-[1.0] tracking-[-0.03em] mb-5" style={{ fontSize: 'clamp(2rem,4.5vw,3.25rem)', fontWeight: 600 }}>
              True Autumn
            </h2>
            <p className="font-sans font-light leading-relaxed" style={{ fontSize: '1rem', color: 'rgba(24,18,16,0.66)' }}>
              A balanced ecosystem of hue, value and chroma. Wear these and the face reads in focus —
              not the dress.
            </p>
          </div>
          <div className="font-mono uppercase border-b pb-2" style={{ borderColor: 'rgba(24,18,16,0.2)', fontSize: '0.6875rem', letterSpacing: '0.22em', color: 'rgba(24,18,16,0.55)' }}>
            8 of 32 base shades
          </div>
        </div>

        {/* Asymmetric grid: first swatch dominates */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">
          {/* Dominant swatch */}
          <div className="col-span-2 md:col-span-6 md:row-span-2 group">
            <div className="relative h-64 md:h-[440px] border transition-transform duration-500 group-hover:-translate-y-1" style={{ backgroundColor: TRUE_AUTUMN[0].hex, borderColor: 'rgba(24,18,16,0.16)' }}>
              <div className="absolute left-5 top-5 font-mono uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', color: 'rgba(255,255,255,0.7)' }}>PRIMARY</div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-sans" style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{TRUE_AUTUMN[0].name}</span>
              <span className="font-mono uppercase" style={{ fontSize: '0.6875rem', color: 'rgba(24,18,16,0.5)' }}>{TRUE_AUTUMN[0].hex}</span>
            </div>
          </div>

          {/* Remaining swatches */}
          {TRUE_AUTUMN.slice(1).map((s) => (
            <div key={s.hex} className="md:col-span-3 group">
              <div className="relative h-28 md:h-32 border transition-transform duration-500 group-hover:-translate-y-1" style={{ backgroundColor: s.hex, borderColor: 'rgba(24,18,16,0.16)' }} />
              <div className="mt-2 flex flex-col">
                <span className="font-sans" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{s.name}</span>
                <span className="font-mono uppercase" style={{ fontSize: '0.625rem', color: 'rgba(24,18,16,0.5)' }}>{s.hex}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  6 — PROOF : edge-to-edge, vertical divider, DARK                   */
/* ------------------------------------------------------------------ */

const Proof = () => {
  return (
    <section className="relative" style={{ backgroundColor: INK, color: PAPER }}>
      {/* Header */}
      <div className="px-6 md:px-12 lg:px-20 pt-24 md:pt-32 pb-12 md:pb-16 text-center">
        <Eyebrow accent={CYAN} className="mb-7 justify-center" >
          Evidence
        </Eyebrow>
        <h2 className="font-sans leading-[0.98] tracking-[-0.03em] mb-6" style={{ fontSize: 'clamp(2.25rem,6vw,4.75rem)', fontWeight: 600 }}>
          Same silhouette. <span className="font-serif italic" style={{ fontWeight: 500, color: WINE }}>Two colours.</span> One verdict.
        </h2>
        <p className="font-sans font-light max-w-2xl mx-auto leading-relaxed" style={{ fontSize: '1.0625rem', color: 'rgba(245,240,235,0.66)' }}>
          The identical garment projected in your worst and best palette shades. This is product
          proof, not a decorative comparison — the visual evidence is the whole argument.
        </p>
      </div>

      {/* Edge-to-edge comparison */}
      <div className="relative grid grid-cols-1 md:grid-cols-2">
        {/* WRONG — cool/muted cast */}
        <div className="relative h-[70vh] md:h-[88vh] overflow-hidden group">
          <img src={DEMO_PERSONA_FULL_BODY_URL} alt="Wrong palette colour" className="absolute inset-0 w-full h-full object-cover object-[center_18%] grayscale-[60%] transition-transform duration-[1200ms] group-hover:scale-105 origin-top" />
          <div className="absolute inset-0 mix-blend-multiply" style={{ backgroundColor: '#2E4A63', opacity: 0.55 }} />
          <div className="absolute inset-0 mix-blend-color" style={{ backgroundColor: '#3B6E8C', opacity: 0.25 }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(24,18,16,0) 45%, rgba(24,18,16,0.85) 100%)' }} />
          <div className="absolute top-5 left-5 font-mono uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', color: 'rgba(245,240,235,0.6)' }}>
            A · COOL SUMMER SHADE
          </div>
          {/* Verdict card */}
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
            <div className="border p-5 md:p-6" style={{ borderColor: 'rgba(245,240,235,0.18)', backgroundColor: 'rgba(24,18,16,0.55)', backdropFilter: 'blur(6px)' }}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: 'rgba(245,240,235,0.18)' }}>
                <span className="font-mono uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.2em', color: 'rgba(245,240,235,0.6)' }}>ΔE 41.6 · OFF-PALETTE</span>
                <span className="font-mono uppercase" style={{ fontSize: '0.6875rem', letterSpacing: '0.18em', color: '#E0556A', fontWeight: 600 }}>SCORE 32 / 100</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <X className="w-4 h-4" style={{ color: '#E0556A' }} />
                <h3 className="font-sans" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Verdict — Avoid</h3>
              </div>
              <p className="font-sans font-light" style={{ fontSize: '0.875rem', color: 'rgba(245,240,235,0.68)' }}>
                Cool cast washes out warm undertones; fabric fights the skin instead of flattering it.
              </p>
            </div>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px z-20" style={{ backgroundColor: 'rgba(245,240,235,0.25)' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 border flex items-center justify-center" style={{ backgroundColor: INK, borderColor: 'rgba(245,240,235,0.3)' }}>
            <span className="font-mono" style={{ fontSize: '0.5625rem', letterSpacing: '0.18em', color: CYAN }}>VS</span>
          </div>
        </div>

        {/* RIGHT — natural warm / correct palette */}
        <div className="relative h-[70vh] md:h-[88vh] overflow-hidden group">
          <img src={DEMO_PERSONA_FULL_BODY_URL} alt="Correct palette colour" className="absolute inset-0 w-full h-full object-cover object-[center_18%] transition-transform duration-[1200ms] group-hover:scale-105 origin-top" />
          <div className="absolute inset-0 mix-blend-soft-light" style={{ backgroundColor: '#B85B42', opacity: 0.4 }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(24,18,16,0) 45%, rgba(24,18,16,0.8) 100%)' }} />
          <div className="absolute top-5 right-5 font-mono uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', color: 'rgba(245,240,235,0.6)' }}>
            B · TRUE AUTUMN SHADE
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
            <div className="border p-5 md:p-6" style={{ borderColor: 'rgba(31,200,214,0.35)', backgroundColor: 'rgba(24,18,16,0.55)', backdropFilter: 'blur(6px)' }}>
              <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: 'rgba(245,240,235,0.18)' }}>
                <span className="font-mono uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.2em', color: 'rgba(245,240,235,0.6)' }}>ΔE 1.2 · ON-PALETTE</span>
                <span className="font-mono uppercase" style={{ fontSize: '0.6875rem', letterSpacing: '0.18em', color: CYAN, fontWeight: 600 }}>SCORE 98 / 100</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4" style={{ color: CYAN }} />
                <h3 className="font-sans" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Verdict — Flawless</h3>
              </div>
              <p className="font-sans font-light" style={{ fontSize: '0.875rem', color: 'rgba(245,240,235,0.68)' }}>
                Warm hue harmonizes with natural contrast; skin reads clearer, the garment recedes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  7 — TRUST / REFUSAL : light, open whitespace, centered             */
/* ------------------------------------------------------------------ */

const Trust = () => {
  return (
    <section className="relative" style={{ backgroundColor: PAPER }}>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(24,18,16,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(24,18,16,0.04) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="relative px-6 md:px-12 py-32 md:py-44 max-w-3xl mx-auto text-center">
        <div className="w-16 h-16 mx-auto border flex items-center justify-center mb-10" style={{ borderColor: 'rgba(24,18,16,0.16)', backgroundColor: PAPER_2 }}>
          <ShieldCheck className="w-7 h-7" style={{ color: WINE, strokeWidth: 1.5 }} />
        </div>
        <Eyebrow accent={CYAN} className="mb-8 justify-center">
          The Refusal Principle
        </Eyebrow>
        <h2 className="font-sans leading-[1.02] tracking-[-0.03em] mb-10" style={{ fontSize: 'clamp(2rem,4.5vw,3.5rem)', fontWeight: 600 }}>
          A refusal to guess is a feature, not a flaw.
        </h2>
        <span className="block w-16 h-px mx-auto mb-10" style={{ backgroundColor: 'rgba(24,18,16,0.25)' }} />
        <p className="font-sans font-light leading-relaxed max-w-2xl mx-auto" style={{ fontSize: '1.1875rem', color: 'rgba(24,18,16,0.7)' }}>
          EventReady does not invent a colour answer when a photo cannot be measured reliably.
          If measurement fails, we say so. Most tools hide this.
          <span className="font-sans" style={{ fontWeight: 600, color: INK }}> We don&apos;t.</span>
        </p>

        {/* contrast row vs outfit generators */}
        <div className="grid sm:grid-cols-2 gap-px mt-16 text-left border" style={{ backgroundColor: 'rgba(24,18,16,0.12)', borderColor: 'rgba(24,18,16,0.12)' }}>
          <div className="p-7 md:p-9" style={{ backgroundColor: PAPER }}>
            <span className="font-mono uppercase block mb-3" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', color: 'rgba(24,18,16,0.45)' }}>OUTFIT GENERATORS</span>
            <p className="font-sans font-light leading-relaxed" style={{ fontSize: '0.9375rem', color: 'rgba(24,18,16,0.7)' }}>
              Tag-matched suggestions. Trend feeds. &ldquo;AI vibes.&rdquo; No measurement, no proof,
              no accountability when it looks wrong on you.
            </p>
          </div>
          <div className="p-7 md:p-9" style={{ backgroundColor: PAPER }}>
            <span className="font-mono uppercase block mb-3" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', color: WINE }}>EVENTREADY AI</span>
            <p className="font-sans font-light leading-relaxed" style={{ fontSize: '0.9375rem', color: 'rgba(24,18,16,0.7)' }}>
              CIELAB measurement, 12-season classification, ΔE-graded scoring, and a same-silhouette
              proof shot. If it can&apos;t measure, it refuses — visibly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  8 — FINAL CTA : clean centered conversion, warm neutral            */
/* ------------------------------------------------------------------ */

const FinalCTA = ({ onStart, onUseDemoPersona, onStartCustom }: StartScreenProps) => {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: PAPER_2 }}>
      {/* subtle corner instrument marks */}
      <div className="absolute top-8 left-8 font-mono uppercase hidden md:block" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', color: 'rgba(24,18,16,0.35)' }}>
        ◢ READY
      </div>
      <div className="absolute top-8 right-8 font-mono uppercase hidden md:block" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', color: 'rgba(24,18,16,0.35)' }}>
        READY ◣
      </div>

      <div className="px-6 md:px-12 py-28 md:py-40 max-w-3xl mx-auto text-center">
        <Eyebrow accent={CYAN} className="mb-8 justify-center">
          Three ways to begin
        </Eyebrow>
        <h2 className="font-sans leading-[0.98] tracking-[-0.03em] mb-5" style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', fontWeight: 600 }}>
          Find out what actually suits you.
        </h2>
        <p className="font-sans font-light leading-relaxed mb-14 max-w-xl mx-auto" style={{ fontSize: '1.0625rem', color: 'rgba(24,18,16,0.66)' }}>
          One photo. A measured verdict. The proof on your own body. No filter, no guesswork.
        </p>

        {/* Primary + secondary */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-center mb-10 max-w-2xl mx-auto">
          <button
            onClick={onStart}
            data-testid="button-start-flow-final"
            className="group flex-1 flex items-center justify-between px-8 py-6 transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: WINE, color: PAPER, boxShadow: '0 14px 36px -14px rgba(124,31,51,0.65)' }}
          >
            <span className="font-mono uppercase" style={{ letterSpacing: '0.16em', fontSize: '0.8125rem', fontWeight: 600 }}>
              Start My Styling
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onUseDemoPersona}
            data-testid="button-use-demo-persona-final"
            className="group flex-1 flex items-center justify-center gap-3 px-8 py-6 border transition-all hover:bg-white/40"
            style={{ borderColor: 'rgba(24,18,16,0.22)', color: INK }}
          >
            <span className="font-mono uppercase" style={{ letterSpacing: '0.14em', fontSize: '0.75rem', fontWeight: 500 }}>
              Try Demo — No photos needed
            </span>
          </button>
        </div>

        {/* Tertiary */}
        <div className="flex items-center justify-center max-w-md mx-auto mb-10">
          <span className="h-px flex-1" style={{ backgroundColor: 'rgba(24,18,16,0.18)' }} />
          <span className="px-5 font-mono uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.24em', color: 'rgba(24,18,16,0.4)' }}>Or</span>
          <span className="h-px flex-1" style={{ backgroundColor: 'rgba(24,18,16,0.18)' }} />
        </div>

        <button
          onClick={onStartCustom}
          data-testid="button-start-custom-final"
          className="group inline-flex flex-col items-center text-center"
        >
          <span className="font-sans mb-2 transition-colors group-hover:text-[#7C1F33]" style={{ fontSize: '1.1875rem', color: INK }}>
            Already have something in mind?
          </span>
          <span
            className="font-mono uppercase underline underline-offset-[7px] decoration-1 group-hover:decoration-2 transition-all"
            style={{ letterSpacing: '0.14em', fontSize: '0.75rem', textDecorationColor: CYAN_DIM, color: 'rgba(24,18,16,0.7)' }}
          >
            Check it before you buy
          </span>
        </button>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/*  9 — FOOTER : near-black, instrument sign-off                       */
/* ------------------------------------------------------------------ */

const Footer = () => (
  <footer className="px-6 md:px-12 py-12" style={{ backgroundColor: INK, color: PAPER }}>
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div className="flex items-center gap-3">
        <Crosshair className="w-4 h-4" style={{ color: CYAN }} />
        <span className="font-mono uppercase" style={{ letterSpacing: '0.28em', fontSize: '0.75rem', fontWeight: 600 }}>
          EventReady AI
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono uppercase" style={{ fontSize: '0.625rem', letterSpacing: '0.2em', color: 'rgba(245,240,235,0.45)' }}>
        <span>Not a filter. A verdict.</span>
        <span className="hidden md:inline">·</span>
        <span>CIELAB · 12-Season</span>
        <span className="hidden md:inline">·</span>
        <span>&copy; {new Date().getFullYear()} EventReady AI</span>
      </div>
    </div>
  </footer>
);

export default StartScreen;
