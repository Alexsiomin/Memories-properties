import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bell, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertRow {
  id: string;
  client_id: string;
  property_id: string;
  score: number;
  created_at: string;
  seen_at: string | null;
  client_name?: string;
  property_title?: string;
  property_slug?: string | null;
}

export default function MatchAlertsBell() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);

  const load = async () => {
    const { data: rows } = await supabase
      .from('match_alerts')
      .select('id, client_id, property_id, score, created_at, seen_at')
      .is('seen_at', null)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!rows?.length) { setAlerts([]); return; }
    const cIds = Array.from(new Set(rows.map((r: any) => r.client_id)));
    const pIds = Array.from(new Set(rows.map((r: any) => r.property_id)));
    const [{ data: cls }, { data: prs }] = await Promise.all([
      supabase.from('clients').select('id, full_name').in('id', cIds),
      supabase.from('properties').select('id, title, slug').in('id', pIds),
    ]);
    const cMap = new Map((cls ?? []).map((c: any) => [c.id, c.full_name]));
    const pMap = new Map((prs ?? []).map((p: any) => [p.id, p]));
    setAlerts(rows.map((r: any) => ({
      ...r,
      client_name: cMap.get(r.client_id) || 'Client',
      property_title: pMap.get(r.property_id)?.title || 'Property',
      property_slug: pMap.get(r.property_id)?.slug || null,
    })));
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('match-alerts-bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_alerts' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const dismiss = async (id: string) => {
    await supabase.from('match_alerts').update({ seen_at: new Date().toISOString() }).eq('id', id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const dismissAll = async () => {
    const ids = alerts.map((a) => a.id);
    if (!ids.length) return;
    await supabase.from('match_alerts').update({ seen_at: new Date().toISOString() }).in('id', ids);
    setAlerts([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Match alerts"
      >
        <Bell className="h-5 w-5" />
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-sm font-semibold">Match alerts</span>
            {alerts.length > 0 && (
              <button onClick={dismissAll} className="text-xs text-muted-foreground hover:text-foreground">Mark all read</button>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No new matches.</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {alerts.map((a) => (
                <li key={a.id} className="border-b border-border last:border-0 px-3 py-2.5 hover:bg-muted/40 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{a.client_name}</div>
                      <Link
                        to={`/properties/${a.property_slug || a.property_id}`}
                        target="_blank"
                        className="text-sm font-medium hover:text-accent line-clamp-2"
                      >
                        {a.property_title}
                      </Link>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                        {Math.round(a.score)}% fit
                      </span>
                    </div>
                    <button
                      onClick={() => dismiss(a.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
                      aria-label="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
