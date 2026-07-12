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
import { Pencil, Trash2, Plus, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
}

const empty = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  author: '',
  tags: '',
  is_published: false,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function AdminBlog() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please drop an image file');
      return;
    }
    setUploading(true);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    // SEO-friendly filename auto-derived from the excerpt/title + brand
    const base =
      slugify(form.excerpt || form.title || 'blog') ||
      'blog';
    const seoName = `${base}-memories-properties-paphos`.slice(0, 80);
    const path = `blog/${seoName}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('property-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from('property-images').getPublicUrl(path);
    setForm((f) => ({ ...f, cover_image: data.publicUrl }));
    setUploading(false);
    toast.success('Image uploaded');
  };

  const load = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load posts');
      return;
    }
    setPosts((data as Post[]) || []);
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
    setSlugTouched(false);
    setShowForm(true);
  };

  const startEdit = (p: Post) => {
    setEditing(p);
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      content: p.content || '',
      cover_image: p.cover_image || '',
      author: p.author || '',
      tags: (p.tags || []).join(', '),
      is_published: p.is_published,
    });
    setSlugTouched(true);
    setShowForm(true);
  };

  const cancel = () => {
    setEditing(null);
    setForm(empty);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    const finalSlug = (form.slug.trim() || slugify(form.title)) || `post-${Date.now()}`;
    const payload = {
      title: form.title.trim(),
      slug: slugify(finalSlug),
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_image: form.cover_image.trim() || null,
      author: form.author.trim() || null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      is_published: form.is_published,
      published_at: form.is_published
        ? editing?.published_at || new Date().toISOString()
        : null,
    };
    const { error } = editing
      ? await supabase.from('blog_posts').update(payload).eq('id', editing.id)
      : await supabase.from('blog_posts').insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? 'Post updated' : 'Post created');
    cancel();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Post deleted');
    load();
  };

  const togglePublished = async (p: Post) => {
    const { error } = await supabase
      .from('blog_posts')
      .update({
        is_published: !p.is_published,
        published_at: !p.is_published ? p.published_at || new Date().toISOString() : null,
      })
      .eq('id', p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  };

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
            <h1 className="text-4xl mt-2">Blog</h1>
            <p className="text-base text-[hsl(212_100%_10%)]/70 mt-1">
              Write and manage articles shown on the public blog.
            </p>
          </div>
          {!showForm && (
            <Button onClick={startNew} className="gap-2">
              <Plus size={16} /> New post
            </Button>
          )}
        </div>

        {showForm && (
          <div className="border border-[hsl(212_100%_10%)]/15 rounded-lg p-6 mb-10 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl">{editing ? 'Edit post' : 'New post'}</h2>
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
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((f) => ({
                      ...f,
                      title,
                      slug: slugTouched ? f.slug : slugify(title),
                    }));
                  }}
                  placeholder="Buying property in Paphos: a 2026 guide"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm({ ...form, slug: e.target.value });
                  }}
                  placeholder="buying-property-in-paphos"
                />
                <p className="text-xs text-[hsl(212_100%_10%)]/50 mt-1">
                  /blog/{slugify(form.slug || form.title) || '…'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    placeholder="Memories Team"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="Paphos, Guides"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cover">Cover image</Label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) uploadImage(file);
                  }}
                  onClick={() => document.getElementById('cover-file')?.click()}
                  className={`mt-1 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                    dragOver
                      ? 'border-[hsl(212_100%_10%)] bg-[hsl(212_100%_10%)]/5'
                      : 'border-[hsl(212_100%_10%)]/20 hover:border-[hsl(212_100%_10%)]/40'
                  }`}
                >
                  {form.cover_image ? (
                    <div className="space-y-2">
                      <img
                        src={form.cover_image}
                        alt="Cover preview"
                        className="mx-auto max-h-40 rounded object-contain"
                      />
                      <p className="text-xs text-[hsl(212_100%_10%)]/60">
                        Click or drop to replace
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[hsl(212_100%_10%)]/60">
                      {uploading
                        ? 'Uploading…'
                        : 'Drag & drop an image here, or click to browse'}
                    </p>
                  )}
                </div>
                <input
                  id="cover-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file);
                    e.target.value = '';
                  }}
                />
                <Input
                  id="cover"
                  value={form.cover_image}
                  onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                  placeholder="…or paste an image URL"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="A short summary shown on the blog listing."
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  rows={14}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your article here. Separate paragraphs with a blank line."
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="published"
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                />
                <Label htmlFor="published">Published</Label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Create post'}
                </Button>
                <Button variant="outline" onClick={cancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {posts.length === 0 ? (
          <p className="text-[hsl(212_100%_10%)]/60">No posts yet. Click “New post” to create one.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <div
                key={p.id}
                className="border border-[hsl(212_100%_10%)]/15 rounded-lg p-5 bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!p.is_published && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          Draft
                        </span>
                      )}
                      {(p.tags || []).map((t) => (
                        <span
                          key={t}
                          className="text-xs px-2 py-0.5 rounded bg-[hsl(212_100%_10%)]/5 text-[hsl(212_100%_10%)]/70"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-semibold text-[hsl(212_100%_10%)]">{p.title}</h3>
                    {p.excerpt && (
                      <p className="text-sm text-[hsl(212_100%_10%)]/75 mt-1 line-clamp-2">
                        {p.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Switch
                      checked={p.is_published}
                      onCheckedChange={() => togglePublished(p)}
                      aria-label="Toggle published"
                    />
                    <div className="flex gap-1">
                      {p.is_published && (
                        <a
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded hover:bg-[hsl(212_100%_10%)]/5"
                          aria-label="View"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <button
                        onClick={() => startEdit(p)}
                        className="p-2 rounded hover:bg-[hsl(212_100%_10%)]/5"
                        aria-label="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => remove(p.id)}
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
        )}
      </div>
    </div>
  );
}
