import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Search } from 'lucide-react';
import type { ResultsScreenProps } from '@/types/screen-props';
import { resolveDemoAssetUrl } from '@/lib/demoAssets';

type ShopData = NonNullable<ResultsScreenProps['report']['shopping']>;
type ShopGroup = ShopData['groups'][number];

interface ShopYourPaletteSectionProps {
  shopping: ResultsScreenProps['report']['shopping'];
}

/** "maxi dress" -> "maxi dresses", "saree" -> "sarees". */
function pluralise(word: string): string {
  return /(s|x|z|ch|sh)$/i.test(word) ? `${word}es` : `${word}s`;
}

/** "2026-08-15" -> "15 Aug 2026". Parsed as parts so it can't shift by timezone. */
function formatCapturedAt(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = Number(match[2]) - 1;
  const month = months[monthIndex] ?? match[2];
  return `${Number(match[3])} ${month} ${match[1]}`;
}

function ColorGroup({ group }: { group: ShopGroup }) {
  return (
    <div className="mb-14 last:mb-0" data-testid={`shop-group-${group.colorFamily}`}>
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <span
          className="w-9 h-9 border border-border/60 shrink-0"
          style={{ backgroundColor: group.paletteColor.hex }}
          data-testid={`shop-group-swatch-${group.colorFamily}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h3 className="text-xl font-serif text-foreground leading-tight">{group.paletteColor.name}</h3>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-0.5">
            {group.paletteColor.hex}
          </p>
        </div>
        {/* The measured colour and the retailer's colour word are not the
            same thing, and the gap is visible: "Forest Green" heads garments
            retailers call teal. Naming the retailer bucket here stops the
            heading from appearing to describe the clothes below it. */}
        <span
          className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0 text-right"
          data-testid={`shop-group-retailer-colour-${group.colorFamily}`}
        >
          Retailer colour
          <span className="block text-foreground">{group.colorFamily.replace(/_/g, ' ')}</span>
        </span>
      </div>

      {group.listings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-5">
          {group.listings.map((listing) => (
            <a
              key={listing.id}
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-testid={`shop-listing-${listing.id}`}
            >
              <div className="aspect-[3/4] bg-secondary border border-border overflow-hidden">
                <img
                  src={resolveDemoAssetUrl(listing.imageUrl)}
                  alt={listing.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
              <p className="mt-3 text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {listing.title}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground font-mono truncate">
                {listing.retailer}
                <ArrowUpRight className="w-3 h-3 shrink-0 opacity-60" />
              </p>
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mr-1">
          <Search className="w-3 h-3" />
          More in this colour
        </span>
        {group.searchLinks.map((link) => (
          <a
            key={link.retailer}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            data-testid={`shop-search-${group.colorFamily}-${link.retailer.toLowerCase()}`}
          >
            {link.retailer}
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Turns the verdict into something actionable: real listings, in the colours
 * measured from the user's own face.
 *
 * The honesty line at the bottom is not decoration. Everything above it in
 * this report is measured — the palette from their selfie, the proof shot
 * from a real try-on. These listings are not: they are filed under the colour
 * word each retailer chose, because retailer product photography cannot be
 * colour-measured reliably enough to score. Saying so plainly is what keeps
 * the measured claims credible.
 */
export function ShopYourPaletteSection({ shopping }: ShopYourPaletteSectionProps) {
  if (!shopping || shopping.groups.length === 0) return null;

  const garments = pluralise(shopping.garmentWord);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="mb-24"
      data-testid="shop-your-palette"
    >
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-5 border border-border/50">
          Where to find it
        </div>
        <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-3">Shop your palette</h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Your strongest measured colours, each matched to real {garments} that retailers themselves
          label in that colour — across{' '}
          {new Set(shopping.groups.flatMap((g) => g.listings.map((l) => l.retailer))).size} independent
          shops, not one sponsored storefront.
        </p>
      </div>

      {shopping.groups.map((group) => (
        <ColorGroup key={group.paletteColor.hex} group={group} />
      ))}

      <p
        className="mt-10 pt-5 border-t border-border text-xs text-muted-foreground leading-relaxed max-w-3xl"
        data-testid="shop-provenance-note"
      >
        <span className="font-semibold text-foreground">How these were matched.</span> We measured your
        colouring — we did not measure these garments. Each group takes your palette colour to the nearest
        retailer colour word (shown beside it) and lists garments filed under that word, so treat them as
        leads rather than scored verdicts like the try-on above. Listings gathered{' '}
        {formatCapturedAt(shopping.capturedAt)} and not checked since, so some will have sold out.
      </p>
    </motion.section>
  );
}
