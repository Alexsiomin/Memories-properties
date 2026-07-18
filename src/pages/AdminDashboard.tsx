import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Eye,
  TrendingUp,
  Home,
  Layers,
  Tag,
  Percent,
  Users,
  MessageSquare,
  CalendarClock,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { ADMIN_NAV } from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import {
  projectName,
  isSold,
  formatEur,
} from '@/lib/developments';

type PropRow = {
  id: string;
  title: string;
  status: string | null;
  price_value: number | null;
  listing_type: string | null;
};


const CARD_DESCRIPTIONS: Record<string, string> = {
  '/admin/properties': 'View, edit, or delete existing listings.',
  '/admin/properties/new': 'Create a new property listing from scratch.',
  '/admin/properties#import': 'Bulk import multiple properties from an XML file.',
  '/admin/faqs': 'Create and edit frequently asked questions shown across the site.',
  '/admin/blog': 'Write and manage blog articles shown on the public blog.',
  '/admin/brand-words': 'Edit the rotating words shown in the footer hero.',
  '/admin/insights': 'Edit metrics and chart data shown on the public Insights page.',
  '/admin/developers': 'Add property developers and their XML feed URLs.',
  '/admin/emails': 'View tour requests and manage notification emails.',
  '/admin/analytics': 'Visitor traffic, most-viewed properties, and conversion stats.',
  '/admin/users-list': 'Browse all registered users and track signups.',
  '/admin/users': 'Grant or revoke admin access for other users.',
};

type StatusRow = {
  id: string;
  property_title: string | null;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
};

type ViewRow = { property_slug: string | null; title: string | null };

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [summary, setSummary] = useState({
    projects: 0,
    available: 0,
    sold: 0,
    soldValue: 0,
    views30d: 0,
    totalListings: 0,
    forSale: 0,
    forRent: 0,
    avgSold: 0,
    soldPct: 0,
    clients: 0,
    enquiries: 0,
    tours: 0,
  });
  const [topViews, setTopViews] = useState<{ key: string; title: string; count: number }[]>([]);
  const [recent, setRecent] = useState<StatusRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [propsRes, viewsRes, historyRes, totalRes, clientsRes, enquiriesRes, toursRes] =
        await Promise.all([
          supabase
            .from('properties')
            .select('id, title, status, price_value, listing_type')
            .not('developer_id', 'is', null)
            .limit(5000),
          supabase
            .from('page_views')
            .select('property_slug, title')
            .gte('created_at', since)
            .limit(10000),
          supabase
            .from('property_status_history')
            .select('id, property_title, old_status, new_status, created_at')
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('properties')
            .select('id, listing_type', { count: 'exact', head: false })
            .limit(10000),
          supabase.from('clients').select('id', { count: 'exact', head: true }),
          supabase.from('enquiries').select('id', { count: 'exact', head: true }),
          supabase.from('tour_requests').select('id', { count: 'exact', head: true }),
        ]);

      if (cancelled) return;

      const rows = (propsRes.data as PropRow[]) ?? [];
      const projects = new Set(rows.map((r) => projectName(r.title)).filter(Boolean));
      const soldUnits = rows.filter((r) => isSold(r));
      const soldValue = soldUnits.reduce((sum, r) => sum + (r.price_value ?? 0), 0);
      const avgSold = soldUnits.length ? Math.round(soldValue / soldUnits.length) : 0;

      const allRows = (totalRes.data as PropRow[]) ?? [];
      const forSale = allRows.filter((r) => r.listing_type === 'sale').length;
      const forRent = allRows.filter((r) => r.listing_type === 'rent').length;

      const views = (viewsRes.data as ViewRow[]) ?? [];
      const counter = new Map<string, { title: string; count: number }>();
      for (const v of views) {
        if (!v.property_slug) continue;
        const cur = counter.get(v.property_slug) ?? { title: v.title || v.property_slug, count: 0 };
        cur.count += 1;
        if (v.title) cur.title = v.title;
        counter.set(v.property_slug, cur);
      }
      const top = Array.from(counter.entries())
        .map(([key, { title, count }]) => ({ key, title, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const available = rows.length - soldUnits.length;
      setSummary({
        projects: projects.size,
        available,
        sold: soldUnits.length,
        soldValue,
        views30d: views.length,
        totalListings: totalRes.count ?? allRows.length,
        forSale,
        forRent,
        avgSold,
        soldPct: rows.length ? Math.round((soldUnits.length / rows.length) * 100) : 0,
        clients: clientsRes.count ?? 0,
        enquiries: enquiriesRes.count ?? 0,
        tours: toursRes.count ?? 0,
      });
      setTopViews(top);
      setRecent((historyRes.data as StatusRow[]) ?? []);
      setStatsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isAdmin]);

  if (authLoading || adminLoading) return <div className="container mx-auto px-6 py-24">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1></div>;

  const cards = ADMIN_NAV.filter((n) => n.to !== '/admin');

  const stat = (icon: React.ReactNode, label: string, value: string, hint?: string) => (
    <div className="border border-border bg-card p-5 rounded-xl transition-colors hover:border-accent/60">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <p className="text-3xl font-semibold mt-2 text-foreground">{statsLoading ? '…' : value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{statsLoading ? '' : hint}</p>}
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-16 max-w-6xl">
      <h1 className="text-4xl font-semibold mb-2 text-foreground">Admin dashboard</h1>
      <p className="text-muted-foreground mb-8">Overview of your portfolio, activity and content.</p>

      {/* Portfolio summary */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Portfolio</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stat(<Building2 size={16} />, 'Projects', String(summary.projects))}
        {stat(<Layers size={16} />, 'Total listings', String(summary.totalListings), `${summary.forSale} for sale · ${summary.forRent} to rent`)}
        {stat(<Home size={16} />, 'Available units', String(summary.available))}
        {stat(<CheckCircle2 size={16} />, 'Sold units', String(summary.sold), `${summary.soldPct}% of project units`)}
        {stat(<TrendingUp size={16} />, 'Sold value', formatEur(summary.soldValue) || '€0')}
        {stat(<Wallet size={16} />, 'Avg. sold price', formatEur(summary.avgSold) || '€0')}
        {stat(<Percent size={16} />, 'Sell-through', `${summary.soldPct}%`)}
        {stat(<Eye size={16} />, 'Views (30d)', String(summary.views30d))}
      </div>

      {/* Engagement summary */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Engagement</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stat(<Users size={16} />, 'Clients', String(summary.clients))}
        {stat(<MessageSquare size={16} />, 'Enquiries', String(summary.enquiries))}
        {stat(<CalendarClock size={16} />, 'Tour requests', String(summary.tours))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Most viewed */}
        <div className="border border-border bg-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground"><Eye size={18} className="text-accent" /> Most viewed (30 days)</h2>
          {statsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : topViews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No views recorded yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {topViews.map((t, i) => (
                <li key={t.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0 w-5 text-muted-foreground tabular-nums">{i + 1}.</span>
                    <span className="truncate">{t.title}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{t.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent status changes */}
        <div className="border border-border bg-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground"><CheckCircle2 size={18} className="text-accent" /> Recent status changes</h2>
          {statsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((r) => (
                <li key={r.id} className="text-sm">
                  <p className="font-medium truncate">{r.property_title || 'Untitled'}</p>
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1">
                      <Tag size={12} /> {(r.old_status || '—')} → {(r.new_status || '—')}
                    </span>
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Navigation cards */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Manage</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="block border border-border bg-card p-6 rounded-xl hover:border-accent hover:shadow-sm transition-all"
          >
            <h3 className="text-lg font-semibold mb-1.5 text-foreground">{c.title}</h3>
            <p className="text-sm text-muted-foreground">{CARD_DESCRIPTIONS[c.to] ?? ''}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
