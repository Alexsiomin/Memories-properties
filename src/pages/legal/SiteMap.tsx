import { Link } from 'react-router-dom';
import Legal from './Legal';

const groups: { title: string; description?: string; links: { to: string; label: string; hint?: string }[] }[] = [
  {
    title: 'Discover',
    description: 'Browse the practice and the portfolio.',
    links: [
      { to: '/', label: 'Home', hint: 'Hero, featured listings & insights' },
      { to: '/about', label: 'About', hint: 'The practice, principals & approach' },
      { to: '/our-expertise', label: 'Our Expertise', hint: 'How we work with buyers & sellers' },
      { to: '/advisory', label: 'Advisory', hint: 'Private, off-market advisory' },
      { to: '/contact', label: 'Contact', hint: 'Get in touch with the team' },
    ],
  },
  {
    title: 'Properties',
    description: 'Every listing and development.',
    links: [
      { to: '/properties', label: 'Properties', hint: 'Search every active listing' },
      { to: '/locations', label: 'Locations', hint: 'Browse by city & district' },
      { to: '/developments', label: 'Developments', hint: 'New-build projects for sale' },
      { to: '/sold-projects', label: 'Sold Projects', hint: 'Completed developments' },
      { to: '/sold-properties', label: 'Sold Properties', hint: 'Recently sold listings' },
      { to: '/sell', label: 'Sell With Us', hint: 'Request a valuation' },
    ],
  },
  {
    title: 'Insights & Guides',
    description: 'Market intelligence and resources.',
    links: [
      { to: '/insights', label: 'Insights — Paphos', hint: 'Market notes & long-form pieces' },
      { to: '/insights/limassol', label: 'Insights — Limassol', hint: 'Limassol market review' },
      { to: '/blog', label: 'Blog', hint: 'Guides, news & advice' },
      { to: '/guides/off-market-investing', label: 'Off-Market Investing', hint: 'Private-sale guide' },
      { to: '/common-questions', label: 'Common Questions', hint: 'Frequently asked questions' },
      { to: '/transfer-fees-calculator', label: 'Transfer Fees Calculator' },
      { to: '/selling-expenses-calculator', label: 'Selling Expenses Calculator' },
    ],
  },
  {
    title: 'Account',
    description: 'Sign in to save searches and favourites.',
    links: [
      { to: '/auth', label: 'Sign in / Register' },
      { to: '/account', label: 'My account' },
      { to: '/account?tab=watchlist', label: 'Saved properties' },
      { to: '/account?tab=searches', label: 'Saved searches' },
    ],
  },
  {
    title: 'Legal',
    description: 'Policies that govern this site.',
    links: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Use' },
      { to: '/cookies', label: 'Cookie Policy' },
      { to: '/disclosure', label: 'Disclosure' },
      { to: '/legal-notice', label: 'Legal Notice & AML' },
      { to: '/sitemap', label: 'Site Map' },
    ],
  },
];


const SiteMap = () => (
  <Legal
    title="Site Map"
    intro="A complete index of every public page on Memories Properties. If you can’t find what you’re looking for, contact us — we’re happy to help."
  >
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 not-prose">
      {groups.map((g) => (
        <div key={g.title}>
          <h2 className="text-xs uppercase tracking-wider text-accent mb-2">{g.title}</h2>
          {g.description && (
            <p className="text-xs text-foreground/60 mb-4">{g.description}</p>
          )}
          <ul className="space-y-3">
            {g.links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="group block"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    {l.label}
                  </span>
                  {l.hint && (
                    <span className="block text-xs text-foreground/55 mt-0.5">{l.hint}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </Legal>
);

export default SiteMap;
