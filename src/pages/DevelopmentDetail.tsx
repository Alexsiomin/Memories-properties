import { useEffect, useMemo, useState } from 'react';
import PropertyMap from '@/components/PropertyMap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Building2, Calendar, Tag, MapPin, BedDouble, Bath, ChevronLeft, ChevronRight, Home as HomeIcon, Ruler } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import Thumbnail from '@/components/Thumbnail';
import ListingGallery from '@/components/ListingGallery';
import TourDialog, { type TourProperty } from '@/components/TourDialog';
import EnquiryDialog, { type EnquiryProperty } from '@/components/EnquiryDialog';
import { publicPrice, publicTitle } from '@/lib/propertyDisplay';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import {
  buildDevelopments,
  bedRange,
  bathRange,
  totalCoveredAreaRange,
  priceRange,
  formatEur,
  isSold,
  isReserved,
  soldStatsByProject,
  type Development,
  type UnitRow,
} from '@/lib/developments';
import residential from '@/assets/proj-residential.jpg';

const colHidden = (tags: string[] | null | undefined, key: string) => tags?.includes(`hidden:${key}`);
const parseAreaNum = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const n = parseFloat(String(s).replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
};
const totalAreaValue = (u: any): string | null => {
  if (u.size) return u.size;
  const internal = parseAreaNum(u.internal_area);
  const covered = parseAreaNum(u.covered_verandas);
  if (internal != null && covered != null) return `${(internal + covered).toFixed(2).replace(/\.00$/, '')} m²`;
  if (internal != null) return `${internal.toFixed(2).replace(/\.00$/, '')} m²`;
  return null;
};
const tagValue = (tags: string[] | null | undefined, re: RegExp) => {
  const t = tags?.find((x) => re.test(x));
  return t ? t.replace(re, '') : null;
};

const isColumnEmpty = (units: UnitRow[], key: string) => {
  switch (key) {
    case 'internal_area':
      return units.every((u) => !u.internal_area);
    case 'covered_verandas':
      return units.every((u) => !u.covered_verandas);
    case 'uncovered_verandas':
      return units.every((u) => !tagValue(u.tags, /^uncovered verandas?\s+/i));
    case 'basement':
      return units.every((u) => !tagValue(u.tags, /^basement\s+/i));
    case 'storage_room':
      return units.every((u) => !tagValue(u.tags, /^storage room\s+/i));
    case 'roof_garden':
      return units.every((u) => !tagValue(u.tags, /^roof garden\s+/i));
    case 'parking':
      return units.every((u) => !u.parking_spaces);
    case 'covered_parking':
      return units.every((u) => !tagValue(u.tags, /^covered parking\s+/i));
    case 'floor':
      return units.every((u) => !tagValue(u.tags, /^floor level\s+/i));
    case 'baths':
      return units.every((u) => u.baths == null);
    case 'lot_size':
      return units.every((u) => !u.lot_size);
    default:
      return false;
  }
};

const DevelopmentDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [openTour, setOpenTour] = useState(false);
  const [openEnquiry, setOpenEnquiry] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [rows, setRows] = useState<UnitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, location, category, price, price_value, beds, baths, status, listing_type, cover_image, images, internal_area, size, covered_verandas, tags, lot_size, parking_spaces, latitude, longitude')
        .not('developer_id', 'is', null)
        .limit(2000);
      if (!cancelled) {
        setRows((data as UnitRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dev: Development | undefined = useMemo(() => {
    const full = buildDevelopments(rows, { all: true });
    // The listing cards link using slugs built from the DEFAULT (available-only)
    // set, whose unitCount/minPrice — and therefore slug — can differ from the
    // { all: true } build. Match the slug against both so links always resolve,
    // then always return the full development (including sold units).
    const direct = full.find((d) => d.slug === slug);
    if (direct) return direct;
    const fromDefault = buildDevelopments(rows).find((d) => d.slug === slug);
    if (fromDefault) return full.find((d) => d.name === fromDefault.name) ?? fromDefault;
    return undefined;
  }, [rows, slug]);

  const stats = useMemo(() => (dev ? soldStatsByProject(rows).get(dev.name) : undefined), [rows, dev]);
  const publicDevTitle = dev
    ? `${dev.categories[0] ?? 'New homes'} in ${dev.location ?? 'Cyprus'}`
    : 'New homes';

  const units = useMemo(
    () => (dev ? [...dev.units].sort((a, b) => (a.price_value ?? 0) - (b.price_value ?? 0)) : []),
    [dev],
  );

  const allSold = useMemo(
    () => units.length > 0 && units.every((u) => isSold(u)),
    [units],
  );

  const gallery = useMemo(() => {
    if (!dev) return [residential];
    const images: string[] = [];
    const seen = new Set<string>();
    const add = (src: string | null | undefined) => {
      if (src && !seen.has(src)) { seen.add(src); images.push(src); }
    };
    add(dev.cover);
    for (const u of dev.units) {
      add(u.cover_image);
      if (u.images) u.images.forEach(add);
    }
    const limited = images.slice(0, 25);
    return limited.length ? limited : [residential];
  }, [dev]);

  const totalGallery = gallery.length;
  const galleryImg = gallery[galleryIndex] ?? gallery[0];
  const goPrev = () => setGalleryIndex((i) => (i - 1 + totalGallery) % totalGallery);
  const goNext = () => setGalleryIndex((i) => (i + 1) % totalGallery);

  if (!loading && !dev) {
    return (
      <section className="container mx-auto px-6 py-24 text-center">
        <p className="text-muted-foreground">This development is no longer available.</p>
        <Link to="/developments" className="text-accent underline mt-4 inline-block">
          Back to developments
        </Link>
      </section>
    );
  }

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';

  const jsonLd = dev
    ? (() => {
        const devUrl = `${origin}/developments/${dev.slug}`;
        const isLand = dev.categories.some((c) => c.toLowerCase().includes('land'));
        const offerCount = units.filter(
          (u) => !/sold|under offer|reserved/i.test(u.status ?? ''),
        ).length;

        const realEstateListing: Record<string, unknown> = {
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          '@id': `${devUrl}#listing`,
          name: publicDevTitle,
          description: `${publicDevTitle}: ${dev.unitCount} units${
            isLand ? '' : dev.minBeds != null ? ` with ${dev.minBeds}+ beds` : ''
          } available${dev.minPrice != null ? ` from ${formatEur(dev.minPrice)}` : ''}.`,
          url: devUrl,
          image: gallery,
          numberOfItems: dev.unitCount,
          ...(dev.location
            ? { address: { '@type': 'PostalAddress', addressLocality: dev.location } }
            : {}),
          ...(dev.minPrice != null
            ? {
                offers: {
                  '@type': 'AggregateOffer',
                  priceCurrency: 'EUR',
                  lowPrice: dev.minPrice,
                  ...(dev.maxPrice != null ? { highPrice: dev.maxPrice } : {}),
                  offerCount: offerCount || dev.unitCount,
                  availability:
                    offerCount > 0
                      ? 'https://schema.org/InStock'
                      : 'https://schema.org/SoldOut',
                  seller: { '@type': 'Organization', name: 'Memories' },
                },
              }
            : {}),
        };

        const itemList: Record<string, unknown> = {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `${publicDevTitle} — available units`,
          numberOfItems: units.length,
          itemListElement: units.slice(0, 50).map((u, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${origin}/properties/${u.slug || u.id}`,
            name: publicTitle(u.title),
          })),
        };

        const breadcrumb: Record<string, unknown> = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Projects for Sale',
              item: `${origin}/developments`,
            },
            { '@type': 'ListItem', position: 3, name: publicDevTitle, item: devUrl },
          ],
        };

        return [realEstateListing, itemList, breadcrumb];
      })()
    : undefined;

  return (
    <>
      <SEO
        title={
          dev
            ? `New Development in ${dev.location ?? 'Cyprus'}${
                dev.minPrice ? ` - From ${formatEur(dev.minPrice)}` : ''
              }`
            : 'New Homes | Memories'
        }
        description={
          dev
            ? `${dev.name} — a new-build development in ${dev.location ?? 'Cyprus'}. ${
                dev.unitCount
              } unit${dev.unitCount === 1 ? '' : 's'}${
                dev.minPrice ? ` from ${formatEur(dev.minPrice)}` : ''
              }.`
            : 'Explore new homes available for sale.'
        }
        type="article"
        image={dev?.cover ?? undefined}
        jsonLd={jsonLd}
      />




      {/* Gallery + sticky CTA + units table in one grid */}
      {dev && (
        <section className="container mx-auto px-6 pt-0 md:pt-8 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Breadcrumb — below gallery on mobile, above on desktop */}
          <div className="order-2 lg:col-span-3 lg:row-start-1 -mx-6 md:mx-0 px-6 md:px-0 pt-4 md:pt-0 pb-2">
            <Breadcrumb>
              <BreadcrumbList className="text-xs sm:text-sm flex-nowrap overflow-hidden">
                <BreadcrumbItem className="shrink-0">
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem className="shrink-0">
                  <BreadcrumbLink asChild>
                    <Link to="/developments">Projects for Sale</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate max-w-[140px] sm:max-w-[240px] md:max-w-none">{publicDevTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {/* Gallery block — first on mobile, second row on desktop */}
          <div className="order-1 lg:col-span-2 lg:row-start-2">
            <div className="relative overflow-hidden bg-muted group -mx-6 md:mx-0 h-[75vh] md:h-auto">
              {allSold && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-black/50">
                  <span className="font-montserrat font-extrabold tracking-tight uppercase text-white text-4xl md:text-6xl border-2 border-white px-6 py-3 md:px-10 md:py-5 -rotate-6">
                    Sold Out
                  </span>
                </div>
              )}
              <button
                type="button"
                aria-label="View all photos"
                className="block w-full h-full text-left"
              >
                <img
                  src={galleryImg}
                  alt={`${publicDevTitle} — photo ${galleryIndex + 1} of ${totalGallery}`}
                  width={1920}
                  height={1200}
                  loading="eager"
                  decoding="async"
                  // @ts-expect-error - fetchpriority is valid HTML, missing in React types
                  fetchpriority="high"
                  className="w-full h-full md:aspect-[16/10] object-cover"
                />
              </button>

              {/* Gradient + title overlay — mobile only */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none md:hidden bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                <div className="p-6 pb-10">
                  <p className="font-mono uppercase tracking-[0.08em] font-semibold text-sm text-white/80">New homes</p>
                  <h1 className="font-montserrat font-extrabold tracking-tighter leading-[0.95] mt-1 text-2xl text-white">
                    {publicDevTitle}
                  </h1>
                  {dev?.location && (
                    <p className="mt-1 flex items-center gap-1.5 text-white/80 text-base">
                      <MapPin size={16} /> {dev.location}
                    </p>
                  )}
                </div>
              </div>

              {totalGallery > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={goPrev}
                    className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 text-white/90 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={goNext}
                    className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 text-white/90 hover:text-white transition-colors"
                  >
                    <ChevronRight size={32} />
                  </button>

                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-foreground/75 text-background text-xs backdrop-blur z-20">
                    {galleryIndex + 1} / {totalGallery}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {totalGallery > 1 && (
              <div className="mt-3 hidden md:grid grid-cols-5 gap-3">
                {gallery.slice(0, 5).map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setGalleryIndex(i)}
                    aria-label={`View photo ${i + 1}`}
                    className={`relative overflow-hidden aspect-[4/3] bg-muted transition-all ${
                      i === galleryIndex ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rest of details — below breadcrumb on mobile, third row on desktop */}
          <div className="order-3 lg:col-span-2 lg:row-start-3">
            <div className="pt-8 pb-6 border-b border-foreground/15 hidden md:block">
              <Link to="/developments" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4">
                <ArrowLeft size={16} /> All new homes
              </Link>
              <div className="flex items-end justify-between gap-8">
                <div className="min-w-0">
                  <p className="label text-accent">New homes</p>
                  <h1 className="font-montserrat font-extrabold tracking-tighter leading-[0.95] mt-2 text-2xl">
                    {publicDevTitle}
                  </h1>
                  {dev && dev.location && (
                    <p className="mt-2 flex items-center gap-1.5 text-muted-foreground text-lg">
                      <MapPin size={16} /> {dev.location}
                    </p>
                  )}
                </div>
                {stats && stats.sold > 0 && (
                  <div className="w-56 shrink-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
                      <span>{stats.sold} of {stats.total} units sold</span>
                      <span>{stats.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${stats.pct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Key details */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FactCard icon={<Building2 size={18} />} label="Units" value={`${dev.unitCount}`} />
              <FactCard icon={<BedDouble size={18} />} label="Beds" value={dev.minBeds != null ? bedRange(dev) : '—'} />
              <FactCard icon={<Tag size={18} />} label="Price" value={dev.minPrice != null ? (dev.minPrice === dev.maxPrice ? formatEur(dev.minPrice) : `From ${formatEur(dev.minPrice)}`) : '—'} />
              <FactCard icon={<HomeIcon size={18} />} label="Type" value={dev.categories[0] ?? '—'} />
            </div>

            {/* Units table */}
            <div className="mt-10">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/60 text-muted-foreground text-left">
                        <th className="px-4 py-3 font-medium w-12">#</th>
                        <th className="px-4 py-3 font-medium">Lots</th>
                        {!colHidden(units[0]?.tags, 'internal_area') && !isColumnEmpty(units, 'internal_area') && <th className="px-4 py-3 font-medium">Internal area</th>}
                        <th className="px-4 py-3 font-medium">Total area</th>
                        {!colHidden(units[0]?.tags, 'covered_verandas') && !isColumnEmpty(units, 'covered_verandas') && <th className="px-4 py-3 font-medium">Covered veranda</th>}
                        {!colHidden(units[0]?.tags, 'uncovered_verandas') && !isColumnEmpty(units, 'uncovered_verandas') && <th className="px-4 py-3 font-medium">Uncovered veranda</th>}
                        {!colHidden(units[0]?.tags, 'basement') && !isColumnEmpty(units, 'basement') && <th className="px-4 py-3 font-medium">Basement</th>}
                        {!colHidden(units[0]?.tags, 'storage_room') && !isColumnEmpty(units, 'storage_room') && <th className="px-4 py-3 font-medium">Storage room</th>}
                        {!colHidden(units[0]?.tags, 'roof_garden') && !isColumnEmpty(units, 'roof_garden') && <th className="px-4 py-3 font-medium">Roof garden</th>}
                        {!colHidden(units[0]?.tags, 'floor') && !isColumnEmpty(units, 'floor') && <th className="px-4 py-3 font-medium">Floor</th>}
                        <th className="px-4 py-3 font-medium">Beds</th>
                        {!colHidden(units[0]?.tags, 'baths') && !isColumnEmpty(units, 'baths') && <th className="px-4 py-3 font-medium">Baths</th>}
                        {!colHidden(units[0]?.tags, 'lot_size') && !isColumnEmpty(units, 'lot_size') && <th className="px-4 py-3 font-medium">Land</th>}
                        {!colHidden(units[0]?.tags, 'parking') && !isColumnEmpty(units, 'parking') && <th className="px-4 py-3 font-medium">Parking</th>}
                        {!colHidden(units[0]?.tags, 'covered_parking') && !isColumnEmpty(units, 'covered_parking') && <th className="px-4 py-3 font-medium">Covered parking</th>}
                        <th className="px-4 py-3 font-medium text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((u: any, index: number) => (
                        <tr
                          key={u.id}
                          className="border-t border-border hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => u.slug && navigate(`/properties/${u.slug}`)}
                        >
                          <td className="px-4 py-4 text-muted-foreground font-medium">{index + 1}</td>
                          <td className="px-4 py-4 font-semibold text-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              {u.category || '—'}
                              {isSold(u) ? (
                                <span className="inline-flex items-center rounded-md bg-foreground/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                                  Sold
                                </span>
                              ) : (
                                <ArrowUpRight size={14} className="text-accent" />
                              )}
                            </span>
                          </td>
                          {!colHidden(u.tags, 'internal_area') && !isColumnEmpty(units, 'internal_area') && <td className="px-4 py-4 text-muted-foreground">{u.internal_area || '—'}</td>}
                          <td className="px-4 py-4 text-muted-foreground">{totalAreaValue(u) || '—'}</td>
                          {!colHidden(u.tags, 'covered_verandas') && !isColumnEmpty(units, 'covered_verandas') && <td className="px-4 py-4 text-muted-foreground">{u.covered_verandas || '—'}</td>}
                          {!colHidden(u.tags, 'uncovered_verandas') && !isColumnEmpty(units, 'uncovered_verandas') && <td className="px-4 py-4 text-muted-foreground">{tagValue(u.tags, /^uncovered verandas?\s+/i) || '—'}</td>}
                          {!colHidden(u.tags, 'basement') && !isColumnEmpty(units, 'basement') && <td className="px-4 py-4 text-muted-foreground">{tagValue(u.tags, /^basement\s+/i) || '—'}</td>}
                          {!colHidden(u.tags, 'storage_room') && !isColumnEmpty(units, 'storage_room') && <td className="px-4 py-4 text-muted-foreground">{tagValue(u.tags, /^storage room\s+/i) || '—'}</td>}
                          {!colHidden(u.tags, 'roof_garden') && !isColumnEmpty(units, 'roof_garden') && <td className="px-4 py-4 text-muted-foreground">{tagValue(u.tags, /^roof garden\s+/i) || '—'}</td>}
                          {!colHidden(u.tags, 'floor') && !isColumnEmpty(units, 'floor') && <td className="px-4 py-4 text-muted-foreground">{tagValue(u.tags, /^floor level\s+/i) || '—'}</td>}
                          <td className="px-4 py-4 text-muted-foreground">{u.beds ?? '—'}</td>
                          {!colHidden(u.tags, 'baths') && !isColumnEmpty(units, 'baths') && <td className="px-4 py-4 text-muted-foreground">{u.baths ?? '—'}</td>}
                          {!colHidden(u.tags, 'lot_size') && !isColumnEmpty(units, 'lot_size') && <td className="px-4 py-4 text-muted-foreground">{u.lot_size || '—'}</td>}
                          {!colHidden(u.tags, 'parking') && !isColumnEmpty(units, 'parking') && <td className="px-4 py-4 text-muted-foreground">{u.parking_spaces ?? '—'}</td>}
                          {!colHidden(u.tags, 'covered_parking') && !isColumnEmpty(units, 'covered_parking') && <td className="px-4 py-4 text-muted-foreground">{tagValue(u.tags, /^covered parking\s+/i) || '—'}</td>}
                          <td className="px-4 py-4 text-right font-semibold text-foreground">
                            {isSold(u) ? (
                              <span className="inline-flex items-center rounded-md bg-foreground/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                                Sold
                              </span>
                            ) : isReserved(u) ? (
                              <span className="inline-flex items-center rounded-md bg-foreground/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                                Reserved
                              </span>
                            ) : (
                              publicPrice(u.price, u.price_value, null)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Location map */}
              {(() => {
                const coordUnit = dev.units.find((u) => u.latitude != null && u.longitude != null);
                if (!coordUnit) return null;
                return (
                  <div className="mt-10">
                    <h3 className="text-2xl font-montserrat font-extrabold text-foreground uppercase">Location</h3>
                    <PropertyMap
                      latitude={coordUnit.latitude!}
                      longitude={coordUnit.longitude!}
                      title={publicDevTitle}
                      className="mt-5 w-full h-[350px] overflow-hidden border border-border bg-muted"
                      locked
                      onLockedInteract={() => setOpenEnquiry(true)}
                    />
                  </div>
                );
              })()}
            </div>
          </div>

          {/* RIGHT — Sticky CTA card */}
          <aside className="order-4 lg:col-span-1 lg:row-start-2 lg:row-span-2 lg:self-stretch">
            <div className="lg:sticky lg:top-24">
              <div className="rounded-none border border-border bg-card p-5">
              {allSold ? (
                <>
                  <span className="inline-block font-montserrat font-extrabold uppercase tracking-tight bg-foreground text-background px-3 py-1 text-sm">
                    Sold Out
                  </span>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    This development is fully sold
                  </p>
                  <p className="mt-1 text-muted-foreground text-base">
                    {[dev.location, `${dev.unitCount} units`].filter(Boolean).join(' | ')}
                  </p>
                  <Link
                    to="/sold-properties"
                    className="mt-5 w-full h-12 rounded-none bg-foreground text-background font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center"
                  >
                    View sold projects
                  </Link>
                  <Link
                    to="/developments"
                    className="mt-3 w-full h-12 rounded-none bg-slate-100 border border-border hover:border-foreground/40 transition-colors font-semibold text-foreground inline-flex items-center justify-center"
                  >
                    Browse available developments
                  </Link>
                </>
              ) : (
                <>
              <p className="text-lg font-semibold text-foreground">
                {dev.minPrice != null ? `From ${formatEur(dev.minPrice)}` : 'Price on request'}
              </p>
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-base">
                {[dev.location, bedRange(dev), `${dev.unitCount} units`].filter(Boolean).join(' | ')}
              </p>

              {/* Tour scheduler quick-pick */}
              <div className="mt-5">
                <p className="font-semibold text-foreground mb-2 text-base">Tour Property</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const d = new Date();
                    d.setHours(0, 0, 0, 0);
                    let added = 0;
                    let offset = 0;
                    while (added < 4) {
                      const check = new Date(d);
                      check.setDate(d.getDate() + offset);
                      if (check.getDay() !== 0) {
                        if (added === i) {
                          d.setDate(d.getDate() + offset);
                          break;
                        }
                        added++;
                      }
                      offset++;
                    }
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setOpenTour(true)}
                        className="py-2 rounded-none border border-border hover:border-accent hover:text-accent transition-colors text-center text-xs"
                      >
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}
                        </p>
                        <p className="text-base font-semibold text-foreground leading-none mt-1">{d.getDate()}</p>
                        <p className="text-[10px] uppercase text-muted-foreground mt-0.5">
                          {d.toLocaleDateString(undefined, { month: 'short' })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setOpenTour(true)}
                className="mt-3 w-full h-12 rounded-none bg-foreground text-background font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
              >
                Request a tour
              </button>
              <button
                onClick={() => setOpenEnquiry(true)}
                className="mt-3 w-full h-12 rounded-none bg-slate-100 border border-border hover:border-foreground/40 transition-colors font-semibold text-foreground inline-flex items-center justify-center"
              >
                Contact Agent
              </button>
                </>
              )}
            </div>
          </div>
        </aside>
        </section>
      )}

      {dev && (
        <>
          <TourDialog
            open={openTour}
            onOpenChange={setOpenTour}
            property={{
              id: dev.slug,
              title: publicDevTitle,
              location: dev.location ?? '',
              image: dev.cover ?? residential,
              price: dev.minPrice != null ? `From ${formatEur(dev.minPrice)}` : 'Price on request',
              beds: dev.minBeds,
              baths: dev.minBaths,
              size: null,
              totalCoveredArea: totalCoveredAreaRange(dev.units),
            } as TourProperty}
          />
          <EnquiryDialog
            open={openEnquiry}
            onOpenChange={setOpenEnquiry}
            property={{
              title: publicDevTitle,
              cat: dev.categories[0] ?? 'Development',
              location: dev.location ?? '',
              price: dev.minPrice != null ? `From ${formatEur(dev.minPrice)}` : 'Price on request',
              status: 'Available',
              img: dev.cover ?? residential,
            } as EnquiryProperty}
          />
        </>
      )}
    </>
  );
};

const FactCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
    <div className="text-muted-foreground">{icon}</div>
    <p className="mt-2 font-semibold text-foreground leading-tight text-base sm:text-xl whitespace-nowrap">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
  </div>
);

export default DevelopmentDetail;
