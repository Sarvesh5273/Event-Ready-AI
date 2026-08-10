/**
 * Mockup: CustomGarmentResultsScreen — image-loading verification
 *
 * Exercises both URL shapes that appear in live sessions, confirmed by
 * browser onLoad callbacks (not just visual inspection):
 *
 *   Case A — VTO success
 *     hero = resolveDemoAssetUrl(vtoResultImageUrl)
 *     vtoResultImageUrl is an absolute https:// URL (YouCam S3 signed URL).
 *     resolveDemoAssetUrl must return it UNCHANGED — the regex
 *     /^([a-z][a-z0-9+.-]*:)?\/\//i matches "https://" and short-circuits.
 *     A real public https:// image stands in for the signed S3 URL so we
 *     can confirm the browser loads it without network errors.
 *
 *   Case B — VTO failed / fallback garment image
 *     hero = garment.imageUrl   (used DIRECTLY — no resolveDemoAssetUrl)
 *     In production this is:
 *       /api/sessions/<id>/garment-image?token=<signed-jwt>
 *     It is a root-relative path starting with "/api/".
 *     Here we use the controlled same-origin fixture endpoint:
 *       /api/_fixture/garment-image
 *     This is served by the API server (port 8080, path prefix /api)
 *     through the same shared path-based proxy the production endpoint
 *     uses, so a successful browser load proves that root-relative
 *     /api/... <img> tags reach the API server correctly — which is the
 *     routing concern under test.  The browser onLoad callback records
 *     the result; an onError would surface the failure.
 */

import { motion } from "framer-motion";
import { Check, Info, Shirt, RotateCcw } from "lucide-react";
import { useState } from "react";

// ─── Inline resolveDemoAssetUrl (identical logic to demoAssets.ts) ────────────
const base = import.meta.env.BASE_URL;

function resolveDemoAssetUrl(assetPath: string): string {
  // Absolute URLs (https://, //) → return unchanged, no base prefix.
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(assetPath)) {
    return assetPath;
  }
  return `${base}${assetPath}`;
}

// ─── Test data ────────────────────────────────────────────────────────────────

/**
 * Case A — VTO success.
 * A real public https:// image stands in for the YouCam S3 signed URL.
 * resolveDemoAssetUrl must pass it through unchanged.
 */
const CASE_A_VTO_RESULT_URL =
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80";

/**
 * Case B — VTO failed / fallback.
 * Root-relative path to the controlled fixture endpoint on the API server.
 * Same proxy route as the real /api/sessions/:id/garment-image endpoint.
 * Must NOT be wrapped in resolveDemoAssetUrl (would prepend BASE_URL and
 * corrupt the path into "/__mockup/api/...").
 */
const CASE_B_GARMENT_IMAGE_URL = "/api/_fixture/garment-image";

// ─── Load-result badge ────────────────────────────────────────────────────────

type LoadState = "pending" | "ok" | "error";

function LoadBadge({ state }: { state: LoadState }) {
  const styles: Record<LoadState, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    ok:      "bg-green-100  text-green-800  border-green-300",
    error:   "bg-red-100    text-red-800    border-red-300",
  };
  const labels: Record<LoadState, string> = {
    pending: "⏳ loading…",
    ok:      "✅ image loaded OK",
    error:   "❌ image failed to load",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-semibold border rounded ${styles[state]}`}
    >
      {labels[state]}
    </span>
  );
}

// ─── Shared card ──────────────────────────────────────────────────────────────

function GarmentCard({
  label,
  urlUsed,
  resolvedHeroUrl,
  tryOnSucceeded,
  colorFamily,
  undertone,
  score,
  errorMessage,
}: {
  label: string;
  urlUsed: string;
  resolvedHeroUrl: string;
  tryOnSucceeded: boolean;
  colorFamily: string;
  undertone: string;
  score: { confidenceScore: number; reasons: string[]; cautions: string[] };
  errorMessage?: string | null;
}) {
  const [loadState, setLoadState] = useState<LoadState>("pending");

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
        {label}
      </div>
      <div className="text-center">
        <LoadBadge state={loadState} />
      </div>
      <div className="text-[11px] text-muted-foreground text-center font-mono break-all">
        src=&ldquo;{resolvedHeroUrl}&rdquo;
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Hero image */}
        <div className="lg:col-span-5 relative" data-testid="custom-garment-image">
          <div className="aspect-[3/4] bg-card border border-border p-2 shadow-xl relative group">
            <div className="w-full h-full overflow-hidden bg-secondary">
              <img
                src={resolvedHeroUrl}
                alt="Your garment"
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                onLoad={(e) => {
                  console.log(`[${label}] image loaded OK:`, (e.target as HTMLImageElement).src);
                  setLoadState("ok");
                }}
                onError={(e) => {
                  console.error(`[${label}] image FAILED to load:`, (e.target as HTMLImageElement).src);
                  setLoadState("error");
                }}
              />
            </div>

            {score && (
              <div className="absolute top-6 right-6 bg-background/90 backdrop-blur-md px-4 py-2 border border-border shadow-sm flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Fit</span>
                <span className="text-2xl font-serif text-primary leading-none">{score.confidenceScore}%</span>
              </div>
            )}

            {!tryOnSucceeded && (
              <div
                className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur-md px-4 py-2 border border-border shadow-sm text-center"
                data-testid="custom-garment-tryon-unavailable"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  Try-on preview unavailable — showing your uploaded photo instead.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Skin & Color Compatibility
          </div>
          <h2 className="text-2xl md:text-3xl font-serif mb-6 text-foreground capitalize">
            {colorFamily.replace("_", " ")} · {undertone} undertone
          </h2>

          {score.reasons.length > 0 && (
            <ul className="space-y-3 mb-6">
              {score.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-base text-foreground leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          )}

          {score.cautions.length > 0 && (
            <div className="bg-secondary/50 border border-border p-4 flex gap-3">
              <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                {score.cautions.map((c, i) => (
                  <p key={i} className="text-sm text-muted-foreground">{c}</p>
                ))}
              </div>
            </div>
          )}

          {errorMessage && !tryOnSucceeded && (
            <p className="text-sm text-muted-foreground mt-4">{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main preview export ──────────────────────────────────────────────────────

export default function CustomGarmentResults() {
  // Case A: VTO succeeded — hero = resolveDemoAssetUrl(vtoResultImageUrl)
  // absolute https:// URL must survive the function unchanged.
  const caseAHeroUrl = resolveDemoAssetUrl(CASE_A_VTO_RESULT_URL);

  // Case B: VTO failed — hero = garment.imageUrl used directly.
  // Root-relative /api/... must NOT pass through resolveDemoAssetUrl;
  // prefixing with BASE_URL ("/__mockup") would corrupt it.
  const caseBHeroUrl = CASE_B_GARMENT_IMAGE_URL; // used as-is, mirrors production

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 font-sans">
      <div className="max-w-6xl mx-auto px-6 space-y-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-4 border border-border/50">
            <Shirt className="w-3.5 h-3.5" />
            Image-Loading Verification Mockup
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-3">
            Custom Garment Results
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Both cases confirm via browser <code>onLoad</code> callbacks — not just visual render.
            A ✅ badge means the browser successfully fetched the image.
          </p>
          <div className="text-xs text-muted-foreground bg-secondary/50 border border-border p-3 font-mono text-left space-y-1">
            <div>BASE_URL = <strong>{base}</strong></div>
            <div>Case A — resolveDemoAssetUrl(&ldquo;https://…&rdquo;) = <strong>{caseAHeroUrl.slice(0, 60)}…</strong></div>
            <div>Case B — garment.imageUrl used directly = <strong>{caseBHeroUrl}</strong></div>
          </div>
        </motion.div>

        <hr className="border-border" />

        {/* Case A */}
        <GarmentCard
          label="Case A — VTO success (absolute https:// → resolveDemoAssetUrl → unchanged)"
          urlUsed={CASE_A_VTO_RESULT_URL}
          resolvedHeroUrl={caseAHeroUrl}
          tryOnSucceeded={true}
          colorFamily="sapphire_blue"
          undertone="cool"
          score={{
            confidenceScore: 84,
            reasons: [
              "Sapphire blue strongly complements cool-toned complexions",
              "Deep jewel tones create striking contrast against your skin",
            ],
            cautions: [],
          }}
        />

        <hr className="border-border" />

        {/* Case B */}
        <GarmentCard
          label="Case B — VTO failed (root-relative /api/... used directly, no resolveDemoAssetUrl)"
          urlUsed={CASE_B_GARMENT_IMAGE_URL}
          resolvedHeroUrl={caseBHeroUrl}
          tryOnSucceeded={false}
          colorFamily="forest_green"
          undertone="warm"
          score={{
            confidenceScore: 71,
            reasons: ["Forest green harmonises with warm golden undertones"],
            cautions: ["Very deep shades can recede against similarly dark skin tones."],
          }}
          errorMessage="Try-on could not be generated for this garment."
        />

        <div className="pt-8 border-t border-border flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors">
            <RotateCcw className="w-4 h-4" />
            Start a new session
          </button>
        </div>
      </div>
    </div>
  );
}
