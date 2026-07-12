import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Building2 } from 'lucide-react';
import { projectName } from '@/lib/developments';

type Row = {
  id: string;
  title: string;
  developer_id: string | null;
  region: string | null;
  created_at: string;
};

type Group = {
  title: string;
  developer_id: string | null;
  region: string | null;
  count: number;
  created_at: string;
};

export default function AdminProjectEdit() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [rows, setRows] = useState<Row[]>([]);
  const [developers, setDevelopers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: props }, { data: devs }] = await Promise.all([
        supabase
          .from('properties')
          .select('id, title, developer_id, region, created_at')
          .not('developer_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(2000),
        supabase.from('developers').select('id, name'),
      ]);
      setRows((props as Row[]) ?? []);
      setDevelopers(Object.fromEntries((devs ?? []).map((d) => [d.id, d.name])));
      setLoading(false);
    })();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const r of rows) {
      const name = projectName(r.title) || r.title;
      const key = `${name}||${r.developer_id ?? ''}`;
      const g = map.get(key);
      if (g) {
        g.count += 1;
      } else {
        map.set(key, {
          title: name,
          developer_id: r.developer_id,
          region: r.region,
          count: 1,
          created_at: r.created_at,
        });
      }
    }
    let list = Array.from(map.values());
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((g) => g.title.toLowerCase().includes(s));
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [rows, q]);

  if (authLoading || adminLoading) return <div className="container mx-auto px-6 py-24">Loading…</div>;
  if (!user) return <Navigate to="/admin" replace />;
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1></div>;

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">Edit project (bulk)</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Pick a developer project to edit all its units together.
      </p>

      <Input
        placeholder="Search projects…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading projects…
        </div>
      ) : groups.length === 0 ? (
        <p className="text-muted-foreground py-12">No developer projects found.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {groups.map((g) => (
            <div key={`${g.title}||${g.developer_id ?? ''}`} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-medium truncate">{g.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {[g.developer_id ? developers[g.developer_id] : null, g.region, `${g.count} unit${g.count === 1 ? '' : 's'}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link
                  to={`/admin/projects/new?edit=${encodeURIComponent(g.title)}${g.developer_id ? `&dev=${encodeURIComponent(g.developer_id)}` : ''}`}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
