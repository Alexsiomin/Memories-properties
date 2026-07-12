import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ParticleText from './ParticleText';
import { useBrandWords } from '@/hooks/use-brand-words';

const navColumns = [
  {
    title: 'Buy',
    links: [
      { label: 'Properties for Sale', to: '/properties' },
      { label: 'Property in Paphos', to: '/properties/region/paphos' },
      { label: 'Property in Limassol', to: '/properties/region/limassol' },
      { label: 'Browse by Location', to: '/locations' },
      { label: 'New Developments', to: '/developments' },
      { label: 'Transfer Fees Calculator', to: '/transfer-fees-calculator' },
      { label: 'Off-Market Investing Guide', to: '/guides/off-market-investing' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { label: 'Request Property Valuation', to: '/contact?intent=sell' },
      { label: 'Sell With Us', to: '/sell' },
      { label: 'Property Selling Expenses Calculator', to: '/selling-expenses-calculator' },
      { label: 'Sold Properties', to: '/sold-properties' },
      { label: 'Sold Projects', to: '/sold-projects' },
    ],
  },
  {
    title: 'Lease',
    links: [
      { label: 'Properties for Lease', to: '/properties' },
      { label: 'Lease With Us', to: '/contact?intent=lease' },
      { label: 'Advocacy', to: '/advisory' },
    ],
  },
  {
    title: 'Projects',
    links: [
      { label: 'New Developments', to: '/developments' },
      { label: 'Project Buyer FAQs', to: '/project-buyer-faqs' },
      { label: 'Market Insights', to: '/insights' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Our Expertise', to: '/our-expertise' },
      { label: 'Insights', to: '/insights' },
      { label: 'Common Questions', to: '/common-questions' },
      { label: 'Site Map', to: '/sitemap' },
      { label: 'Legal Notice', to: '/legal-notice' },
      { label: 'AML Obligations', to: '/legal-notice#aml' },
    ],
  },
];

const SiteFooter = () => {
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { words: brandWords } = useBrandWords(['MEMORIES.', 'CYPRUS.']);
  const [brandIdx, setBrandIdx] = useState(0);
  const brandText = brandWords[brandIdx % brandWords.length] ?? brandWords[0];
  const isMobile = vw < 640;
  const fontSize = isMobile ? Math.min(240, Math.floor(vw * 0.58)) : 280;
  const density = isMobile ? 2 : 2.5;
  const dotSize = isMobile ? 1.3 : 1.7;
  const mouseRadius = isMobile ? 60 : 90;
  const force = isMobile ? 40 : 60;

  return (
    <footer className="bg-[#00101f] text-white">
      {/* Top nav */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 pt-16 pb-12">

          {/* Mobile: Accordion nav rows */}
          <div className="sm:hidden">
            {navColumns.map((col, i) => {
              const open = openIdx === i;
              return (
                <div key={col.title} className="border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="w-full flex items-center justify-between py-5 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-montserrat uppercase font-extrabold tracking-[0.08em] text-white text-base">
                      {col.title}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-white/60 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                      strokeWidth={1}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-[max-height] duration-300 ease-out ${open ? 'max-h-96' : 'max-h-0'}`}
                  >
                    <ul className="space-y-2.5 pb-5 text-sm">
                      {col.links.map((l) => (
                        <li key={l.label}>
                          <Link
                            to={l.to}
                            className="story-link text-white transition-colors"
                          >
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Multi-column grid */}
          <div className="hidden sm:grid grid-cols-3 lg:grid-cols-5 gap-x-12 gap-y-8">
            {navColumns.map((col) => (
              <div key={col.title} className="text-left">
                <h4 className="font-montserrat uppercase font-extrabold tracking-[0.08em] text-white text-xs mb-5">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="story-link text-white transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter + Brand */}
      <div className="container mx-auto px-6 pt-2 pb-16 sm:pt-4 sm:pb-20">
        {/* Brand */}
        <div className="flex flex-col items-center pt-0">
          <div className="relative w-full h-[200px] sm:h-[300px] overflow-hidden flex items-center justify-center">
            <ParticleText
              text={brandText}
              fontSize={fontSize}
              density={density}
              dotSize={dotSize}
              mouseRadius={mouseRadius}
              force={force}
              color="#ffffff"
              accentColor="#ff8c42"
              accentRanges={[[brandText.length - 1, brandText.length]]}
              className="max-w-full"
            />
          </div>
          <button
            type="button"
            onClick={() => setBrandIdx((i) => (i + 1) % brandWords.length)}
            className="text-white/50 hover:text-white transition-colors font-montserrat font-extrabold text-[10px] tracking-widest uppercase flex items-center gap-2"
          >
            Tap to change the word
          </button>
        </div>

        {/* Legal */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-white/70">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('memories:open-consent'))}
                  className="hover:text-white transition-colors"
                >
                  Cookies
                </button>
              </li>
              <li>© {new Date().getFullYear()} Memories</li>
            </ul>
            <p className="text-[11px] text-white/70 text-center sm:text-right">
              Designed in Cyprus with AI and Love
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
