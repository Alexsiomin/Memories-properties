import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';

interface SoldProperty {
  id: string;
  title: string;
  location: string;
  category: string;
  status: string;
  price: string;
  price_value: number | null;
  cover_image: string | null;
  updated_at: string;
}

const formatPrice = (v: number | null, fallback: string) =>
  v && v > 0 ? `€${new Intl.NumberFormat('en-US').format(v)}` : fallback;

export default function AdminSoldProperties() {
  const [items, setItems] = useState<SoldProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('id,title,location,category,status,price,price_value,cover_image,updated_at')
      .ilike('status', '%sold%')
      .order('updated_at', { ascending: false });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setItems((data ?? []) as SoldProperty[]);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm('Delete this sold listing?')) return;
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted');
    setItems((xs) => xs.filter((x) => x.id !== id));
  };

  const filtered = items.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      (p.category ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl mb-2">Sold properties</h1>
          <p className="text-foreground/60">
            Track every closed transaction. Sold listings appear on the public “Most expensive sold” lists.
          </p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/admin/properties/new?status=sold">
            <Plus className="h-4 w-4 mr-1" /> Add sold listing
          </Link>
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by title, location, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-foreground/60">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 p-10 text-center">
          <p className="text-lg text-foreground/70 mb-4">
            No sold listings yet. Add your first sold transaction.
          </p>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/admin/properties/new?status=sold">
              <Plus className="h-4 w-4 mr-1" /> Add sold listing
            </Link>
          </Button>
        </div>
      ) : (
        <ol className="divide-y divide-foreground/10 border-t border-b border-foreground/10">
          {filtered.map((p, i) => (
            <li
              key={p.id}
              className="grid grid-cols-[40px_72px_1fr_auto_auto] items-center gap-4 py-4"
            >
              <span className="font-mono text-sm text-foreground/50 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="aspect-[4/3] overflow-hidden rounded-md bg-foreground/5">
                {p.cover_image ? (
                  <img src={p.cover_image} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-medium truncate">{p.title}</h3>
                <p className="text-sm text-foreground/60 truncate">
                  {p.location} · {p.category}
                </p>
              </div>
              <span className="text-base font-medium whitespace-nowrap">
                {formatPrice(p.price_value, p.price)}
              </span>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/admin/properties/${p.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => remove(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
