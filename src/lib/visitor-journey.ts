import { hasConsent } from '@/lib/cookie-consent';

/**
 * Lightweight, consent-gated "lead context" tracker.
 *
 * Only records anything if the visitor has granted "functional" or
 * "analytics" consent via the cookie banner. Everything is stored in
 * localStorage/sessionStorage on the visitor's own device — nothing is
 * sent anywhere until the visitor themselves submits an enquiry, tour
 * request, or contact form, at which point a snapshot of this data is
 * attached to that submission so the team has useful context on the lead.
 */

const VIEWS_KEY = 'memories_journey_views';
const SEARCH_KEY = 'memories_journey_last_search';
const REFERRAL_KEY = 'memories_journey_referral';
const VISITS_KEY = 'memories_journey_visits';
const MAX_VIEWS = 8;

const trackingAllowed = () => hasConsent('functional') || hasConsent('analytics');

type ViewedProperty = { id: string; title: string; slug: string | null; viewedAt: string };

/** Call once when a property detail page mounts. */
export function trackPropertyView(id: string, title: string, slug: string | null) {
  if (typeof window === 'undefined' || !trackingAllowed()) return;
  try {
    const raw = localStorage.getItem(VIEWS_KEY);
    const list: ViewedProperty[] = raw ? JSON.parse(raw) : [];
    const withoutDupe = list.filter((v) => v.id !== id);
    withoutDupe.unshift({ id, title, slug, viewedAt: new Date().toISOString() });
    localStorage.setItem(VIEWS_KEY, JSON.stringify(withoutDupe.slice(0, MAX_VIEWS)));
  } catch {
    /* best-effort only */
  }
}

/** Call when a search/filter is applied on the Properties page. */
export function trackSearch(summary: {
  region?: string | null;
  category?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  beds?: number | null;
}) {
  if (typeof window === 'undefined' || !trackingAllowed()) return;
  try {
    sessionStorage.setItem(SEARCH_KEY, JSON.stringify({ ...summary, at: new Date().toISOString() }));
  } catch {
    /* best-effort only */
  }
}

/** Call once on first load of a session — captures how the visitor arrived. */
export function trackReferralOnce() {
  if (typeof window === 'undefined' || !trackingAllowed()) return;
  try {
    if (sessionStorage.getItem(REFERRAL_KEY)) return; // already captured this session
    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
    };
    const referrer = document.referrer || null;
    sessionStorage.setItem(REFERRAL_KEY, JSON.stringify({ referrer, ...utm }));

    const visits = Number(localStorage.getItem(VISITS_KEY) ?? '0') + 1;
    localStorage.setItem(VISITS_KEY, String(visits));
  } catch {
    /* best-effort only */
  }
}

/** Call at submission time (enquiry/tour/contact form) to snapshot everything collected. */
export function getVisitorJourneySnapshot(): Record<string, unknown> | null {
  if (typeof window === 'undefined' || !trackingAllowed()) return null;
  try {
    const views: ViewedProperty[] = JSON.parse(localStorage.getItem(VIEWS_KEY) ?? '[]');
    const lastSearch = JSON.parse(sessionStorage.getItem(SEARCH_KEY) ?? 'null');
    const referral = JSON.parse(sessionStorage.getItem(REFERRAL_KEY) ?? 'null');
    const visits = Number(localStorage.getItem(VISITS_KEY) ?? '1');

    if (!views.length && !lastSearch && !referral) return null;

    return {
      recentlyViewed: views.map((v) => ({ id: v.id, title: v.title, slug: v.slug })),
      lastSearch,
      referral,
      visitCount: visits,
    };
  } catch {
    return null;
  }
}
