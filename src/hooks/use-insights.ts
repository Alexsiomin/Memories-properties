import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type InsightRow = {
  id: string;
  section: string;
  label: string | null;
  value: string | null;
  sub: string | null;
  numeric_value: number | null;
  numeric_x: number | null;
  numeric_y: number | null;
  category: string | null;
  sort_order: number;
  is_active: boolean;
};

export function useInsights(section: string, fallback: InsightRow[] = []) {
  const [data, setData] = useState<InsightRow[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('insights')
      .select('*')
      .eq('section', section)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data && data.length) setData(data as InsightRow[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [section]);

  return { data, loading };
}
