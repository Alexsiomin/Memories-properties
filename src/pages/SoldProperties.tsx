import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import Thumbnail from '@/components/Thumbnail';
import { publicLocation, publicTitle } from '@/lib/propertyDisplay';

type SoldRow = {
  id: string;
  title: string;
  location: string;
  city: string | null;
  region: string | null;
  district: string | null;
  category: string | null;
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

const SoldProperties = () => {
  const [items, setItems] = useState<SoldRow[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, title, location, city, region, district, category, price, price_value, cover_image, slug')
        .ilike('status', '%sold%')
        .order('price_value', { ascending: false, nullsFirst: false });
      if (!active) return;
      setItems((data ?? []) as SoldRow[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SEO
        title="Sold Properties | Memories"
        description="Browse our track record of sold properties — individual homes and villas we have successfully closed."
      />
      <PageHeader
        title="Sold properties"
        intro="A record of individual listings we have successfully sold."
      />

      <section className="container mx-auto px-6 py-10">
        {items === null && (
          <div className="text-foreground/60 text-base">Loading…</div>
        )}

        {items && items.length === 0 && (
          <div className="rounded-2xl border border-foreground/10 p-10 text-center">
            <p className="text-lg text-foreground/70">
              Sold listings will appear here as soon as they are recorded.
            </p>
          </div>
        )}

        {items && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((p) => {
              const href = p.slug ? `/properties/${p.slug}` : `/properties/${p.id}`;
              return (
                <article key={p.id} className="group">
                  <Link
                    to={href}
                    className="block overflow-hidden bg-card border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="relative">
                      <Thumbnail
                        src={p.cover_image || ''}
                        alt={publicTitle(p.title)}
                        wrapperClassName="aspect-[4/3]"
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 grayscale-[35%]"
                      />
                      <span className="absolute top-0 left-0 inline-flex items-center px-3 py-1.5 rounded-none bg-foreground/85 text-background text-[11px] font-semibold uppercase tracking-wide">
                        Sold
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-medium truncate group-hover:text-accent transition-colors">
                        {publicTitle(p.title)}
                      </h3>
                      <p className="text-foreground/60 text-base mt-1 truncate">
                        {publicLocation(p)}
                      </p>
                      <p className="text-xl font-semibold text-foreground mt-3">
                        {formatPrice(p.price_value, p.price)}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
};

export default SoldProperties;
