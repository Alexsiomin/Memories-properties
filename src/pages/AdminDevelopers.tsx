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
  FEED_FORMAT_OPTIONS,
  FeedFormat,
  parsePropertiesXml,
  fetchFeedXml,
  ParsedProperty,
} from '@/lib/xml-import';

interface Developer {
  id: string;
  name: string;
  xml_url: string | null;
  notes: string | null;
  feed_format: FeedFormat;
  created_at: string;
}

const empty = { name: '', xml_url: '', notes: '', feed_format: 'auto' as FeedFormat };

export default function AdminDevelopers() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [items, setItems] = useState<Developer[]>([]);
  const [editing, setEditing] = useState<Developer | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ rows: ParsedProperty[]; source: string } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const runTest = (xml: string, source: string) => {
    try {
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


  const sync = async (d: Developer) => {
    if (!d.xml_url) { toast.error('No XML feed URL set for this developer'); return; }
    setSyncingId(d.id);
    try {
      const res = await syncDeveloperFeed(d.id, d.xml_url, d.feed_format || 'auto');
      toast.success(`Synced ${d.name}: ${res.inserted} new, ${res.updated} updated (of ${res.total})`);
    } catch (e: any) {
      toast.error(e.message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const load = async () => {
    const { data } = await supabase.from('developers').select('*').order('name');
    setItems((data as Developer[]) || []);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

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
          {items.map((d) => (
            <div key={d.id} className="border p-4 flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Format: {formatLabel(d.feed_format || 'auto')}
                </div>
                {d.xml_url && (
                  <div className="text-sm text-muted-foreground truncate">{d.xml_url}</div>
                )}
                {d.notes && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.notes}</div>
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
          ))}
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
