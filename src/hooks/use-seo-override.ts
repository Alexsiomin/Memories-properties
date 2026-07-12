import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SeoOverride {
  title: string | null;
  description: string | null;
  og_image: string | null;
  noindex: boolean;
}

// In-memory cache so we don't refetch the same path repeatedly per session.
const cache = new Map<string, SeoOverride | null>();

/**
 * Fetches admin-managed SEO overrides for a given path.
 * Returns null until loaded (or if no override exists).
 */
export function useSeoOverride(path: string): SeoOverride | null {
  const [override, setOverride] = useState<SeoOverride | null>(
    cache.has(path) ? cache.get(path)! : null
  );

  useEffect(() => {
    let active = true;
    if (cache.has(path)) {
      setOverride(cache.get(path)!);
      return;
    }
    supabase
      .from('seo_settings')
      .select('title, description, og_image, noindex')
      .eq('path', path)
      .maybeSingle()
      .then(({ data }) => {
        const value = (data as SeoOverride) ?? null;
        cache.set(path, value);
        if (active) setOverride(value);
      });
    return () => {
      active = false;
    };
  }, [path]);

  return override;
}
