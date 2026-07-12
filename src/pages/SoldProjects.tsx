import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import Thumbnail from '@/components/Thumbnail';
import {
  buildDevelopments,
  bedRange,
  formatEur,
  soldStatsByProject,
  type Development,
  type UnitRow,
} from '@/lib/developments';
import residential from '@/assets/proj-residential.jpg';

const SoldProjects = () => {
  const [rows, setRows] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, location, category, price, price_value, beds, baths, status, listing_type, cover_image, images')
        .not('developer_id', 'is', null)
        .limit(2000);
      if (!cancelled) {
        setRows((data as UnitRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const developments = useMemo(() => buildDevelopments(rows, { sold: true }), [rows]);
  const soldStats = useMemo(() => soldStatsByProject(rows), [rows]);

  return (
    <>
      <SEO
        title="Sold Projects | Memories"
        description="Explore our portfolio of sold-out developments and completed projects — a track record of successful new-build communities."
      />
      <PageHeader
        title="Sold-out developments"
        intro="A showcase of completed and fully sold projects — proof of demand for the developments we represent."
      />

      <section className="container mx-auto px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-none overflow-hidden border border-border">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : developments.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            No sold projects to show yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {developments.map((d: Development, i) => (
              <article key={`${d.name}-${d.slug}`} className="group reveal" data-reveal-delay={String((i % 3) * 100)}>
                <Link
                  to={`/developments/${d.slug}`}
                  className="block rounded-none overflow-hidden bg-card border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative">
                    <Thumbnail
                      src={d.cover || residential}
                      alt={d.location ? `Sold property in ${d.location}` : 'Sold property'}
                      wrapperClassName="aspect-[4/3]"
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 grayscale-[35%]"
                    />
                    <span className="absolute top-0 left-0 inline-flex px-2.5 py-1 rounded-none bg-foreground/85 backdrop-blur text-background text-[11px] font-semibold tracking-wide uppercase">
                      Sold out
                    </span>
                  </div>
                  <div className="p-5">
                    {d.minPrice != null && (
                      <p className="text-xl font-semibold text-foreground">
                        From {formatEur(d.minPrice)}
                      </p>
                    )}
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-base">
                      {[`${d.unitCount} unit${d.unitCount === 1 ? '' : 's'} sold`, bedRange(d), d.categories.join(', ')].filter(Boolean).join(' | ')}
                    </p>
                    {d.location && <p className="text-foreground/60 text-base mt-2">{d.location}</p>}
                    {(() => {
                      const s = soldStats.get(d.name);
                      if (!s || s.soldValue <= 0) return null;
                      return (
                        <p className="text-foreground/50 text-sm mt-2">Total sold: {formatEur(s.soldValue)}</p>
                      );
                    })()}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default SoldProjects;
