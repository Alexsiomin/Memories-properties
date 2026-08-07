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
  AlertTriangle,
  ImageOff,
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

const STALE_SYNC_DAYS = 7;

type StaleDeveloper = { id: string; name: string; last_synced_at: string | null };
type RecentEnquiry = { id: string; first_name: string | null; phone: string | null; property_type: string | null; region: string | null; created_at: string };
type RecentTour = { id: string; full_name: string | null; property_title: string | null; preferred_date: string | null; created_at: string };

function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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
  const [staleDevelopers, setStaleDevelopers] = useState<StaleDeveloper[]>([]);
  const [dataQuality, setDataQuality] = useState({ missingImage: 0, missingPrice: 0, missingDescription: 0 });
  const [recentEnquiries, setRecentEnquiries] = useState<RecentEnquiry[]>([]);
  const [recentTours, setRecentTours] = useState<RecentTour[]>([]);
  const [trackingStale, setTrackingStale] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [propsRes, viewsRes, historyRes, totalRes, clientsRes, enquiriesRes, toursRes, developersRes, qualityRes, recentEnquiriesRes, recentToursRes, lastViewRes] =
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
          supabase.from('developers').select('id, name, last_synced_at, xml_url'),
          supabase.from('properties').select('cover_image, images, price_value, description').limit(5000),
          supabase.from('enquiries').select('id, first_name, phone, property_type, region, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('tour_requests').select('id, full_name, property_id, preferred_date, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('page_views').select('created_at').order('created_at', { ascending: false }).limit(1),
        ]);

      if (cancelled) return;

      // Feed health: developers with an XML feed that haven't synced in a while.
      const stale = ((developersRes.data as { id: string; name: string; last_synced_at: string | null; xml_url: string | null }[]) ?? [])
        .filter((d) => d.xml_url)
        .filter((d) => !d.last_synced_at || (Date.now() - new Date(d.last_synced_at).getTime()) / 86_400_000 > STALE_SYNC_DAYS)
        .map((d) => ({ id: d.id, name: d.name, last_synced_at: d.last_synced_at }));
      setStaleDevelopers(stale);

      // Site-wide data quality flags.
      const qualityRows = (qualityRes.data as { cover_image: string | null; images: string[] | null; price_value: number | null; description: string | null }[]) ?? [];
      setDataQuality({
        missingImage: qualityRows.filter((p) => !p.cover_image && !(p.images && p.images.length > 0)).length,
        missingPrice: qualityRows.filter((p) => !p.price_value || p.price_value <= 0).length,
        missingDescription: qualityRows.filter((p) => !p.description || !p.description.trim()).length,
      });

      // Recent enquiries — shown as-is, no property join needed for a quick glance.
      setRecentEnquiries((recentEnquiriesRes.data as RecentEnquiry[]) ?? []);

      // Recent tours — join property titles for readability.
      const tourRows = (recentToursRes.data as { id: string; full_name: string | null; property_id: string | null; preferred_date: string | null; created_at: string }[]) ?? [];
      const tourPropIds = [...new Set(tourRows.map((r) => r.property_id).filter(Boolean))] as string[];
      let tourPropMap: Record<string, string> = {};
      if (tourPropIds.length) {
        const { data: tourProps } = await supabase.from('properties').select('id, title').in('id', tourPropIds);
        (tourProps ?? []).forEach((p: any) => { tourPropMap[p.id] = p.title; });
      }
      setRecentTours(tourRows.map((r) => ({
        id: r.id,
        full_name: r.full_name,
        property_title: r.property_id ? (tourPropMap[r.property_id] ?? null) : null,
        preferred_date: r.preferred_date,
        created_at: r.created_at,
      })));

      // Tracking staleness: flag if the most recent page view is itself old,
      // so the Views (30d) figure doesn't look silently authoritative while
      // tracking may be incomplete.
      const lastView = (lastViewRes.data as { created_at: string }[] | null)?.[0];
      setTrackingStale(!lastView || (Date.now() - new Date(lastView.created_at).getTime()) / 3_600_000 > 24);

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

      {/* Rollup warnings — surfaced here so problems are visible without
          having to visit each management page individually. */}
      {!statsLoading && (staleDevelopers.length > 0 || dataQuality.missingImage > 0 || dataQuality.missingPrice > 0) && (
        <div className="space-y-2 mb-8">
          {staleDevelopers.length > 0 && (
            <Link
              to="/admin/developers"
              className="flex items-start gap-3 border border-amber-200 bg-amber-50 text-amber-900 p-4 rounded-xl hover:border-amber-300 transition-colors"
            >
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm">
                <span className="font-semibold">{staleDevelopers.length} developer feed{staleDevelopers.length === 1 ? '' : 's'}</span>
                {' '}not synced in over {STALE_SYNC_DAYS} days: {staleDevelopers.map((d) => d.name).join(', ')}.
              </p>
            </Link>
          )}
          {(dataQuality.missingImage > 0 || dataQuality.missingPrice > 0) && (
            <Link
              to="/admin/properties"
              className="flex items-start gap-3 border border-amber-200 bg-amber-50 text-amber-900 p-4 rounded-xl hover:border-amber-300 transition-colors"
            >
              <ImageOff size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm">
                {dataQuality.missingImage > 0 && (
                  <><span className="font-semibold">{dataQuality.missingImage}</span> propert{dataQuality.missingImage === 1 ? 'y' : 'ies'} missing photos</>
                )}
                {dataQuality.missingImage > 0 && dataQuality.missingPrice > 0 && ' · '}
                {dataQuality.missingPrice > 0 && (
                  <><span className="font-semibold">{dataQuality.missingPrice}</span> missing a price</>
                )}
              </p>
            </Link>
          )}
        </div>
      )}

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
        {stat(<Eye size={16} />, 'Views (30d)', String(summary.views30d), trackingStale ? 'Tracking data may be incomplete right now' : undefined)}
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

        {/* Recent enquiries */}
        <div className="border border-border bg-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground"><MessageSquare size={18} className="text-accent" /> Recent enquiries</h2>
          {statsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : recentEnquiries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enquiries yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentEnquiries.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-medium truncate">{e.first_name || 'Anonymous'}{e.phone ? ` · ${e.phone}` : ''}</p>
                  <p className="text-muted-foreground truncate">
                    {[e.property_type, e.region].filter(Boolean).join(' · ') || 'General enquiry'}
                    {' · '}{relativeTime(e.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/emails" className="inline-block mt-4 text-sm text-accent hover:underline">View all →</Link>
        </div>

        {/* Recent tour requests */}
        <div className="border border-border bg-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground"><CalendarClock size={18} className="text-accent" /> Recent tour requests</h2>
          {statsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : recentTours.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tour requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentTours.map((t) => (
                <li key={t.id} className="text-sm">
                  <p className="font-medium truncate">{t.full_name || 'Anonymous'}</p>
                  <p className="text-muted-foreground truncate">
                    {t.property_title || 'Property'}
                    {t.preferred_date ? ` · ${new Date(t.preferred_date).toLocaleDateString()}` : ''}
                    {' · '}{relativeTime(t.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/emails" className="inline-block mt-4 text-sm text-accent hover:underline">View all →</Link>
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
