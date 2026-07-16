import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Bath, LayoutGrid, Grid3x3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import Thumbnail from '@/components/Thumbnail';
import {
  buildDevelopments,
  bedRange,
  bathRange,
  type Development,
  type UnitRow,
} from '@/lib/developments';
import residential from '@/assets/proj-residential.jpg';

type Columns = 2 | 4;

const SoldProjects = () => {
  const [rows, setRows] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<Columns>(4);
  const [sort, setSort] = useState<'az' | 'za'>('az');

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

  const developments = useMemo(() => {
    const list = buildDevelopments(rows, { sold: true });
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return sort === 'az' ? sorted : sorted.reverse();
  }, [rows, sort]);

  const gridClass =
    columns === 2
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12'
      : 'grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10';

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
        {!loading && developments.length > 0 && (
          <div className="flex items-center justify-between border-b border-border pb-4 mb-8">
            <p className="text-sm text-muted-foreground">
              {developments.length} of {developments.length} Results
            </p>
            <div className="flex items-center gap-4">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'az' | 'za')}
                className="text-sm border border-border rounded-none px-3 py-1.5 bg-background text-foreground"
                aria-label="Sort projects"
              >
                <option value="az">Sort A to Z</option>
                <option value="za">Sort Z to A</option>
              </select>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setColumns(2)}
                  aria-label="2 columns"
                  aria-pressed={columns === 2}
                  className={`p-1.5 border ${columns === 2 ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setColumns(4)}
                  aria-label="4 columns"
                  aria-pressed={columns === 4}
                  className={`p-1.5 border ${columns === 4 ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}
                >
                  <Grid3x3 size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className={gridClass}>
            {Array.from({ length: columns === 2 ? 4 : 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="pt-3 space-y-3">
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
          <div className={gridClass}>
            {developments.map((d: Development, i) => (
              <article key={`${d.name}-${d.slug}`} className="group reveal" data-reveal-delay={String((i % 4) * 75)}>
                <Link to={`/developments/${d.slug}`} className="block">
                  <div className="relative overflow-hidden">
                    <Thumbnail
                      src={d.cover || residential}
                      alt={d.location ? `${d.name} — ${d.location}` : d.name}
                      wrapperClassName="aspect-[4/3]"
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 inline-flex px-2.5 py-1 bg-white text-[hsl(212_100%_10%)] text-xs font-semibold">
                      {d.name}
                    </span>
                  </div>
                  <div className={columns === 2 ? 'pt-4 flex items-center justify-between gap-4' : 'pt-3'}>
                    <p className="font-montserrat font-extrabold uppercase text-sm text-foreground">
                      {d.location || d.name}
                    </p>
                    <div className="flex items-center gap-3 text-muted-foreground text-sm shrink-0 mt-1">
                      {bedRange(d) && (
                        <span className="inline-flex items-center gap-1">
                          <BedDouble size={16} /> {bedRange(d)}
                        </span>
                      )}
                      {bathRange(d) && (
                        <span className="inline-flex items-center gap-1">
                          <Bath size={16} /> {bathRange(d)}
                        </span>
                      )}
                    </div>
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
