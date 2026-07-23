import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import heroVilla from '@/assets/about-hero-villa.jpg';
import portrait from '@/assets/concierge-agent.jpg';
import eraCyprus from '@/assets/about-era-cyprus.jpg';
import era3 from '@/assets/about-era-3.jpg';


const ERAS = [
  {
    period: '2018 – 2022',
    title: 'GROWTH, PRESTIGE AND EXPANSION',
    body:
      'As the most desirable regions evolved, so too did the practice. We expanded into key inner and coastal precincts, refining our approach to bespoke marketing, strategic negotiation and premium private campaigns. During this period the practice became synonymous with prestige estates, establishing long-standing relationships with families, developers and investors across blue-chip markets.',
    image: eraCyprus,
    alt: 'Historic Cyprus architecture',
    cta: { label: 'View properties', to: '/properties' },
  },
];

const PILLARS = [
  {
    title: 'Integrity',
    italic: 'We do what we say. We do what is right.',
    body:
      'Integrity is the cornerstone of trust. By honouring our commitments, acting with transparency and upholding the highest ethical standards, we build lasting relationships with clients, colleagues and community — reinforcing our reputation and driving long-term success.',
  },
  {
    title: 'Discretion',
    italic: 'Quiet by structure. Private by default.',
    body:
      'Off-market is not a feature — it is the practice. Counterparties, locations and capital flows are protected as a matter of course, allowing the right transactions to happen in the right way, at the right moment.',
  },
  {
    title: 'Professionalism',
    italic: 'Excellence in every moment.',
    body:
      'In a premium market, every detail matters. Professionalism defines us in every aspect — how we present ourselves, how we represent properties and how we communicate. This daily commitment to excellence keeps us at the forefront of the practice.',
  },
];

const About = () => {
  const themeRef = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(false);

  // Marshall White–style scroll theme switch: the section flips between the
  // site's two real palette colors (white and menu navy) with a smooth CSS
  // transition once it's scrolled past the midpoint of the viewport.
  useEffect(() => {
    const el = themeRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      setDark(rect.top <= window.innerHeight * 0.4);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <SEO
        title="Our Story — A Decade of Real Estate Leadership"
        description="Since 2014 Memories has led a private real estate practice grounded in deep local knowledge, refined strategy and an uncompromising commitment to service."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Memories Properties',
          url: 'https://memoriesproperties.com',
          logo: 'https://memoriesproperties.com/favicon.png',
          description:
            'Private real estate practice sourcing off-market investment projects and land since 2014.',
        }}
      />

      {/* HERO */}
      <section className="relative -mt-px h-screen min-h-[600px] w-full overflow-hidden">
        <img
          src={heroVilla}
          alt="Grand classical villa facade framed by mature trees"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/35" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h1 className="max-w-[24ch] text-center font-montserrat font-extrabold leading-[1.1] tracking-tight text-white text-xl sm:text-3xl md:text-4xl reveal">
            MORE THAN A DECADE OF LEADERSHIP IN REAL ESTATE
          </h1>
        </div>
      </section>

      {/* PORTRAIT */}
      <section className="mt-24 bg-[#400001] text-white">
        <div className="container mx-auto px-6 py-14 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="reveal" data-reveal-delay="200">
              <h2 className="font-montserrat font-bold tracking-tight text-2xl md:text-3xl leading-tight text-white">
                OUR MISSION
              </h2>
              <div className="mt-6 space-y-4 text-base md:text-lg leading-relaxed text-white">
                <p>We are Memories a Cyprus real estate agency built on people, stories, and heart.</p>
                <p>We are Estate Agents, Property Valuers, Dreamers, Community Builders and Animal Lovers.</p>
                <p>We believe in the spirit of place.</p>
                <p>We make timeless, beautiful spaces for those that care deeply.</p>
                <p>We are driven to inspire our clients and our community.</p>
              </div>
            </div>
            <div className="reveal">
              <div className="img-hover">
                <img
                  src={portrait}
                  alt="Portrait of Memories Properties, private real estate agent"
                  loading="lazy"
                  decoding="async"
                  width={960}
                  height={720}
                  className="w-full aspect-[4/3] object-cover object-top transition-all duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KEY PILLARS (scroll-triggered theme switch) */}
      <div
        ref={themeRef}
        style={{
          background: dark ? 'hsl(var(--menu))' : 'hsl(var(--background))',
          color: dark ? 'hsl(var(--menu-foreground))' : 'hsl(var(--foreground))',
          transition: 'background-color 0.6s ease, color 0.6s ease',
        }}
      >
        <section className="container mx-auto px-6 mt-24 pt-24 pb-24 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="label text-accent reveal">Our Key Pillars</p>
            <p
              className="mt-6 text-lg leading-relaxed reveal text-left"
              style={{ color: 'inherit', opacity: 0.75 }}
              data-reveal-delay="200"
            >
              Our core values are the foundation of Memories Properties as a practice and a
              community — shaping our culture, inspiring our vision and upholding
              our standard of excellence.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
            {PILLARS.map((p, i) => (
              <article
                key={p.title}
                className="reveal text-left"
                data-reveal-delay={String(i * 100)}
              >
                <h3 className="text-2xl font-montserrat font-extrabold" style={{ color: 'inherit' }}>
                  {p.title}
                </h3>
                <p className="mt-3 italic" style={{ color: 'inherit', opacity: 0.7 }}>
                  {p.italic}
                </p>
                <p className="mt-5 text-base leading-relaxed" style={{ color: 'inherit', opacity: 0.75 }}>
                  {p.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* JOURNEY INTRO */}
      <section className="container mx-auto px-6 mt-24 max-w-3xl text-center">
        <p className="label text-accent reveal">Our Journey</p>
        <p
          className="mt-6 text-lg md:text-xl leading-relaxed text-foreground/80 reveal"
          data-reveal-delay="100"
        >
          Since 2014, Memories Properties has been at the forefront of the prestige property
          market, representing some of the region's most significant land and
          investment-grade assets. Privately owned and proudly independent, our
          practice is built on deep local knowledge, refined strategy and an
          uncompromising commitment to service. We specialise exclusively in
          investment real estate, delivering considered advice and exceptional
          results for discerning clients.
        </p>
      </section>

      {/* ERAS */}
      <div className="container mx-auto px-6 mt-24 space-y-24">
        {ERAS.map((era, i) => {
          const reverse = i % 2 === 1;
          return (
            <section
              key={era.period}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center"
            >
              <div
                className={`md:col-span-6 reveal ${reverse ? 'md:order-2' : ''}`}
              >
                <div className="img-hover bg-muted overflow-hidden rounded-md">
                  <img
                    src={era.image}
                    alt={era.alt}
                    loading="lazy"
                    decoding="async"
                    width={960}
                    height={1216}
                    className="w-full aspect-[4/5] object-cover transition-transform duration-700 hover:scale-[1.02]"
                  />
                </div>
              </div>
              <div
                className={`md:col-span-6 reveal ${reverse ? 'md:order-1' : ''}`}
                data-reveal-delay="120"
              >
                <p className="label text-accent">{era.period}</p>
                <h2 className="mt-4 text-xl md:text-2xl font-light tracking-tight leading-[1.1] whitespace-nowrap md:whitespace-normal">
                  {era.title}
                </h2>
                <p className="mt-6 text-base md:text-lg leading-relaxed text-foreground/80 max-w-[52ch]">
                  {era.body}
                </p>
                {era.cta && (
                  <Link
                    to={era.cta.to}
                    className="story-link inline-block mt-5 text-base label text-accent"
                  >
                    {era.cta.label} →
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {/* WIDE IMAGE + LOCAL EXPERTISE */}
      <section className="mt-28">
        <div className="container mx-auto px-6 mt-16 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 reveal">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-[1.1]">
              Local Expertise. Collective Strength.
            </h2>
          </div>
          <div className="md:col-span-7 reveal" data-reveal-delay="120">
            <p className="text-lg leading-relaxed text-foreground/80">
              Our greatest advantage lies in our people and our structure. With
              strategically positioned mandates across the most sought-after
              regions, we offer specialist knowledge supported by a highly
              collaborative network.
            </p>
            <ul className="mt-6 space-y-3 text-foreground/80">
              <li className="flex gap-3">
                <span className="text-accent">—</span>
                <span>Prestige land and development opportunities in established markets</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent">—</span>
                <span>Coastal and agricultural estates with long-cycle optionality</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent">—</span>
                <span>Civic-adjacent commercial assets with durable rent rolls</span>
              </li>
            </ul>
            <p className="mt-6 text-foreground/80 leading-relaxed">
              This connected approach allows us to introduce qualified buyers to
              opportunities before they reach the open market — creating
              discretion, momentum and competitive advantage.
            </p>
            <Link
              to="/properties"
              className="story-link inline-block mt-8 label text-accent"
            >
              View properties →
            </Link>
          </div>
        </div>
      </section>

      {/* VALUATION */}
      <section className="container mx-auto px-6 mt-28">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5 reveal">
            <p className="label text-accent">Request a Valuation</p>
            <h2 className="mt-4 text-2xl md:text-3xl font-light tracking-tight leading-[1.2]">
              Considering selling? Begin with a confidential Valuation.
            </h2>
            <p className="mt-6 text-base md:text-lg leading-relaxed text-foreground/75 max-w-[48ch]">
              Share a few details about your property and one of our advisors
              will be in touch to arrange a private, no-obligation valuation.
            </p>
          </div>
          <form
            className="md:col-span-7 reveal space-y-5"
            data-reveal-delay="120"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-1">
                <label htmlFor="firstName" className="text-sm font-normal text-foreground/70">
                  Full Name*
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  className="w-full rounded-none border-0 border-b border-foreground/25 bg-transparent px-0 h-8 py-0 text-base focus:border-foreground focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-normal text-foreground/70">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full rounded-none border-0 border-b border-foreground/25 bg-transparent px-0 h-8 py-0 text-base focus:border-foreground focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="phone" className="text-sm font-normal text-foreground/70">
                  Phone*
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  className="w-full rounded-none border-0 border-b border-foreground/25 bg-transparent px-0 h-8 py-0 text-base focus:border-foreground focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="message" className="text-sm font-normal text-foreground/70">
                Message (Optional)
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full rounded-none border-0 border-b border-foreground/25 bg-transparent px-0 py-0 text-base resize-none focus:border-foreground focus:outline-none"
              />
            </div>
            <div className="pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-none bg-foreground text-background hover:bg-foreground/90 px-5 py-2 text-sm transition-colors"
              >
                Send Enquiry <span aria-hidden>→</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 mt-28 mb-20 text-center reveal">
        <Link
          to="/common-questions"
          className="story-link inline-block mt-5 ml-6 text-base label text-accent"
        >
          Common Questions →
        </Link>
      </section>
    </>
  );
};

export default About;
