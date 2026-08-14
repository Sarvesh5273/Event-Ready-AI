import { hexToRgb } from "../color/lab";
import type { PaletteColor } from "../color/palettes";
import type {
  ColorFamily,
  GarmentTradition,
  ShopColorGroup,
  ShopSearchLink,
  ShopYourPalette,
  TraditionPreference,
} from "../types";
import { nearestColorFamily } from "../youcam/garmentColor";
import { SHOP_INDEX_CAPTURED_AT, SHOP_LISTINGS } from "./listings";

type IndexTradition = GarmentTradition;

/**
 * Four colours is enough to shop from and few enough to scan. The palette
 * carries eight; showing all of them turns a shortlist back into a catalog.
 */
const MAX_COLORS = 4;
const MAX_PER_COLOR = 3;

/** What this tradition's wedding-guest garment is actually called when searching for one. */
const GARMENT_WORD: Record<IndexTradition, string> = {
  western: "maxi dress",
  indian: "saree",
  east_asian: "qipao",
  middle_eastern: "kaftan",
};

interface SearchRetailer {
  retailer: string;
  build: (query: string) => string;
}

const enc = encodeURIComponent;

/**
 * Only retailers whose search-URL shape is known to be stable are listed here.
 * A dead link in the one section that promises "you can actually buy this"
 * does more damage than a shorter list, so unverified patterns are left out.
 */
const AMAZON: SearchRetailer = { retailer: "Amazon", build: (q) => `https://www.amazon.com/s?k=${enc(q)}` };
const ETSY: SearchRetailer = { retailer: "Etsy", build: (q) => `https://www.etsy.com/search?q=${enc(q)}` };

const SEARCH_RETAILERS: Record<IndexTradition, SearchRetailer[]> = {
  western: [
    { retailer: "Nordstrom", build: (q) => `https://www.nordstrom.com/sr?keyword=${enc(q)}` },
    { retailer: "ASOS", build: (q) => `https://www.asos.com/search/?q=${enc(q)}` },
    AMAZON,
  ],
  indian: [
    { retailer: "Myntra", build: (q) => `https://www.myntra.com/search?q=${enc(q)}` },
    { retailer: "AJIO", build: (q) => `https://www.ajio.com/search/?text=${enc(q)}` },
    AMAZON,
  ],
  east_asian: [ETSY, AMAZON],
  middle_eastern: [
    { retailer: "Modanisa", build: (q) => `https://www.modanisa.com/en/search?q=${enc(q)}` },
    ETSY,
    AMAZON,
  ],
};

/** "any" is a browsing preference, not a garment type — shop it as western. */
export function resolveIndexTradition(tradition: TraditionPreference): IndexTradition {
  return tradition === "any" ? "western" : tradition;
}

/**
 * Turns the measured palette into somewhere to actually shop.
 *
 * Each hero colour is snapped to the nearest catalog colour family, and the
 * baked listing index is queried for real garments filed under that family in
 * the user's dressing tradition. Listings are never repeated across colours —
 * seeing the same dress under both "Rust" and "Terracotta" would make the
 * match look arbitrary.
 *
 * Note what is and is not claimed. The colour is measured from the user's
 * face; the garment is filed under the colour word its own retailer used. We
 * cannot measure a retailer's product photo reliably enough to score it (see
 * `listings.ts`), so this returns places to look, not verdicts. Anything
 * stronger would be inventing evidence.
 *
 * Returns null when there is no palette to shop, rather than an empty shell.
 */
export function buildShopYourPalette(
  heroColors: readonly PaletteColor[],
  tradition: TraditionPreference,
): ShopYourPalette | null {
  if (heroColors.length === 0) return null;

  const indexTradition = resolveIndexTradition(tradition);
  const garmentWord = GARMENT_WORD[indexTradition];
  const usedFamilies = new Set<ColorFamily>();
  const groups: ShopColorGroup[] = [];

  // Scan the whole palette rather than the first few colours, and allow each
  // colour family only once.
  //
  // Several hero colours routinely snap to a single family — an autumn
  // palette collapses Rust, Olive and Terracotta onto `terracotta`, because
  // the family match is a plain RGB nearest-neighbour and goes hue-blind at
  // low lightness. Taking the first four colours by position therefore
  // produced near-duplicate headings competing over one bucket of listings,
  // and whichever lost rendered empty. Worse, it put the wrong word on the
  // screen: "Olive" over a row of rust garments is a visible lie.
  //
  // One group per family, labelled by the first palette colour that claimed
  // it, keeps every heading truthful about what sits beneath it.
  for (const paletteColor of heroColors) {
    if (groups.length >= MAX_COLORS) break;

    const rgb = hexToRgb(paletteColor.hex);
    if (!rgb) continue;

    const { colorFamily } = nearestColorFamily([rgb.r, rgb.g, rgb.b]);
    if (usedFamilies.has(colorFamily)) continue;

    const listings = SHOP_LISTINGS.filter(
      (l) => l.tradition === indexTradition && l.colorFamily === colorFamily,
    )
      .slice(0, MAX_PER_COLOR)
      .map((l) => ({ id: l.id, title: l.title, retailer: l.retailer, url: l.url, imageUrl: l.imageUrl }));

    // A heading with nothing under it reads as a broken page, and the search
    // links alone do not carry a group.
    if (listings.length === 0) continue;

    usedFamilies.add(colorFamily);

    const query = `${paletteColor.name} ${garmentWord}`;
    const searchLinks: ShopSearchLink[] = SEARCH_RETAILERS[indexTradition].map((r) => ({
      retailer: r.retailer,
      url: r.build(query),
    }));

    groups.push({ paletteColor, colorFamily, listings, searchLinks });
  }

  if (groups.length === 0) return null;

  return { capturedAt: SHOP_INDEX_CAPTURED_AT, garmentWord, groups };
}
