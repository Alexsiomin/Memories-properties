import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSeoOverride } from '@/hooks/use-seo-override';
import { LANG_CODES, stripLangPrefix, addLangPrefix } from '@/hooks/use-language';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Preload an image for LCP (use the actual hero/cover image URL) */
  preloadImage?: string;
  /** Optional responsive preload — pairs with preloadImage as fallback. */
  preloadImageSrcSet?: string;
  /** sizes attribute for responsive preload (e.g. "100vw"). */
  preloadImageSizes?: string;
  /** MIME type for the preload (e.g. "image/avif", "image/webp"). */
  preloadImageType?: string;
}

const SITE_NAME = 'Memories';
const DEFAULT_IMAGE = '/og-image.jpg';

const SEO = ({
  title,
  description,
  image,
  type = 'website',
  noindex,
  jsonLd,
  preloadImage,
  preloadImageSrcSet,
  preloadImageSizes,
  preloadImageType,
}: SEOProps) => {
  const { pathname } = useLocation();
  const seoOverride = useSeoOverride(pathname);

  // Admin-managed overrides take precedence over the props passed in code.
  const effTitle = seoOverride?.title || title;
  const effDescription = seoOverride?.description || description;
  const effImage = seoOverride?.og_image || image;
  const effNoindex = seoOverride ? seoOverride.noindex || noindex : noindex;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';
  // Language-aware URLs: canonical self-references the current locale, and
  // hreflang links declare alternates for every supported language so all
  // are indexable and Google can offer the right one per searcher.
  const enPath = stripLangPrefix(pathname);
  const enUrl = `${origin}${enPath}`;
  const langUrls: Record<string, string> = { en: enUrl };
  for (const code of LANG_CODES) langUrls[code] = `${origin}${addLangPrefix(enPath, code)}`;
  const currentUrl = `${origin}${pathname}`;
  const fullTitle = effTitle.includes(SITE_NAME) ? effTitle : `${effTitle} | ${SITE_NAME}`;
  const ogImage = effImage ? (effImage.startsWith('http') ? effImage : `${origin}${effImage}`) : `${origin}${DEFAULT_IMAGE}`;
  const truncatedDesc = effDescription.length > 160 ? effDescription.slice(0, 157) + '…' : effDescription;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={truncatedDesc} />
      <meta name="robots" content={effNoindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      <link rel="canonical" href={currentUrl} />
      {!effNoindex && <link rel="alternate" hrefLang="en" href={enUrl} />}
      {!effNoindex && LANG_CODES.map((code) => (
        <link key={code} rel="alternate" hrefLang={code} href={langUrls[code]} />
      ))}
      {!effNoindex && <link rel="alternate" hrefLang="x-default" href={enUrl} />}

      {preloadImage && (
        <link
          rel="preload"
          as="image"
          href={preloadImage}
          {...(preloadImageSrcSet ? { imageSrcSet: preloadImageSrcSet } : {})}
          {...(preloadImageSizes ? { imageSizes: preloadImageSizes } : {})}
          {...(preloadImageType ? { type: preloadImageType } : {})}
          fetchPriority="high"
        />
      )}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncatedDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncatedDesc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
