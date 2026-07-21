import { Helmet } from 'react-helmet-async';

// Site-wide structured data (Organization + RealEstateAgent + WebSite search
// box). This used to be hardcoded as static <script> tags directly in
// index.html. That caused a real bug: because those tags existed in the DOM
// before React ever mounted, react-helmet-async's reconciliation treated the
// "application/ld+json" script slot as already accounted for, and silently
// never added any individual page's own structured data (SEO.tsx's jsonLd
// prop) on top of it — every page, even ones with their own Service/Product
// schema in code, only ever showed these two global blocks.
//
// Moving this into a Helmet-managed component — mounted once, at the app
// root, alongside every other page's own <SEO> — makes all structured data
// go through the same reconciliation path, so per-page jsonLd actually
// renders now.
const ORG_GRAPH = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://memoriesproperties.com/#organization',
      name: 'Memories',
      legalName: 'Memories Properties',
      url: 'https://memoriesproperties.com',
      logo: 'https://memoriesproperties.com/favicon.png',
      image: 'https://memoriesproperties.com/og-image.jpg',
      foundingDate: '2014',
      description:
        'Private real estate practice sourcing off-market investment properties, development land and coastal homes for a discreet roster of clients. By introduction only.',
      areaServed: [
        { '@type': 'Place', name: 'Paphos, Cyprus' },
        { '@type': 'Place', name: 'Limassol, Cyprus' },
        { '@type': 'Country', name: 'Cyprus' },
      ],
      sameAs: [],
    },
    {
      '@type': 'RealEstateAgent',
      '@id': 'https://memoriesproperties.com/#realestateagent',
      name: 'Memories',
      url: 'https://memoriesproperties.com',
      logo: 'https://memoriesproperties.com/favicon.png',
      image: 'https://memoriesproperties.com/og-image.jpg',
      parentOrganization: { '@id': 'https://memoriesproperties.com/#organization' },
      description:
        'Private real estate practice specialising in off-market investment projects, development land, agricultural estates, coastal plots and prestige property in Cyprus.',
      priceRange: '€€€€',
      foundingDate: '2014',
      areaServed: [
        { '@type': 'Place', name: 'Paphos, Cyprus' },
        { '@type': 'Place', name: 'Limassol, Cyprus' },
        { '@type': 'Country', name: 'Cyprus' },
      ],
      knowsAbout: [
        'Off-market real estate',
        'Investment property',
        'Development land',
        'Agricultural estates',
        'Coastal property',
        'Real estate investment advisory',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Private Real Estate Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Off-market acquisition',
              description: 'Sourcing and acquiring off-market investment properties for private clients.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Development land sourcing',
              description: 'Identifying development land and plots for investors and developers.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Investment advisory',
              description: 'Advising on real estate investment strategy, asset mix and ticket sizes.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Private & discreet sales',
              description: 'Confidential, by-introduction sales of prestige and investment-grade property.',
            },
          },
        ],
      },
      sameAs: [],
    },
  ],
};

const WEBSITE_SEARCH = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Memories',
  url: 'https://memoriesproperties.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://memoriesproperties.com/properties?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const GlobalSEO = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(ORG_GRAPH)}</script>
    <script type="application/ld+json">{JSON.stringify(WEBSITE_SEARCH)}</script>
  </Helmet>
);

export default GlobalSEO;
