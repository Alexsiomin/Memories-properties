import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FAQItem } from '@/components/FAQSection';

/**
 * Fetches active FAQs for a given category from the database, ordered by sort_order.
 * Falls back to an optional `fallback` list if the fetch fails or returns nothing,
 * so the page never renders empty if the DB is briefly unreachable.
 */
export function useFaqs(category: string, fallback: FAQItem[] = []) {
  const [items, setItems] = useState<FAQItem[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('question, answer')
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setItems(fallback);
      } else {
        setItems(data as FAQItem[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return { items, loading };
}
