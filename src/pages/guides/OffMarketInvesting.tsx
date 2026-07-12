import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';

const GUIDE_TITLE = 'How to Find Off-Market Investment Properties';
const GUIDE_DESCRIPTION =
  'A practical guide to sourcing off-market investment properties — how private deals work, where they come from, and how to access them through a private practice.';

const steps: { heading: string; body: string }[] = [
  {
    heading: '1. Understand what "off-market" really means',
    body: 'Off-market (or "private") properties are never advertised on portals or with mainstream agents. Owners sell discreetly to control who sees the asset, protect confidentiality, and transact quickly. For investors, this means less competition and more room to negotiate — but it also means deals are only visible to those inside the right networks.',
  },
  {
    heading: '2. Build relationships with private practices',
    body: 'The single most reliable route to off-market deals is a relationship with a private real estate practice that holds exclusive mandates. Unlike a public listing portal, a private practice matches qualified investors to vendors directly. Register your interest, complete a brief qualification conversation, and make your investment criteria explicit.',
  },
  {
    heading: '3. Define a precise mandate',
    body: 'Vendors and advisors prioritise investors who know exactly what they want. Specify asset type (development land, agricultural estate, mixed-use, residential portfolio), target regions, ticket size, and return profile. A precise mandate makes you the first call when a matching asset appears.',
  },
  {
    heading: '4. Tap professional networks',
    body: 'Lawyers, notaries, tax advisers, family offices, and wealth managers frequently know of owners considering a discreet sale before anything is formalised. Cultivating these relationships gives you early sight of opportunities that never reach the open market.',
  },
  {
    heading: '5. Move with speed and certainty',
    body: 'Off-market vendors value discretion and a clean, certain process above a marginally higher headline price. Have your financing arranged, your advisers ready, and your decision-making fast. Demonstrating that you can transact quietly and reliably is what earns repeat access to private deals.',
  },
];

const GuideOffMarketInvesting = () => {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';

  return (
    <>
      <SEO
        title={GUIDE_TITLE}
        description={GUIDE_DESCRIPTION}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: GUIDE_TITLE,
          description: GUIDE_DESCRIPTION,
          publisher: {
            '@type': 'Organization',
            name: 'Memories Properties',
            logo: {
              '@type': 'ImageObject',
              url: `${origin}/favicon.png`,
            },
          },
          step: steps.map((s) => ({
            '@type': 'HowToStep',
            name: s.heading.replace(/^\d+\.\s*/, ''),
            text: s.body,
          })),
        }}
      />
      <PageHeader
        eyebrow="Guide"
        title="How to Find Off-Market Investment Properties"
        intro="Off-market deals are where the strongest risk-adjusted returns often sit. Here is how private investors source and secure them."
      />

      <article className="container mx-auto max-w-3xl px-4 sm:px-6 pb-20">
        <p className="text-lg text-muted-foreground leading-relaxed">
          The best investment-grade real estate rarely reaches a public listing. It moves
          quietly between owners, advisers, and a small circle of qualified investors. This
          guide explains how that market works and how to position yourself to access it.
        </p>

        <div className="mt-12 space-y-10">
          {steps.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                {s.heading}
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-14 rounded-[var(--radius)] border border-border bg-muted/40 p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Access our off-market mandates
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Memories sources off-market investment projects and land exclusively for a private
            roster of investors and family offices. Register your interest to be matched with
            mandates that fit your criteria.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-[var(--radius)] bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Begin a conversation
            </Link>
            <Link
              to="/properties"
              className="inline-flex items-center justify-center rounded-[var(--radius)] border border-border px-6 py-3 font-medium text-foreground transition-colors hover:bg-muted"
            >
              View the portfolio
            </Link>
          </div>
        </section>
      </article>
    </>
  );
};

export default GuideOffMarketInvesting;
