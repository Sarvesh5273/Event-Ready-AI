import React, { useRef } from 'react';
import type { StartScreenProps } from '@/types/screen-props';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Ruler, Sparkles, Check, ShieldCheck } from 'lucide-react';
import { DEMO_PERSONA_FULL_BODY_URL } from '@/lib/demoAssets';

export function StartScreen(props: StartScreenProps) {
  return (
    <div className="flex flex-col bg-background font-sans">
      <Hero {...props} />
      <Statement />
      <Process />
      <MeasurementDistinction />
      <PaletteExample />
      <Proof />
      <Trust />
      <FinalCTA {...props} />
      <Footer />
    </div>
  );
}

const Hero = ({ onStart, onUseDemoPersona, onStartCustom }: StartScreenProps) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const prefersReducedMotion = useReducedMotion();

  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  return (
    <section ref={ref} className="relative min-h-[100dvh] flex flex-col lg:flex-row overflow-hidden bg-background border-b border-border">
      
      {/* Left Content */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center px-6 md:px-16 lg:px-24 py-24 relative z-20 bg-background">
        <motion.div style={prefersReducedMotion ? {} : { opacity }} className="max-w-xl mx-auto lg:mx-0">
          <div className="flex items-center gap-3 mb-10">
            <span className="h-px w-8 bg-primary"></span>
            <span className="uppercase tracking-widest text-xs font-semibold text-primary">Measured. Not guessed.</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif text-foreground leading-[1.05] tracking-tight mb-8">
            Not a filter. <br />
            <span className="italic text-primary">A verdict.</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 mb-12 font-light leading-relaxed max-w-lg">
            Upload one photo. EventReady measures your skin, hair and eye colour, finds the shades that genuinely suit you, and shows you the difference on your own body.
          </p>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 mb-8">
            <button
              onClick={onStart}
              data-testid="button-start-flow"
              className="bg-primary text-primary-foreground px-8 py-5 text-sm uppercase tracking-widest font-semibold hover:bg-primary/90 transition-colors flex items-center justify-between group w-full lg:w-auto shadow-lg flex-1"
            >
              <span>Start My Styling</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onUseDemoPersona}
              data-testid="button-use-demo-persona"
              className="border border-border bg-transparent text-foreground px-8 py-5 text-sm uppercase tracking-widest font-semibold hover:bg-secondary transition-colors flex items-center justify-center w-full lg:w-auto shadow-sm flex-1 text-center whitespace-nowrap"
            >
              Try Demo — No photos needed
            </button>
          </div>
          
          <button
            onClick={onStartCustom}
            data-testid="button-start-custom"
            className="text-sm text-foreground/60 hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-all block w-full text-center lg:text-left"
          >
            Already have something in mind? Check it before you buy
          </button>
        </motion.div>
      </div>

      {/* Right Image */}
      <div className="w-full lg:w-[45%] h-[60vh] lg:h-screen relative overflow-hidden bg-secondary border-t lg:border-t-0 lg:border-l border-border">
        <motion.div
          style={prefersReducedMotion ? {} : { y: y1, scale }}
          className="absolute inset-0 origin-top"
        >
          <img
            src={DEMO_PERSONA_FULL_BODY_URL}
            alt="Demo Persona"
            className="w-full h-full object-cover object-top opacity-90 grayscale-[20%]"
          />
          {/* Overlay gradient to add mood */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent mix-blend-multiply" />
          
          {/* Visual treatments: subtle measurement lines overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none mix-blend-overlay" />
          
          {/* Reticle / Measurement UI placeholder */}
          <div className="absolute top-1/3 left-[20%] lg:left-1/4 w-12 h-12 border border-white/50 rounded-full flex items-center justify-center pointer-events-none shadow-2xl">
             <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
             <div className="absolute top-0 -translate-y-full left-1/2 -translate-x-1/2 text-[10px] font-mono text-white bg-black/50 px-2 py-1 mt-1 backdrop-blur-md border border-white/20 uppercase tracking-widest whitespace-nowrap">
               SKIN_VAL: #E6B99E
             </div>
          </div>
          
          <div className="absolute bottom-1/4 right-[20%] lg:right-1/4 w-12 h-12 border border-white/50 rounded-full flex items-center justify-center pointer-events-none shadow-2xl">
             <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
             <div className="absolute bottom-0 translate-y-full left-1/2 -translate-x-1/2 text-[10px] font-mono text-white bg-black/50 px-2 py-1 mb-1 backdrop-blur-md border border-white/20 uppercase tracking-widest whitespace-nowrap">
               CLOTH_VAL: #B85B42
             </div>
          </div>
          
        </motion.div>
      </div>
    </section>
  );
};

const Statement = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const prefersReducedMotion = useReducedMotion();
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section className="py-40 md:py-56 bg-primary relative overflow-hidden flex items-center justify-center border-b border-primary-border">
       {/* Background decorative text */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center opacity-[0.03] pointer-events-none">
          <span className="text-[25vw] font-serif leading-none whitespace-nowrap text-primary-foreground">SCIENCE</span>
       </div>
       
       <motion.div 
         ref={ref}
         style={prefersReducedMotion ? {} : { y }}
         className="container mx-auto px-6 max-w-5xl text-center relative z-10"
       >
        <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif leading-[1.15] text-primary-foreground">
          Other tools guess based on AI vibes. <br className="hidden md:block" />
          <span className="italic text-secondary/80">We measure based on colour science.</span>
        </h2>
      </motion.div>
    </section>
  );
};

const Process = () => {
  return (
    <section className="py-32 bg-background border-b border-border">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="mb-20 text-center max-w-2xl mx-auto">
          <h2 className="text-xs uppercase tracking-widest text-primary font-semibold mb-6">The Methodology</h2>
          <h3 className="text-4xl md:text-5xl font-serif text-foreground leading-tight">
            A sequence of absolute precision
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-border border border-border shadow-sm">
          {/* Step 1 */}
          <div className="bg-background p-10 md:p-16 relative group transition-colors hover:bg-secondary/10">
            <div className="text-6xl font-serif text-border absolute top-8 right-8 pointer-events-none transition-colors group-hover:text-primary/10">01</div>
            <h4 className="text-2xl font-serif text-foreground mb-4 relative z-10">Skin & hair analysis</h4>
            <p className="text-foreground/70 font-light relative z-10 max-w-sm leading-relaxed">
              Precision extraction of your intrinsic undertones and contrast levels from a single photo.
            </p>
          </div>
          {/* Step 2 */}
          <div className="bg-secondary/30 p-10 md:p-16 relative group transition-colors hover:bg-secondary/50">
            <div className="text-6xl font-serif text-border absolute top-8 right-8 pointer-events-none transition-colors group-hover:text-primary/10">02</div>
            <h4 className="text-2xl font-serif text-foreground mb-4 relative z-10">Colour palette classification</h4>
            <p className="text-foreground/70 font-light relative z-10 max-w-sm leading-relaxed">
              Mapping your unique metrics to one of 12 scientifically defined seasonal palettes.
            </p>
          </div>
          {/* Step 3 */}
          <div className="bg-background p-10 md:p-16 relative group transition-colors hover:bg-secondary/10">
            <div className="text-6xl font-serif text-border absolute top-8 right-8 pointer-events-none transition-colors group-hover:text-primary/10">03</div>
            <h4 className="text-2xl font-serif text-foreground mb-4 relative z-10">Outfit shortlisting</h4>
            <p className="text-foreground/70 font-light relative z-10 max-w-sm leading-relaxed">
              Curating high-end pieces where the fabric colour perfectly matches your verified palette.
            </p>
          </div>
          {/* Step 4 */}
          <div className="bg-background p-10 md:p-16 relative group overflow-hidden transition-colors hover:bg-secondary/10">
            <div className="absolute inset-0 opacity-5 grayscale group-hover:opacity-10 transition-opacity pointer-events-none mix-blend-multiply">
              <img src={DEMO_PERSONA_FULL_BODY_URL} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="text-6xl font-serif text-border absolute top-8 right-8 pointer-events-none transition-colors group-hover:text-primary/10">04</div>
            <h4 className="text-2xl font-serif text-foreground mb-4 relative z-10">Virtual try-on + scoring</h4>
            <p className="text-foreground/70 font-light relative z-10 max-w-sm leading-relaxed">
              Seeing the garment on your own body, backed by an objective, calculated compatibility score.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const MeasurementDistinction = () => {
  return (
    <section className="py-32 bg-secondary/20 border-b border-border">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          <div className="space-y-16">
            <div>
              <div className="flex items-center gap-5 mb-6">
                <div className="w-12 h-12 border border-border bg-background flex items-center justify-center shrink-0 shadow-sm">
                  <Ruler className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-3xl font-serif">Measured from your photo</h3>
              </div>
              <p className="text-lg text-foreground/70 font-light leading-relaxed pl-[68px]">
                What the sensor returns. We extract the exact hex values of your skin, hair, and eyes, factoring out lighting artifacts. It is empirical data—not an opinion.
              </p>
            </div>
            
            <div className="w-px h-16 bg-border ml-[23px]"></div>

            <div>
              <div className="flex items-center gap-5 mb-6">
                <div className="w-12 h-12 border border-border bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-serif">Your Palette</h3>
              </div>
              <p className="text-lg text-foreground/70 font-light leading-relaxed pl-[68px]">
                What the classification produces. We interpret your measurements against established colour science to determine the precise seasonal palette that elevates your natural contrast.
              </p>
            </div>
          </div>

          <div className="relative aspect-square max-h-[600px] lg:aspect-auto lg:h-[650px] bg-background border border-border flex items-center justify-center p-8 shadow-sm">
             {/* Diagonal lines pattern background */}
             <div className="absolute inset-0 bg-[linear-gradient(45deg,var(--color-border)_25%,transparent_25%,transparent_50%,var(--color-border)_50%,var(--color-border)_75%,transparent_75%,transparent)] bg-[size:4px_4px] opacity-[0.15] pointer-events-none" />
             
             <div className="w-full max-w-md space-y-6 relative z-10">
                <div className="bg-background border border-border p-6 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-transform group">
                   <div className="font-mono text-xs uppercase tracking-widest text-foreground/50 group-hover:text-primary transition-colors">Skin Metric</div>
                   <div className="flex items-center gap-4">
                     <div className="w-6 h-6 rounded-none bg-[#E6B99E] border border-border shadow-inner"></div>
                     <span className="font-mono text-sm">#E6B99E</span>
                   </div>
                </div>
                <div className="bg-background border border-border p-6 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-transform group">
                   <div className="font-mono text-xs uppercase tracking-widest text-foreground/50 group-hover:text-primary transition-colors">Hair Metric</div>
                   <div className="flex items-center gap-4">
                     <div className="w-6 h-6 rounded-none bg-[#4A3B32] border border-border shadow-inner"></div>
                     <span className="font-mono text-sm">#4A3B32</span>
                   </div>
                </div>
                <div className="bg-background border border-border p-6 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-transform group">
                   <div className="font-mono text-xs uppercase tracking-widest text-foreground/50 group-hover:text-primary transition-colors">Eye Metric</div>
                   <div className="flex items-center gap-4">
                     <div className="w-6 h-6 rounded-none bg-[#5C4D3C] border border-border shadow-inner"></div>
                     <span className="font-mono text-sm">#5C4D3C</span>
                   </div>
                </div>
                
                <div className="pt-8 border-t border-border mt-8 flex justify-center relative">
                  <div className="w-px h-8 bg-border mb-8 absolute -top-8"></div>
                </div>

                <div className="bg-primary text-primary-foreground p-8 shadow-xl flex flex-col items-center justify-center text-center">
                  <div className="font-mono text-xs uppercase tracking-widest text-primary-foreground/70 mb-2">Classification Result</div>
                  <div className="font-serif text-3xl">True Autumn</div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const PaletteExample = () => {
  const swatches = [
    { name: "Warm Terracotta", hex: "#C96A52" },
    { name: "Deep Rust", hex: "#9C3D26" },
    { name: "Olive", hex: "#5E6135" },
    { name: "Golden Amber", hex: "#D99C38" },
    { name: "Burnt Sienna", hex: "#B85B42" },
    { name: "Dark Chocolate", hex: "#3A231C" },
    { name: "Forest Green", hex: "#2A4B36" },
    { name: "Mustard", hex: "#C79F3F" },
  ];

  return (
    <section className="py-32 bg-background border-b border-border overflow-hidden">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-12 items-end justify-between mb-16">
          <div className="max-w-xl">
            <h3 className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">Anatomy of a Palette</h3>
            <h2 className="text-4xl md:text-5xl font-serif mb-6 text-foreground">True Autumn</h2>
            <p className="text-foreground/70 font-light leading-relaxed">
              Every palette is a carefully balanced ecosystem of hues, values, and chromas. When you wear these colours, you don't just look good—you look in focus.
            </p>
          </div>
          <div className="text-left md:text-right">
            <span className="font-mono text-xs uppercase tracking-widest text-foreground/50 border-b border-border pb-2 inline-block">
              8 of 32 Base Shades
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {swatches.map((swatch, i) => (
            <div key={i} className="group cursor-default">
              <div 
                className="aspect-[4/3] w-full mb-4 border border-border shadow-sm transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-md"
                style={{ backgroundColor: swatch.hex }}
              />
              <div className="flex flex-col gap-1 border-l-2 border-primary/20 pl-3">
                <span className="font-medium text-sm text-foreground">{swatch.name}</span>
                <span className="font-mono text-[11px] text-foreground/50 uppercase">{swatch.hex}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Proof = () => {
  return (
    <section className="py-32 md:py-48 bg-primary text-primary-foreground border-b border-border overflow-hidden relative">
      {/* Background large typography */}
      <div className="absolute -left-[10%] top-[30%] -rotate-90 origin-center text-[15vw] font-serif opacity-[0.03] pointer-events-none whitespace-nowrap leading-none select-none">
        EVIDENCE
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center mb-20 md:mb-32">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif mb-8 leading-tight">
            Same silhouette. <br className="hidden sm:block"/>
            <span className="italic text-secondary/70">Two colours.</span> One verdict.
          </h2>
          <p className="text-primary-foreground/70 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
            We show you exactly why a colour works or fails. By projecting the identical garment in both your best and worst palette shades, the visual evidence is undeniable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-primary-foreground/10 border border-primary-foreground/10 mx-auto max-w-5xl shadow-2xl">
          
          {/* Bad Proof */}
          <div className="relative aspect-[3/4] bg-primary group overflow-hidden">
            <img src={DEMO_PERSONA_FULL_BODY_URL} alt="Bad Color Fit" className="absolute inset-0 w-full h-full object-cover object-top grayscale transition-transform duration-1000 group-hover:scale-105 origin-top" />
            <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <div className="bg-background/10 backdrop-blur-md border border-primary-foreground/20 p-6 shadow-lg group-hover:-translate-y-1 transition-transform duration-500">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-primary-foreground/20">
                  <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-primary-foreground/70">Cool Summer Shade</span>
                  <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-red-400">Score: 32/100</span>
                </div>
                <h4 className="text-xl md:text-2xl font-serif mb-2">Verdict: Avoid</h4>
                <p className="text-sm font-light text-primary-foreground/70">
                  Washes out warm undertones. Creates artificial shadows.
                </p>
              </div>
            </div>
          </div>

          {/* Good Proof */}
          <div className="relative aspect-[3/4] bg-primary group overflow-hidden">
            <img src={DEMO_PERSONA_FULL_BODY_URL} alt="Good Color Fit" className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105 origin-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <div className="bg-background text-foreground border border-border p-6 shadow-xl group-hover:-translate-y-1 transition-transform duration-500">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                  <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-foreground/70">True Autumn Shade</span>
                  <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-emerald-700 font-semibold">Score: 98/100</span>
                </div>
                <h4 className="text-xl md:text-2xl font-serif mb-2 flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-700" /> Verdict: Flawless
                </h4>
                <p className="text-sm font-light text-foreground/70">
                  Harmonizes with natural contrast. Elevates skin clarity.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const Trust = () => {
  return (
    <section className="py-40 bg-background border-b border-border relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <div className="w-20 h-20 mx-auto border border-border flex items-center justify-center mb-12 bg-secondary/30 text-primary shadow-sm">
           <ShieldCheck className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-10 leading-tight text-foreground">
          A refusal to guess is a <br className="hidden md:block"/>
          <span className="italic text-primary">feature, not a flaw.</span>
        </h2>
        <div className="w-24 h-px bg-border mx-auto mb-10"></div>
        <p className="text-xl md:text-2xl text-foreground/70 font-light leading-relaxed max-w-3xl mx-auto">
          EventReady does not invent a colour answer when a photo cannot be measured reliably. If measurement fails, we say so. Most tools hide this. <span className="font-medium text-foreground">We don't.</span>
        </p>
      </div>
    </section>
  );
};

const FinalCTA = ({ onStart, onUseDemoPersona, onStartCustom }: StartScreenProps) => {
  return (
    <section className="py-32 md:py-48 bg-secondary/20 border-b border-border relative overflow-hidden">
      {/* Decorative large logo or shape */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-primary/5 rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-primary/5 rounded-full pointer-events-none"></div>
      
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <h2 className="text-5xl md:text-7xl font-serif mb-16 text-foreground">
          Ready for your <span className="italic text-primary">verdict?</span>
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center mb-16">
          <button
            onClick={onStart}
            data-testid="button-start-flow-final"
            className="bg-primary text-primary-foreground px-12 py-6 text-sm uppercase tracking-widest font-semibold hover:bg-primary/90 transition-all flex items-center gap-4 group w-full sm:w-auto justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Start My Styling
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onUseDemoPersona}
            data-testid="button-use-demo-persona-final"
            className="border border-border bg-background px-12 py-6 text-sm uppercase tracking-widest font-semibold hover:bg-secondary transition-all w-full sm:w-auto justify-center shadow-sm hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap"
          >
            Try Demo — No photos needed
          </button>
        </div>
        
        <div className="flex items-center justify-center max-w-md mx-auto mb-16">
          <div className="h-px bg-border flex-1"></div>
          <span className="px-6 text-xs uppercase tracking-widest text-foreground/40 font-mono">Or</span>
          <div className="h-px bg-border flex-1"></div>
        </div>

        <button
          onClick={onStartCustom}
          data-testid="button-start-custom-final"
          className="group flex flex-col items-center justify-center mx-auto text-center"
        >
          <span className="text-xl md:text-2xl font-serif text-foreground mb-3 group-hover:text-primary transition-colors">
            Already have something in mind?
          </span>
          <span className="text-sm uppercase tracking-widest text-foreground/60 group-hover:text-foreground underline underline-offset-8 decoration-border group-hover:decoration-foreground transition-all">
            Check it before you buy
          </span>
        </button>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-12 bg-background text-center flex flex-col items-center justify-center gap-4">
    <div className="flex items-center gap-2 text-primary">
       <Sparkles className="w-4 h-4" />
       <span className="font-serif font-semibold">EventReady AI</span>
    </div>
    <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-mono">
      &copy; {new Date().getFullYear()} EventReady AI. All rights reserved.
    </p>
  </footer>
);
