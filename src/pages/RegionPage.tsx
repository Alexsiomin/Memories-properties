import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import { publicLocation, publicTitle, publicPrice } from '@/lib/propertyDisplay';
import { optimizeImage } from '@/lib/img';
import FAQSection from '@/components/FAQSection';
import residential from '@/assets/proj-residential.jpg';
import vineyard from '@/assets/proj-vineyard.jpg';
import coastal from '@/assets/proj-coastal.jpg';
import mixed from '@/assets/proj-mixed.jpg';
import hero from '@/assets/hero-land.jpg';
import skyline from '@/assets/hero-skyline.jpg';
import desert from '@/assets/feat-desert.jpg';
import library from '@/assets/feat-library.jpg';
import markets from '@/assets/feat-markets.jpg';
import tech from '@/assets/feat-tech.jpg';

const IMAGE_MAP: Record<string, string> = {
  residential, vineyard, coastal, mixed, hero, skyline, desert, library, markets, tech,
};

// Curated location landing pages — each has unique editorial content.
// Add new entries here to create more SEO landing pages.
const REGIONS: Record<
  string,
  {
    name: string;
    country: string;
    matchTerms: string[]; // Substrings to match against property.location
    heroImage: keyof typeof IMAGE_MAP;
    intro: string;
    market: string;
    investment: string;
    faqs: { question: string; answer: string }[];
  }
> = {
  paphos: {
    name: 'Paphos',
    country: 'Cyprus',
    matchTerms: ['paphos', 'pafos', 'coral bay', 'peyia', 'pegeia', 'chloraka', 'kato paphos', 'tala', 'tsada', 'polis'],
    heroImage: 'coastal',
    intro:
      'Paphos blends a relaxed coastal lifestyle with strong year-round rental demand and some of Cyprus\'s best value per square metre. From sea-view villas in Coral Bay to modern apartments in Kato Paphos, it remains a favourite among UK buyers and international investors.',
    market:
      'Paphos offers an exceptional range of property — contemporary villas with private pools, golf-resort residences around Aphrodite Hills and Secret Valley, and well-priced apartments close to the harbour and beaches. Demand is led by lifestyle buyers, retirees, and holiday-let investors, with consistent appreciation supported by ongoing infrastructure and marina development.',
    investment:
      'Buyers typically target sea-view villas for long-term appreciation and holiday-let income, or apartments delivering reliable rental yields of 4–6% gross. Cyprus offers a favourable, EU-aligned tax regime, English-language conveyancing, and a straightforward purchase process — making Paphos one of the Mediterranean\'s most accessible markets for overseas buyers.',
    faqs: [
      {
        question: 'Can foreigners buy property in Paphos, Cyprus?',
        answer:
          'Yes. EU citizens buy with no restrictions, and non-EU buyers can purchase property with Council of Ministers approval, which is routine for residential purchases. Memories Properties coordinates the full process with trusted local lawyers.',
      },
      {
        question: 'What are typical property prices in Paphos?',
        answer:
          'Modern apartments start from around €150K, while sea-view and golf-resort villas typically range from €400K to over €2M depending on location, plot size and views. Coral Bay and Peyia command premiums for proximity to the coast.',
      },
      {
        question: 'Is Paphos a good place to invest in property?',
        answer:
          'Yes. Paphos benefits from strong holiday-rental demand, a growing expat community, a mild year-round climate, and good value relative to other Mediterranean markets. Well-located apartments and villas deliver solid rental yields alongside steady capital growth.',
      },
    ],
  },
  limassol: {
    name: 'Limassol',
    country: 'Cyprus',
    matchTerms: ['limassol', 'lemesos', 'germasogeia', 'germasoyia', 'agios tychonas', 'amathus', 'mouttagiaka', 'potamos', 'parekklisia'],
    heroImage: 'skyline',
    intro:
      'Limassol is Cyprus\'s most dynamic city — a cosmopolitan business and lifestyle hub with a world-class marina, beachfront high-rises, and a thriving international community. It commands the island\'s premium prices and the strongest investment liquidity.',
    market:
      'Limassol leads the Cypriot market for luxury living, from landmark seafront towers and Limassol Marina residences to elegant villas in Germasogeia and Agios Tychonas. The city draws international corporations, tech and shipping firms, and high-net-worth buyers, sustaining premium values and a deep rental market for professionals.',
    investment:
      'Limassol offers Cyprus\'s strongest combination of capital appreciation and rental demand. Premium apartments and marina residences attract corporate tenants and deliver dependable yields, while branded seafront developments appeal to investors seeking trophy assets. Cyprus\'s attractive tax framework and EU membership underpin long-term demand.',
    faqs: [
      {
        question: 'Can foreigners buy property in Limassol, Cyprus?',
        answer:
          'Yes. EU citizens buy freely, and non-EU buyers can purchase residential property with Council of Ministers approval, which is standard and handled by your lawyer. Memories Properties manages the entire process end-to-end.',
      },
      {
        question: 'Why is Limassol more expensive than other Cyprus cities?',
        answer:
          'Limassol is the island\'s leading business, financial and tourism centre, home to its marina and many international companies. Strong corporate and expat demand, limited prime seafront supply, and landmark developments keep prices and rental values at a premium.',
      },
      {
        question: 'What rental yields can I expect in Limassol?',
        answer:
          'Well-located apartments in Limassol typically achieve gross rental yields of around 4–6%, supported by steady demand from professionals, corporate tenants and long-stay visitors. Premium seafront and marina units add strong capital-growth potential.',
      },
    ],
  },
};

interface PropertyRow {
  id: string;
  slug: string | null;
  title: string;
  location: string;
  city: string | null;
  region: string | null;
  district: string | null;
  price: string;
  category: string;
  status: string;
  image_key: string;
  cover_image: string | null;
  description: string | null;
}

const RegionPage = () => {
  const { region } = useParams<{ region: string }>();
  const [props, setProps] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const config = region ? REGIONS[region.toLowerCase()] : null;

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, location, city, region, district, price, category, status, image_key, cover_image, description')
        .order('sort_order', { ascending: true });
      if (cancelled || !data) return;
      const filtered = (data as PropertyRow[]).filter((p) => {
        const loc = (p.location ?? '').toLowerCase();
        return config.matchTerms.some((t) => loc.includes(t));
      });
      setProps(filtered);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [config]);

  const heroImg = useMemo(() => (config ? IMAGE_MAP[config.heroImage] : hero), [config]);

  if (!region) return <Navigate to="/properties" replace />;
  if (!config) return <Navigate to="/properties" replace />;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';
  const canonical = `${origin}/properties/region/${region.toLowerCase()}`;

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Off-Market Properties in ${config.name}, ${config.country}`,
    description: config.intro,
    url: canonical,
    about: {
      '@type': 'Place',
      name: `${config.name}, ${config.country}`,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: props.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}/properties/${p.slug ?? p.id}`,
        name: publicTitle(p.title),
      })),
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Properties', item: `${origin}/properties` },
      { '@type': 'ListItem', position: 3, name: config.name, item: canonical },
    ],
  };

  return (
    <main className="bg-background min-h-screen">
      <SEO
        title={`Off-Market Properties in ${config.name}, ${config.country}`}
        description={`Private real estate, vineyards, coastal estates and investment land in ${config.name}, ${config.country}. ${props.length} curated mandates from Memories Properties.`}
        image={heroImg}
        preloadImage={heroImg}
        jsonLd={[collectionJsonLd, breadcrumbJsonLd]}
      />

      {/* Hero */}
      <section className="relative">
        <div className="aspect-[16/7] md:aspect-[21/8] w-full overflow-hidden bg-muted">
          <img
            src={heroImg}
            alt={`${config.name}, ${config.country} — investment properties via Memories Properties`}
            width={1920}
            height={840}
            // @ts-expect-error - fetchpriority is valid HTML
            fetchpriority="high"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 md:px-8 -mt-16 md:-mt-24 relative z-10">
          <div className="rounded-2xl bg-card border border-border shadow-sm p-6 md:p-10 max-w-4xl">
            <nav className="text-sm text-muted-foreground mb-3">
              <Link to="/" className="hover:text-foreground">Home</Link> ·{' '}
              <Link to="/properties" className="hover:text-foreground">Properties</Link> ·{' '}
              <span className="text-foreground">{config.name}</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-semibold text-foreground leading-tight">
              Off-Market Properties in {config.name}, {config.country}
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              {config.intro}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial */}
      <section className="container mx-auto px-4 md:px-8 py-16 grid md:grid-cols-2 gap-10 max-w-5xl">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">The {config.name} market</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{config.market}</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Investment landscape</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{config.investment}</p>
        </div>
      </section>

      {/* Listings */}
      <section className="container mx-auto px-4 md:px-8 py-10">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
          Available mandates in {config.name}
        </h2>
        {loading ? (
          <p className="mt-6 text-muted-foreground">Loading properties…</p>
        ) : props.length === 0 ? (
          <div className="mt-6 p-8 rounded-2xl border border-border bg-card text-center">
            <p className="text-muted-foreground">
              No public mandates currently in {config.name}. Off-market opportunities are released privately —{' '}
              <Link to="/contact" className="text-accent underline">request access</Link> to view current options.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.map((p) => {
              const img = p.cover_image || IMAGE_MAP[p.image_key] || hero;
              const href = `/properties/${p.slug ?? p.id}`;
              return (
                <Link
                  key={p.id}
                  to={href}
                  className="group rounded-none overflow-hidden border border-border bg-card hover:border-foreground/40 transition-colors"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={optimizeImage(img, 800)}
                      alt={`${publicTitle(p.title)} in ${publicLocation(p)}`}
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
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.category}</p>
                    <h3 className="mt-1 font-semibold text-foreground line-clamp-2 text-xl">{publicTitle(p.title)}</h3>
                    <p className="mt-1 text-muted-foreground flex items-center gap-1 text-base">
                      <MapPin size={12} /> {publicLocation(p)}
                    </p>
                    <p className="mt-3 font-semibold text-foreground text-lg">{publicPrice(p.price, undefined, p.status)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* FAQ */}
      <FAQSection
        title={`Buying property in ${config.name}, ${config.country}`}
        intro="Common questions from international investors."
        items={config.faqs}
      />

      {/* Internal links to other regions */}
      <section className="container mx-auto px-4 md:px-8 py-16">
        <h2 className="text-xl font-semibold text-foreground">Other regions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(REGIONS)
            .filter(([k]) => k !== region.toLowerCase())
            .map(([k, v]) => (
              <Link
                key={k}
                to={`/properties/region/${k}`}
                className="px-4 h-10 inline-flex items-center rounded-full border border-border bg-card text-sm text-foreground hover:border-foreground/40 transition-colors"
              >
                {v.name}, {v.country}
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
};

export default RegionPage;
