import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';

export interface FavoriteInput {
  property_id: string;
  property_title: string;
  property_location?: string;
  property_price?: string;
  property_image?: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    const { data } = await supabase.from('favorites').select('property_id').eq('user_id', user.id);
    setIds(new Set((data ?? []).map((r) => r.property_id)));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

    const toggle = useCallback(async (fav: FavoriteInput) => {
    if (!user) {
      toast.error('Sign in to save properties');
      return;
    }
    setLoading(true);
    if (ids.has(fav.property_id)) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', fav.property_id);
      setIds((s) => { const n = new Set(s); n.delete(fav.property_id); return n; });
      toast.success('Removed from watchlist', {
        style: { background: '#00101f', color: '#fff', fontSize: '16px', border: 'none' },
        icon: <Heart className="h-5 w-5 text-muted-foreground" />,
      });
    } else {
      const { error } = await supabase.from('favorites').insert({ ...fav, user_id: user.id });
      if (error) toast.error(error.message);
      else {
        setIds((s) => new Set(s).add(fav.property_id));
        toast.success('Saved to watchlist', {
          style: { background: '#00101f', color: '#fff', fontSize: '16px', border: 'none' },
          icon: <Heart className="h-6 w-6 text-red-500 fill-red-500" />,
        });
      }
    }
    setLoading(false);
  }, [ids, user]);

  return { ids, isFavorite: (id: string) => ids.has(id), toggle, loading, refresh };
};
