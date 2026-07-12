import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { useLanguage } from '@/hooks/use-language';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import heroAsset from '@/assets/project-buyer-faqs-hero.jpg.asset.json';

type Faq = { question: string; answer: string[] };
type Tab = { id: string; label: string; intro?: string; items: Faq[] };

const TABS: Tab[] = [
  {
    id: 'overview',
    label: 'Overview',
    intro: 'Why buy brand new',
    items: [
      {
        question: 'Long-Term Peace of Mind',
        answer: [
          'All of our projects come with a minimum maintenance programme, with many now extending to 12 months.',
          'Purchasers should know the difference between defect management and building insurance, as whilst they all offer you peace of mind, they operate differently.',
          'Defect management typically covers the first 12 months from the practical completion date and is a contractual obligation under the building contract, with the builder responsible for rectifying defects caused by workmanship or materials.',
        ],
      },
      {
        question: 'Sustainable Development',
        answer: [
          'Our developers have sustainability in mind when briefing their design team for any new development. These include cost-saving additions to help protect our precious planet.',
        ],
      },
      {
        question: 'Personalised Living Spaces',
        answer: [
          'Many of our developers will offer customisation opportunities, allowing you to make personalised changes for off-the-plan purchases. Enjoy your new home from the first day of moving in, without the need to suffer through costly renovations later.',
        ],
      },
      {
        question: 'Transparent Pricing',
        answer: [
          'All of our off-the-plan apartments or villas are offered at a fixed price, rather than a quoted forecast range. Prior sales within the same building also provide social proof that the price on offer accords with market value.',
        ],
      },
      {
        question: 'Financial Incentives',
        answer: [
          'Depending upon your individual circumstances, buying off the plan could save you significantly in unnecessary expenses and taxes, allowing you to borrow less and take years off your mortgage.',
        ],
      },
      {
        question: 'Extended Savings Period',
        answer: [
          'Additional time to save. Often the time between the day of sale and the call to settlement will be twelve months or more. This allows you to save more, borrow less and then pocket the difference.',
        ],
      },
      {
        question: 'Capital Growth Opportunity',
        answer: [
          'In a rising market, the time between buying your new property and settlement may allow for a period of capital growth. If you have a property to sell, it may be beneficial to delay selling to coincide the two settlements.',
        ],
      },
      {
        question: 'Brand New Living Spaces',
        answer: [
          'Brand new off-the-plan properties have never been lived in, ensuring a fresh and exciting start for both homeowners and tenants.',
        ],
      },
    ],
  },
  {
    id: 'how-it-works',
    label: 'How it works',
    intro: 'The journey from sale to settlement',
    items: [
      {
        question: 'Initial Paperwork and Deposit',
        answer: [
          'Following exchange, the completed paperwork goes off to yourself or to your nominated legal representative. Your agreed deposit will then be placed in the vendor’s legal representative’s trust account.',
        ],
      },
      {
        question: 'Milestones and Construction Commencement',
        answer: [
          'There are numerous milestones along the way that should be communicated to you.',
          'If the tender process to appoint a builder had not already been completed at the time of your purchase, the developer will complete this process and the successful builder will be announced.',
          'Once the necessary building permits have been sourced from the various authorities, construction can commence.',
        ],
      },
      {
        question: 'Variations and Customisations',
        answer: [
          'If construction is yet to commence or in its very early stages, you’ll be invited to provide a list of your requested variations, noting that not all requested changes can be accommodated.',
        ],
      },
      {
        question: 'Quote Approval and Payment for Variations',
        answer: [
          'This process can extend from weeks to months whilst the project manager liaises with the builder to provide you with a quote for your requested upgrades. Prior to a specified date, you’ll be asked to approve the quote and remit payment directly to the developer.',
        ],
      },
      {
        question: 'Regular Construction Updates',
        answer: [
          'Construction updates, including information on current works and accompanying photos, should be emailed to you typically every quarter or on milestone completion, with some being more frequent.',
        ],
      },
      {
        question: 'Forecasting Completion and Settlement',
        answer: [
          'Suggested forecast completion and settlement dates are typically best-case scenarios. Sometimes unforeseen circumstances such as supply issues or labour shortages will cause delays, outside both the builder’s and developer’s control.',
        ],
      },
      {
        question: 'Settlement Assistance and Final Inspection',
        answer: [
          'As construction approaches completion, a settlement company will be appointed to assist you through to settlement. Their role includes taking your valuer through the property, coordinating your accompanied final inspection and detailing any last-minute defects that require the builder’s attention.',
        ],
      },
      {
        question: 'Financial Checks and Additional Support',
        answer: [
          'During construction, it’s prudent for those financing their purchase to check in regularly with your finance broker or banker, ensuring you can take advantage of the best finance options available at settlement.',
          'Your selling salesperson will stay connected with you along the journey from sale to settlement.',
        ],
      },
    ],
  },
  {
    id: 'downsizers',
    label: 'Downsizers',
    items: [
      {
        question: 'Can I bring my pet to my new home?',
        answer: [
          'Most contracts of sale will have a clause referring to the provisions of an animal occupying a group of apartments or townhomes.',
          'Speak to your legal professional if you’re unsure.',
        ],
      },
      {
        question: 'When do I sell my family home?',
        answer: [
          'Many of our downsizers are in the fortunate position of determining their own timing with regards to when to move from their family home.',
          'Buyers who are risk averse may choose to sell within the same market they purchased, and then make two moves. Others will follow their new home’s progress and sell the family home closer to completion.',
          'It’s always prudent to talk to one of our local residential experts for a market appraisal of your existing property.',
        ],
      },
      {
        question: 'Who’s the appointed builder?',
        answer: [
          'Often for a particular project the vendor is the developer rather than the builder, so a builder will need to be appointed.',
          'If the tender process is still ongoing, ask to see the panel of builders on the tender list, allowing you to do your homework by looking at their experience online or by viewing completed projects.',
        ],
      },
    ],
  },
  {
    id: 'first-home-buyers',
    label: 'First Home Buyers',
    items: [
      {
        question: 'What am I entitled to as a first home buyer?',
        answer: [
          'Depending on your circumstances and jurisdiction, you could be eligible for first home buyer and reduced VAT rate.',
          'Speak with your advisor and always check with the relevant body first to see if you qualify.',
        ],
      },
      {
        question: 'Government schemes for off-the-plan purchasers',
        answer: [
          'There are a number of government schemes for off-the-plan purchasers that you should be aware of, as they could potentially save you thousands.',
          'Prior to proceeding you should always check with the relevant body first to confirm your eligibility.',
        ],
      },
    ],
  },
  {
    id: 'investors',
    label: 'Investors',
    items: [
      {
        question: 'What’s a rental guarantee?',
        answer: [
          'Whilst they can vary, typically under a guaranteed rent arrangement the landlord assigns the property to a letting agent for a specified period, in return for a guaranteed income.',
          'A Guaranteed Rental Return is a future rental income guaranteed by the developer or management company for a contracted period, typically one to two years. Potentially you can receive rent from day one, even when there is no tenant.',
        ],
      },
      {
        question: 'What’s my estimated rental income?',
        answer: [
          'Our dedicated property management team will provide you with a forecast rental appraisal for your off-the-plan property.',
          'It’s worth remembering that these estimates are at today’s market value and may differ at settlement. Check in during construction to learn firsthand what the rental market is doing in your area.',
        ],
      },
    ],
  },
  {
    id: 'points-of-difference',
    label: 'Our Points of Difference',
    items: [
      {
        question: 'We are specialists with off-the-plan selling',
        answer: [
          'Your dedicated specialist team focuses on off-the-plan selling, ensuring you are dealing with the best suited agent for your brand new property. We specialise in the new apartment and villa market, giving our clients peace of mind that they are dealing with experts.',
        ],
      },
      {
        question: 'Appropriately Sized Off-Plan Portfolio',
        answer: [
          'We offer a carefully selected portfolio of off-plan properties, focusing on quality rather than quantity. By working with trusted developers, we provide our clients with access to well-chosen opportunities that match a variety of budgets, lifestyles, and investment goals. Our tailored approach ensures you receive expert guidance in finding the right property for your needs.',
        ],
      },
      {
        question: 'We provide advantages unique to Memories',
        answer: [
          'With our team having already worked hand in hand with the developer of your property leading up to settlement, we can offer advantages not available to any other\u00A0 company — including current marketing collateral, early access for prospective new buyers and a vast database of tenants specifically for brand new properties.',
        ],
      },
      {
        question: 'We provide one agent across your entire service',
        answer: [
          'One person. One voice. One exceptional service through continuity.',
        ],
      },
    ],
  },
];

const ProjectBuyerFAQs = () => {
  const [active, setActive] = useState(TABS[0].id);
  const current = TABS.find((t) => t.id === active) ?? TABS[0];
  const { lang } = useLanguage();

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


  const isRu = lang === 'ru';
  const seoTitle = isRu
    ? 'Частые вопросы покупателей проектов — новостройки на Кипре | Memories'
    : 'Project Buyer FAQs — Off-the-Plan Property in Cyprus | Memories';
  const seoDescription = isRu
    ? 'Всё, что нужно знать покупателям новостроек на Кипре: как работает покупка off-the-plan, советы даунсайзерам и первым покупателям, инвестиционные инсайты и наши преимущества.'
    : 'Everything off-the-plan buyers need to know about Cyprus property: how buying new works, downsizer and first home buyer guidance, investor insights and our points of difference.';

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} />

      {/* HERO */}
      <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
        <img
          src={heroAsset.url}
          alt="Brand new off-the-plan development in Cyprus"
          className="absolute inset-0 h-full w-full object-cover object-left"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1 className="font-montserrat text-2xl font-bold uppercase tracking-[0.12em] text-white sm:text-5xl xl:tracking-[0.18em] 2xl:tracking-[0.22em]">
            Project Buyer FAQs
          </h1>
        </div>
      </section>

      {/* TAB NAV + CONTENT (scroll-triggered theme switch) */}
      <div
        ref={themeRef}
        style={{
          background: dark ? 'hsl(var(--menu))' : 'hsl(var(--background))',
          color: dark ? 'hsl(var(--menu-foreground))' : 'hsl(var(--foreground))',
          transition: 'background-color 0.6s ease, color 0.6s ease',
        }}
      >
        {/* TAB NAV */}
        <nav
          className="sticky top-0 z-30 backdrop-blur"
          style={{
            background: dark ? 'hsl(var(--menu))' : 'hsl(var(--background))',
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'hsl(var(--border))'}`,
            transition: 'background-color 0.6s ease, border-color 0.6s ease',
          }}
        >
          <div className="faq-tab-scroll touch-pan-x mx-auto flex max-w-6xl justify-start gap-6 px-6 pb-2 sm:justify-center">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className="relative whitespace-nowrap py-4 font-montserrat text-sm font-extrabold uppercase tracking-[0.12em]"
                style={{
                  color: 'inherit',
                  opacity: active === t.id ? 1 : 0.5,
                  transition: 'opacity 0.3s ease',
                }}
              >
                {t.label}
                {active === t.id && (
                  <span
                    className="absolute inset-x-0 -bottom-px h-0.5"
                    style={{ background: 'currentColor' }}
                  />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* CONTENT */}
        <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
          {current.intro && (
            <h2
              className="mb-8 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: 'inherit', opacity: 0.65 }}
            >
              {current.intro}
            </h2>
          )}
          <Accordion type="single" collapsible className="w-full">
            {current.items.map((item, i) => (
              <AccordionItem
                key={i}
                value={`${current.id}-${i}`}
                style={{
                  borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'hsl(var(--border))'}`,
                  transition: 'border-color 0.6s ease',
                }}
              >
                <AccordionTrigger
                  className="text-left text-base font-semibold"
                  style={{ color: 'inherit' }}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <div
                    className="space-y-3 text-base leading-relaxed"
                    style={{ color: 'inherit', opacity: 0.75 }}
                  >
                    {item.answer.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* CTA */}
          <div
            className="mt-60 pt-40 pb-40 text-center"
            style={{
              borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'hsl(var(--border))'}`,
              transition: 'border-color 0.6s ease',
            }}
          >
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: '#ffffff' }}
            >
              Knowledge is power
            </p>
            <h2
              className="mt-3 text-sm sm:text-2xl font-bold uppercase tracking-wide"
              style={{ color: 'inherit' }}
            >
              BE FULLY INFORMED BEFORE OWNING
              <br />
              YOUR NEW OFF-THE-PLAN PROPERTY
            </h2>
            <Link
              to="/contact"
              className="mt-32 inline-flex min-h-[44px] items-center justify-center border border-white bg-transparent px-6 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white hover:text-menu"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectBuyerFAQs;
