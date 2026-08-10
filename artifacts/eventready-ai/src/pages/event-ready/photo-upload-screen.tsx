import React, { useRef } from 'react';
import type { PhotoUploadScreenProps } from '@/types/screen-props';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Upload, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PhotoUploadScreen({
  selfiePreviewUrl,
  fullBodyPreviewUrl,
  onSelfieSelected,
  onFullBodySelected,
  onUseDemoPersona,
  onContinue,
  onBack,
  canContinue,
  isSubmitting
}: PhotoUploadScreenProps) {
  
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const fullBodyInputRef = useRef<HTMLInputElement>(null);

  const handleSelfieClick = () => selfieInputRef.current?.click();
  const handleFullBodyClick = () => fullBodyInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="px-6 py-8 flex items-center justify-between max-w-2xl w-full mx-auto">
        <button 
          onClick={onBack}
          data-testid="button-back"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onUseDemoPersona}
          data-testid="button-use-demo-persona-alt"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          disabled={isSubmitting}
        >
          <User className="w-4 h-4" />
          Skip with Demo Persona
        </button>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-4xl font-serif mb-2">Upload your photos</h1>
          <p className="text-muted-foreground text-lg mb-10">
            We need a close-up to analyze your complexion, and a full-body shot to preview the outfits on you.
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
        </motion.div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t border-border z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground hidden sm:block">
            {canContinue ? "Ready to process" : "Upload both photos to continue"}
          </div>
          <button
            onClick={onContinue}
            disabled={!canContinue || isSubmitting}
            data-testid="button-continue-upload"
            className="w-full sm:w-auto h-14 px-10 bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover-elevate transition-all ml-auto flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Analyze & Style"
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
