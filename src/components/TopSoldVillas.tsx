import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { publicLocation, publicTitle } from '@/lib/propertyDisplay';

type SoldVilla = {
  id: string;
  title: string;
  location: string;
  city: string | null;
  region: string | null;
  district: string | null;
  price: string;
  price_value: number | null;
  cover_image: string | null;
  slug: string | null;
};

const formatPrice = (value: number | null, fallback: string) => {
  if (value && value > 0) {
    return `€${new Intl.NumberFormat('en-US').format(value)}`;
  }
  return fallback;
};

const TopSoldVillas = () => {
  const [items, setItems] = useState<SoldVilla[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, location, city, region, district, price, price_value, cover_image, slug')
        .ilike('category', '%villa%')
        .ilike('status', '%sold%')
        .order('price_value', { ascending: false, nullsFirst: false })
        .limit(10);
      if (!active) return;
      if (error) {
        setItems([]);
        return;
      }
      setItems((data ?? []) as SoldVilla[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="w-full px-2 sm:px-6 py-20 border-t border-foreground/10 sm:container sm:mx-auto sm:max-w-7xl">
      <div className="flex items-end justify-between gap-6 mb-12">
        <div>
          <p className="label mb-3 text-foreground/60">Recent transactions</p>
          <h2 className="text-3xl font-light tracking-tight md:text-3xl">
            10 Most Expensive Villas Sold
          </h2>
        </div>
      </div>

      {items === null && (
        <div className="text-foreground/60 text-base">Loading…</div>
      )}

      {items && items.length === 0 && (
        <div className="rounded-2xl border border-foreground/10 p-10 text-center">
          <p className="text-lg text-foreground/70">
            Sold villa transactions will appear here as soon as they are recorded.
          </p>
        </div>
      )}

      {items && items.length > 0 && (
        <ol className="divide-y divide-foreground/10 border-t border-b border-foreground/10">
          {items.map((v, i) => {
            const href = v.slug ? `/properties/${v.slug}` : `/properties/${v.id}`;
            return (
              <li key={v.id}>
                <Link
                  to={href}
                  className="grid grid-cols-[40px_72px_1fr_auto] md:grid-cols-[56px_96px_1fr_auto] items-center gap-4 md:gap-8 py-5 group"
                >
                  <span className="font-mono text-base md:text-lg text-foreground/50 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="aspect-[4/3] overflow-hidden rounded-md bg-foreground/5">
                    {v.cover_image ? (
                      <img
                        src={v.cover_image}
                        alt={publicTitle(v.title)}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base md:text-xl font-medium truncate group-hover:text-accent transition-colors">
                      {publicTitle(v.title)}
                    </h3>
                    <p className="text-sm md:text-base text-foreground/60 truncate">
                      {publicLocation(v)}
                    </p>
                  </div>
                  <span className="text-base md:text-xl font-medium whitespace-nowrap">
                    {formatPrice(v.price_value, v.price)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

export default TopSoldVillas;
