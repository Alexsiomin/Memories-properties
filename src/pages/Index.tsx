import { lazy, Suspense } from 'react';
import Hero from '@/components/Hero';
import SEO from '@/components/SEO';
import RouteLoader from '@/components/RouteLoader';

// The LCP hero image is preloaded statically from index.html (stable /public
// URLs) so it downloads in parallel with the JS bundle — no JS-injected preload.

// Below-the-fold sections — split into their own chunks so the hero paints first.

const SecondaryFeatures = lazy(() => import('@/components/SecondaryFeatures'));
const StayUpdated = lazy(() => import('@/components/StayUpdated'));
const About = lazy(() => import('@/components/About'));
const EnquiryList = lazy(() => import('@/components/EnquiryList'));
const Appraisal = lazy(() => import('@/components/Appraisal'));
const PropertiesPreview = lazy(() => import('@/components/PropertiesPreview'));


const SectionSkeleton = ({ height = 'min-h-[40vh]' }: { height?: string }) => (
  <RouteLoader minHeight={height} />
);

const Index = () => {


  return (
    <>
      <SEO
        title="Memories Real Estate & Cyprus Property For Sale"
        description="Private real estate practice sourcing off-market investment projects and land for a discreet roster of clients. By introduction only."
        preloadImage="/hero-estate.avif"
        preloadImageSrcSet="/hero-estate-640.avif 640w, /hero-estate-1280.avif 1280w, /hero-estate.avif 1920w"
        preloadImageSizes="100vw"
        preloadImageType="image/avif"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'RealEstateAgent',
            '@id': 'https://memoriesproperties.com/#realestateagent',
            name: 'Memories Properties',
            url: 'https://memoriesproperties.com',
            logo: 'https://memoriesproperties.com/favicon.png',
            image: 'https://memoriesproperties.com/favicon.png',
            description: 'Private real estate practice sourcing off-market investment projects and land.',
            areaServed: 'Worldwide',
            priceRange: '€€€€',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': 'https://memoriesproperties.com/#website',
            url: 'https://memoriesproperties.com',
            name: 'Memories Properties',
            publisher: { '@id': 'https://memoriesproperties.com/#organization' },
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://memoriesproperties.com/properties?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />
      <h1 className="sr-only">
        Private Real Estate Practice &amp; Investment Projects
      </h1>
      <Hero />
      <div className="light-panel">
        <div className="container mx-auto px-0 sm:px-6 py-12">
          <Suspense fallback={<SectionSkeleton />}>
            <PropertiesPreview />
          </Suspense>
          <Suspense fallback={<SectionSkeleton height="min-h-[20vh]" />}>
            <StayUpdated />
          </Suspense>
          <div className="mt-16 p-0 sm:p-8 rounded-md">
            <Suspense fallback={<SectionSkeleton height="min-h-[30vh]" />}>
              <SecondaryFeatures />
            </Suspense>
          </div>
          <Suspense fallback={<SectionSkeleton height="min-h-[20vh]" />}>
            <About />
          </Suspense>
          <div className="mt-16 p-0 sm:p-8 rounded-md">
            <Suspense fallback={<SectionSkeleton height="min-h-[20vh]" />}>
              <EnquiryList />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={<SectionSkeleton height="min-h-[20vh]" />}>
          <Appraisal />
        </Suspense>
      </div>
    </>
  );
};

export default Index;
