import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getRecentlyViewedIds } from '@/lib/visitor-journey';
import { useFavorites } from '@/hooks/use-favorites';
import { publicTitle, publicLocation, publicPrice } from '@/lib/propertyDisplay';
import ListingGallery from '@/components/ListingGallery';

interface Row {
  id: string;
  slug: string | null;
  title: string;
  location: string;
  city: string | null;
  region: string | null;
  price: string;
  price_value: number | null;
  status: string | null;
  cover_image: string | null;
  images: string[] | null;
  image_key: string;
}

const IMAGE_MAP: Record<string, string> = {};

/**
 * "Continue browsing" — the visitor's own recently-viewed properties from
 * this device, surfaced back to them. The IDs were already being collected
 * (via visitor-journey.ts) purely to give the sales team context on a lead
 * when they enquire, but were never shown back to the visitor themselves.
 *
 * Fetches fresh data for each ID rather than trusting the locally-stored
 * title/slug, since price or status may have changed since the view — a
 * property that's sold since being viewed is simply left out rather than
 * shown as if still available.
 */
export default function RecentlyViewed({ excludeId, className }: { excludeId?: string; className?: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const { isFavorite, toggle } = useFavorites();

  useEffect(() => {
    let cancelled = false;
    const ids = getRecentlyViewedIds(excludeId);
    if (!ids.length) { setRows([]); return; }
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, location, city, region, price, price_value, status, cover_image, images, image_key')
        .in('id', ids)
        .not('listing_type', 'eq', 'withdrawn');
      if (cancelled) return;
      const byId = new Map((data ?? []).map((r: any) => [r.id, r as Row]));
      // Preserve the visitor's own most-recent-first order rather than
      // whatever order the database happens to return.
      const ordered = ids.map((id) => byId.get(id)).filter((r): r is Row => !!r);
      setRows(ordered.slice(0, 6));
    })();
    return () => { cancelled = true; };
  }, [excludeId]);

  if (!rows || rows.length === 0) return null;

  return (
    <section className={className ?? 'container mx-auto px-6 py-12'}>
      <div className="flex items-center gap-2 mb-6">
        <Eye size={20} className="text-accent" />
        <h2 className="text-2xl font-semibold text-foreground">Continue browsing</h2>
      </div>
      <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
        {rows.map((r) => {
          const img = r.cover_image || IMAGE_MAP[r.image_key] || '';
          const images = r.images && r.images.length ? r.images : img ? [img] : [];
          const href = `/properties/${r.slug ?? r.id}`;
          return (
            <Link
              key={r.id}
              to={href}
              className="group snap-start shrink-0 basis-[80%] xs:basis-[65%] sm:basis-auto sm:shrink overflow-hidden bg-card border border-border rounded-none hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="relative">
                {images.length > 0 ? (
                  <ListingGallery images={images} alt={`${publicTitle(r.title)} — ${publicLocation(r)}`} />
                ) : (
                  <div className="aspect-[4/3] bg-muted" />
                )}
                <span className="absolute top-0 left-0 inline-flex items-center px-3 py-1.5 rounded-none bg-foreground text-background text-[11px] font-semibold uppercase tracking-wide">
                  {/sold|closed|under offer/i.test(r.status ?? '') ? 'Sold' : 'For Sale'}
                </span>
                <button
                  type="button"
                  aria-label={isFavorite(r.id) ? 'Remove from watchlist' : 'Save to watchlist'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggle({
                      property_id: r.id,
                      property_title: publicTitle(r.title),
                      property_location: publicLocation(r),
                      property_price: r.price,
                      property_image: img,
                    });
                  }}
                  className={`absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-none backdrop-blur transition-colors text-xs shadow-sm ${
                    isFavorite(r.id) ? 'bg-accent text-accent-foreground' : 'bg-white/90 hover:text-accent text-foreground'
                  }`}
                >
                  <Star size={14} fill={isFavorite(r.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="p-5">
                <p className="text-lg font-semibold text-foreground tracking-wider break-words">
                  {publicPrice(r.price, r.price_value ?? undefined, r.status ?? undefined)}
                </p>
                <p className="text-foreground/60 mt-0.5 text-sm truncate">{publicTitle(r.title)}</p>
                <p className="text-foreground/60 text-sm">{publicLocation(r)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
