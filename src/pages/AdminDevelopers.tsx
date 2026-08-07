import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  syncDeveloperFeed,
  syncProjectsFeed,
  parseProjectsXml,
  FEED_FORMAT_OPTIONS,
  FeedFormat,
  parsePropertiesXml,
  fetchFeedXml,
  ParsedProperty,
} from '@/lib/xml-import';

interface SyncHistoryEntry {
  at: string;
  success: boolean;
  inserted?: number;
  updated?: number;
  summary?: string;
  error?: string;
}

interface Developer {
  id: string;
  name: string;
  xml_url: string | null;
  notes: string | null;
  feed_format: FeedFormat;
  created_at: string;
  last_synced_at: string | null;
  last_sync_success: boolean | null;
  sync_history: SyncHistoryEntry[];
}

const empty = { name: '', xml_url: '', notes: '', feed_format: 'auto' as FeedFormat };

const STALE_SYNC_DAYS = 7;

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never synced';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isStale(iso: string | null): boolean {
  if (!iso) return true;
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return days > STALE_SYNC_DAYS;
}

export default function AdminDevelopers() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [items, setItems] = useState<Developer[]>([]);
  const [editing, setEditing] = useState<Developer | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ rows: ParsedProperty[]; source: string } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const runTest = (xml: string, source: string) => {
    try {
      if (form.feed_format === 'islandblue-projects') {
        const projects = parseProjectsXml(xml);
        setTestResult(null);
        setTestError(null);
        toast.success(`Parsed ${projects.length} project${projects.length === 1 ? '' : 's'} from ${source}. First: "${projects[0]?.name ?? 'n/a'}" (status: ${projects[0]?.status ?? 'n/a'})`);
        return;
      }
      const rows = parsePropertiesXml(xml, form.feed_format);
      setTestResult({ rows, source });
      setTestError(null);
      toast.success(`Parsed ${rows.length} propert${rows.length === 1 ? 'y' : 'ies'} from ${source}`);
    } catch (e: any) {
      setTestResult(null);
      setTestError(e.message || 'Failed to parse');
      toast.error(e.message || 'Failed to parse');
    }
  };

  const onTestFile = async (file: File) => {
    setTesting(true);
    try {
      const text = await file.text();
      runTest(text, file.name);
    } finally {
      setTesting(false);
    }
  };

  const onTestUrl = async () => {
    if (!form.xml_url.trim()) { toast.error('Enter an XML feed URL first'); return; }
    setTesting(true);
    try {
      const xml = await fetchFeedXml(form.xml_url.trim());
      runTest(xml, 'feed URL');
    } catch (e: any) {
      setTestError(e.message || 'Failed to fetch');
      setTestResult(null);
      toast.error(e.message || 'Failed to fetch');
    } finally {
      setTesting(false);
    }
  };


  /**
   * Records a sync attempt on the developer row itself (last_synced_at,
   * last_sync_success, and a rolling sync_history log capped at 20 entries)
   * so sync outcomes are actually remembered instead of only flashing in a
   * toast. Extends the existing developers table rather than a new one.
   */
  const logSyncAttempt = async (developer: Developer, entry: Omit<SyncHistoryEntry, 'at'>) => {
    const fullEntry: SyncHistoryEntry = { at: new Date().toISOString(), ...entry };
    const nextHistory = [fullEntry, ...(developer.sync_history || [])].slice(0, 20);
    const { error } = await supabase
      .from('developers')
      .update({
        last_synced_at: fullEntry.at,
        last_sync_success: entry.success,
        sync_history: nextHistory,
      })
      .eq('id', developer.id);
    if (error) { console.error('Failed to log sync attempt:', error.message); return; }
    setItems((prev) => prev.map((d) => (d.id === developer.id
      ? { ...d, last_synced_at: fullEntry.at, last_sync_success: entry.success, sync_history: nextHistory }
      : d)));
  };

  const sync = async (d: Developer) => {
    if (!d.xml_url) { toast.error('No XML feed URL set for this developer'); return; }
    setSyncingId(d.id);
    try {
      if (d.feed_format === 'islandblue-projects') {
        const res = await syncProjectsFeed(d.xml_url);
        const summary = `${res.matchedProjects}/${res.totalProjects} projects matched, ${res.unitsUpdated} units enriched, ${res.markedSold} marked sold` +
          (res.unmatched.length ? ` (${res.unmatched.length} unmatched)` : '');
        toast.success(`Synced ${d.name}: ${summary}`);
        await logSyncAttempt(d, { success: true, summary });
        await loadStats();
      } else {
        const res = await syncDeveloperFeed(d.id, d.xml_url, d.feed_format || 'auto');
        toast.success(`Synced ${d.name}: ${res.inserted} new, ${res.updated} updated (of ${res.total})`);
        await logSyncAttempt(d, { success: true, inserted: res.inserted, updated: res.updated, summary: `${res.inserted} new, ${res.updated} updated (of ${res.total})` });
        await loadStats();
      }
    } catch (e: any) {
      const message = e.message || 'Sync failed';
      toast.error(message);
      await logSyncAttempt(d, { success: false, error: message });
    } finally {
      setSyncingId(null);
    }
  };

  interface DevStats {
    total: number;
    forSale: number;
    sold: number;
    reserved: number;
    missingImage: number;
    missingPrice: number;
    missingDescription: number;
  }
  const [devStats, setDevStats] = useState<Record<string, DevStats>>({});

  const load = async () => {
    const { data } = await supabase.from('developers').select('*').order('name');
    setItems((data as Developer[]) || []);
  };

  /**
   * Property counts and data quality flags per developer, computed from a
   * single query rather than one query per developer. Deliberately doesn't
   * depend on visitor/traffic analytics, since that tracking is currently
   * broken pending real Supabase access — this only uses the properties
   * table itself, which is reliable.
   */
  const loadStats = async () => {
    const { data } = await supabase
      .from('properties')
      .select('developer_id, status, cover_image, images, price_value, description')
      .not('developer_id', 'is', null);
    const stats: Record<string, DevStats> = {};
    (data || []).forEach((p: any) => {
      const id = p.developer_id;
      if (!id) return;
      if (!stats[id]) {
        stats[id] = { total: 0, forSale: 0, sold: 0, reserved: 0, missingImage: 0, missingPrice: 0, missingDescription: 0 };
      }
      const s = stats[id];
      s.total++;
      const status = (p.status || '').toLowerCase();
      if (/sold/.test(status)) s.sold++;
      else if (/reserved/.test(status)) s.reserved++;
      else s.forSale++;
      const hasImage = p.cover_image || (Array.isArray(p.images) && p.images.length > 0);
      if (!hasImage) s.missingImage++;
      if (!p.price_value || p.price_value <= 0) s.missingPrice++;
      if (!p.description || !p.description.trim()) s.missingDescription++;
    });
    setDevStats(stats);
  };

  useEffect(() => { if (isAdmin) { load(); loadStats(); } }, [isAdmin]);

  if (authLoading || adminLoading) return <div className="container mx-auto px-6 py-24">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1></div>;

  const startEdit = (d: Developer) => {
    setEditing(d);
    setForm({
      name: d.name,
      xml_url: d.xml_url || '',
      notes: d.notes || '',
      feed_format: (d.feed_format || 'auto') as FeedFormat,
    });
    setTestResult(null);
    setTestError(null);
  };
  const startNew = () => { setEditing(null); setForm(empty); setTestResult(null); setTestError(null); };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      xml_url: form.xml_url.trim() || null,
      notes: form.notes.trim() || null,
      feed_format: form.feed_format,
    };
    const { error } = editing
      ? await supabase.from('developers').update(payload).eq('id', editing.id)
      : await supabase.from('developers').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? 'Updated' : 'Created');
    startNew();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this developer? Linked properties will keep their data but lose the developer link.')) return;
    const { error } = await supabase.from('developers').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted');
    if (editing?.id === id) startNew();
    load();
  };

  const formatLabel = (f: FeedFormat) =>
    FEED_FORMAT_OPTIONS.find((o) => o.value === f)?.label ?? f;

  return (
    <div className="container mx-auto px-6 py-16 max-w-7xl">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl">Manage developers</h1>
        <Link to="/admin"><Button variant="outline">Back to dashboard</Button></Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-3">
          {items.map((d) => {
            const stats = devStats[d.id];
            const stale = isStale(d.last_synced_at);
            const historyOpen = expandedHistory.has(d.id);
            return (
            <div key={d.id} className="border p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="font-medium flex items-center gap-2 flex-wrap">
                    {d.name}
                    {stale && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-sm" title={`Not successfully synced in over ${STALE_SYNC_DAYS} days`}>
                        Stale feed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Format: {formatLabel(d.feed_format || 'auto')}
                  </div>
                  {d.xml_url && (
                    <div className="text-sm text-muted-foreground truncate">{d.xml_url}</div>
                  )}
                  {d.notes && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.notes}</div>
                  )}

                  {/* Last sync status */}
                  <div className="text-xs mt-2 flex items-center gap-1.5">
                    {d.last_sync_success === true && <span className="text-emerald-600">✓</span>}
                    {d.last_sync_success === false && <span className="text-red-600">✗</span>}
                    <span className="text-muted-foreground">
                      {d.last_synced_at ? `Last synced ${relativeTime(d.last_synced_at)}` : 'Never synced'}
                    </span>
                    {d.sync_history?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedHistory((prev) => {
                          const next = new Set(prev);
                          if (next.has(d.id)) next.delete(d.id); else next.add(d.id);
                          return next;
                        })}
                        className="text-accent underline underline-offset-2"
                      >
                        {historyOpen ? 'Hide history' : 'View history'}
                      </button>
                    )}
                  </div>
                  {historyOpen && (
                    <ul className="mt-1.5 space-y-1 text-xs border-l-2 border-border pl-2">
                      {d.sync_history.map((h, i) => (
                        <li key={i} className="text-muted-foreground">
                          <span className={h.success ? 'text-emerald-600' : 'text-red-600'}>{h.success ? '✓' : '✗'}</span>
                          {' '}{relativeTime(h.at)} — {h.success ? (h.summary || 'Synced') : (h.error || 'Failed')}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Property stats + data quality flags */}
                  {stats && (
                    <div className="text-xs mt-2 text-muted-foreground">
                      <span>{stats.total} propert{stats.total === 1 ? 'y' : 'ies'} · {stats.forSale} for sale · {stats.sold} sold · {stats.reserved} reserved</span>
                      {(stats.missingImage > 0 || stats.missingPrice > 0 || stats.missingDescription > 0) && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          {stats.missingImage > 0 && <span className="text-amber-700">{stats.missingImage} missing image{stats.missingImage === 1 ? '' : 's'}</span>}
                          {stats.missingPrice > 0 && <span className="text-amber-700">{stats.missingPrice} missing price{stats.missingPrice === 1 ? '' : 's'}</span>}
                          {stats.missingDescription > 0 && <span className="text-amber-700">{stats.missingDescription} missing description{stats.missingDescription === 1 ? '' : 's'}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => sync(d)}
                    disabled={!d.xml_url || syncingId === d.id}
                    title={d.xml_url ? 'Re-fetch the XML feed and update properties' : 'Add an XML URL to enable sync'}
                  >
                    {syncingId === d.id ? 'Syncing…' : 'Sync XML'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startEdit(d)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(d.id)}>Delete</Button>
                </div>
              </div>
            </div>
            );
          })}
          {items.length === 0 && <p className="text-muted-foreground">No developers yet.</p>}
        </div>

        <div className="border p-6 space-y-4 sticky top-6 self-start">
          <h2 className="text-2xl">{editing ? 'Edit developer' : 'New developer'}</h2>
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>XML feed URL</Label>
            <Input
              value={form.xml_url}
              onChange={(e) => setForm({ ...form, xml_url: e.target.value })}
              placeholder="https://example.com/feed.xml"
            />
          </div>
          <div>
            <Label>Feed format</Label>
            <select
              value={form.feed_format}
              onChange={(e) => setForm({ ...form, feed_format: e.target.value as FeedFormat })}
              className="w-full h-10 px-3 border rounded-md bg-background text-sm"
            >
              {FEED_FORMAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {FEED_FORMAT_OPTIONS.find((o) => o.value === form.feed_format)?.desc}
            </p>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Format quirks, contact, etc."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
            {editing && <Button variant="outline" onClick={startNew}>Cancel</Button>}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <h3 className="text-lg">Test feed format</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Parse a sample without writing to the database. Uses the format selected above.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".xml,application/xml,text/xml"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onTestFile(f);
                    e.target.value = '';
                  }}
                />
                <span
                  role="button"
                  className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  {testing ? 'Testing…' : 'Upload test XML'}
                </span>
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={onTestUrl}
                disabled={testing || !form.xml_url.trim()}
                title={form.xml_url.trim() ? 'Fetch the saved feed URL and parse it' : 'Enter a feed URL above first'}
              >
                {testing ? 'Testing…' : 'Test feed URL'}
              </Button>
              {(testResult || testError) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setTestResult(null); setTestError(null); }}
                >
                  Clear
                </Button>
              )}
            </div>

            {testError && (
              <div className="text-sm text-destructive border border-destructive/30 rounded-md p-3">
                {testError}
              </div>
            )}

            {testResult && (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>{testResult.rows.length}</strong> propert{testResult.rows.length === 1 ? 'y' : 'ies'} parsed from {testResult.source}
                </p>
                <div className="max-h-72 overflow-auto border rounded-md divide-y text-xs">
                  {testResult.rows.slice(0, 50).map((p, i) => {
                    const issues: string[] = [];
                    if (!p.title) issues.push('no title');
                    if (!p.location) issues.push('no location');
                    if (!p.price_value) issues.push('no price');
                    if (!p.images?.length) issues.push('no images');
                    return (
                      <div key={i} className="p-2">
                        <div className="font-medium">{p.title || '(no title)'}</div>
                        <div className="text-muted-foreground">
                          {p.location || '—'} · {p.price || '—'} · {p.category || '—'}
                          {p.reference_code ? ` · ref ${p.reference_code}` : ''}
                        </div>
                        {issues.length > 0 && (
                          <div className="text-destructive mt-1">⚠ {issues.join(', ')}</div>
                        )}
                      </div>
                    );
                  })}
                  {testResult.rows.length > 50 && (
                    <div className="p-2 text-muted-foreground">
                      …showing first 50 of {testResult.rows.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
