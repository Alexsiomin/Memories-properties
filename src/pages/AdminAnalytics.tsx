import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Users, TrendingUp, Percent, Flame, BellRing, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type RangeDays = 7 | 30 | 90;

type PageViewRow = {
  path: string;
  property_slug: string | null;
  title: string | null;
  referrer: string | null;
  session_id: string | null;
  created_at: string;
};

type PropertyRow = {
  id: string;
  slug: string | null;
  title: string;
  status: string | null;
};

type JourneySnapshot = {
  recentlyViewed?: { id: string; title: string; slug: string | null }[];
} | null | undefined;

type EnquiryMetaRow = { metadata?: { journey?: JourneySnapshot } | null };

const RANGE_OPTIONS: RangeDays[] = [7, 30, 90];

function classifyReferrer(referrer: string | null): string {
  if (!referrer) return 'Direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (/google|bing|duckduckgo|yahoo|perplexity/i.test(host)) return 'Search';
    if (/facebook|instagram|twitter|x\.com|linkedin|tiktok|whatsapp/i.test(host)) return 'Social';
    if (host.includes('memoriesproperties.com')) return 'Internal';
    return `Referral · ${host}`;
  } catch {
    return 'Direct';
  }
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<RangeDays>(30);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<PageViewRow[]>([]);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [viewedIdsWithEnquiry, setViewedIdsWithEnquiry] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString();

      const [viewsRes, propsRes, enquiriesCountRes, enquiriesMetaRes] = await Promise.all([
        supabase
          .from('page_views')
          .select('path, property_slug, title, referrer, session_id, created_at')
          .gte('created_at', since)
          .limit(20000),
        supabase.from('properties').select('id, slug, title, status').limit(5000),
        supabase.from('enquiries').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('enquiries').select('metadata').gte('created_at', since).limit(2000),
      ]);

      if (cancelled) return;

      const ids = new Set<string>();
      ((enquiriesMetaRes.data as EnquiryMetaRow[]) ?? []).forEach((row) => {
        row.metadata?.journey?.recentlyViewed?.forEach((v) => {
          if (v.id) ids.add(v.id);
          if (v.slug) ids.add(v.slug);
        });
      });

      setViews((viewsRes.data as PageViewRow[]) ?? []);
      setProperties((propsRes.data as PropertyRow[]) ?? []);
      setEnquiryCount(enquiriesCountRes.count ?? 0);
      setViewedIdsWithEnquiry(ids);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [range]);

  const propertyBySlugOrId = useMemo(() => {
    const map = new Map<string, PropertyRow>();
    properties.forEach((p) => {
      map.set(p.id, p);
      if (p.slug) map.set(p.slug, p);
    });
    return map;
  }, [properties]);

  const stats = useMemo(() => {
    const uniqueSessions = new Set(views.map((v) => v.session_id).filter(Boolean));
    const referrerCounts = new Map<string, number>();
    views.forEach((v) => {
      const cat = classifyReferrer(v.referrer);
      referrerCounts.set(cat, (referrerCounts.get(cat) ?? 0) + 1);
    });
    const topReferrer = Array.from(referrerCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    const conversionRate = uniqueSessions.size
      ? ((enquiryCount / uniqueSessions.size) * 100).toFixed(1)
      : '0.0';
    return {
      totalViews: views.length,
      uniqueSessions: uniqueSessions.size,
      topReferrer: topReferrer ? `${topReferrer[0]} (${topReferrer[1]})` : '—',
      conversionRate,
    };
  }, [views, enquiryCount]);

  const dailySeries = useMemo(() => {
    const buckets = new Map<string, number>();
    views.forEach((v) => {
      const day = v.created_at.slice(0, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [views]);

  const referrerBreakdown = useMemo(() => {
    const buckets = new Map<string, number>();
    views.forEach((v) => {
      const cat = classifyReferrer(v.referrer).split(' · ')[0];
      buckets.set(cat, (buckets.get(cat) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).sort((a, b) => b[1] - a[1]);
  }, [views]);

  const mostViewed = useMemo(() => {
    const counter = new Map<string, { title: string; slug: string | null; propertyId: string | null; count: number }>();
    views.forEach((v) => {
      if (!v.property_slug) return;
      const cur = counter.get(v.property_slug) ?? {
        title: v.title || v.property_slug,
        slug: v.property_slug,
        propertyId: propertyBySlugOrId.get(v.property_slug)?.id ?? null,
        count: 0,
      };
      cur.count += 1;
      counter.set(v.property_slug, cur);
    });
    return Array.from(counter.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((row) => {
        const hasEnquiry =
          (row.propertyId && viewedIdsWithEnquiry.has(row.propertyId)) ||
          (row.slug && viewedIdsWithEnquiry.has(row.slug));
        return { ...row, hot: row.count >= 3 && !hasEnquiry };
      });
  }, [views, propertyBySlugOrId, viewedIdsWithEnquiry]);

  const [alertRunResult, setAlertRunResult] = useState<{ alertsChecked: number; matchesCreated: number; emailsSent: number; emailProviderConfigured: boolean } | null>(null);
  const [runningAlerts, setRunningAlerts] = useState(false);

  const runAlertMatching = async () => {
    setRunningAlerts(true);
    setAlertRunResult(null);
    const { data, error } = await supabase.functions.invoke('match-property-alerts', {});
    setRunningAlerts(false);
    if (error) {
      toast({ title: 'Alert matching failed', description: error.message, variant: 'destructive' });
      return;
    }
    setAlertRunResult(data);
    toast({
      title: 'Alert matching complete',
      description: `${data.matchesCreated} new match(es) found across ${data.alertsChecked} active alert(s).`,
    });
  };

  const stat = (icon: React.ReactNode, label: string, value: string) => (
    <div className="border border-border bg-card p-5 rounded-xl">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <p className="text-3xl font-semibold mt-2 text-foreground">{loading ? '…' : value}</p>
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-16 max-w-6xl">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-4xl font-semibold text-foreground">Analytics</h1>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                range === d
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'border-border text-muted-foreground hover:border-accent/60'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground mb-8">Visitor behaviour and listing engagement, last {range} days.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stat(<Eye size={16} />, 'Page views', String(stats.totalViews))}
        {stat(<Users size={16} />, 'Unique sessions', String(stats.uniqueSessions))}
        {stat(<TrendingUp size={16} />, 'Top traffic source', stats.topReferrer)}
        {stat(<Percent size={16} />, 'Enquiry conversion', `${stats.conversionRate}%`)}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="border border-border bg-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Views over time</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : dailySeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No views recorded yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="border border-border bg-card p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Traffic sources</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : referrerBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No traffic recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {referrerBreakdown.map(([label, count]) => {
                const pct = stats.totalViews ? Math.round((count / stats.totalViews) * 100) : 0;
                return (
                  <li key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{label}</span>
                      <span className="text-muted-foreground tabular-nums">{count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="border border-border bg-card p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-1 text-foreground">Most viewed properties</h2>
        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5">
          <Flame size={14} className="text-accent" /> Flagged rows: viewed 3+ times, no linked enquiry yet — good re-targeting candidates.
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : mostViewed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No property views recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {mostViewed.map((row, i) => (
              <li key={row.slug ?? i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0 w-5 text-muted-foreground tabular-nums">{i + 1}.</span>
                  {row.propertyId ? (
                    <Link
                      to={`/properties/${row.slug ?? row.propertyId}`}
                      target="_blank"
                      className="truncate underline-offset-2 hover:underline"
                    >
                      {row.title}
                    </Link>
                  ) : (
                    <span className="truncate">{row.title}</span>
                  )}
                  {row.hot && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-accent/15 text-accent px-2 py-0.5 rounded-full">
                      Hot lead
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-border bg-card p-6 rounded-xl mt-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <BellRing size={18} className="text-accent" /> Property alerts
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Checks active saved-search alerts against current listings and records new matches. Emails send only once a
              provider (e.g. Resend) is configured — until then, matches are still logged for later sending.
            </p>
          </div>
          <Button onClick={runAlertMatching} disabled={runningAlerts}>
            {runningAlerts ? <Loader2 className="animate-spin" size={16} /> : <BellRing size={16} />}
            {runningAlerts ? 'Checking…' : 'Check for matches now'}
          </Button>
        </div>
        {alertRunResult && (
          <div className="mt-4 text-sm text-muted-foreground flex flex-wrap gap-x-6 gap-y-1">
            <span>Alerts checked: <span className="text-foreground font-medium">{alertRunResult.alertsChecked}</span></span>
            <span>New matches: <span className="text-foreground font-medium">{alertRunResult.matchesCreated}</span></span>
            <span>Emails sent: <span className="text-foreground font-medium">{alertRunResult.emailsSent}</span></span>
            {!alertRunResult.emailProviderConfigured && (
              <span className="text-accent">No email provider configured — matches logged only.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
