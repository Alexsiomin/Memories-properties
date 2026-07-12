import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface SeoRow {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  noindex: boolean;
}

// Common pages suggested to the admin for quick editing.
const SUGGESTED_PAGES = [
  { path: '/', label: 'Home' },
  { path: '/properties', label: 'Properties' },
  { path: '/developments', label: 'Developments' },
  { path: '/insights', label: 'Insights' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/common-questions', label: 'Common questions' },
];

const empty = { path: '', title: '', description: '', og_image: '', noindex: false };
const SEO_DRAFT_KEY = 'admin-seo-draft';

const getInitialForm = () => {
  if (typeof window === 'undefined') return empty;
  try {
    const saved = window.localStorage.getItem(SEO_DRAFT_KEY);
    return saved ? { ...empty, ...JSON.parse(saved) } : empty;
  } catch {
    return empty;
  }
};

export default function AdminSeo() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [form, setForm] = useState<typeof empty>(getInitialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('seo_settings')
      .select('*')
      .order('path');
    if (error) {
      toast.error('Failed to load SEO settings');
      return;
    }
    setRows((data as SeoRow[]) || []);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  useEffect(() => {
    const hasDraft = form.path || form.title || form.description || form.og_image || form.noindex;
    if (hasDraft) {
      window.localStorage.setItem(SEO_DRAFT_KEY, JSON.stringify(form));
    } else {
      window.localStorage.removeItem(SEO_DRAFT_KEY);
    }
  }, [form]);

  if (authLoading || adminLoading) {
    return <div className="container mx-auto px-6 py-24">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-6 py-24">
        <h1 className="text-4xl">Forbidden</h1>
      </div>
    );
  }

  const startEdit = (r: SeoRow) => {
    setEditingId(r.id);
    setForm({
      path: r.path,
      title: r.title ?? '',
      description: r.description ?? '',
      og_image: r.og_image ?? '',
      noindex: r.noindex,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startNew = (path = '') => {
    setEditingId(null);
    setForm({ ...empty, path });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    const path = form.path.trim();
    if (!path.startsWith('/')) {
      toast.error('Path must start with "/" (e.g. /properties)');
      return;
    }
    setSaving(true);
    const payload = {
      path,
      title: form.title.trim() || null,
      description: form.description.trim() || null,
      og_image: form.og_image.trim() || null,
      noindex: form.noindex,
    };
    const { error } = await supabase
      .from('seo_settings')
      .upsert(payload, { onConflict: 'path' });
    setSaving(false);
    if (error) {
      toast.error('Failed to save: ' + error.message);
      return;
    }
    toast.success('SEO settings saved');
    window.localStorage.removeItem(SEO_DRAFT_KEY);
    setForm(empty);
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this SEO override? The page will fall back to its default tags.')) return;
    const { error } = await supabase.from('seo_settings').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    toast.success('Deleted');
    load();
  };

  const existingPaths = new Set(rows.map((r) => r.path));

  return (
    <div className="container mx-auto px-6 py-10 max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <Search className="h-6 w-6" />
        <h1 className="text-3xl font-semibold">SEO manager</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Override the search engine title, description, and social image for any page.
        Leave a field blank to keep the page's built-in default.
      </p>

      {/* Editor */}
      <div className="rounded-lg border border-foreground/10 p-5 mb-10 space-y-4">
        <h2 className="text-xl font-medium">{editingId ? 'Edit page' : 'New / edit page'}</h2>
        <div>
          <Label htmlFor="path">Page path</Label>
          <Input
            id="path"
            placeholder="/properties"
            value={form.path}
            onChange={(e) => setForm({ ...form, path: e.target.value })}
            disabled={!!editingId}
          />
          <p className="text-xs text-muted-foreground mt-1">Must start with "/". Use the exact route path.</p>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Investment Property, Land & Homes for Sale"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <p className={`text-xs mt-1 ${form.title.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {form.title.length} characters — keep under 60 so Google doesn't truncate it.
          </p>
        </div>
        <div>
          <Label htmlFor="description">Meta description</Label>
          <Textarea
            id="description"
            placeholder="A short, compelling summary shown under the title in search results."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <p className={`text-xs mt-1 ${form.description.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {form.description.length} characters — keep under 160 so Google doesn't truncate it.
          </p>
        </div>
        <div>
          <Label htmlFor="og_image">Social share image URL</Label>
          <Input
            id="og_image"
            placeholder="https://… (optional)"
            value={form.og_image}
            onChange={(e) => setForm({ ...form, og_image: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="noindex"
            checked={form.noindex}
            onCheckedChange={(v) => setForm({ ...form, noindex: v })}
          />
          <Label htmlFor="noindex">Hide this page from search engines (noindex)</Label>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save'}
          </Button>
          {(editingId || form.path) && (
            <Button variant="outline" onClick={() => { setForm(empty); setEditingId(null); }}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Quick add suggested pages */}
      <h2 className="text-lg font-medium mb-3">Quick add</h2>
      <div className="flex flex-wrap gap-2 mb-10">
        {SUGGESTED_PAGES.filter((p) => !existingPaths.has(p.path)).map((p) => (
          <Button key={p.path} variant="outline" size="sm" onClick={() => startNew(p.path)}>
            <Plus className="h-3 w-3 mr-1" /> {p.label}
          </Button>
        ))}
      </div>

      {/* Existing overrides */}
      <h2 className="text-lg font-medium mb-3">Saved overrides</h2>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">No overrides yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border border-foreground/10 p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-medium">{r.path}</code>
                  {r.noindex && <span className="text-xs rounded bg-destructive/10 text-destructive px-1.5 py-0.5">noindex</span>}
                </div>
                {r.title && <p className="text-sm mt-1 truncate">{r.title}</p>}
                {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>Edit</Button>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
