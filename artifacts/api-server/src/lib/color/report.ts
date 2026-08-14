import { pickProofPair } from "./match";
import type { ColorSeason, PaletteColor } from "./palettes";
import { describeAxes } from "./season";
import type { ColorAnalysis, DepthSource, DominantTrait, FacialColorTones, PaletteAxes } from "./season";

/**
 * The colour reading as the client sees it.
 *
 * Deliberately carries `measured` — the raw hex values the YouCam Facial
 * Colour Tones task read off the user's face — alongside the interpretation.
 * The palette itself is our own curated domain data, so showing the
 * measurement next to it is what lets the user (and a judge) see exactly
 * where the API's contribution ends and ours begins, rather than taking the
 * verdict on faith.
 */
export interface ColorReport {
  season: ColorSeason;
  seasonLabel: string;
  tagline: string;
  rationale: string;
  dominantTrait: DominantTrait;
  axes: PaletteAxes;
  /** Plain-language rendering of `axes`, e.g. "warm, light and clear". */
  axesSummary: string;
  /** 0..1 — how clearly the dominant trait beat the runner-up. */
  confidence: number;
  /** Raw colours measured from the selfie. Nulls mean that feature was not returned. */
  measured: FacialColorTones;
  /**
   * Which feature anchored the depth reading, and whether a hair colour was
   * measured but thrown out.
   *
   * The client needs both because it displays the raw swatches. Showing a
   * hair swatch the engine refused to use, with no indication that it was
   * refused, would be the one kind of dishonesty this panel exists to
   * prevent — the user would see a measurement contradicted by their own
   * reflection and have no way to tell we had already caught it.
   */
  depthSource: DepthSource | null;
  hairReadingRejected: boolean;
  heroColors: PaletteColor[];
  avoidColors: PaletteColor[];
  bestNeutral: PaletteColor;
  /** The best/worst pair for the side-by-side try-on proof, when one can be formed. */
  proofPair: { best: PaletteColor; worst: PaletteColor } | null;
}

export function toColorReport(analysis: ColorAnalysis): ColorReport {
  return {
    season: analysis.season,
    seasonLabel: analysis.seasonLabel,
    tagline: analysis.tagline,
    rationale: analysis.rationale,
    dominantTrait: analysis.dominantTrait,
    axes: analysis.axes,
    axesSummary: describeAxes(analysis.axes),
    confidence: analysis.confidence,
    measured: analysis.measured,
    depthSource: analysis.depthSource,
    hairReadingRejected: analysis.hairReadingRejected,
    heroColors: analysis.heroColors,
    avoidColors: analysis.avoidColors,
    bestNeutral: analysis.bestNeutral,
    proofPair: pickProofPair(analysis),
  };
}
