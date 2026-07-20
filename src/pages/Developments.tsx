import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, MapPin, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import Thumbnail from '@/components/Thumbnail';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

const TABS = ['Buy', 'Rent', 'Sold', 'Projects'] as const;
type Tab = (typeof TABS)[number];
const MODE_BY_TAB: Record<Tab, string> = { Buy: 'Buy', Rent: 'Invest', Sold: 'Sold', Projects: 'Projects' };

const Developments = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [tab, setTab] = useState<Tab>('Projects');
  const [query, setQuery] = useState('');

  // Heading reflects the searched location, same pattern as the Buy page;
  // defaults to Paphos when nothing has been searched yet.
  const headingLocation = useMemo(() => {
    const q = query.trim();
    if (!q) return 'Paphos';
    const parts = q.split(',').map((s) => s.trim()).filter(Boolean);
    return parts[0] || q;
  }, [query]);
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [openPopover, setOpenPopover] = useState<'type' | 'filters' | 'filters-mobile' | null>(null);
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, location, category, price, price_value, beds, baths, status, listing_type, cover_image, images, created_at, project_name')
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

  const allCategories = useMemo(
    () => Array.from(new Set(developments.flatMap((d) => d.categories))).sort(),
    [developments],
  );

  const filteredDevelopments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return developments.filter((d) => {
      const matchesQuery = !q || d.name.toLowerCase().includes(q) || (d.location ?? '').toLowerCase().includes(q);
      const matchesCats = activeCats.length === 0 || d.categories.some((c) => activeCats.includes(c));
      return matchesQuery && matchesCats;
    });
  }, [developments, query, activeCats]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'Projects') return; // already on the projects view
    const params = new URLSearchParams();
    params.set('mode', MODE_BY_TAB[tab]);
    if (query.trim()) params.set('locs', query.trim());
    navigate(`/properties?${params.toString()}`);
  };

  const toggleCat = (c: string) =>
    setActiveCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const sortedDevelopments = useMemo(() => {
    const list = [...filteredDevelopments];
    switch (sortBy) {
      case 'price-desc':
        return list.sort((a, b) => {
          if (a.minPrice == null) return 1;
          if (b.minPrice == null) return -1;
          return b.minPrice - a.minPrice;
        });
      case 'availability-desc':
        return list.sort((a, b) => b.unitCount - a.unitCount || a.name.localeCompare(b.name));
      case 'availability-asc':
        return list.sort((a, b) => a.unitCount - b.unitCount || a.name.localeCompare(b.name));
      case 'newest':
      default:
        return list.sort((a, b) => {
          if (a.createdAt == null) return 1;
          if (b.createdAt == null) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
  }, [filteredDevelopments, sortBy]);

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

      <div className="container mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-2">
        <h1 className="text-center font-semibold tracking-tight text-[hsl(212_100%_10%)] uppercase text-2xl sm:text-4xl mb-8 sm:mb-10">
          Projects for Sale in {headingLocation}
        </h1>
      </div>

      {/* Search bar — same bar/BUY pill used across the site */}
      <div className="container mx-auto px-6">
        <form onSubmit={onSearch} className="w-full max-w-[974px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-0 sm:bg-[hsl(0_0%_90%)]">
            <div className="flex items-stretch bg-[hsl(0_0%_90%)] sm:bg-transparent sm:contents">
            <Popover open={openPopover === 'type'} onOpenChange={(o) => setOpenPopover(o ? 'type' : null)}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group/ctrl inline-flex items-center justify-between gap-3 w-32 sm:w-44 pl-4 sm:pl-6 pr-3 sm:pr-5 h-[48px] bg-[hsl(212_100%_10%)] text-white uppercase tracking-[0.08em] font-montserrat font-extrabold hover:opacity-95 transition-opacity whitespace-nowrap text-xs shrink-0"
                >
                  <span>{tab}</span>
                  <ChevronDown size={18} className="opacity-80 transition-transform duration-200 group-data-[state=open]/ctrl:rotate-180" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={0} className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none bg-white border border-[hsl(212_100%_10%)]/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] z-[60]">
                {TABS.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setOpenPopover(null);
                      if (t === 'Projects') { setTab(t); return; }
                      // Buy/Rent/Sold aren't shown on this page — take the
                      // user straight to the Properties listing filtered
                      // that way, same as everywhere else this dropdown appears.
                      const params = new URLSearchParams();
                      params.set('mode', MODE_BY_TAB[t]);
                      if (query.trim()) params.set('locs', query.trim());
                      navigate(`/properties?${params.toString()}`);
                    }}
                    className={`w-full text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold transition-colors ${
                      i > 0 ? 'border-t border-[hsl(212_100%_10%)]/10' : ''
                    } ${
                      tab === t ? 'bg-[hsl(212_100%_10%)] text-white' : 'text-[hsl(212_100%_10%)] hover:text-accent transition-colors'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by project name or location"
                className="w-full h-[48px] bg-transparent px-4 text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="pr-3 text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="submit"
              aria-label="Search"
              className="sm:hidden inline-flex items-center justify-center w-10 h-full text-foreground shrink-0"
            >
              <Search size={18} strokeWidth={2} />
            </button>
            </div>

            {/* Filter pill (desktop) */}
            <Popover open={openPopover === 'filters'} onOpenChange={(o) => setOpenPopover(o ? 'filters' : null)}>
              <PopoverTrigger asChild>
                <div className="hidden sm:flex items-center bg-[hsl(0_0%_90%)] pr-3 py-1.5 pl-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-8 bg-white text-foreground text-xs font-medium border border-[hsl(212_100%_10%)]/10 hover:border-accent/40 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Filter</span>
                    <span className="text-base leading-none">+</span>
                    {activeCats.length > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                        {activeCats.length}
                      </span>
                    )}
                  </button>
                </div>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={4} className="w-64 p-4 rounded-none bg-white border border-[hsl(212_100%_10%)]/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] z-[60]">
                <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[hsl(212_100%_10%)]/60 mb-3">Category</p>
                <div className="space-y-2">
                  {allCategories.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={activeCats.includes(c)} onChange={() => toggleCat(c)} className="accent-accent" />
                      {c}
                    </label>
                  ))}
                  {allCategories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
                </div>
              </PopoverContent>
            </Popover>

            {/* Desktop search submit (icon only) */}
            <button
              type="submit"
              aria-label="Search"
              className="hidden sm:inline-flex items-center justify-center w-10 h-[48px] text-foreground hover:text-foreground/70 transition-colors shrink-0 bg-[hsl(0_0%_90%)]"
            >
              <Search size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Mobile filter row — full width, with + on the right, own Popover
              so it anchors correctly (the desktop trigger is hidden here). */}
          <Popover open={openPopover === 'filters-mobile'} onOpenChange={(o) => setOpenPopover(o ? 'filters-mobile' : null)}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="sm:hidden mt-2 inline-flex items-center justify-between px-5 h-10 max-h-10 bg-white border border-[hsl(212_100%_10%)]/15 text-[hsl(212_100%_10%)] text-sm font-medium w-full"
              >
                <span>Filter</span>
                <span className="inline-flex items-center gap-2">
                  {activeCats.length > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                      {activeCats.length}
                    </span>
                  )}
                  <span className="text-lg leading-none">+</span>
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" sideOffset={4} className="w-[calc(100vw-3rem)] max-w-sm p-4 rounded-none bg-white border border-[hsl(212_100%_10%)]/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] z-[60]">
              <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[hsl(212_100%_10%)]/60 mb-3">Category</p>
              <div className="space-y-2">
                {allCategories.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={activeCats.includes(c)} onChange={() => toggleCat(c)} className="accent-accent" />
                    {c}
                  </label>
                ))}
                {allCategories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
              </div>
            </PopoverContent>
          </Popover>
        </form>
      </div>

      <section className="container mx-auto px-4 sm:px-6 pt-10">
        {!loading && developments.length > 0 && (
          <div className="flex items-center justify-between gap-4 border-b border-[hsl(212_100%_10%)]/10 pb-4 mb-6">
            <p className="text-sm text-[hsl(212_100%_10%)]/60">
              {sortedDevelopments.length} {sortedDevelopments.length === 1 ? 'Result' : 'Results'}
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <label className="sr-only" htmlFor="development-sort">Sort by</label>
              <div className="relative w-full max-w-[10.5rem] sm:w-44 sm:max-w-none shrink-0">
                <select
                  id="development-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-10 appearance-none truncate rounded-none bg-foreground text-background text-xs sm:text-sm pl-4 pr-8 focus:outline-none focus:ring-0 border-none uppercase tracking-[0.12em] sm:tracking-[0.2em] font-montserrat font-extrabold cursor-pointer"
                >
                  <option value="newest" className="bg-white text-foreground normal-case font-normal">Newest</option>
                  <option value="price-desc" className="bg-white text-foreground normal-case font-normal">High to Low</option>
                  <option value="availability-desc" className="bg-white text-foreground normal-case font-normal">Most Availability</option>
                  <option value="availability-asc" className="bg-white text-foreground normal-case font-normal">Least Availability</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-background/80" />
              </div>
              {/* Grid size toggle */}
              <div className="hidden lg:flex items-center gap-1">
                {([2, 3, 4] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} columns`}
                    onClick={() => setGridCols(n)}
                    className={`h-10 px-2 inline-flex items-center gap-[3px] transition-colors ${
                      gridCols === n ? 'text-[hsl(212_100%_10%)]' : 'text-[hsl(212_100%_10%)]/30 hover:text-accent transition-colors text-xs'
                    }`}
                  >
                    {Array.from({ length: n }).map((_, j) => (
                      <span key={j} className="w-[3px] h-4 bg-current" />
                    ))}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Listings — edge-to-edge on mobile, padded from sm: up, matching Buy page */}
      <section className="container mx-auto px-0 sm:px-6 pb-10">
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
        ) : sortedDevelopments.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            {developments.length === 0
              ? 'No developments are available for sale right now.'
              : 'No developments match your search — try a different name, location, or category.'}
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-8 ${gridCols === 2 ? 'lg:grid-cols-2' : gridCols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
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
