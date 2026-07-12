// Dynamic sitemap including all properties
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SITE_URL = 'https://memoriesproperties.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: properties } = await supabase
      .from('properties')
      .select('id, slug, updated_at')
      .order('updated_at', { ascending: false });

    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    const staticRoutes = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/properties', priority: '0.9', changefreq: 'daily' },
      { loc: '/properties/region/tuscany', priority: '0.8', changefreq: 'weekly' },
      { loc: '/properties/region/aegean-coast', priority: '0.8', changefreq: 'weekly' },
      { loc: '/properties/region/costa-del-sol', priority: '0.8', changefreq: 'weekly' },
      { loc: '/about', priority: '0.7', changefreq: 'monthly' },
      { loc: '/insights', priority: '0.7', changefreq: 'weekly' },
      { loc: '/blog', priority: '0.7', changefreq: 'weekly' },
      { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
      { loc: '/legal', priority: '0.3', changefreq: 'yearly' },
      { loc: '/legal/privacy', priority: '0.3', changefreq: 'yearly' },
      { loc: '/legal/terms', priority: '0.3', changefreq: 'yearly' },
      { loc: '/legal/cookies', priority: '0.3', changefreq: 'yearly' },
      { loc: '/legal/disclosure', priority: '0.3', changefreq: 'yearly' },
      { loc: '/legal/sitemap', priority: '0.3', changefreq: 'monthly' },
    ];

    const today = new Date().toISOString().split('T')[0];

    const urls = [
      ...staticRoutes.map(
        (r) =>
          `  <url>\n    <loc>${SITE_URL}${r.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
      ),
      ...(properties ?? []).map(
        (p) =>
          `  <url>\n    <loc>${SITE_URL}/properties/${p.slug ?? p.id}</loc>\n    <lastmod>${new Date(p.updated_at).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
      ),
      ...(posts ?? []).map(
        (p) =>
          `  <url>\n    <loc>${SITE_URL}/blog/${p.slug}</loc>\n    <lastmod>${new Date(p.updated_at).toISOString().split('T')[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      ),
    ].join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    return new Response(`Error: ${(err as Error).message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
