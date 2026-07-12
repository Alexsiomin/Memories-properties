import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

import heroAsset from '@/assets/expertise-hero.jpg.asset.json';
import buyImg from '@/assets/our-story-2.jpg.asset.json';
import sellImg from '@/assets/cyprus-sunset-villas.jpg.asset.json';

import newDevImg from '@/assets/new-development.jpg.asset.json';
import agentsImg from '@/assets/Cyprus_properties.png.asset.json';
import insightsImg from '@/assets/market-insights.png.asset.json';
import locationsImg from '@/assets/filed_in_Pegeia.png.asset.json';

const SECTIONS = [
  {
    title: 'Buy',
    body:
      'We offer a bespoke property buying experience, featuring an extensive and diverse collection of exceptional real estate across Cyprus. Catering to a range of preferences — from luxurious family residences and modern coastal apartments to prime investment opportunities — our dedicated team works collaboratively to align properties seamlessly with your lifestyle and aspirations, supported by unrivalled local market knowledge.',
    cta: { label: 'View Properties', to: '/properties' },
    image: buyImg.url,
    alt: 'Luxury Cyprus residence for sale',
  },
  {
    title: 'Sell',
    body:
      'Our strategy for selling your property combines a personalised and strategic approach, emphasising its unique characteristics to attract the ideal buyer. By leveraging our in-depth market insights and expansive network, we maximise your property’s appeal — ensuring a seamless and successful sale that is efficient and perfectly aligned with your specific objectives.',
    cta: { label: 'Request a Valuation', to: '/sell' },
    image: sellImg.url,
    alt: 'Elegant villa interior prepared for sale',
  },
  {
    title: 'Projects',
    body:
      'Experience the pinnacle of sophisticated living with our off-the-plan projects, meticulously crafted with ultimate luxury and environmental responsibility in mind. Each development combines timeless elegance and cutting-edge design, appealing to those who seek unparalleled quality and modern convenience across Cyprus’ most desirable locations.',
    cta: { label: 'View More', to: '/developments' },
    image: newDevImg.url,
    alt: 'New development project in Cyprus',
  },
] as const;

const CTA_CARDS = [
  { title: 'New Developments', to: '/developments', image: agentsImg.url, alt: 'New developments' },
  { title: 'Market Insights', to: '/insights', image: insightsImg.url, alt: 'Market insights' },
  { title: 'Browse by Location', to: '/locations', image: locationsImg.url, alt: 'Browse by location' },
];

const OurExpertise = () => {
  return (
    <>
      <SEO
        title="Our Expertise — Buy, Sell & Projects in Cyprus"
        description="Discover the Memories Properties expertise: bespoke buying, strategic selling, premium leasing and off-the-plan projects across Cyprus."
      />

      {/* HERO */}
      <section className="relative -mt-px h-screen min-h-[600px] w-full overflow-hidden">
        <img
          src={heroAsset.url}
          alt="Iconic Cyprus architecture"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-white sm:text-5xl">
            Expertise
          </h1>
        </div>
      </section>

      {/* ZIGZAG SECTIONS */}
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="space-y-16 sm:space-y-28">
          {SECTIONS.map((s, i) => (
            <div
              key={s.title}
              className={`grid items-center gap-8 sm:gap-14 md:grid-cols-2 ${
                (i === 3 ? false : i % 2 === 1) ? 'md:[&>div:first-child]:order-2' : ''
              }`}
            >
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-wide text-foreground sm:text-3xl">
                  {s.title}
                </h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
                <Link
                  to={s.cta.to}
                  className="btn-cta btn-cta-solid mt-6"
                >
                  {s.cta.label}
                </Link>
              </div>
              <div className="overflow-hidden">
                <img
                  src={s.image}
                  alt={s.alt}
                  loading="lazy"
                  className="h-64 w-full object-cover sm:h-80"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA CARDS */}
      <div className="mx-auto max-w-6xl px-6 pb-20 sm:pb-28">
        <div className="grid gap-6 sm:grid-cols-3">
          {CTA_CARDS.map((c) => (
            <Link key={c.title} to={c.to} className="group block">
              <div className="relative overflow-hidden">
                <img
                  src={c.image}
                  alt={c.alt}
                  loading="lazy"
                  className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="block text-lg font-semibold uppercase tracking-wide text-white">
                    {c.title}
                  </span>
                  <span className="story-link-group text-xs font-semibold uppercase tracking-wide text-white/90">
                    View More →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default OurExpertise;
