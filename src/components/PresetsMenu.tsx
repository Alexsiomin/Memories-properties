import { useEffect, useState } from 'react';
import { Bookmark, Trash2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface FilterPreset {
  mode: string;
  query: string;
  region: string;
  activeTags: string[];
  activeCats: string[];
  minPrice: string;
  maxPrice: string;
  minBeds: number;
  minBaths: number;
  sort: string;
}

interface SavedRow {
  id: string;
  name: string;
  filters: FilterPreset | Record<string, unknown>;
  created_at: string;
}

interface Props {
  current: FilterPreset;
  onApply: (p: FilterPreset) => void;
}

export default function PresetsMenu({ current, onApply }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_searches')
      .select('id, name, filters, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as SavedRow[]);
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const savePreset = async () => {
    if (!user) {
      toast.error('Sign in to save presets', {
        action: { label: 'Sign in', onClick: () => (window.location.href = '/auth') },
      });
      return;
    }
    const defaultName = [
      current.mode,
      current.query,
      current.activeCats[0],
      current.minPrice || current.maxPrice
        ? `€${current.minPrice || '0'}–${current.maxPrice || '∞'}`
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const name = window.prompt('Name this preset', defaultName || 'My preset');
    if (!name) return;
    const { error } = await supabase.from('saved_searches').insert([
      {
        user_id: user.id,
        name,
        mode: current.mode,
        query: current.query || null,
        region: current.region || null,
        tags: current.activeTags.length ? current.activeTags : null,
        filters: current as any,
      },
    ]);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Preset saved');
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('saved_searches').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success('Preset removed');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="btn-cta btn-cta-sm"
          aria-label="Filter presets"
        >
          <Bookmark size={14} />
          <span className="hidden sm:inline">Presets</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-white border-[hsl(212_100%_10%)]/15 z-[60]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(212_100%_10%)]/10">
          <p className="font-semibold text-base uppercase tracking-wider text-[hsl(212_100%_10%)]/70">
            Filter presets
          </p>
          <button
            type="button"
            onClick={savePreset}
            className="font-semibold text-base text-accent hover:underline underline-offset-4"
          >
            Save current
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {!user ? (
            <div className="px-4 py-6 text-sm text-[hsl(212_100%_10%)]/60 text-center">
              <a href="/auth" className="text-accent font-semibold hover:underline">
                Sign in
              </a>{' '}
              to save and reuse filter combinations.
            </div>
          ) : loading ? (
            <div className="px-4 py-6 text-sm text-[hsl(212_100%_10%)]/60 text-center">
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[hsl(212_100%_10%)]/60 text-center">
              No presets yet. Configure filters and tap “Save current”.
            </div>
          ) : (
            rows.map((r) => {
              const f = (r.filters ?? {}) as Partial<FilterPreset>;
              const summary = [
                f.mode,
                f.activeCats?.length ? `${f.activeCats.length} type${f.activeCats.length > 1 ? 's' : ''}` : '',
                f.minPrice || f.maxPrice ? `€${f.minPrice || '0'}–${f.maxPrice || '∞'}` : '',
                f.minBeds ? `${f.minBeds}+ bd` : '',
                f.minBaths ? `${f.minBaths}+ ba` : '',
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <div
                  key={r.id}
                  className="group flex items-center gap-2 px-3 py-2 hover:bg-[hsl(212_100%_10%)]/5 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onApply({ ...current, ...f } as FilterPreset);
                      setOpen(false);
                      toast.success(`Applied “${r.name}”`);
                    }}
                    className="flex-1 min-w-0 text-left flex items-center gap-2"
                  >
                    <Check size={14} className="text-accent shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[hsl(212_100%_10%)] truncate">
                        {r.name}
                      </span>
                      {summary && (
                        <span className="block text-xs text-[hsl(212_100%_10%)]/60 truncate">
                          {summary}
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    aria-label={`Delete ${r.name}`}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-[hsl(212_100%_10%)]/60 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
