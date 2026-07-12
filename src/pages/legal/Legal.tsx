import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';

interface TocItem { id: string; label: string }

interface LegalProps {
  title: string;
  intro?: string;
  updated?: string;
  toc?: TocItem[];
  children: React.ReactNode;
}

const RELATED = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/legal-notice', label: 'Legal Notice' },
  { to: '/terms', label: 'Terms of Use' },
  { to: '/cookies', label: 'Cookie Policy' },
  { to: '/disclosure', label: 'Disclosure' },
  { to: '/sitemap', label: 'Site Map' },
];

const Legal = ({ title, intro, updated = 'June 30, 2026', toc, children }: LegalProps) => {
  useEffect(() => {
    document.title = `${title} · Memories`;
  }, [title]);

  return (
    <>
      <SEO
        title={title}
        description={intro || `${title} — Memories Properties, private real estate in Paphos & Limassol, Cyprus.`}
      />
      <PageHeader title={title} />
      <section className="container mx-auto px-6 mt-6 pb-24">
        <div className="grid lg:grid-cols-[1fr_240px] gap-12 max-w-6xl">
          <article className="max-w-3xl space-y-6 text-foreground/80 leading-relaxed">
            <div className="text-xs uppercase tracking-wider text-foreground/50">
              Last Updated: {updated}
            </div>
            {intro && (
              <p className="text-base text-foreground/90 border-l-2 border-accent pl-4">
                {intro}
              </p>
            )}
            <div className="space-y-8 [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-montserrat [&_h2]:font-extrabold [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:text-accent [&_a:hover]:underline">
              {children}
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-xs uppercase tracking-wider text-foreground/50 mb-3">Related</p>
              <div className="flex flex-wrap gap-2">
                {RELATED.filter((r) => r.label !== title).map((r) => (
                  <Link
                    key={r.to}
                    to={r.to}
                    className="px-3 h-8 inline-flex items-center rounded-full border border-border text-xs text-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </div>
          </article>

          {toc && toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="text-xs uppercase tracking-wider text-foreground/50 mb-4">On this page</p>
                <ul className="space-y-2 text-sm border-l border-border">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a
                        href={`#${t.id}`}
                        className="block pl-4 -ml-px border-l border-transparent hover:border-accent text-foreground/70 hover:text-accent transition-colors"
                      >
                        {t.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </section>
    </>
  );
};

export default Legal;
