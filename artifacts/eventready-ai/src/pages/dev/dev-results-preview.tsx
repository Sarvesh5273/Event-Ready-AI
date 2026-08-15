/**
 * DEV-ONLY results preview page — gated by import.meta.env.DEV in App.tsx.
 *
 * Creates a fresh live YouCam session at runtime (no hardcoded credentials,
 * URLs, or tokens in source) so the actual CustomGarmentResultsScreen can be
 * rendered with real data for browser-level image-load verification.
 *
 * Flow:
 *   1. Fetch the demo persona images from the app's own public directory.
 *   2. POST /api/sessions → /api/sessions/:id/analyze with those images.
 *   3. Poll /api/sessions/:id/status until ready (or timeout/error).
 *   4. GET /api/sessions/:id/report and render CustomGarmentResultsScreen.
 *
 * This means each page load costs one real YouCam VTO call. The in-process
 * replay cache (24-hour TTL, keyed on image content + garment category) means
 * repeated loads with the same demo images return instantly from cache after
 * the first run. Data never enters source control.
 */

import { useEffect, useState } from 'react';
import type { EventReadyReport } from '@workspace/api-client-react';
import { CustomGarmentResultsScreen } from '@/pages/event-ready/custom-garment-results-screen';
import { ResultsScreen } from '@/pages/event-ready/results-screen';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = import.meta.env.BASE_URL.replace(/\/$/, '') ? '' : '';  // always ''

async function fetchAsBase64(publicPath: string): Promise<{ base64Data: string; contentType: string }> {
  const res = await fetch(publicPath);
  if (!res.ok) throw new Error(`Failed to fetch ${publicPath}: ${res.status}`);
  const blob = await res.blob();
  const ab = await blob.arrayBuffer();
  const bytes = new Uint8Array(ab);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { base64Data: btoa(binary), contentType: blob.type || 'image/jpeg' };
}

async function createSession(): Promise<{ sessionId: string; sessionToken: string }> {
  const res = await fetch(`${API}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'live',
      preferences: { occasion: 'wedding_guest', styleVibe: 'classic', timeOfDay: 'evening', tradition: 'any' },
      garmentSource: 'custom',
    }),
  });
  const json = await res.json();
  if (!json.sessionId) throw new Error(json.error ?? 'Failed to create session');
  return { sessionId: json.sessionId, sessionToken: json.sessionToken };
}

async function startAnalysis(
  sessionId: string,
  sessionToken: string,
  selfieImage: { base64Data: string; contentType: string },
  fullBodyImage: { base64Data: string; contentType: string },
  garmentImage: { base64Data: string; contentType: string },
): Promise<string> {
  const res = await fetch(`${API}/api/sessions/${sessionId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionToken,
      selfieImage,
      fullBodyImage,
      garmentImage,
      garmentCategory: 'full_body',
    }),
  });
  const json = await res.json();
  if (json.status === 'error') throw new Error(json.errorMessage ?? 'Analysis failed');
  return json.sessionToken ?? sessionToken;
}

async function pollUntilReady(
  sessionId: string,
  token: string,
  onProgress: (msg: string) => void,
  maxAttempts = 40,
  intervalMs = 5000,
): Promise<{ token: string; report: EventReadyReport }> {
  let currentToken = token;
  for (let i = 1; i <= maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));

    const res = await fetch(`${API}/api/sessions/${sessionId}/status`, {
      headers: { token: currentToken },
    });
    const status = await res.json();
    currentToken = status.sessionToken ?? currentToken;
    onProgress(`Polling (${i}/${maxAttempts}) — step ${status.currentStep}/4`);

    if (status.status === 'error') {
      throw new Error(status.errorMessage ?? 'Session errored');
    }
    if (status.status === 'ready') {
      const reportRes = await fetch(`${API}/api/sessions/${sessionId}/report`, {
        headers: { token: currentToken },
      });
      const report = await reportRes.json() as EventReadyReport;
      return { token: currentToken, report };
    }
  }
  throw new Error(`Timed out after ${maxAttempts} polls`);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Phase =
  | { kind: 'idle' }
  | { kind: 'running'; message: string }
  | { kind: 'ready'; report: EventReadyReport; garmentImageUrl: string }
  | { kind: 'error'; message: string };

export function DevResultsPreview() {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [activeCase, setActiveCase] = useState<'success' | 'fallback'>('success');
  // This harness exercises the custom-garment report only; video generation
  // has its own endpoints and is tested through the main flow.
  const [devVideoError, setDevVideoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Fast path: if ?sid=<id>&token=<token> are present in the URL, the
        // session was pre-created externally (e.g. by the warmup script) and
        // is already ready — fetch the report directly without creating a new
        // session. This lets the screenshot tool navigate to a ready state
        // immediately rather than waiting for the 5-second poll cycle.
        const params = new URLSearchParams(window.location.search);
        const prefillSid   = params.get('sid');
        const prefillToken = params.get('token');

        if (prefillSid && prefillToken) {
          setPhase({ kind: 'running', message: 'Loading pre-created session report…' });
          const reportRes = await fetch(`${API}/api/sessions/${prefillSid}/report`, {
            headers: { token: prefillToken },
          });
          if (!reportRes.ok) throw new Error(`Report fetch failed: ${reportRes.status}`);
          const report = await reportRes.json() as EventReadyReport;
          if (cancelled) return;
          setPhase({ kind: 'ready', report, garmentImageUrl: report.customGarment?.imageUrl ?? '' });
          return;
        }

        // Demo fast path: ?demo=1 runs the catalog flow in Demo Mode, which
        // makes no YouCam calls at all. Free to reload, so this is the route
        // to use for visual checks and screenshots of the catalog results
        // screen — the live paths below cost real units every run.
        if (params.get('demo')) {
          setPhase({ kind: 'running', message: 'Creating demo session…' });

          const createRes = await fetch(`${API}/api/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'demo',
              preferences: { occasion: 'wedding_guest', styleVibe: 'classic', timeOfDay: 'evening', tradition: 'any' },
              garmentSource: 'catalog',
            }),
          });
          const created = await createRes.json();
          if (!created.sessionId) throw new Error(created.error ?? 'Failed to create demo session');
          if (cancelled) return;

          const analyzeRes = await fetch(`${API}/api/sessions/${created.sessionId}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken: created.sessionToken }),
          });
          const analyzed = await analyzeRes.json();
          if (cancelled) return;

          const { report } = await pollUntilReady(
            created.sessionId,
            analyzed.sessionToken ?? created.sessionToken,
            msg => { if (!cancelled) setPhase({ kind: 'running', message: msg }); },
            20,
            1500,
          );
          if (cancelled) return;

          setPhase({ kind: 'ready', report, garmentImageUrl: '' });
          return;
        }

        // Slow path: create a new live session from scratch.
        setPhase({ kind: 'running', message: 'Fetching demo persona images…' });

        const base = import.meta.env.BASE_URL;
        const [selfie, fullBody, garment] = await Promise.all([
          fetchAsBase64(`${base}demo/persona-selfie.jpg`),
          fetchAsBase64(`${base}demo/persona-full-body.jpg`),
          fetchAsBase64(`${base}demo/outfits/bold-emerald-jumpsuit.jpg`),
        ]);

        if (cancelled) return;
        setPhase({ kind: 'running', message: 'Creating live session…' });

        const { sessionId, sessionToken } = await createSession();
        if (cancelled) return;

        setPhase({ kind: 'running', message: 'Starting YouCam analysis…' });
        const token = await startAnalysis(sessionId, sessionToken, selfie, fullBody, garment);
        if (cancelled) return;

        const { report } = await pollUntilReady(
          sessionId,
          token,
          msg => { if (!cancelled) setPhase({ kind: 'running', message: msg }); },
        );
        if (cancelled) return;

        // imageUrl is the root-relative /api/sessions/:id/garment-image?token=… URL
        const garmentImageUrl = report.customGarment?.imageUrl ?? '';
        setPhase({ kind: 'ready', report, garmentImageUrl });
      } catch (err) {
        if (!cancelled) {
          setPhase({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
        }
      }
    }

    void run();
    return () => { cancelled = true; };
  }, []);

  const renderBody = () => {
    if (phase.kind === 'idle' || phase.kind === 'running') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground font-mono text-sm">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          <p>{phase.kind === 'running' ? phase.message : 'Initialising…'}</p>
          <p className="text-xs opacity-60">
            First run calls YouCam APIs (~1–2 min). Repeat loads hit the 24-hour replay cache.
          </p>
        </div>
      );
    }

    if (phase.kind === 'error') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-destructive font-semibold">Session failed</p>
          <p className="text-sm text-muted-foreground font-mono">{phase.message}</p>
          <p className="text-xs text-muted-foreground">
            Is the API server running? Is YOUCAM_API_KEY configured?
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary text-foreground text-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    // phase.kind === 'ready'
    const { report, garmentImageUrl } = phase;

    if (report.flow === 'catalog') {
      return (
        <div className="pt-10 pb-20">
          <ResultsScreen
            report={report}
            isDemoMode={report.mode === 'demo'}
            onStartOver={() => { window.location.href = '/'; }}
            video={null}
            onGenerateVideo={() => setDevVideoError('Video generation is not wired up in this dev preview — use the main flow to test it.')}
            isGeneratingVideo={false}
            videoError={devVideoError}
          />
        </div>
      );
    }

    const vtoStatus = report.customGarment?.vtoStatus;

    // Build the report variant for the selected case
    const displayReport: EventReadyReport =
      activeCase === 'fallback'
        ? {
            ...report,
            customGarment: report.customGarment
              ? {
                  ...report.customGarment,
                  vtoStatus: 'error',
                  vtoResultImageUrl: null,
                  vtoErrorMessage: 'Try-on could not be generated — showing uploaded photo.',
                }
              : null,
          }
        : report;

    return (
      <>
        {/* Garment-image direct-load test strip (Case B) */}
        {garmentImageUrl && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-2 bg-black/80 text-white font-mono text-[11px]">
            <GarmentDirectLoadTest url={garmentImageUrl} />
          </div>
        )}
        <div className="pt-10 pb-20">
          <CustomGarmentResultsScreen
            report={displayReport}
            onStartOver={() => window.location.href = '/'}
            video={null}
            onGenerateVideo={() => setDevVideoError('Video generation is not wired up in this dev preview — use the main flow to test it.')}
            isGeneratingVideo={false}
            videoError={devVideoError}
          />
        </div>
      </>
    );
  };

  const vtoStatus = phase.kind === 'ready' ? phase.report.customGarment?.vtoStatus : undefined;

  return (
    <div>
      {/* Dev toolbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 text-white text-xs px-4 py-2 flex flex-wrap items-center gap-4 font-mono">
        <span className="font-semibold text-yellow-400">[DEV PREVIEW]</span>
        {phase.kind === 'ready' && phase.report.flow === 'catalog' && (
          <span className="opacity-70">Demo Mode — catalog results screen (no YouCam calls)</span>
        )}
        {phase.kind === 'ready' && phase.report.flow === 'custom' && (
          <>
            <span className="opacity-70">
              {activeCase === 'success'
                ? 'Case A — hero = resolveDemoAssetUrl(YouCam S3 URL) → unchanged'
                : 'Case B — hero = garment.imageUrl (root-relative /api/…) direct'}
            </span>
            {vtoStatus && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${vtoStatus === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                VTO {vtoStatus}
              </span>
            )}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setActiveCase('success')}
                className={`px-2 py-0.5 border rounded ${activeCase === 'success' ? 'bg-white text-black' : 'border-white/40 text-white/70'}`}
              >
                Case A
              </button>
              <button
                onClick={() => setActiveCase('fallback')}
                className={`px-2 py-0.5 border rounded ${activeCase === 'fallback' ? 'bg-white text-black' : 'border-white/40 text-white/70'}`}
              >
                Case B
              </button>
            </div>
          </>
        )}
      </div>
      {renderBody()}
    </div>
  );
}

// ─── Garment image direct-load test ──────────────────────────────────────────

function GarmentDirectLoadTest({ url }: { url: string }) {
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending');
  const colors = { pending: 'text-yellow-300', ok: 'text-green-300', error: 'text-red-300' };
  const icons  = { pending: '⏳', ok: '✅', error: '❌' };
  return (
    <div className="flex items-center gap-3">
      <span className={colors[state]}>{icons[state]} Case B — garment.imageUrl direct load (root-relative /api/…)</span>
      <span className="opacity-50 truncate max-w-xs">{url.slice(0, 80)}…</span>
      <img
        src={url}
        alt="garment direct"
        className="h-12 w-auto border border-white/20 object-cover"
        onLoad={e => {
          console.log('[DevResultsPreview] garment-image direct load OK:', (e.target as HTMLImageElement).src.slice(0, 100));
          setState('ok');
        }}
        onError={e => {
          console.error('[DevResultsPreview] garment-image direct load FAILED:', (e.target as HTMLImageElement).src.slice(0, 100));
          setState('error');
        }}
      />
    </div>
  );
}
