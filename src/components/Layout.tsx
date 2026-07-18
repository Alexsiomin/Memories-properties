import { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Masthead, { MobileBottomNav } from '@/components/Masthead';
import AuthModal from '@/components/AuthModal';
// import GoogleOneTapPrompt from '@/components/GoogleOneTapPrompt';
// Lazy-loaded: pulls react-markdown (~70KB) — keep it out of the main bundle.
const ConciergeWidget = lazy(() => import('@/components/ConciergeWidget'));
import { useAuth } from '@/hooks/use-auth';

import SiteFooter from '@/components/SiteFooter';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { usePageView } from '@/hooks/use-page-view';
import { trackReferralOnce } from '@/lib/visitor-journey';

const Layout = () => {
  const ref = useScrollReveal<HTMLDivElement>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showConcierge, setShowConcierge] = useState(false);
  usePageView();
  useEffect(() => { trackReferralOnce(); }, []);

  // Defer the chat widget (pulls react-markdown) until the browser is idle or
  // the user first interacts, so its chunk never competes with first paint.
  useEffect(() => {
    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      setShowConcierge(true);
    };
    const opts = { once: true, passive: true } as AddEventListenerOptions;
    ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach((evt) =>
      window.addEventListener(evt, load, opts)
    );
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, o?: { timeout: number }) => number)
      | undefined;
    const handle = ric ? ric(load, { timeout: 5000 }) : window.setTimeout(load, 4000);
    return () => {
      ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach((evt) =>
        window.removeEventListener(evt, load)
      );
      if (ric && (window as any).cancelIdleCallback) (window as any).cancelIdleCallback(handle);
      else window.clearTimeout(handle as number);
    };
  }, []);



  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  // Google sign-in temporarily disabled — listing click interceptor removed.

  const isHeroRoute = pathname === '/' || pathname === '/about' || pathname === '/advisory' || pathname === '/sell' || pathname === '/our-expertise' || pathname === '/project-buyer-faqs' || pathname === '/project-expertise';
  const isDevPage = pathname.startsWith('/developments') || pathname.startsWith('/sold-projects');
  // Only development/sold DETAIL pages have a full-bleed hero (and only on mobile).
  // Listing pages never have a hero, so they always need the spacer.
  const isDevDetail = /^\/(developments|sold-projects)\/.+/.test(pathname);
  const isDevListing = isDevPage && !isDevDetail;

  return (
    <div ref={ref} className="min-h-screen flex flex-col bg-background text-foreground">
      <Masthead />
      {/* Spacer for fixed header on non-hero routes */}
      {!isHeroRoute && !isDevPage && <div aria-hidden className="h-16 md:h-20" />}
      {/* Dev listing pages have no hero at any size */}
      {isDevListing && <div aria-hidden className="h-16 md:h-20" />}
      {/* Dev detail pages bleed the hero behind the header on mobile only */}
      {isDevDetail && <div aria-hidden className="hidden md:block h-20" />}
      <main key={pathname} className="animate-page-in flex-grow">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      {!pathname.startsWith('/admin') && pathname !== '/account' && <SiteFooter />}
      {!/^\/properties\/[^/]+$/.test(pathname) && <MobileBottomNav />}
      <AuthModal />
      {/* {!pathname.startsWith('/admin') && <GoogleOneTapPrompt />} */}
      {!pathname.startsWith('/admin') && showConcierge && (
        <Suspense fallback={null}>
          <ConciergeWidget />
        </Suspense>
      )}
    </div>
  );
};

export default Layout;
