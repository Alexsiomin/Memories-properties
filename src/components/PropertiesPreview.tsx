import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import EnquiryDialog, { type EnquiryProperty } from '@/components/EnquiryDialog';
import Thumbnail from '@/components/Thumbnail';
import { supabase } from '@/integrations/supabase/client';
import { publicLocation, publicPrice, publicTitle } from '@/lib/propertyDisplay';
import hero from '@/assets/proj-residential.jpg';

type Tab = 'Featured' | 'Houses' | 'Apartments' | 'Projects';

type Property = {
  id: string;
  slug: string | null;
  img: string;
  images?: string[];
  title: string;
  location: string;
  city?: string | null;
  region?: string | null;
  district?: string | null;
  price: string | null;
  price_value: number | null;
  beds: number | null;
  baths: number | null;
  cat: string;
  badge?: string;
  listing_type: string;
  status: string;
  size?: string | null;
  internal_area?: string | null;
  covered_verandas?: string | null;
  lot_size?: string | null;
};

const parseAreaNum = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const n = parseFloat(s.replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
};

const TABS: Tab[] = ['Featured', 'Houses', 'Apartments', 'Projects'];

const HOUSE_CATS = new Set(['Villa', 'Townhouse', 'Bungalow', 'Coastal', 'Vineyard']);
const APARTMENT_CATS = new Set(['Apartment', 'Penthouse']);
const PROJECT_CATS = new Set(['Commercial', 'Mixed-use', 'Commercial and Residential Building', 'Boutique Hotel', 'Hotel', 'Development', 'Urban Tower', 'Agricultural Estate']);

const filterByTab = (rows: Property[], tab: Tab): Property[] => {
  const sold = (s: string) => /sold|under offer/i.test(s);
  const activeSale = (r: Property) => r.listing_type === 'sale' && !sold(r.status);
  if (tab === 'Featured') return rows.filter(activeSale);
  if (tab === 'Houses') return rows.filter((r) => activeSale(r) && HOUSE_CATS.has(r.cat));
  if (tab === 'Apartments') return rows.filter((r) => activeSale(r) && APARTMENT_CATS.has(r.cat));
  return rows.filter((r) => activeSale(r) && PROJECT_CATS.has(r.cat));
};

const PropertiesPreview = () => {
  const [tab, setTab] = useState<Tab>('Featured');
  const [rows, setRows] = useState<Property[]>([]);
  const [selected, setSelected] = useState<EnquiryProperty | null>(null);
  const [open, setOpen] = useState(false);
  const { isFavorite, toggle } = useFavorites();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, slug, title, location, city, region, district, category, price, price_value, beds, baths, cover_image, images, status, listing_type, sort_order, created_at, size, internal_area, covered_verandas, lot_size')
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(40);
      if (cancelled || error || !data) return;
      const mapped: Property[] = data.map((row: any) => ({
        id: row.id,
        slug: row.slug,
        img: row.cover_image || (row.images && row.images[0]) || hero,
        images: row.images || [],
        title: row.title,
        location: row.location,
        city: row.city,
        region: row.region,
        district: row.district,
        price: row.price,
        price_value: row.price_value,
        beds: row.beds,
        baths: row.baths ?? row.beds,
        cat: row.category,
        listing_type: row.listing_type,
        status: row.status,
        size: row.size,
        internal_area: row.internal_area,
        covered_verandas: row.covered_verandas,
        lot_size: row.lot_size,
      }));
      setRows(mapped);
    })();
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    const filtered = filterByTab(rows, tab);
    if (filtered.length > 0) return filtered.slice(0, 4);
    // Fallback: show the most recent active sale listing so the section is never empty
    const activeSales = rows.filter((r) => r.listing_type === 'sale' && !/sold|under offer/i.test(r.status));
    return activeSales.slice(0, 4);
  }, [rows, tab]);

  const openEnquiry = (p: Property) => {
    setSelected({
      title: publicTitle(p.title),
      location: publicLocation(p),
      price: publicPrice(p.price, p.price_value, p.status),
      cat: p.cat,
      img: p.img,
      status: p.status,
    });
    setOpen(true);
  };

  const featured = visible[0];
  const rest = visible.slice(1);

  const featuredImages = featured?.images?.length ? featured.images : featured?.img ? [featured.img] : [];
  const [featuredImgIndex, setFeaturedImgIndex] = useState(0);

  useEffect(() => {
    setFeaturedImgIndex(0);
  }, [featured?.id]);

  const goPrev = () => {
    setFeaturedImgIndex((i) => (i === 0 ? featuredImages.length - 1 : i - 1));
  };
  const goNext = () => {
    setFeaturedImgIndex((i) => (i === featuredImages.length - 1 ? 0 : i + 1));
  };

  return (
    <section className="mt-20 light-panel px-4 py-8 sm:p-8 rounded-none">
      <div className="text-center reveal">
        <h2 className="font-montserrat font-extrabold leading-[0.95] tracking-tight text-foreground uppercase md:text-4xl text-2xl">
          Properties We Love
        </h2>

        <div
          role="tablist"
          aria-label="Browse properties"
          className="mt-8 flex items-center justify-center gap-8 md:gap-12"
        >
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`relative pb-2 text-sm md:text-base transition-colors ${
                tab === t
                  ? 'text-foreground font-medium'
                  : 'text-foreground/60 font-normal hover:text-foreground'
              }`}
            >
              {t}
              <span
                className={`absolute left-0 right-0 -bottom-px h-px bg-foreground transition-opacity ${
                  tab === t ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center text-foreground/60 py-12">
          No listings available in this category yet.
        </div>
      ) : (
        <>
          {featured && (
            <article className="group reveal mt-10">
              <Link to={featured.slug ? `/properties/${featured.slug}` : '/properties'} className="block">
                <div className="relative overflow-hidden -mx-5">
                  <Thumbnail
                    src={featuredImages[featuredImgIndex] || featured.img}
                    alt={`${publicTitle(featured.title)}${publicLocation(featured) ? ` — ${publicLocation(featured)}` : ''}`}
                    wrapperClassName="aspect-[4/3]"
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  {featuredImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); goPrev(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/30 backdrop-blur-md text-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); goNext(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/30 backdrop-blur-md text-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
                <div className="mt-6 text-center">
                  <h3 className="font-montserrat font-extrabold tracking-tight uppercase text-foreground text-xl md:text-2xl">
                    {publicTitle(featured.title)}
                  </h3>
                  <p className="mt-2 text-muted-foreground text-base md:text-lg">
                    {(() => {
                      const internalNum = parseAreaNum(featured.internal_area);
                      const coveredNum = parseAreaNum(featured.covered_verandas);
                      const computedTotalNum = (internalNum ?? 0) + (coveredNum ?? 0);
                      const totalCoveredArea = computedTotalNum > 0
                        ? `${computedTotalNum.toFixed(2).replace(/\.00$/, '')} m²`
                        : featured.size;
                      const priceLabel = publicPrice(featured.price, featured.price_value, featured.status);
                      return [
                        featured.beds && featured.beds > 0 ? `${featured.beds} bds` : null,
                        featured.baths && featured.baths > 0 ? `${featured.baths} ba` : null,
                        totalCoveredArea,
                        featured.lot_size,
                        priceLabel,
                      ].filter(Boolean).join(' · ');
                    })()}
                  </p>
                  <p className="mt-1 text-muted-foreground text-base md:text-lg">
                    {publicLocation(featured)}
                  </p>
                </div>
              </Link>
            </article>
          )}

          {rest.length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-6 lg:gap-8">
              {rest.map((p, i) => (
                <article
                  key={p.id}
                  className="group reveal"
                  data-reveal-delay={String(i * 100)}
                >
                  <div className="overflow-hidden bg-card border border-border rounded-none hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    <Link to={p.slug ? `/properties/${p.slug}` : '/properties'} className="block">
                      <div className="relative">
                        <Thumbnail
                          src={p.img}
                          alt={`${publicTitle(p.title)}${publicLocation(p) ? ` — ${publicLocation(p)}` : ''}`}
                          wrapperClassName="aspect-[4/3]"
                          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                        <span className="absolute top-0 left-0 inline-flex items-center px-3 py-1.5 rounded-none bg-foreground/85 text-background text-[11px] font-semibold uppercase tracking-wide">
                          {/sold|closed|under offer/i.test(p.status) ? 'Sold' : p.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                        </span>
                        <button
                          type="button"
                          aria-label={isFavorite(p.id) ? 'Remove from watchlist' : 'Save to watchlist'}
                          onClick={(e) => {
                            e.preventDefault();
                            toggle({
                              property_id: p.id,
                              property_title: publicTitle(p.title),
                              property_location: publicLocation(p),
                              property_price: publicPrice(p.price, p.price_value, p.status),
                              property_image: p.img,
                            });
                          }}
                          className={`absolute top-0 right-0 w-10 h-6 flex items-center justify-center rounded-none backdrop-blur-md transition-colors shadow-sm ${
                            isFavorite(p.id)
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-background/30 text-primary hover:bg-background/50'
                          }`}
                        >
                          <Star size={14} fill={isFavorite(p.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <div className="p-5">
                        <h3 className="font-montserrat font-extrabold uppercase tracking-tight text-base leading-snug text-foreground flex items-start gap-1.5">
                          <span>{publicTitle(p.title)}</span>
                          <ArrowUpRight
                            size={16}
                            className="shrink-0 mt-0.5 text-accent opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                          />
                        </h3>
                        <p className="text-muted-foreground text-base mt-1 truncate whitespace-nowrap">
                          {publicLocation(p)}
                          {publicLocation(p) && [
                            p.beds && p.beds > 0 ? `${p.beds} bds` : null,
                            p.baths && p.baths > 0 ? `${p.baths} ba` : null,
                            p.cat,
                          ].filter(Boolean).length > 0 && (
                            <span className="text-foreground/60">
                              {' · ' +
                                [
                                  p.beds && p.beds > 0 ? `${p.beds} bds` : null,
                                  p.baths && p.baths > 0 ? `${p.baths} ba` : null,
                                  p.cat,
                                ]
                                  .filter(Boolean)
                                  .join(' | ')}
                            </span>
                          )}
                        </p>
                        <p className="text-foreground font-semibold text-base mt-2">{publicPrice(p.price, p.price_value, p.status)}</p>
                      </div>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-12 flex justify-center">
        <Link
          to="/properties"
          className="btn-cta"
        >
          View all properties
        </Link>
      </div>

      <EnquiryDialog property={selected} open={open} onOpenChange={setOpen} />
    </section>
  );
};

export default PropertiesPreview;
