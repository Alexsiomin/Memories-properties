import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  intro?: string;
  items: FAQItem[];
  /** When true, also injects FAQPage JSON-LD for Google rich results */
  withJsonLd?: boolean;
}

const FAQSection = ({ title = 'Frequently asked questions', intro, items, withJsonLd = true }: FAQSectionProps) => {
  const [open, setOpen] = useState<number | null>(0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  };

  return (
    <section className="py-16" aria-labelledby="faq-heading">
      {withJsonLd && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Helmet>
      )}
      <div className="max-w-3xl mx-auto px-4">
        <h2 id="faq-heading" className="text-3xl font-semibold text-foreground text-center md:text-5xl">
          {title}
        </h2>
        {intro && <p className="mt-3 text-center text-muted-foreground">{intro}</p>}
        <div className="mt-10 space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.question}
                className="border border-border bg-card overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold text-foreground text-lg">{item.question}</span>
                  <Plus
                    size={20}
                    className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-45' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-muted-foreground leading-relaxed">{item.answer}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
