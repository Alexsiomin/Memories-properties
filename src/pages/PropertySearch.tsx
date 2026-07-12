import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { MapPin, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import { publicLocation, publicTitle, publicPrice } from '@/lib/propertyDisplay';
import { optimizeImage } from '@/lib/img';
import {
  parseSearchSlug,
  buildSearchSlug,
  facetHeading,
  facetDescription,
  facetIntro,
  facetPlaceName,
  facetLocationDef,
  matchesFacets,
  relatedSearches,
} from '@/lib/searchFacets';
import hero from '@/assets/hero-land.jpg';

interface PropertyRow {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  city: string | null;
  region: string | null;
  district: string | null;
  price: string | null;
  price_value: number | null;
  category: string | null;
  beds: number | null;
  status: string | null;
  cover_image: string | null;
}

const ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';

const PropertySearch = () => {
  const { slug } = useParams<{ slug: string }>();
  const facets = slug ? parseSearchSlug(slug) : null;
  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facets) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('properties')
        .select(
          'id, slug, title, location, city, region, district, price, price_value, category, beds, status, cover_image',
        )
        .order('sort_order', { ascending: true });
      if (cancelled || !data) {
        setLoading(false);
        return;
      }
      setRows((data as PropertyRow[]).filter((p) => matchesFacets(facets, p)));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const related = useMemo(() => (facets ? relatedSearches(facets) : []), [facets]);

  if (!slug || !facets) return <Navigate to="/properties" replace />;

  // Enforce canonical slug — redirect non-canonical variants.
  const canonicalSlug = buildSearchSlug(facets);
  if (canonicalSlug !== slug) {
    return <Navigate to={`/property-search/${canonicalSlug}`} replace />;
  }

  const heading = facetHeading(facets);
  const description = facetDescription(facets);
  const intro = facetIntro(facets);
  const place = facetPlaceName(facets);
  const locDef = facetLocationDef(facets);
  const canonical = `${ORIGIN}/property-search/${canonicalSlug}`;

  const jsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: heading,
      description: intro,
      url: canonical,
      about: { '@type': 'Place', name: `${place}, Cyprus` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: rows.length,
        itemListElement: rows.slice(0, 25).map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${ORIGIN}/properties/${p.slug ?? p.id}`,
          name: publicTitle(p.title),
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Properties', item: `${ORIGIN}/properties` },
        { '@type': 'ListItem', position: 3, name: heading, item: canonical },
      ],
    },
  ];

  return (
    <main>
      <SEO
        title={`${heading} | Memories`}
        description={description}
        type="website"
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0">
          <img
            src={hero}
            alt={`${place}, Cyprus property`}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-foreground/55" />
        </div>
        <div className="relative container mx-auto px-4 md:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <nav className="text-sm text-background/80 mb-3">
              <Link to="/" className="hover:text-background">Home</Link> ·{' '}
              <Link to="/properties" className="hover:text-background">Properties</Link> ·{' '}
              <span className="text-background">{place}</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-semibold text-background leading-tight">
              {heading}
            </h1>
            <p className="mt-3 text-base md:text-lg text-background/85">{intro}</p>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="container mx-auto px-4 md:px-8 py-12">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            {heading.replace(/, Cyprus.*/, '')}
          </h2>
          <Link
            to="/properties"
            className="btn-cta btn-cta-sm"
          >
            <SlidersHorizontal size={15} /> Refine search
          </Link>
        </div>

        {loading ? (
          <p className="mt-6 text-muted-foreground">Loading properties…</p>
        ) : rows.length === 0 ? (
          <div className="mt-6 p-8 rounded-2xl border border-border bg-card text-center">
            <p className="text-muted-foreground">
              No matching listings are published right now.{' '}
              <Link to="/properties" className="text-accent underline">
                Browse all properties
              </Link>{' '}
              or{' '}
              <Link to="/contact" className="text-accent underline">
                contact us
              </Link>{' '}
              about upcoming opportunities.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-muted-foreground">
              {rows.length} {rows.length === 1 ? 'listing' : 'listings'} available.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rows.map((p) => {
                const img = optimizeImage(p.cover_image || hero, 800);
                const href = `/properties/${p.slug ?? p.id}`;
                return (
                  <Link
                    key={p.id}
                    to={href}
                    className="group rounded-none overflow-hidden border border-border bg-card hover:border-foreground/40 transition-colors"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={img}
                        alt={`${publicTitle(p.title)} in ${publicLocation(p) || place}`}
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {p.status && (
                        <span className="absolute top-0 left-0 inline-flex items-center px-3 py-1.5 rounded-none bg-foreground/85 text-background text-[11px] font-semibold uppercase tracking-wide">
                          {/sold|closed|under offer/i.test(p.status) ? 'Sold' : 'For Sale'}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {p.category}
                      </p>
                      <h3 className="mt-1 font-semibold text-foreground line-clamp-2 text-xl">
                        {publicTitle(p.title)}
                      </h3>
                      <p className="mt-1 text-muted-foreground flex items-center gap-1 text-base">
                        <MapPin size={12} /> {publicLocation(p)}
                      </p>
                      <p className="mt-3 font-semibold text-foreground text-lg break-words">{publicPrice(p.price, p.price_value, p.status)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Editorial context (uses the location page copy when available) */}
      {locDef && (
        <section className="container mx-auto px-4 md:px-8 pb-6 max-w-4xl">
          <h2 className="text-2xl font-semibold text-foreground">
            About the {locDef.name} market
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{locDef.market}</p>
          <p className="mt-4 text-sm">
            <Link to={`/locations/${locDef.slug}`} className="text-accent underline">
              Read the full {locDef.name} area guide →
            </Link>
          </p>
        </section>
      )}

      {/* Related searches — internal links */}
      {related.length > 0 && (
        <section className="container mx-auto px-4 md:px-8 py-16">
          <h2 className="text-xl font-semibold text-foreground">Related searches</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/property-search/${r.slug}`}
                className="px-4 h-10 inline-flex items-center rounded-full border border-border bg-card text-sm text-foreground hover:border-foreground/40 transition-colors"
              >
                {r.label}
              </Link>
            ))}
            <Link
              to="/properties"
              className="px-4 h-10 inline-flex items-center rounded-full border border-accent bg-accent/10 text-sm text-foreground hover:bg-accent/20 transition-colors"
            >
              All properties →
            </Link>
          </div>
        </section>
      )}
    </main>
  );
};

export default PropertySearch;
