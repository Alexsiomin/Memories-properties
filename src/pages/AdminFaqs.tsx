import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const empty = {
  question: '',
  answer: '',
  category: 'buyers',
  sort_order: 0,
  is_active: true,
};

export default function AdminFaqs() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('category')
      .order('sort_order');
    if (error) {
      toast.error('Failed to load FAQs');
      return;
    }
    setFaqs((data as Faq[]) || []);
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
    setForm(empty);
    setShowForm(true);
  };

  const startEdit = (f: Faq) => {
    setEditing(f);
    setForm({
      question: f.question,
      answer: f.answer,
      category: f.category,
      sort_order: f.sort_order,
      is_active: f.is_active,
    });
    setShowForm(true);
  };

  const cancel = () => {
    setEditing(null);
    setForm(empty);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    setSaving(true);
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category.trim() || 'buyers',
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from('faqs').update(payload).eq('id', editing.id)
      : await supabase.from('faqs').insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? 'FAQ updated' : 'FAQ created');
    cancel();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('FAQ deleted');
    load();
  };

  const toggleActive = async (f: Faq) => {
    const { error } = await supabase
      .from('faqs')
      .update({ is_active: !f.is_active })
      .eq('id', f.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  };

  // Group by category for display
  const grouped = faqs.reduce<Record<string, Faq[]>>((acc, f) => {
    (acc[f.category] = acc[f.category] || []).push(f);
    return acc;
  }, {});

  return (
    <div className="light-panel min-h-screen">
      <div className="container mx-auto px-6 py-16 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/admin"
              className="text-sm text-[hsl(212_100%_10%)]/60 hover:text-[hsl(212_100%_10%)]"
            >
              ← Back to dashboard
            </Link>
            <h1 className="text-4xl mt-2">FAQs</h1>
            <p className="text-base text-[hsl(212_100%_10%)]/70 mt-1">
              Manage questions shown across the site, grouped by type — <code>buyers</code> and{' '}
              <code>sellers</code>.
            </p>
          </div>
          {!showForm && (
            <Button onClick={startNew} className="gap-2">
              <Plus size={16} /> Add FAQ
            </Button>
          )}
        </div>

        {showForm && (
          <div className="border border-[hsl(212_100%_10%)]/15 rounded-lg p-6 mb-10 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl">{editing ? 'Edit FAQ' : 'New FAQ'}</h2>
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
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="What is off-market real estate?"
                />
              </div>
              <div>
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  rows={5}
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="Off-market real estate refers to…"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Question type</Label>
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant={form.category === 'buyers' ? 'default' : 'outline'}
                      onClick={() => setForm({ ...form, category: 'buyers' })}
                      className="flex-1"
                    >
                      Buyers
                    </Button>
                    <Button
                      type="button"
                      variant={form.category === 'sellers' ? 'default' : 'outline'}
                      onClick={() => setForm({ ...form, category: 'sellers' })}
                      className="flex-1"
                    >
                      Sellers
                    </Button>
                  </div>
                </div>
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
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create FAQ'}
                </Button>
                <Button variant="outline" onClick={cancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {Object.keys(grouped).length === 0 ? (
          <p className="text-[hsl(212_100%_10%)]/60">No FAQs yet. Click “Add FAQ” to create one.</p>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-10">
              <h2 className="text-xs uppercase tracking-widest text-[hsl(212_100%_10%)]/60 mb-3">
                {category}
              </h2>
              <div className="space-y-3">
                {items.map((f) => (
                  <div
                    key={f.id}
                    className="border border-[hsl(212_100%_10%)]/15 rounded-lg p-5 bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-[hsl(212_100%_10%)]/5 text-[hsl(212_100%_10%)]/70">
                            #{f.sort_order}
                          </span>
                          {!f.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                              Hidden
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-[hsl(212_100%_10%)]">
                          {f.question}
                        </h3>
                        <p className="text-sm text-[hsl(212_100%_10%)]/75 mt-1 whitespace-pre-line">
                          {f.answer}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Switch
                          checked={f.is_active}
                          onCheckedChange={() => toggleActive(f)}
                          aria-label="Toggle active"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(f)}
                            className="p-2 rounded hover:bg-[hsl(212_100%_10%)]/5"
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => remove(f.id)}
                            className="p-2 rounded hover:bg-red-50 text-red-600"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
