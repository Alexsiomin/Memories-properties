import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { categorySlug, buildCategories } from '@/lib/blogCategories';

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

export default function Blog() {
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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

  const categories = useMemo(() => buildCategories(posts.map((p) => p.tags)), [posts]);



  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';

  return (
    <>
      <SEO
        title="Cyprus Property Blog — Paphos & Limassol Real Estate News"
        description="Expert guides, market updates and area spotlights on buying, selling and investing in property in Paphos, Limassol and across Cyprus."
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Memories Property Blog',
          url: `${origin}/blog`,
          blogPost: posts.map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: `${origin}/blog/${p.slug}`,
            datePublished: p.published_at,
            ...(p.cover_image ? { image: p.cover_image } : {}),
          })),
        }}
      />
      <PageHeader
        eyebrow="Journal"
        title="Cyprus Property Insights & Market News"
        intro="Guides, area spotlights and market perspectives on buying, selling and investing in Paphos and Limassol real estate."
      />

      {categories.length > 0 && (
        <nav
          aria-label="Blog categories"
          className="container mx-auto px-6 flex flex-wrap gap-2 pt-2"
        >
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/blog/category/${c.slug}`}
              className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors"
            >
              {c.tag}
            </Link>
          ))}
        </nav>
      )}

      <section className="container mx-auto px-6 py-12">

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center">No posts yet. Check back soon.</p>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <div key={p.id} className="group block">
                <Link to={`/blog/${p.slug}`} className="block">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
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
                </Link>
                <div className="mt-4">
                  {p.tags?.length > 0 && (
                    <Link
                      to={`/blog/category/${categorySlug(p.tags[0])}`}
                      className="label text-accent mb-1 inline-block hover:underline"
                    >
                      {p.tags[0]}
                    </Link>
                  )}
                  <Link to={`/blog/${p.slug}`} className="block group">
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
                  </Link>
                </div>
              </div>

            ))}
          </div>
        )}
      </section>
    </>
  );
}
