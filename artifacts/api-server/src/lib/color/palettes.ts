/**
 * The twelve seasonal palettes.
 *
 * This is curated domain data — the equivalent of a colour analyst's swatch
 * book — not something derived from the YouCam APIs. The *measurement* of a
 * person (skin, hair and eye colour) comes from YouCam's AI Facial Colour
 * Tones Analyzer; this file is the reference library those measurements get
 * matched against, and the split matters: we never claim the API told us
 * which colours suit someone.
 *
 * Palettes follow the widely used four-season/twelve-subtype system, where
 * each season is defined by where it sits on three axes — temperature
 * (warm/cool), value (light/deep) and chroma (bright/soft).
 */

export type ColorSeason =
  | "light_spring"
  | "true_spring"
  | "bright_spring"
  | "light_summer"
  | "true_summer"
  | "soft_summer"
  | "soft_autumn"
  | "true_autumn"
  | "deep_autumn"
  | "deep_winter"
  | "true_winter"
  | "bright_winter";

export const COLOR_SEASONS: readonly ColorSeason[] = [
  "light_spring",
  "true_spring",
  "bright_spring",
  "light_summer",
  "true_summer",
  "soft_summer",
  "soft_autumn",
  "true_autumn",
  "deep_autumn",
  "deep_winter",
  "true_winter",
  "bright_winter",
] as const;

export interface PaletteColor {
  hex: string;
  name: string;
}

export interface SeasonPalette {
  season: ColorSeason;
  /** Display name, e.g. "True Autumn". */
  label: string;
  /** One-line description of the colouring, written for the wearer. */
  tagline: string;
  /** How to describe the palette's logic in a sentence. */
  rationale: string;
  /** Colours that make this colouring look its best. */
  heroColors: PaletteColor[];
  /** Colours that visibly fight this colouring. */
  avoidColors: PaletteColor[];
  /** The most flattering neutral, used for "pair it with" guidance. */
  bestNeutral: PaletteColor;
}

export const SEASON_PALETTES: Record<ColorSeason, SeasonPalette> = {
  light_spring: {
    season: "light_spring",
    label: "Light Spring",
    tagline: "Warm and delicate — your colouring is lit from within rather than bold.",
    rationale: "Light, warm and gently clear colours keep your natural glow without overpowering it.",
    heroColors: [
      { hex: "#FFB59E", name: "Peach" },
      { hex: "#FFD275", name: "Buttercup" },
      { hex: "#7FD8C4", name: "Light Aqua" },
      { hex: "#F5A3B8", name: "Coral Pink" },
      { hex: "#BFDD8E", name: "Spring Green" },
      { hex: "#FFF0D6", name: "Warm Ivory" },
      { hex: "#A9C7EA", name: "Powder Periwinkle" },
      { hex: "#E8B98A", name: "Light Camel" },
    ],
    avoidColors: [
      { hex: "#000000", name: "Black" },
      { hex: "#4A2545", name: "Deep Aubergine" },
      { hex: "#6B705C", name: "Heavy Olive" },
      { hex: "#7D1128", name: "Dark Burgundy" },
    ],
    bestNeutral: { hex: "#FFF0D6", name: "Warm Ivory" },
  },
  true_spring: {
    season: "true_spring",
    label: "True Spring",
    tagline: "Genuinely warm and clear — golden, fresh and vivid.",
    rationale: "Warm colours with real clarity echo the golden warmth in your skin, hair and eyes.",
    heroColors: [
      { hex: "#FF6F52", name: "Coral" },
      { hex: "#FFC627", name: "Golden Yellow" },
      { hex: "#2EC4B6", name: "Warm Turquoise" },
      { hex: "#8DB600", name: "Apple Green" },
      { hex: "#FF8C69", name: "Salmon" },
      { hex: "#F2542D", name: "Bright Poppy" },
      { hex: "#C19A6B", name: "Camel" },
      { hex: "#FFF8E7", name: "Warm Ivory" },
    ],
    avoidColors: [
      { hex: "#000000", name: "Black" },
      { hex: "#8E9AAF", name: "Dusty Slate" },
      { hex: "#5D5A6E", name: "Muted Plum Grey" },
      { hex: "#2B2D42", name: "Cold Charcoal" },
    ],
    bestNeutral: { hex: "#C19A6B", name: "Camel" },
  },
  bright_spring: {
    season: "bright_spring",
    label: "Bright Spring",
    tagline: "Warm-leaning and high-clarity — you can carry colour most people can't.",
    rationale: "Saturated, clean colours match the contrast and vividness in your features.",
    heroColors: [
      { hex: "#FF4E50", name: "Hot Coral" },
      { hex: "#00B894", name: "Bright Emerald" },
      { hex: "#FFD400", name: "Vivid Gold" },
      { hex: "#FF3D8B", name: "Warm Fuchsia" },
      { hex: "#00BBF9", name: "Clear Turquoise" },
      { hex: "#E63946", name: "True Red" },
      { hex: "#9B5DE5", name: "Bright Violet" },
      { hex: "#FFFDF5", name: "Clear Ivory" },
    ],
    avoidColors: [
      { hex: "#A8A29E", name: "Dusty Taupe" },
      { hex: "#7D8471", name: "Muted Sage" },
      { hex: "#9C6B84", name: "Dusty Mauve" },
      { hex: "#6D6875", name: "Smoky Grey" },
    ],
    bestNeutral: { hex: "#FFFDF5", name: "Clear Ivory" },
  },
  light_summer: {
    season: "light_summer",
    label: "Light Summer",
    tagline: "Cool and soft-edged — your colouring is airy rather than dramatic.",
    rationale: "Light, cool, gently muted colours sit with your natural softness instead of flattening it.",
    heroColors: [
      { hex: "#A8C6E5", name: "Powder Blue" },
      { hex: "#E7B6C4", name: "Soft Rose" },
      { hex: "#C3B2D9", name: "Lavender" },
      { hex: "#9FD6C9", name: "Sea Mint" },
      { hex: "#B8C4D9", name: "Grey Blue" },
      { hex: "#D9A7B6", name: "Dusty Pink" },
      { hex: "#F2F1EC", name: "Cool Ivory" },
      { hex: "#8D9CB8", name: "Soft Denim" },
    ],
    avoidColors: [
      { hex: "#000000", name: "Black" },
      { hex: "#D2691E", name: "Burnt Orange" },
      { hex: "#B8860B", name: "Mustard" },
      { hex: "#6F4E37", name: "Warm Brown" },
    ],
    bestNeutral: { hex: "#B8C4D9", name: "Grey Blue" },
  },
  true_summer: {
    season: "true_summer",
    label: "True Summer",
    tagline: "Definitively cool — powdery, refined and never harsh.",
    rationale: "Cool colours with a soft finish flatter the blue undertone in your skin.",
    heroColors: [
      { hex: "#4C5C7A", name: "Soft Navy" },
      { hex: "#D983A6", name: "Rose Pink" },
      { hex: "#4E8C88", name: "Cool Teal" },
      { hex: "#A987A5", name: "Mauve" },
      { hex: "#6D7EA8", name: "Slate Blue" },
      { hex: "#8E4159", name: "Soft Burgundy" },
      { hex: "#B7B3AE", name: "Pearl Grey" },
      { hex: "#C7D3D4", name: "Sea Glass" },
    ],
    avoidColors: [
      { hex: "#FF6A00", name: "Bright Orange" },
      { hex: "#FFD400", name: "Vivid Gold" },
      { hex: "#000000", name: "Black" },
      { hex: "#8B4000", name: "Rust" },
    ],
    bestNeutral: { hex: "#4C5C7A", name: "Soft Navy" },
  },
  soft_summer: {
    season: "soft_summer",
    label: "Soft Summer",
    tagline: "Cool and muted — your colouring is blended, with low natural contrast.",
    rationale: "Greyed-off cool colours match your softness; anything too clean looks pasted on.",
    heroColors: [
      { hex: "#9CAF9A", name: "Sage" },
      { hex: "#C89BA4", name: "Dusty Rose" },
      { hex: "#6E7B8B", name: "Slate" },
      { hex: "#9A8AA0", name: "Soft Plum" },
      { hex: "#7BA098", name: "Muted Teal" },
      { hex: "#A39B8B", name: "Taupe" },
      { hex: "#8FA3BF", name: "Dusty Blue" },
      { hex: "#5F5B6B", name: "Smoke" },
    ],
    avoidColors: [
      { hex: "#FF3D8B", name: "Hot Pink" },
      { hex: "#FFD400", name: "Vivid Gold" },
      { hex: "#000000", name: "Black" },
      { hex: "#00B894", name: "Bright Emerald" },
    ],
    bestNeutral: { hex: "#A39B8B", name: "Taupe" },
  },
  soft_autumn: {
    season: "soft_autumn",
    label: "Soft Autumn",
    tagline: "Warm and muted — golden, but gently so.",
    rationale: "Earthy colours with the edge taken off flatter your low-contrast warmth.",
    heroColors: [
      { hex: "#9CAF88", name: "Sage Green" },
      { hex: "#D98E73", name: "Dusty Coral" },
      { hex: "#C19A6B", name: "Camel" },
      { hex: "#7FA6A0", name: "Soft Teal" },
      { hex: "#A89076", name: "Warm Taupe" },
      { hex: "#C9A227", name: "Muted Gold" },
      { hex: "#E29578", name: "Salmon" },
      { hex: "#87794E", name: "Olive" },
    ],
    avoidColors: [
      { hex: "#000000", name: "Black" },
      { hex: "#FF3D8B", name: "Hot Pink" },
      { hex: "#00BBF9", name: "Icy Blue" },
      { hex: "#FFFFFF", name: "Pure White" },
    ],
    bestNeutral: { hex: "#A89076", name: "Warm Taupe" },
  },
  true_autumn: {
    season: "true_autumn",
    label: "True Autumn",
    tagline: "Richly warm — spice, earth and metal rather than pastel.",
    rationale: "Deep golden colours pick up the warmth in your skin and hair without dulling either.",
    heroColors: [
      { hex: "#B7410E", name: "Rust" },
      { hex: "#6B7A3A", name: "Olive" },
      { hex: "#C99700", name: "Mustard" },
      { hex: "#C1683C", name: "Terracotta" },
      { hex: "#2F5D50", name: "Forest Green" },
      { hex: "#8B5E3C", name: "Warm Brown" },
      { hex: "#1F6F78", name: "Deep Teal" },
      { hex: "#D9A566", name: "Honey" },
    ],
    avoidColors: [
      { hex: "#C3B2D9", name: "Icy Lavender" },
      { hex: "#FF3D8B", name: "Hot Pink" },
      { hex: "#A8C6E5", name: "Powder Blue" },
      { hex: "#000000", name: "Black" },
    ],
    bestNeutral: { hex: "#8B5E3C", name: "Warm Brown" },
  },
  deep_autumn: {
    season: "deep_autumn",
    label: "Deep Autumn",
    tagline: "Warm and deep — your colouring carries saturation and darkness well.",
    rationale: "Dark, warm, saturated colours match your depth; pastels simply disappear on you.",
    heroColors: [
      { hex: "#6E1423", name: "Burgundy" },
      { hex: "#4A5D23", name: "Dark Olive" },
      { hex: "#14505C", name: "Deep Teal" },
      { hex: "#4B3621", name: "Chocolate" },
      { hex: "#A63A1E", name: "Rust" },
      { hex: "#4E2A45", name: "Aubergine" },
      { hex: "#1E3F2B", name: "Pine" },
      { hex: "#B8860B", name: "Dark Gold" },
    ],
    avoidColors: [
      { hex: "#FFD1DC", name: "Baby Pink" },
      { hex: "#A8C6E5", name: "Powder Blue" },
      { hex: "#D6E5D2", name: "Pale Mint" },
      { hex: "#B8C4D9", name: "Grey Blue" },
    ],
    bestNeutral: { hex: "#4B3621", name: "Chocolate" },
  },
  deep_winter: {
    season: "deep_winter",
    label: "Deep Winter",
    tagline: "Cool and deep — high drama suits you where softness doesn't.",
    rationale: "Dark, cool, saturated colours match your natural contrast head-on.",
    heroColors: [
      { hex: "#000000", name: "Black" },
      { hex: "#C8102E", name: "True Red" },
      { hex: "#046A38", name: "Emerald" },
      { hex: "#0F3D6E", name: "Sapphire" },
      { hex: "#4B1D6B", name: "Deep Purple" },
      { hex: "#6E1423", name: "Burgundy" },
      { hex: "#1B2A41", name: "Midnight Navy" },
      { hex: "#F4F7F8", name: "Icy White" },
    ],
    avoidColors: [
      { hex: "#E8C39E", name: "Beige" },
      { hex: "#D9A566", name: "Honey" },
      { hex: "#9CAF88", name: "Sage" },
      { hex: "#E29578", name: "Salmon" },
    ],
    bestNeutral: { hex: "#1B2A41", name: "Midnight Navy" },
  },
  true_winter: {
    season: "true_winter",
    label: "True Winter",
    tagline: "Cool and clear — icy, crisp and unmistakably sharp.",
    rationale: "Pure, cool, high-contrast colours are the only ones that meet your clarity.",
    heroColors: [
      { hex: "#000000", name: "Black" },
      { hex: "#FFFFFF", name: "Pure White" },
      { hex: "#C8102E", name: "True Red" },
      { hex: "#0047AB", name: "Royal Blue" },
      { hex: "#046A38", name: "Emerald" },
      { hex: "#D6338B", name: "Fuchsia" },
      { hex: "#DCE6F2", name: "Icy Blue" },
      { hex: "#1B2A41", name: "Navy" },
    ],
    avoidColors: [
      { hex: "#D9A566", name: "Honey" },
      { hex: "#B7410E", name: "Rust" },
      { hex: "#A89076", name: "Warm Taupe" },
      { hex: "#C99700", name: "Mustard" },
    ],
    bestNeutral: { hex: "#000000", name: "Black" },
  },
  bright_winter: {
    season: "bright_winter",
    label: "Bright Winter",
    tagline: "Cool-leaning and electric — saturation is your natural register.",
    rationale: "Jewel-bright cool colours match the vividness in your eyes and the contrast in your face.",
    heroColors: [
      { hex: "#FF0F7B", name: "Hot Pink" },
      { hex: "#0077FF", name: "Electric Blue" },
      { hex: "#00A878", name: "Bright Emerald" },
      { hex: "#E4002B", name: "True Red" },
      { hex: "#7B2FF7", name: "Bright Violet" },
      { hex: "#000000", name: "Black" },
      { hex: "#FFFFFF", name: "Pure White" },
      { hex: "#00CFE8", name: "Icy Turquoise" },
    ],
    avoidColors: [
      { hex: "#A39B8B", name: "Taupe" },
      { hex: "#9CAF88", name: "Sage" },
      { hex: "#D98E73", name: "Dusty Coral" },
      { hex: "#87794E", name: "Olive" },
    ],
    bestNeutral: { hex: "#000000", name: "Black" },
  },
};

export function getSeasonPalette(season: ColorSeason): SeasonPalette {
  return SEASON_PALETTES[season];
}
