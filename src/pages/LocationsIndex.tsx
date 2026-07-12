import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import SEO from '@/components/SEO';
import { LOCATIONS } from '@/lib/locations';
import { curatedSearchFacets, buildSearchSlug, facetHeading } from '@/lib/searchFacets';

const ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';

const REGIONS: ('Paphos' | 'Limassol')[] = ['Paphos', 'Limassol'];

const LocationsIndex = () => {
  const canonical = `${ORIGIN}/locations`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Property Locations in Cyprus',
    description:
      'Browse property for sale by city and district across Cyprus — Paphos, Limassol and their most sought-after areas.',
    url: canonical,
    hasPart: LOCATIONS.map((l) => ({
      '@type': 'WebPage',
      name: `Property for sale in ${l.name}`,
      url: `${ORIGIN}/locations/${l.slug}`,
    })),
  };

  return (
    <main>
      <SEO
        title="Property by Location in Cyprus — Cities & Districts"
        description="Explore property for sale by city and district across Cyprus — Paphos, Limassol and their most sought-after areas, each with a dedicated local guide."
        jsonLd={jsonLd}
      />

      <section className="container mx-auto px-4 md:px-8 py-16 max-w-5xl">
        <nav className="text-sm text-muted-foreground mb-3">
          <Link to="/" className="hover:text-foreground">Home</Link> ·{' '}
          <span className="text-foreground">Locations</span>
        </nav>
        <h1 className="text-3xl md:text-5xl font-semibold text-foreground leading-tight">
          Property for Sale by Location in Cyprus
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
          Discover homes, villas and apartments across Cyprus, organised by city and district. Each
          area has its own guide covering the local market, lifestyle and available listings.
        </p>

        {REGIONS.map((region) => (
          <div key={region} className="mt-12">
            <h2 className="text-2xl font-semibold text-foreground">{region} district</h2>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LOCATIONS.filter((l) => l.region === region).map((l) => (
                <Link
                  key={l.slug}
                  to={`/locations/${l.slug}`}
                  className="group rounded-none border border-border bg-card p-5 hover:border-foreground/40 transition-colors"
                >
                  <h3 className="flex items-center gap-2 font-semibold text-foreground text-lg">
                    <MapPin size={16} className="text-accent" /> {l.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{l.tagline}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Popular searches — internal links to faceted SEO landing pages */}
      <section className="container mx-auto px-4 md:px-8 pb-20 max-w-5xl">
        <h2 className="text-xl font-semibold text-foreground">Popular searches</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Jump straight to the most-requested combinations of location, property type, bedrooms
          and budget.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {curatedSearchFacets().map((f) => {
            const slug = buildSearchSlug(f);
            return (
              <Link
                key={slug}
                to={`/property-search/${slug}`}
                className="px-4 h-10 inline-flex items-center rounded-full border border-border bg-card text-sm text-foreground hover:border-foreground/40 transition-colors"
              >
                {facetHeading(f).replace(/, Cyprus.*/, '')}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default LocationsIndex;
