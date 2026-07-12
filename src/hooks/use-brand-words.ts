import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches active brand words from the database, ordered by sort_order.
 * Falls back to the provided list if the fetch fails or returns nothing.
 */
export function useBrandWords(fallback: string[] = []) {
  const [words, setWords] = useState<string[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('brand_words')
        .select('word')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setWords(fallback);
      } else {
        setWords(data.map((d) => d.word));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { words, loading };
}
