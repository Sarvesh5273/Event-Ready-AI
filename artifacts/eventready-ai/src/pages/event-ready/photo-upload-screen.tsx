import React, { useRef } from 'react';
import type { PhotoUploadScreenProps } from '@/types/screen-props';
import { motion } from 'framer-motion';
import { Camera, Upload, Shirt, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from './page-header';

const LIME = '#C1FF4D';
const INK = '#0D0D0D';

const GARMENT_CATEGORIES: { value: PhotoUploadScreenProps['garmentCategory']; label: string }[] = [
  { value: 'full_body', label: 'Full outfit / dress' },
  { value: 'upper_body', label: 'Top' },
  { value: 'lower_body', label: 'Bottom' },
];

export function PhotoUploadScreen({
  flow,
  selfiePreviewUrl,
  fullBodyPreviewUrl,
  onSelfieSelected,
  onFullBodySelected,
  onUseDemoPersona,
  onContinue,
  onBack,
  canContinue,
  isSubmitting,
  garmentPreviewUrl,
  onGarmentSelected,
  garmentCategory,
  onGarmentCategoryChange,
}: PhotoUploadScreenProps) {
  
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const fullBodyInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  const handleSelfieClick = () => selfieInputRef.current?.click();
  const handleFullBodyClick = () => fullBodyInputRef.current?.click();
  const handleGarmentClick = () => garmentInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const isCustom = flow === 'custom';

  const rightSlot = !isCustom ? (
    <button
      onClick={onUseDemoPersona}
      data-testid="button-use-demo-persona-alt"
      className="text-xs font-mono uppercase tracking-widest flex items-center gap-2 transition-colors hover:opacity-70"
      style={{ color: 'rgba(0,0,0,0.45)', letterSpacing: '0.1em' }}
      disabled={isSubmitting}
    >
      <User className="w-3.5 h-3.5" />
      Skip with Demo
    </button>
  ) : undefined;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <PageHeader onBack={onBack} backDisabled={isSubmitting} rightSlot={rightSlot} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 pb-32 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-4xl font-bold mb-2">{isCustom ? 'Upload your photos & garment' : 'Upload your photos'}</h1>
          <p className="text-muted-foreground text-lg mb-10">
            {isCustom
              ? "We need a close-up to analyze your complexion, a full-body shot to preview it on you, and a photo of the piece you're considering."
              : 'We need a close-up to analyze your complexion, and a full-body shot to preview the outfits on you.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Selfie Upload */}
            <div className="flex flex-col gap-3">
              <label className="font-medium">Close-up Selfie</label>
              <div 
                onClick={handleSelfieClick}
                data-testid="upload-area-selfie"
                className={cn(
                  "relative aspect-[3/4] border border-dashed rounded-none flex flex-col items-center justify-center overflow-hidden cursor-pointer group transition-all duration-300",
                  selfiePreviewUrl ? "border-primary/50 bg-secondary/10" : "border-border bg-card hover:border-primary/50 hover:bg-secondary/30"
                )}
              >
                {selfiePreviewUrl ? (
                  <>
                    <img src={selfiePreviewUrl} alt="Selfie preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-background px-4 py-2 text-sm font-medium border border-border">Change photo</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center p-6 text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4 text-primary">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium mb-1">Tap to upload</span>
                    <span className="text-xs opacity-70">Clear lighting, natural face</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={selfieInputRef}
                  onChange={(e) => handleFileChange(e, onSelfieSelected)}
                  data-testid="input-file-selfie"
                />
              </div>
            </div>

            {/* Full Body Upload */}
            <div className="flex flex-col gap-3">
              <label className="font-medium">Full-body Photo</label>
              <div 
                onClick={handleFullBodyClick}
                data-testid="upload-area-fullbody"
                className={cn(
                  "relative aspect-[3/4] border border-dashed rounded-none flex flex-col items-center justify-center overflow-hidden cursor-pointer group transition-all duration-300",
                  fullBodyPreviewUrl ? "border-primary/50 bg-secondary/10" : "border-border bg-card hover:border-primary/50 hover:bg-secondary/30"
                )}
              >
                {fullBodyPreviewUrl ? (
                  <>
                    <img src={fullBodyPreviewUrl} alt="Full body preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-background px-4 py-2 text-sm font-medium border border-border">Change photo</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center p-6 text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4 text-primary">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium mb-1">Tap to upload</span>
                    <span className="text-xs opacity-70">Head to toe, form-fitting clothes</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fullBodyInputRef}
                  onChange={(e) => handleFileChange(e, onFullBodySelected)}
                  data-testid="input-file-fullbody"
                />
              </div>
            </div>

          </div>

          {isCustom && (
            <div className="mt-10">
              <div className="flex flex-col gap-3 max-w-xs">
                <label className="font-medium">The garment you're considering</label>
                <div
                  onClick={handleGarmentClick}
                  data-testid="upload-area-garment"
                  className={cn(
                    "relative aspect-[3/4] border border-dashed rounded-none flex flex-col items-center justify-center overflow-hidden cursor-pointer group transition-all duration-300",
                    garmentPreviewUrl ? "border-primary/50 bg-secondary/10" : "border-border bg-card hover:border-primary/50 hover:bg-secondary/30"
                  )}
                >
                  {garmentPreviewUrl ? (
                    <>
                      <img src={garmentPreviewUrl} alt="Garment preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-background px-4 py-2 text-sm font-medium border border-border">Change photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-center p-6 text-muted-foreground group-hover:text-foreground transition-colors">
                      <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4 text-primary">
                        <Shirt className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium mb-1">Tap to upload</span>
                      <span className="text-xs opacity-70">A product photo or a flat lay works well</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={garmentInputRef}
                    onChange={(e) => handleFileChange(e, onGarmentSelected)}
                    data-testid="input-file-garment"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="font-medium block mb-3">What kind of piece is it?</label>
                <div className="flex flex-wrap gap-2">
                  {GARMENT_CATEGORIES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onGarmentCategoryChange(option.value)}
                      data-testid={`button-garment-category-${option.value}`}
                      className={cn(
                        "px-4 py-2 text-sm font-medium border transition-colors",
                        garmentCategory === option.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-secondary/50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 backdrop-blur-xl border-t z-20"
        style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'rgba(0,0,0,0.08)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="text-[11px] font-mono uppercase tracking-widest hidden sm:block" style={{ color: 'rgba(0,0,0,0.38)' }}>
            {canContinue ? "Ready to process" : isCustom ? "Upload photos & garment to continue" : "Upload both photos to continue"}
          </div>
          <button
            onClick={onContinue}
            disabled={!canContinue || isSubmitting}
            data-testid="button-continue-upload"
            className="w-full sm:w-auto h-12 px-10 font-bold tracking-wide transition-all ml-auto flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: LIME, color: INK, fontSize: '13px', letterSpacing: '0.06em' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Analyze & Style →"
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
