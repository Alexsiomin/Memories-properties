import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface BrandWord {
  id: string;
  word: string;
  sort_order: number;
  is_active: boolean;
}

const empty = { word: '', sort_order: 0, is_active: true };

export default function AdminBrandWords() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [words, setWords] = useState<BrandWord[]>([]);
  const [editing, setEditing] = useState<BrandWord | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('brand_words')
      .select('*')
      .order('sort_order');
    if (error) {
      toast.error('Failed to load brand words');
      return;
    }
    setWords((data as BrandWord[]) || []);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

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

  const startNew = () => {
    setEditing(null);
    setForm({ ...empty, sort_order: words.length });
    setShowForm(true);
  };

  const startEdit = (w: BrandWord) => {
    setEditing(w);
    setForm({ word: w.word, sort_order: w.sort_order, is_active: w.is_active });
    setShowForm(true);
  };

  const cancel = () => {
    setEditing(null);
    setForm(empty);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.word.trim()) {
      toast.error('Word is required');
      return;
    }
    setSaving(true);
    const payload = {
      word: form.word.trim(),
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from('brand_words').update(payload).eq('id', editing.id)
      : await supabase.from('brand_words').insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? 'Word updated' : 'Word created');
    cancel();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this word?')) return;
    const { error } = await supabase.from('brand_words').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Word deleted');
    load();
  };

  const toggleActive = async (w: BrandWord) => {
    const { error } = await supabase
      .from('brand_words')
      .update({ is_active: !w.is_active })
      .eq('id', w.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  };

  return (
    <div className="light-panel min-h-screen">
      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/admin"
              className="text-sm text-[hsl(212_100%_10%)]/60 hover:text-[hsl(212_100%_10%)]"
            >
              ← Back to dashboard
            </Link>
            <h1 className="text-4xl mt-2">Brand words</h1>
            <p className="text-base text-[hsl(212_100%_10%)]/70 mt-1">
              The rotating words shown in the footer hero. Visitors can cycle through them with the
              refresh button.
            </p>
          </div>
          {!showForm && (
            <Button onClick={startNew} className="gap-2">
              <Plus size={16} /> Add word
            </Button>
          )}
        </div>

        {showForm && (
          <div className="border border-[hsl(212_100%_10%)]/15 rounded-lg p-6 mb-10 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl">{editing ? 'Edit word' : 'New word'}</h2>
              <button
                onClick={cancel}
                className="text-[hsl(212_100%_10%)]/60 hover:text-[hsl(212_100%_10%)]"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="word">Word</Label>
                <Input
                  id="word"
                  value={form.word}
                  onChange={(e) => setForm({ ...form, word: e.target.value })}
                  placeholder="Memories Properties."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sort">Sort order</Label>
                  <Input
                    id="sort"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-3">
                  <div>
                    <Label htmlFor="active">Active</Label>
                    <div className="mt-2">
                      <Switch
                        id="active"
                        checked={form.is_active}
                        onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create word'}
                </Button>
                <Button variant="outline" onClick={cancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {words.length === 0 ? (
          <p className="text-[hsl(212_100%_10%)]/60">No words yet. Click “Add word” to create one.</p>
        ) : (
          <div className="space-y-3">
            {words.map((w) => (
              <div
                key={w.id}
                className="border border-[hsl(212_100%_10%)]/15 rounded-lg p-5 bg-white flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs px-2 py-0.5 rounded bg-[hsl(212_100%_10%)]/5 text-[hsl(212_100%_10%)]/70">
                    #{w.sort_order}
                  </span>
                  <h3 className="text-lg font-semibold text-[hsl(212_100%_10%)] truncate">
                    {w.word}
                  </h3>
                  {!w.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={w.is_active}
                    onCheckedChange={() => toggleActive(w)}
                    aria-label="Toggle active"
                  />
                  <button
                    onClick={() => startEdit(w)}
                    className="p-2 rounded hover:bg-[hsl(212_100%_10%)]/5"
                    aria-label="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => remove(w.id)}
                    className="p-2 rounded hover:bg-red-50 text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
