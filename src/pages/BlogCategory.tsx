import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { categorySlug, slugToLabel } from '@/lib/blogCategories';

interface PostCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  author: string | null;
  tags: string[];
  published_at: string | null;
}

export default function BlogCategory() {
  const { slug = '' } = useParams();
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image, author, tags, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      setPosts((data as PostCard[]) || []);
      setLoading(false);
    })();
  }, []);

  const matching = useMemo(
    () => posts.filter((p) => (p.tags || []).some((t) => categorySlug(t) === slug)),
    [posts, slug],
  );

  // Use the real tag spelling from a matching post when available.
  const label = useMemo(() => {
    for (const p of matching) {
      const tag = (p.tags || []).find((t) => categorySlug(t) === slug);
      if (tag) return tag;
    }
    return slugToLabel(slug);
  }, [matching, slug]);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';

  return (
    <>
      <SEO
        title={`${label} — Cyprus Property Blog`}
        description={`Articles, market news and guides about ${label} for property buyers and sellers in Paphos and Limassol, Cyprus.`}
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `${label} — Cyprus Property Blog`,
          url: `${origin}/blog/category/${slug}`,
          isPartOf: { '@type': 'Blog', name: 'Memories Property Blog', url: `${origin}/blog` },
          hasPart: matching.map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: `${origin}/blog/${p.slug}`,
            datePublished: p.published_at,
            ...(p.cover_image ? { image: p.cover_image } : {}),
          })),
        }}
      />
      <PageHeader
        eyebrow="Category"
        title={label}
        intro={`Posts tagged “${label}”.`}
      />

      <section className="container mx-auto px-6 py-12">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-accent">
          ← All posts
        </Link>

        {loading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : matching.length === 0 ? (
          <p className="mt-8 text-muted-foreground text-center">
            No posts in this category yet.
          </p>
        ) : (
          <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {matching.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  {p.cover_image ? (
                    <img
                      src={p.cover_image}
                      alt={`${p.title}${p.excerpt ? ` — ${p.excerpt}` : ''} | Memories Properties Paphos`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      Memories
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  {p.tags?.length > 0 && (
                    <p className="label text-accent mb-1">{p.tags[0]}</p>
                  )}
                  <h2 className="text-xl font-semibold leading-snug group-hover:text-accent transition-colors">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                  )}
                  <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                    {p.author ? `${p.author} · ` : ''}
                    {p.published_at
                      ? new Date(p.published_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
