import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import RouteLoader from '@/components/RouteLoader';
import { supabase } from '@/integrations/supabase/client';
import { categorySlug } from '@/lib/blogCategories';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author: string | null;
  tags: string[];
  published_at: string | null;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      setPost((data as Post) || null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <RouteLoader />;

  if (!post) {
    return (
      <div className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-semibold mb-4">Post not found</h1>
        <Link to="/blog" className="text-accent underline">
          Back to the blog
        </Link>
      </div>
    );
  }

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';

  return (
    <>
      <SEO
        title={`${post.title} | Cyprus Property Blog`}
        description={
          post.excerpt ||
          `${post.title} — expert insights on Paphos, Limassol and Cyprus property from Memories Properties.`
        }
        type="article"
        image={post.cover_image || undefined}
        preloadImage={post.cover_image || undefined}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt || post.title,
          ...(post.cover_image ? { image: post.cover_image } : {}),
          author: { '@type': 'Organization', name: post.author || 'Memories' },
          publisher: { '@type': 'Organization', name: 'Memories' },
          datePublished: post.published_at,
          mainEntityOfPage: `${origin}/blog/${post.slug}`,
        }}
      />

      <article className="container mx-auto px-6 py-12 max-w-3xl">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-accent">
          ← Back to the blog
        </Link>

        {post.tags?.length > 0 && (
          <div className="label text-accent mt-6 flex flex-wrap gap-x-2 gap-y-1">
            {post.tags.map((t, i) => (
              <span key={t} className="inline-flex items-center">
                <Link to={`/blog/category/${categorySlug(t)}`} className="hover:underline">
                  {t}
                </Link>
                {i < post.tags.length - 1 && <span className="ml-2">·</span>}
              </span>
            ))}
          </div>
        )}
        <h1 className="font-montserrat font-extrabold tracking-tighter leading-[1.0] text-4xl md:text-5xl mt-2">
          {post.title}
        </h1>
        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
          {post.author ? `${post.author} · ` : ''}
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : ''}
        </p>

        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={`${post.title}${post.excerpt ? ` — ${post.excerpt}` : ''} | Memories Properties Paphos`}
            className="mt-8 w-full rounded-xl object-cover"
          />
        )}

        <div className="mt-10 space-y-5 text-lg leading-relaxed text-foreground/90">
          {post.content
            .split(/\n{2,}/)
            .filter((p) => p.trim())
            .map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
        </div>
      </article>
    </>
  );
}
