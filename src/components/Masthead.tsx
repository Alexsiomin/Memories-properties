import { useEffect, useState } from 'react';
import { User as UserIcon, Facebook, Home, Handshake, BarChart3, Search, Star, ChevronDown, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useIsAdmin } from '@/hooks/use-is-admin';
import LanguageToggle from '@/components/LanguageToggle';
import { toast } from 'sonner';
import { signInWithGoogle } from '@/lib/auth-redirect';

// Compact logo mark. Drawn inline as SVG (rather than a hosted image asset)
// so it inherits text color via currentColor and never depends on an
// external asset URL.
const MonogramM = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 726.010389 470.801074" className={className} fill="currentColor" aria-hidden="true">
    <g transform="translate(-263.994806,887.794883) scale(0.1,-0.1)">
      <path d="M4919 8873 c-4 -36 -5 -113 -7 -495 l-2 -437 -437 4 c-241 2 -448 2
-460 -2 l-23 -5 0 -259 0 -259 -255 0 -255 0 0 259 0 258 -62 5 c-35 2 -223 4
-418 3 l-355 0 -3 -1888 -2 -1887 1595 0 1595 0 2 733 3 732 452 3 453 2 2
-732 3 -733 1578 -3 1577 -2 -2 1886 -3 1885 -395 0 -395 -1 -3 -260 -2 -260
-255 0 -255 0 -2 260 -3 261 -395 0 c-217 0 -423 3 -457 6 l-63 5 -2 462 -3
461 -1372 3 c-755 1 -1373 -1 -1374 -5z" />
    </g>
  </svg>
);

type NavItem = { label: string; to: string; icon?: boolean; children?: { label: string; to: string }[] };

const NAV: NavItem[] = [
  {
    label: 'HOME',
    to: '/',
  },
  {
    label: 'BUY',
    to: '/properties',
    children: [
      { label: 'PROPERTIES FOR SALE', to: '/properties' },
      { label: 'Apartments', to: '/properties?kw=apartment' },
      { label: 'Villas', to: '/properties?kw=villa' },
      { label: 'NEW DEVELOPMENTS', to: '/developments' },
      { label: 'MARKET INSIGHTS', to: '/insights' },
      { label: 'TRANSFER FEES CALCULATOR', to: '/transfer-fees-calculator' },
    ],
  },
  {
    label: 'SELL',
    to: '/sell',
    children: [
      { label: 'REQUEST A VALUATION', to: '/contact?intent=valuation' },
      { label: 'SELL WITH US', to: '/sell' },
      { label: 'SOLD PROPERTIES', to: '/sold-projects' },
    ],
  },
  {
    label: 'PROJECTS',
    to: '/developments',
    children: [
      { label: 'CURRENT PROJECTS', to: '/developments' },
      { label: 'OFF-THE-PLAN', to: '/developments' },
      { label: 'SOLD PROJECTS', to: '/sold-projects' },
      { label: 'PROJECT EXPERTISE', to: '/project-expertise' },
    ],
  },
  { label: 'ADVOCACY', to: '/advisory' },
  { label: 'MARKET INSIGHTS', to: '/insights' },
  
];

// Mobile menu only — adds an ABOUT section (with the same links as the
// footer's About column) without affecting the desktop nav bar, which
// still uses NAV as-is.
const MOBILE_NAV: NavItem[] = [
  ...NAV,
  {
    label: 'ABOUT',
    to: '/about',
    children: [
      { label: 'About Us', to: '/about' },
      { label: 'Our Expertise', to: '/our-expertise' },
      { label: 'Common Questions', to: '/common-questions' },
      { label: 'Legal Notice', to: '/legal-notice' },
      { label: 'AML Obligations', to: '/legal-notice#aml' },
    ],
  },
];

const Masthead = () => {
  const [open, setOpen] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  

  // Transparent overlay only on routes with a full-bleed hero
  const isHeroRoute = pathname === '/' || pathname === '/about' || pathname === '/advisory' || pathname === '/sell' || pathname === '/our-expertise' || pathname === '/project-buyer-faqs' || pathname === '/project-expertise';

  // Listing pages (and Insights) show the full "Memories" text logo at the top,
  // then switch to the square "M" on scroll, but they do NOT have a hero image
  // behind the header, so the header must stay opaque with dark ink.
  const isDevListing = pathname === '/developments' || pathname === '/sold-projects' || pathname === '/insights' || pathname === '/insights/limassol';
  // Only development/sold DETAIL pages have a full-bleed hero (mobile). Listing pages don't.
  const isDevDetail = /^\/(developments|sold-projects)\/.+/.test(pathname);
  // Property detail pages also bleed their hero photo behind the header on mobile only.
  const isPropertyDetail = /^\/properties\/[^/]+$/.test(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const isDevPage = isDevDetail || isPropertyDetail;
  const isProjectExpertisePage = pathname === '/project-expertise';
  const transparent = (isHeroRoute || isDevPage) && !scrolled;
  // Dev pages have a full-bleed hero image only on mobile, so use white text on
  // mobile but dark on desktop while transparent. Hero routes are full-bleed at all sizes.
  const inkClass = transparent
    ? (isDevPage ? 'text-white md:text-[hsl(212_100%_10%)]' : 'text-white')
    : 'text-[hsl(212_100%_10%)]';
  const inkMuted = transparent
    ? (isDevPage
        ? 'text-white/80 hover:text-white md:text-[hsl(212_100%_10%/0.8)] md:hover:text-[hsl(212_100%_10%)]'
        : 'text-white/80 hover:text-white')
    : 'text-[hsl(212_100%_10%/0.8)] hover:text-[hsl(212_100%_10%)]';

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 translate-y-0 ${
        transparent
          ? 'bg-transparent border-b border-transparent'
          : 'bg-white/95 backdrop-blur-md border-b border-[hsl(212_100%_10%)]/10'
      }`}
      id="top"
    >
      <div className="w-full px-4 md:px-6 h-[49px] md:h-[63px] relative flex items-center justify-between gap-2 md:gap-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="relative flex flex-col items-center group h-7 w-[168px] md:w-[178px] lg:w-[188px]">
            <span
              translate="no"
              className={`notranslate font-montserrat font-extrabold text-2xl sm:text-3xl lg:text-2xl uppercase tracking-wide transition-colors ${inkClass} leading-none absolute left-0 after:content-[''] after:absolute after:w-full after:h-0.5 after:bottom-0 after:left-0 after:bg-current after:scale-x-0 after:origin-bottom-right after:transition-transform after:duration-300 group-hover:after:scale-x-100 group-hover:after:origin-bottom-left ${
                isProjectExpertisePage
                  ? 'opacity-0 group-hover:opacity-100'
                  : scrolled ? 'opacity-0' : 'opacity-100'
              }`}
            >
              Memories
            </span>
            <MonogramM
              className={`h-[24px] w-auto absolute left-0 top-1/2 -translate-y-1/2 transition-opacity duration-500 ${inkClass} ${
                isProjectExpertisePage
                  ? 'opacity-100 group-hover:opacity-0'
                  : scrolled ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </Link>
        </div>


        {(() => {
          const navCentered = scrolled || pathname === '/our-expertise' || isProjectExpertisePage;
          return (
        <nav className={`${open ? 'hidden' : 'hidden lg:flex'} items-center gap-6 xl:gap-8 2xl:gap-10 min-w-0 ${navCentered ? 'absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none' : 'ml-auto'}`}>
          {NAV.filter((item) => item.label !== 'HOME').map((item) => {
            const [itemPath, itemQs] = item.to.split('?');
            const itemIntent = new URLSearchParams(itemQs ?? '').get('intent');
            const currentIntent = new URLSearchParams(search).get('intent');
            const active = pathname === itemPath && (itemIntent ? currentIntent === itemIntent : !currentIntent);
            return (
              <div key={item.label} className="relative group pointer-events-auto">
                <Link
                  to={item.to}
                  className={`story-link relative py-2 text-sm uppercase tracking-[0.12em] xl:tracking-[0.18em] 2xl:tracking-[0.22em] font-montserrat font-extrabold transition-colors inline-flex items-center gap-1 whitespace-nowrap ${
                    active ? inkClass : inkMuted
                  }`}
                >
                  {item.icon ? <Home size={20} strokeWidth={2} /> : item.label}
                </Link>
                {item.children && item.children.length > 0 && (
                  navCentered ? (
                    <div className="fixed left-0 right-0 top-[49px] md:top-[63px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-white border-t border-b border-[hsl(212_100%_10%)]/10 shadow-lg py-8 px-4 md:px-6">
                        <ul className="max-w-7xl mx-auto flex flex-col gap-4">
                          {item.children.map((child) => (
                            <li key={child.label}>
                              <Link
                                to={child.to}
                                className="story-link text-[hsl(212_100%_10%)] text-base uppercase tracking-[0.06em] font-montserrat font-extrabold whitespace-nowrap pb-0.5 hover:opacity-70 transition-opacity"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-[hsl(212_100%_8%)] py-6 px-8 min-w-[280px] shadow-xl">
                        <ul className="flex flex-col gap-3">
                          {item.children.map((child) => (
                            <li key={child.label}>
                              <Link
                                to={child.to}
                                className="story-link text-white text-lg [font-variant-caps:all-small-caps] font-montserrat font-extrabold whitespace-nowrap pb-0.5"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </nav>
          );
        })()}

          <div className="flex items-center gap-6">
            <div className={`items-center gap-6 ${open ? 'hidden' : 'flex'}`}>
              {isAdmin ? (
              <Link
                to="/admin"
                className={`hidden sm:inline-flex text-sm uppercase tracking-[0.22em] font-montserrat font-extrabold transition-colors ${inkMuted}`}
              >
                Admin
              </Link>
            ) : null}
            {user ? (
              <Link
                to="/account"
                aria-label="My account"
                className={`hidden md:inline-flex items-center text-sm uppercase tracking-[0.22em] font-montserrat font-extrabold px-3 py-1.5 transition-colors hover:bg-[hsl(212_100%_10%)] hover:text-white ${
                  transparent && !isDevPage ? 'text-white/80' : 'text-[hsl(212_100%_10%)]/80'
                }`}
              >
                Account
              </Link>
            ) : (
              <Link
                to={`${pathname}?auth=1`}
                aria-label="Sign in"
                className={`hidden md:inline-flex items-center text-sm uppercase tracking-[0.22em] font-montserrat font-extrabold px-3 py-1.5 transition-colors hover:bg-[hsl(212_100%_10%)] hover:text-white ${
                  transparent && !isDevPage ? 'text-white/80' : 'text-[hsl(212_100%_10%)]/80'
                }`}
              >
                Sign in
              </Link>
            )}
          </div>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="masthead-menu"
            onClick={() => setOpen((current) => !current)}
            className={`mw-header-hamburger relative z-[60] transition-colors ${open ? 'active text-menu-foreground' : `${inkClass} hover:text-accent`}`}
          >
            <span aria-hidden="true" className="mw-header-hamburger-lines" />
          </button>

          <button
            type="button"
            aria-label="Close menu overlay"
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
            className={`fixed inset-0 z-40 bg-transparent transition-none ${open ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}`}
          />

          <aside
            id="masthead-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            aria-hidden={!open}
            className={`fixed inset-y-0 right-0 z-50 h-[100vh] w-full sm:w-[510px] bg-menu text-menu-foreground shadow-lg transition-all duration-300 ease-[ease] ${
              open ? 'visible translate-x-0 opacity-100' : 'invisible translate-x-full opacity-0 pointer-events-none'
            }`}
            style={{ transition: 'all ease .3s' }}
          >
              {/* Logo aligned with the sheet's close (X) button */}
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="absolute top-3.5 left-4 md:left-6 flex items-center"
              >
                <MonogramM className="h-7 w-auto text-menu-foreground" />
              </Link>

              <div className="flex-1 overflow-y-auto px-5 pt-[70px] pb-10 md:px-11 flex flex-col justify-between">
                <nav className="flex flex-col">
                  {MOBILE_NAV.filter((item) => item.label !== 'HOME').map((item) => {
                    const hasChildren = !!item.children?.length;
                    const expanded = openSection === item.label;
                    // When a section is open, dim every other top-level word
                    const dimmed = openSection !== null && !expanded;
                    const labelColor = dimmed
                      ? 'text-menu-foreground/35'
                      : 'text-menu-foreground';
                    return (
                      <div key={item.label} className="mb-2.5">
                  {hasChildren ? (
                          <button
                            type="button"
                            aria-expanded={expanded}
                            onClick={() => setOpenSection(expanded ? null : item.label)}
                            className={`flex items-center justify-between gap-3 w-full text-left font-montserrat font-extrabold uppercase tracking-normal transition-colors leading-[34px] text-[26px] hover:text-menu-foreground ${labelColor}`}
                          >
                            {item.label}
                            <ChevronDown
                              size={20}
                              className={`shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        ) : (
                          <Link
                            to={item.to}
                            onClick={() => setOpen(false)}
                            className={`block font-montserrat font-extrabold uppercase tracking-normal transition-colors leading-[34px] text-[26px] hover:text-menu-foreground ${labelColor}`}
                          >
                            {item.label}
                          </Link>
                        )}
                        {hasChildren && expanded && (
                          <ul className="flex flex-col gap-2 pt-2 pb-3">
                            {item.children!.map((child) => (
                              <li key={child.label}>
                                <Link
                                  to={child.to}
                                  onClick={() => setOpen(false)}
                                  className="story-link inline-block text-menu-foreground text-base leading-[24px] font-montserrat font-normal uppercase"
                                >
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </nav>


                <div className="mt-auto pt-16 pb-8 space-y-6">
                  <div className="block">
                    <LanguageToggle tone="text-menu-foreground" className="text-[26px]" />
                  </div>

                  {!user && (
                    <button
                      type="button"
                      disabled={googleBusy}
                      onClick={async () => {
                        setGoogleBusy(true);
                        const result = await signInWithGoogle('/account');
                        if (result.error) {
                          toast.error('Could not sign in with Google');
                          setGoogleBusy(false);
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-3 bg-white text-[hsl(212_100%_10%)] text-sm font-semibold px-4 h-12 hover:opacity-90 transition-opacity disabled:opacity-70"
                    >
                      {googleBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
                      Sign in with <span className="font-bold">Google</span>
                    </button>
                  )}

                  <div className="flex flex-col gap-4 text-base">
                    <a href="https://www.facebook.com/profile.php?id=61590658206461" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-menu-foreground/90 hover:text-accent transition-colors">
                      <Facebook size={18} /> Facebook
                    </a>
                    <Link
                      to="/contact"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center border border-menu-foreground text-menu-foreground px-4 py-1.5 text-sm font-montserrat font-normal hover:bg-menu-foreground hover:text-menu transition-colors w-fit"
                    >
                      Contact Us
                    </Link>
                    <a
                      href="https://wa.me/35797947862"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center border border-menu-foreground text-menu-foreground px-4 py-1.5 text-sm font-montserrat font-normal hover:bg-menu-foreground hover:text-menu transition-colors w-fit"
                    >
                      Whats App
                    </a>
                  </div>
                </div>
              </div>
          </aside>
        </div>
      </div>
    </header>
  );
};

export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isHome = pathname === '/';
  // Always visible on load; on the homepage it additionally hides while
  // actively scrolling down (to stay out of the way of the hero) and
  // reappears on scroll-up. It must never start hidden.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (!isHome) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 0) {
        setVisible(true);
      } else if (y > lastY && y > 80) {
        setVisible(false);
      } else if (y < lastY) {
        setVisible(true);
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const avatarUrl = meta.avatar_url || meta.picture || null;
  const initial = (meta.given_name?.[0] || meta.full_name?.[0] || meta.name?.[0] || user?.email?.[0] || '?').toUpperCase();
  const items = [
    ...NAV.filter((n) => n.to !== '/contact' && n.label !== 'SELL' && n.label !== 'PROJECTS').map((n) => ({ ...n, icon: false as const })),
    ...(user ? [
      { label: 'WATCHLIST', to: '/account?tab=watchlist', icon: false as const },
      { label: 'Account', to: '/account', icon: true as const },
    ] : [
      { label: 'Sign in', to: `${pathname}?auth=1`, icon: true as const },
    ]),
  ];
  return (
    <nav
      className={`md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#00101f] text-foreground border-t border-white/10 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      aria-hidden={!visible}
      aria-label="Primary mobile"
    >
      <ul className="flex items-center justify-around h-[45px]">
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <li key={item.label} className={item.icon ? 'shrink-0' : 'flex-1'}>
              <Link
                to={item.to}
                aria-label={item.label}
                className={`relative flex items-center justify-center ${item.icon ? 'px-5' : 'px-3'} py-0 text-sm font-montserrat font-extrabold whitespace-nowrap transition-colors ${
                  active ? 'text-white' : 'text-white/70 hover:text-accent'
                }`}
              >
                {item.icon ? (
                  user ? (
                    avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Account"
                        className={`w-7 h-7 rounded-full object-cover ring-1 ${active ? 'ring-white' : 'ring-white/40'}`}
                      />
                    ) : (
                      <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-semibold bg-white/10 ring-1 ${active ? 'ring-white text-white' : 'ring-white/40'}`}>
                        {initial}
                      </span>
                    )
                  ) : (
                    <UserIcon size={22} />
                  )
                ) : item.label === 'HOME' ? (
                  <Home size={22} />
                ) : item.label === 'ADVOCACY' ? (
                  <Handshake size={22} />
                ) : item.label === 'MARKET INSIGHTS' ? (
                  <BarChart3 size={22} />
                ) : item.label === 'BUY' ? (
                  <Search size={22} />
                ) : item.label === 'WATCHLIST' ? (
                  <Star size={22} />
                ) : (
                  item.label
                )}
                {active && (
                  <span className="absolute left-3 right-3 top-0 h-px bg-accent" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Masthead;
