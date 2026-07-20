import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import Thumbnail from '@/components/Thumbnail';
import {
  buildDevelopments,
  bedRange,
  bathRange,
  formatEur,
  priceRange,
  soldStatsByProject,
  type Development,
  type UnitRow,
} from '@/lib/developments';
import residential from '@/assets/proj-residential.jpg';

const SoldProjects = () => {
  const [rows, setRows] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'az' | 'za'>('az');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, location, category, price, price_value, beds, baths, status, listing_type, cover_image, images, project_name')
        .not('developer_id', 'is', null)
        .limit(2000);
      if (!cancelled) {
        setRows((data as UnitRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const developments = useMemo(() => {
    const list = buildDevelopments(rows, { sold: true });
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return sort === 'az' ? sorted : sorted.reverse();
  }, [rows, sort]);

  // Sold-progress stats need the full unfiltered row set — every project
  // shown here is already 100% sold by definition (that's what qualifies it
  // for this page), so this naturally renders "X of X sold — 100%".
  const soldStats = useMemo(() => soldStatsByProject(rows), [rows]);

  return (
    <>
      <SEO
        title="Sold Projects | Memories"
        description="Explore our portfolio of sold-out developments and completed projects — a track record of successful new-build communities."
      />
      <div className="container mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-2">
        <h1 className="text-center font-semibold tracking-tight text-[hsl(212_100%_10%)] uppercase text-2xl sm:text-4xl mb-4">
          Sold Out Developments
        </h1>
        <p className="max-w-[60ch] mx-auto text-center text-muted-foreground text-base sm:text-lg leading-snug mb-8 sm:mb-10">
          A showcase of completed and fully sold projects — proof of demand for the developments we represent.
        </p>
      </div>

      <section className="container mx-auto px-4 sm:px-6 pt-10">
        {!loading && developments.length > 0 && (
          <div className="flex items-center justify-between border-b border-border pb-4 mb-8">
            <p className="text-sm text-muted-foreground">
              {developments.length} of {developments.length} Results
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'az' | 'za')}
              className="text-sm border border-border rounded-none px-3 py-1.5 bg-background text-foreground"
              aria-label="Sort projects"
            >
              <option value="az">Sort A to Z</option>
              <option value="za">Sort Z to A</option>
            </select>
          </div>
        )}
      </section>

      {/* Listings — fixed 1 column on mobile, 2 on desktop; edge-to-edge on
          mobile, padded from sm: up, matching the Projects page. */}
      <section className="container mx-auto px-0 sm:px-6 pb-10">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {developments.map((d: Development, i) => (
              <article key={`${d.slug}-${i}`} className="group reveal" data-reveal-delay={String((i % 2) * 100)}>
                <Link
                  to={`/developments/${d.slug}`}
                  className="block rounded-none overflow-hidden bg-card border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative">
                    <Thumbnail
                      src={d.cover || residential}
                      alt={d.location ? `Sold-out development in ${d.location}` : 'Sold-out development'}
                      wrapperClassName="aspect-[4/3]"
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    {d.location && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur text-foreground text-xs font-medium">
                        <MapPin size={12} />
                        {d.location}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    {d.minPrice != null && (
                      <p className="text-lg font-semibold text-foreground flex items-start gap-1.5">
                        {d.minPrice === d.maxPrice
                          ? formatEur(d.minPrice)
                          : `From ${priceRange(d)}`}
                        <ArrowUpRight
                          size={18}
                          className="shrink-0 mt-0.5 text-accent opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                        />
                      </p>
                    )}
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-base">
                      {[bedRange(d), bathRange(d), d.categories[0]].filter(Boolean).join(' | ')}
                    </p>
                    {(() => {
                      const s = soldStats.get(d.name);
                      if (!s || s.total === 0) return null;
                      return (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                            <span>{s.sold} of {s.total} sold</span>
                            <span>{s.pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${s.pct}%` }} />
                          </div>
                        </div>
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
