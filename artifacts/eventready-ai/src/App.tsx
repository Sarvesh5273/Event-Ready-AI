import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { useEventReadyFlow } from '@/hooks/use-event-ready-flow';
import { DemoModeBanner } from '@/components/demo-mode-banner';
import { StartScreen } from '@/pages/event-ready/start-screen';
import { PreferencesScreen } from '@/pages/event-ready/preferences-screen';
import { PhotoUploadScreen } from '@/pages/event-ready/photo-upload-screen';
import { ProcessingScreen } from '@/pages/event-ready/processing-screen';
import { ResultsScreen } from '@/pages/event-ready/results-screen';

const queryClient = new QueryClient();

function WeddingGuestFlow() {
  const flow = useEventReadyFlow();

  return (
    <div className="min-h-screen w-full">
      {flow.isDemoMode && <DemoModeBanner />}

      {flow.screen === 'start' && (
        <StartScreen
          onStart={flow.startFlow}
          onUseDemoPersona={flow.startFlowWithDemoPersona}
          onStartCustom={flow.startFlowCustom}
        />
      )}

      {flow.screen === 'preferences' && (
        <PreferencesScreen
          styleVibe={flow.styleVibe}
          budgetTier={flow.budgetTier}
          onStyleVibeChange={flow.setStyleVibe}
          onBudgetTierChange={flow.setBudgetTier}
          onContinue={flow.confirmPreferences}
          onBack={flow.goToStart}
          wantsDemoPersona={flow.wantsDemoPersona}
        />
      )}

      {flow.screen === 'photo' && (
        <PhotoUploadScreen
          flow={flow.garmentSource}
          selfiePreviewUrl={flow.photos.selfiePreviewUrl}
          fullBodyPreviewUrl={flow.photos.fullBodyPreviewUrl}
          onSelfieSelected={flow.setSelfieFile}
          onFullBodySelected={flow.setFullBodyFile}
          onUseDemoPersona={flow.useDemoPersonaFromPhotoScreen}
          onContinue={flow.continueFromPhotos}
          onBack={flow.goToStart}
          canContinue={Boolean(
            flow.photos.selfieFile &&
              flow.photos.fullBodyFile &&
              (flow.garmentSource === 'catalog' || flow.garment.file),
          )}
          isSubmitting={flow.isCreatingSession}
          garmentPreviewUrl={flow.garment.previewUrl}
          onGarmentSelected={flow.setGarmentFile}
          garmentCategory={flow.garmentCategory}
          onGarmentCategoryChange={flow.setGarmentCategory}
        />
      )}

      {flow.screen === 'processing' && (
        <ProcessingScreen
          steps={flow.session?.steps ?? []}
          currentStep={flow.session?.currentStep ?? 0}
          errorMessage={flow.flowError}
          onRetryWithDemoPersona={flow.retryWithDemoPersona}
          onBack={flow.restart}
        />
      )}

      {flow.screen === 'results' && flow.report && (
        <ResultsScreen report={flow.report} isDemoMode={flow.isDemoMode} onStartOver={flow.restart} />
      )}

      {flow.screen === 'results' && !flow.report && flow.isLoadingReport && (
        <div className="min-h-screen flex items-center justify-center" data-testid="status-loading-report">
          <p className="text-muted-foreground">Loading your results…</p>
        </div>
      )}
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={WeddingGuestFlow} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
