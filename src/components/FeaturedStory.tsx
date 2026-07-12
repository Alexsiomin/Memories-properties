import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-land.jpg';

type Listing = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  price: string | null;
  cover_image: string | null;
  status: string | null;
};

const FeaturedStory = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, location, price, cover_image, status')
        .not('cover_image', 'is', null)
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8);
      if (!cancelled && data) setListings(data as Listing[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const current = listings[idx];
  const total = listings.length;
  const prev = () => setIdx((i) => (total ? (i - 1 + total) % total : 0));
  const next = () => setIdx((i) => (total ? (i + 1) % total : 0));

  return (
    <section className="reveal" id="portfolio">
      <div className="overflow-hidden bg-[hsl(212_100%_10%)] text-white">
        <div className="relative min-h-[320px] lg:min-h-[480px] group">
          <Link
            to={current?.slug ? `/properties/${current.slug}` : '/properties'}
            className="block absolute inset-0"
            aria-label={current?.title ?? 'Browse properties'}
          >
            <img
              src={current?.cover_image || heroImage}
              alt={current?.title ?? 'Featured property'}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </Link>

          {current && (
            <Link
              to={current.slug ? `/properties/${current.slug}` : '/properties'}
              className="absolute left-6 right-6 bottom-20 text-white pointer-events-auto"
            >
              {current.status && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-sm">
                  <span className="size-1.5 rounded-full bg-accent" />
                  {current.status}
                </span>
              )}
              <h3 className="mt-3 text-2xl md:text-3xl font-medium leading-tight">{current.title}</h3>
            </Link>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous"
              onClick={prev}
              disabled={total < 2}
              className="w-10 h-10 rounded-full border border-white/70 text-white flex items-center justify-center bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white/80 text-sm tabular-nums min-w-[3rem] text-center">
              {total ? `${idx + 1} / ${total}` : '—'}
            </span>
            <button
              type="button"
              aria-label="Next"
              onClick={next}
              disabled={total < 2}
              className="w-10 h-10 rounded-full border border-white/70 text-white flex items-center justify-center bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedStory;
