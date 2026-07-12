import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import FAQSection from '@/components/FAQSection';
import { publicLocation, publicTitle, publicPrice } from '@/lib/propertyDisplay';
import { optimizeImage } from '@/lib/img';
import { getLocation, siblingLocations, matchesLocation } from '@/lib/locations';
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
  category: string | null;
  status: string | null;
  cover_image: string | null;
}

const ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';

const LocationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const loc = getLocation(slug);
  const [props, setProps] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loc) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, location, city, region, district, price, category, status, cover_image')
        .order('sort_order', { ascending: true });
      if (cancelled || !data) {
        setLoading(false);
        return;
      }
      const filtered = (data as PropertyRow[]).filter(
        (p) =>
          !/closed|sold/i.test(p.status ?? '') &&
          matchesLocation(loc, p.location, p.city, p.region),
      );
      setProps(filtered);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loc]);

  const siblings = useMemo(() => (loc ? siblingLocations(loc) : []), [loc]);

  if (!slug) return <Navigate to="/properties" replace />;
  if (!loc) return <Navigate to="/properties" replace />;

  const canonical = `${ORIGIN}/locations/${loc.slug}`;
  const heading = `Property for Sale in ${loc.name}, Cyprus`;

  const jsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: heading,
      description: loc.intro,
      url: canonical,
      about: { '@type': 'Place', name: `${loc.name}, ${loc.region}, Cyprus` },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: props.slice(0, 25).map((p, i) => ({
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
        { '@type': 'ListItem', position: 2, name: 'Locations', item: `${ORIGIN}/locations` },
        { '@type': 'ListItem', position: 3, name: loc.name, item: canonical },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: loc.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    },
  ];

  return (
    <main>
      <SEO
        title={`${heading} | Memories`}
        description={`${loc.tagline}. ${loc.intro}`.slice(0, 158)}
        type="website"
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0">
          <img
            src={hero}
            alt={`${loc.name}, Cyprus`}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-foreground/55" />
        </div>
        <div className="relative container mx-auto px-4 md:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <nav className="text-sm text-background/80 mb-3">
              <Link to="/" className="hover:text-background">Home</Link> ·{' '}
              <Link to="/locations" className="hover:text-background">Locations</Link> ·{' '}
              <span className="text-background">{loc.name}</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-semibold text-background leading-tight">
              {heading}
            </h1>
            <p className="mt-3 text-base md:text-lg text-background/85">{loc.tagline}</p>
          </div>
        </div>
      </section>

      {/* Intro + highlights */}
      <section className="container mx-auto px-4 md:px-8 py-14 grid md:grid-cols-3 gap-10 max-w-6xl">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold text-foreground">About {loc.name}</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{loc.intro}</p>
          <h2 className="mt-8 text-2xl font-semibold text-foreground">
            The {loc.name} property market
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{loc.market}</p>
        </div>
        <aside>
          <h2 className="text-lg font-semibold text-foreground">Why buy in {loc.name}</h2>
          <ul className="mt-4 space-y-3">
            {loc.highlights.map((h) => (
              <li key={h} className="flex gap-2 text-muted-foreground">
                <MapPin size={18} className="mt-0.5 shrink-0 text-accent" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* Listings */}
      <section className="container mx-auto px-4 md:px-8 py-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
          Properties for sale in {loc.name}
        </h2>
        {loading ? (
          <p className="mt-6 text-muted-foreground">Loading properties…</p>
        ) : props.length === 0 ? (
          <div className="mt-6 p-8 rounded-2xl border border-border bg-card text-center">
            <p className="text-muted-foreground">
              No listings currently published in {loc.name}.{' '}
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
              {props.length} {props.length === 1 ? 'listing' : 'listings'} available in {loc.name}.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {props.map((p) => {
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
                        alt={`${publicTitle(p.title)} in ${publicLocation(p) || loc.name}`}
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
                      <p className="mt-3 font-semibold text-foreground text-lg">{publicPrice(p.price, undefined, p.status)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* FAQ */}
      <FAQSection
        title={`Buying property in ${loc.name}`}
        intro={`Common questions about the ${loc.name} property market.`}
        items={loc.faqs}
      />

      {/* Internal links */}
      <section className="container mx-auto px-4 md:px-8 py-16">
        <h2 className="text-xl font-semibold text-foreground">
          Explore other areas in {loc.region}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {siblings.map((s) => (
            <Link
              key={s.slug}
              to={`/locations/${s.slug}`}
              className="px-4 h-10 inline-flex items-center rounded-full border border-border bg-card text-sm text-foreground hover:border-foreground/40 transition-colors"
            >
              {s.name}
            </Link>
          ))}
          <Link
            to="/locations"
            className="px-4 h-10 inline-flex items-center rounded-full border border-accent bg-accent/10 text-sm text-foreground hover:bg-accent/20 transition-colors"
          >
            All locations →
          </Link>
        </div>
      </section>
    </main>
  );
};

export default LocationPage;
