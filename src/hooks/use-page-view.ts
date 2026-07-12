import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/** Stable per-browser session id used to group anonymous page views. */
function getSessionId(): string {
  try {
    const key = 'mp_session_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}

/**
 * Records a page view on every route change. Failures are silently ignored —
 * tracking must never break the page.
 */
export function usePageView() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Don't track admin pages.
    if (pathname.startsWith('/admin')) return;

    let cancelled = false;
    const slugMatch =
      pathname.match(/^\/properties\/(?!region\/)([^/]+)\/?$/) ||
      pathname.match(/^\/developments\/([^/]+)\/?$/);
    const property_slug = slugMatch ? slugMatch[1] : null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      await supabase.from('page_views').insert({
        path: pathname,
        property_slug,
        title: document.title || null,
        referrer: document.referrer || null,
        session_id: getSessionId(),
        user_id: user?.id ?? null,
      });
    })();

    return () => { cancelled = true; };
  }, [pathname]);
}
