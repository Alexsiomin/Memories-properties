import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUpRight, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';
import Thumbnail from '@/components/Thumbnail';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  buildDevelopments,
  bedRange,
  bathRange,
  priceRange,
  formatEur,
  soldStatsByProject,
  type Development,
  type UnitRow,
} from '@/lib/developments';
import residential from '@/assets/proj-residential.jpg';

const Developments = () => {
  const [rows, setRows] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('default');

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

  const developments = useMemo(() => buildDevelopments(rows), [rows]);
  const soldStats = useMemo(() => soldStatsByProject(rows), [rows]);

  const sortedDevelopments = useMemo(() => {
    const list = [...developments];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => {
          if (a.minPrice == null) return 1;
          if (b.minPrice == null) return -1;
          return a.minPrice - b.minPrice;
        });
      case 'price-desc':
        return list.sort((a, b) => {
          if (a.minPrice == null) return 1;
          if (b.minPrice == null) return -1;
          return b.minPrice - a.minPrice;
        });
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'availability-asc':
        return list.sort((a, b) => a.unitCount - b.unitCount || a.name.localeCompare(b.name));
      case 'availability-desc':
        return list.sort((a, b) => b.unitCount - a.unitCount || a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [developments, sortBy]);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com'}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Projects for Sale',
      },
    ],
  };

  return (
    <>
      <SEO
        title="New Developments for Sale | Memories"
        description="Browse new-build developments and projects for sale — apartment blocks, villa communities and more, with prices from the lowest available unit."
        jsonLd={breadcrumbJsonLd}
      />
      <div className="container mx-auto px-6 pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Projects for Sale</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <PageHeader title="PROJECTS FOR SALE" />

      <section className="container mx-auto px-6 py-10">
        {!loading && developments.length > 0 && (
          <div className="flex items-center justify-end mb-6">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full max-w-[220px] sm:w-[220px] h-9 text-sm rounded-none border-border bg-card">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="price-asc">Price: low to high</SelectItem>
                  <SelectItem value="price-desc">Price: high to low</SelectItem>
                  <SelectItem value="name-asc">Name: A–Z</SelectItem>
                  <SelectItem value="availability-asc">Availability: least first</SelectItem>
                  <SelectItem value="availability-desc">Availability: most first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
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
            No developments are available for sale right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedDevelopments.map((d: Development, i) => (
              <article key={`${d.slug}-${i}`} className="group reveal" data-reveal-delay={String((i % 3) * 100)}>
                <Link
                  to={`/developments/${d.slug}`}
                  className="block rounded-none overflow-hidden bg-card border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative">
                    <Thumbnail
                      src={d.cover || residential}
                      alt={d.location ? `New development in ${d.location}` : 'New development'}
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

export default Developments;
