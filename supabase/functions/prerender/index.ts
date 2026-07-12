// Prerender edge function — serves fully-rendered HTML with SEO tags to crawlers.
// Real users hit the SPA directly; only bots are routed here (via your hosting/CDN
// or by linking crawlers to URLs like /functions/v1/prerender?url=...).
//
// Usage (manual test):
//   GET /functions/v1/prerender?url=https://memoriesproperties.com/properties/{id}
//
// For production, configure your reverse proxy / CDN to route requests where
// User-Agent matches a known bot to this function with the original URL passed
// as ?url=. The function returns full HTML for that page.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE = 'https://memoriesproperties.com';

const escape = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

interface Property {
  id: string;
  title: string;
  location: string;
  category: string;
  status: string;
  price: string;
  price_value: number;
  size: string | null;
  beds: number | null;
  baths: number | null;
  description: string | null;
  cover_image: string | null;
  images: string[] | null;
  reference_code: string | null;
  address_line: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  year_built: number | null;
  tags: string[];
  updated_at: string;
  share_title: string | null;
  share_description: string | null;
  share_image: string | null;
}

function shell({
  title,
  description,
  canonical,
  image,
  jsonLd,
  bodyContent,
  type = 'website',
}: {
  title: string;
  description: string;
  canonical: string;
  image: string;
  jsonLd: unknown[];
  bodyContent: string;
  type?: string;
}) {
  const desc = description.length > 160 ? description.slice(0, 157) + '…' : description;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escape(title)}</title>
<meta name="description" content="${escape(desc)}" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
<link rel="canonical" href="${escape(canonical)}" />
<meta property="og:site_name" content="Memories Properties" />
<meta property="og:title" content="${escape(title)}" />
<meta property="og:description" content="${escape(desc)}" />
<meta property="og:type" content="${escape(type)}" />
<meta property="og:url" content="${escape(canonical)}" />
<meta property="og:image" content="${escape(image)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escape(title)}" />
<meta name="twitter:description" content="${escape(desc)}" />
<meta name="twitter:image" content="${escape(image)}" />
${jsonLd
  .map(
    (j) =>
      `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`
  )
  .join('\n')}
</head>
<body>
${bodyContent}
</body>
</html>`;
}

async function renderProperty(supabase: ReturnType<typeof createClient>, idOrSlug: string, canonical: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq(isUuid ? 'id' : 'slug', idOrSlug)
    .maybeSingle();


  if (error || !data) {
    return shell({
      title: 'Property not found | Memories Properties',
      description: 'This property is no longer listed.',
      canonical,
      image: `${SITE}/og-image.jpg`,
      jsonLd: [],
      bodyContent: '<h1>Property not found</h1>',
    });
  }

  const p = data as unknown as Property;
  const shareImgRaw = p.share_image && p.share_image.trim() ? p.share_image.trim() : null;
  const cover = shareImgRaw || p.cover_image || (p.images && p.images[0]) || `${SITE}/og-image.jpg`;
  const image = cover.startsWith('http') ? cover : `${SITE}${cover}`;
  const galleryImages = (p.images && p.images.length ? p.images : [cover]).map((u) =>
    u.startsWith('http') ? u : `${SITE}${u}`
  );
  const isSold = p.status?.toLowerCase().includes('sold');
  const sizeNumeric = p.size ? parseFloat(p.size.replace(/[^\d.]/g, '')) : null;

  const locShort = (p.location || '').split('·')[0].split(',')[0].trim();
  const ref = p.reference_code || p.id;
  const bedsPart = p.beds != null ? `${p.beds} Bed ` : '';
  const bathsPart = p.baths != null ? `${p.baths} Bath ` : '';
  // Singularise the category (e.g. "Apartments" -> "Apartment", "Villas" -> "Villa").
  const categorySingular = (p.category || 'Property').replace(/s$/i, '');
  const listingVerb = p.status?.toLowerCase().includes('rent') ? 'For Rent in' : 'For Sale in';
  // Round size to whole m² (e.g. "123.11 m²" -> "123 m²").
  const sizeShort = sizeNumeric != null && !isNaN(sizeNumeric) ? `${Math.round(sizeNumeric)} m²` : null;
  // Full price (e.g. "€560,000"), never abbreviated. Falls back to the stored price string.
  const priceStr =
    (p as { price_value?: number | null }).price_value != null &&
    Number((p as { price_value?: number | null }).price_value) > 0
      ? fmtEur(Number((p as { price_value?: number | null }).price_value))
      : p.price;
  // Auto format, e.g. "2 Bed 2 Bath Apartment For Sale in Paphos - €310,000" (no ID in title).
  // Custom overrides (share_title / share_description) take precedence when set.
  const autoTitle = `${bedsPart}${bathsPart}${categorySingular} ${listingVerb}${locShort ? ` ${locShort}` : ''}${priceStr ? ` - ${priceStr}` : ''}`;
  const autoDescription = `${bedsPart}${bathsPart}${categorySingular} in ${locShort || p.location}. ${priceStr}${sizeShort ? ` · ${sizeShort}` : ''}. Ref: ${ref}.`;
  const title = p.share_title && p.share_title.trim() ? p.share_title.trim() : autoTitle;
  const description = p.share_description && p.share_description.trim() ? p.share_description.trim() : autoDescription;


  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE}/properties/${p.id}`,
    name: p.title,
    description: p.description || description,
    image: galleryImages,
    sku: p.reference_code || p.id,
    productID: p.id,
    category: p.category,
    brand: { '@type': 'Brand', name: 'Memories Properties' },
    offers: {
      '@type': 'Offer',
      url: `${SITE}/properties/${p.id}`,
      price: p.price_value,
      priceCurrency: 'EUR',
      availability: isSold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Memories Properties' },
    },
  };

  const place = {
    '@context': 'https://schema.org',
    '@type': p.category?.toLowerCase().includes('land') ? 'Place' : 'Residence',
    name: p.title,
    description: p.description || description,
    url: `${SITE}/properties/${p.id}`,
    image: galleryImages,
    ...(p.address_line || p.city
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(p.address_line && { streetAddress: p.address_line }),
            ...(p.city && { addressLocality: p.city }),
            ...(p.region && { addressRegion: p.region }),
            ...(p.postal_code && { postalCode: p.postal_code }),
            ...(p.country && { addressCountry: p.country }),
          },
        }
      : {}),
    ...(p.latitude != null && p.longitude != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: p.latitude, longitude: p.longitude } }
      : {}),
    ...(sizeNumeric ? { floorSize: { '@type': 'QuantitativeValue', value: sizeNumeric, unitCode: 'MTK' } } : {}),
    ...(p.beds != null && { numberOfRooms: p.beds }),
    ...(p.baths != null && { numberOfBathroomsTotal: p.baths }),
    ...(p.year_built && { yearBuilt: p.year_built }),
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Buy', item: `${SITE}/properties` },
      {
        '@type': 'ListItem',
        position: 3,
        name: p.location.split('·')[0].trim(),
        item: `${SITE}/properties/${p.id}`,
      },
    ],
  };

  const body = `
<nav aria-label="Breadcrumb"><a href="${SITE}/">Home</a> › <a href="${SITE}/properties">Buy</a> › <span>${escape(p.location)}</span></nav>
<main>
  <article>
    <h1>${escape(p.title)}</h1>
    <p><strong>${escape(p.price)}</strong> · ${escape(p.location)}</p>
    <img src="${escape(image)}" alt="${escape(p.title)} — ${escape(p.location)}" width="1200" height="750" />
    <ul>
      ${p.beds != null ? `<li>${p.beds} bedrooms</li>` : ''}
      ${p.baths != null ? `<li>${p.baths} bathrooms</li>` : ''}
      ${p.size ? `<li>Size: ${escape(p.size)}</li>` : ''}
      <li>Category: ${escape(p.category)}</li>
      <li>Status: ${escape(p.status)}</li>
      ${p.reference_code ? `<li>Reference: ${escape(p.reference_code)}</li>` : ''}
    </ul>
    <h2>About this home</h2>
    <p>${escape(p.description || `${p.title} is positioned in ${p.location} as a ${p.category.toLowerCase()} mandate currently ${p.status.toLowerCase()}. Curated for investors seeking exposure to durable European real-estate themes.`)}</p>
    ${p.tags?.length ? `<h3>Features</h3><ul>${p.tags.map((t) => `<li>${escape(t)}</li>`).join('')}</ul>` : ''}
    ${p.address_line || p.city ? `<h3>Location</h3><address>${[p.address_line, p.city, p.region, p.postal_code, p.country].filter(Boolean).map(escape).join(', ')}</address>` : ''}
    <p><a href="${SITE}/contact">Enquire about this property</a></p>
  </article>
</main>
<footer><p>© Memories Properties · <a href="${SITE}/">Home</a> · <a href="${SITE}/properties">All properties</a></p></footer>
`;

  return shell({
    title,
    description,
    canonical,
    image,
    jsonLd: [product, place, breadcrumbs],
    bodyContent: body,
    type: 'article',
  });
}

function projectNameFromTitle(title?: string | null): string {
  if (!title) return '';
  const idx = title.indexOf(' - ');
  return (idx === -1 ? title : title.slice(0, idx)).trim();
}

function projectSlugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const fmtEur = (n: number | null) =>
  n != null && Number.isFinite(n) && n > 0 ? `€${Math.round(n).toLocaleString('en-US')}` : '';

async function renderDevelopment(
  supabase: ReturnType<typeof createClient>,
  slug: string,
  canonical: string
) {
  const { data } = await supabase
    .from('properties')
    .select('title, location, price_value, beds, baths, category, status, listing_type, cover_image, images')
    .not('developer_id', 'is', null);

  const rows = (data ?? []) as Array<{
    title: string | null;
    location: string | null;
    price_value: number | null;
    beds: number | null;
    baths: number | null;
    category: string | null;
    status: string | null;
    listing_type: string | null;
    cover_image: string | null;
    images: string[] | null;
  }>;

  // Group developer units by project name, then match the incoming slug against
  // each project's computed slug: {unitCount}units-from{minPrice}-{location}
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const pname = projectNameFromTitle(r.title);
    if (!pname) continue;
    const list = groups.get(pname) ?? [];
    list.push(r);
    groups.set(pname, list);
  }
  const devSlugify = (uCount: number, mPrice: number | null, loc: string | null) => {
    const l = (loc ?? '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const pricePart = mPrice != null && mPrice > 0 ? `-from${Math.round(mPrice)}` : '';
    const locPart = l ? `-${l}` : '';
    return `${uCount}units${pricePart}${locPart}`;
  };
  const locOf = (list: typeof rows) => {
    const raw = list.find((u) => u.location)?.location ?? null;
    if (!raw) return '';
    const idx = raw.indexOf(' · ');
    return (idx === -1 ? raw : raw.slice(0, idx)).trim();
  };
  let units: typeof rows = [];
  for (const list of groups.values()) {
    const gPrices = list.map((u) => u.price_value).filter((v): v is number => v != null && v > 0);
    const gMin = gPrices.length ? Math.min(...gPrices) : null;
    if (devSlugify(list.length, gMin, locOf(list)) === slug || projectSlugify(projectNameFromTitle(list[0].title)) === slug) {
      units = list;
      break;
    }
  }

  if (!units.length) {
    return shell({
      title: 'Development not found | Memories Properties',
      description: 'This development is no longer listed.',
      canonical,
      image: `${SITE}/og-image.jpg`,
      jsonLd: [],
      bodyContent: '<h1>Development not found</h1>',
    });
  }

  const name = projectNameFromTitle(units[0].title);
  const prices = units.map((u) => u.price_value).filter((v): v is number => v != null && v > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const beds = units.map((u) => u.beds).filter((v): v is number => v != null && v > 0);
  const baths = units.map((u) => u.baths).filter((v): v is number => v != null && v > 0);
  const categories = Array.from(new Set(units.map((u) => u.category).filter(Boolean) as string[]));
  const location = (() => {
    const raw = units.find((u) => u.location)?.location ?? null;
    if (!raw) return '';
    const idx = raw.indexOf(' · ');
    return (idx === -1 ? raw : raw.slice(0, idx)).trim();
  })();
  const coverRaw =
    units.find((u) => u.cover_image)?.cover_image ??
    units.find((u) => u.images && u.images.length)?.images?.[0] ??
    `${SITE}/og-image.jpg`;
  const image = coverRaw.startsWith('http') ? coverRaw : `${SITE}${coverRaw}`;

  const fromPart = minPrice ? ` - From ${fmtEur(minPrice)}` : '';
  const title = `New Development in ${location || 'Cyprus'}${fromPart}`;

  const bedRange = beds.length
    ? beds.length > 1 && Math.min(...beds) !== Math.max(...beds)
      ? `${Math.min(...beds)}–${Math.max(...beds)} bed`
      : `${Math.min(...beds)} bed`
    : '';
  const descParts = [
    `${name} — a new-build development in ${location || 'Cyprus'}.`,
    `${units.length} unit${units.length === 1 ? '' : 's'}${minPrice ? ` from ${fmtEur(minPrice)}` : ''}.`,
    bedRange ? `${bedRange}${categories.length ? ` ${categories.join(', ').toLowerCase()}` : ''}.` : '',
  ].filter(Boolean);
  const description = descParts.join(' ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: canonical,
    numberOfItems: units.length,
  };

  const body = `
<main>
  <h1>${escape(name)}</h1>
  <p>${escape(description)}</p>
  <img src="${escape(image)}" alt="${escape(name)}" />
</main>`;

  return shell({
    title,
    description,
    canonical,
    image,
    jsonLd: [jsonLd],
    bodyContent: body,
  });
}

async function renderPropertiesIndex(supabase: ReturnType<typeof createClient>, canonical: string) {

  const { data } = await supabase
    .from('properties')
    .select('id, title, location, price, category, status, cover_image, image_key')
    .order('sort_order', { ascending: true })
    .limit(100);

  const items = (data ?? []) as Array<{
    id: string;
    title: string;
    location: string;
    price: string;
    category: string;
    status: string;
    cover_image: string | null;
    image_key: string;
  }>;

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/properties/${p.id}`,
      name: p.title,
    })),
  };

  const body = `
<main>
  <h1>Off-Market Properties for Sale</h1>
  <p>Browse Memories Properties's curated collection of private real estate, investment projects and land across Europe.</p>
  <ul>
    ${items
      .map(
        (p) => `
      <li>
        <a href="${SITE}/properties/${p.id}">
          <h2>${escape(p.title)}</h2>
          <p>${escape(p.location)} · ${escape(p.price)} · ${escape(p.category)} · ${escape(p.status)}</p>
        </a>
      </li>`
      )
      .join('')}
  </ul>
</main>
`;

  return shell({
    title: 'Properties for Sale | Off-Market Real Estate | Memories Properties',
    description:
      'Browse off-market investment properties, vineyards, coastal estates, and development land. Private real estate by introduction only.',
    canonical,
    image: `${SITE}/og-image.jpg`,
    jsonLd: [itemListJsonLd],
    bodyContent: body,
  });
}

function renderHome(canonical: string) {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${SITE}/#organization`,
    name: 'Memories Properties',
    url: SITE,
    logo: `${SITE}/og-image.jpg`,
    image: `${SITE}/og-image.jpg`,
    description: 'Private real estate practice sourcing off-market investment projects and land.',
    areaServed: 'Worldwide',
    priceRange: '€€€€',
  };
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    url: SITE,
    name: 'Memories Properties',
    publisher: { '@id': `${SITE}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE}/properties?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const body = `
<main>
  <h1>Memories Properties — Private Real Estate</h1>
  <p>A discreet practice sourcing off-market investment projects and land for a private roster of clients. By introduction only.</p>
  <nav>
    <ul>
      <li><a href="${SITE}/properties">View properties</a></li>
      <li><a href="${SITE}/about">About Memories Properties</a></li>
      <li><a href="${SITE}/insights">Insights</a></li>
      <li><a href="${SITE}/contact">Contact</a></li>
    </ul>
  </nav>
</main>
`;
  return shell({
    title: 'Memories Properties — Private Real Estate · Investment Projects & Land',
    description:
      'Private real estate practice sourcing off-market investment projects and land for a discreet roster of clients. By introduction only.',
    canonical,
    image: `${SITE}/og-image.jpg`,
    jsonLd: [org, website],
    bodyContent: body,
  });
}

function renderStatic(path: string, canonical: string) {
  const pages: Record<string, { title: string; description: string; h1: string; body: string }> = {
    '/about': {
      title: 'About | Memories Properties',
      description: 'Memories Properties is a private real estate practice sourcing off-market investment projects and land for a discreet roster of clients.',
      h1: 'About Memories Properties',
      body: 'A private real estate practice founded on discretion, deep market access, and long-term client relationships.',
    },
    '/contact': {
      title: 'Contact | Memories Properties',
      description: 'Get in touch with Memories Properties for private real estate enquiries, off-market mandates, and investment opportunities.',
      h1: 'Contact Memories Properties',
      body: 'An advisor will reply within one business day. By introduction only.',
    },
    '/insights': {
      title: 'Insights | Memories Properties',
      description: 'Perspectives on private real estate, off-market mandates, and European investment themes from Memories Properties.',
      h1: 'Insights',
      body: 'Briefings and perspectives on private real estate markets.',
    },
  };
  const page = pages[path];
  if (!page) {
    return shell({
      title: 'Memories Properties',
      description: 'Private real estate practice.',
      canonical,
      image: `${SITE}/og-image.jpg`,
      jsonLd: [],
      bodyContent: `<main><h1>Memories Properties</h1><p><a href="${SITE}/">Home</a></p></main>`,
    });
  }
  return shell({
    title: page.title,
    description: page.description,
    canonical,
    image: `${SITE}/og-image.jpg`,
    jsonLd: [],
    bodyContent: `<main><h1>${page.h1}</h1><p>${page.body}</p><p><a href="${SITE}/">Home</a> · <a href="${SITE}/properties">Properties</a></p></main>`,
  });
}

// ---- Russian (/ru) localization for crawlers -------------------------------

const isRuPath = (p: string) => p === '/ru' || p.startsWith('/ru/');
const stripRu = (p: string) => (isRuPath(p) ? p.replace(/^\/ru/, '') || '/' : p);
const addRu = (p: string) => (p === '/' ? '/ru' : `/ru${p}`);

/** Translate a batch of English strings to Russian via the translate function. */
async function translateBatch(texts: string[]): Promise<string[]> {
  const out: string[] = [];
  const base = Deno.env.get('SUPABASE_URL')!;
  const key =
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const CHUNK = 60;
  for (let i = 0; i < texts.length; i += CHUNK) {
    const chunk = texts.slice(i, i + CHUNK);
    try {
      const res = await fetch(`${base}/functions/v1/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ texts: chunk, target: 'ru' }),
      });
      const data = await res.json().catch(() => null);
      const tr = data?.translations;
      chunk.forEach((t, idx) =>
        out.push(Array.isArray(tr) && typeof tr[idx] === 'string' ? tr[idx] : t)
      );
    } catch {
      chunk.forEach((t) => out.push(t));
    }
  }
  return out;
}

const KEEP_ATTR = new Set(['summary_large_image', 'Memories Properties']);

/** Translate the visible text + key meta of a rendered English page into Russian. */
async function localizeToRu(html: string): Promise<string> {
  // Protect <script> blocks (JSON-LD) from text scanning/replacement.
  const scripts: string[] = [];
  let work = html.replace(/<script[\s\S]*?<\/script>/gi, (m) => {
    scripts.push(m);
    return `\u0000S${scripts.length - 1}\u0000`;
  });

  const segs = new Set<string>();
  const textRe = />([^<>]+)</g;
  let m: RegExpExecArray | null;
  while ((m = textRe.exec(work))) {
    const t = m[1].trim();
    if (t && /[a-zA-Z]/.test(t)) segs.add(t);
  }
  const attrRe = /(?:content|title)="([^"]+)"/g;
  while ((m = attrRe.exec(work))) {
    const t = m[1].trim();
    if (
      t &&
      /[a-zA-Z]/.test(t) &&
      !/^https?:/.test(t) &&
      !t.includes('width=device-width') &&
      !/index,\s*follow/.test(t) &&
      !KEEP_ATTR.has(t)
    ) {
      segs.add(t);
    }
  }

  const list = Array.from(segs);
  if (list.length) {
    const translated = await translateBatch(list);
    const map = new Map<string, string>();
    list.forEach((t, i) => map.set(t, translated[i]));
    const attrEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

    work = work.replace(/>([^<>]+)</g, (full, txt) => {
      const ru = map.get(txt.trim());
      return ru ? `>${txt.replace(txt.trim(), ru)}<` : full;
    });
    work = work.replace(/(content|title)="([^"]+)"/g, (full, attr, val) => {
      const ru = map.get(val.trim());
      return ru ? `${attr}="${attrEscape(ru)}"` : full;
    });
  }

  // Restore scripts and mark the document language.
  work = work.replace(/\u0000S(\d+)\u0000/g, (_, i) => scripts[Number(i)]);
  return work.replace('<html lang="en">', '<html lang="ru">');
}

/** Inject EN/RU hreflang alternates right after the canonical link. */
function injectHreflang(html: string, enUrl: string, ruUrl: string): string {
  const links =
    `\n<link rel="alternate" hreflang="en" href="${escape(enUrl)}" />` +
    `\n<link rel="alternate" hreflang="ru" href="${escape(ruUrl)}" />` +
    `\n<link rel="alternate" hreflang="x-default" href="${escape(enUrl)}" />`;
  return html.replace(/(<link rel="canonical"[^>]*>)/, `$1${links}`);
}



Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // Accept either ?url=https://memoriesproperties.com/properties/{id} or ?path=/properties/{id}
    const targetUrl = url.searchParams.get('url');
    let pathname = url.searchParams.get('path') || '/';
    let canonical = `${SITE}/`;

    if (targetUrl) {
      try {
        const u = new URL(targetUrl);
        pathname = u.pathname;
        canonical = `${SITE}${u.pathname}`;
      } catch {
        /* fall through */
      }
    } else {
      canonical = `${SITE}${pathname}`;
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Language-aware: /ru serves Russian, content is looked up by the un-prefixed path.
    const ru = isRuPath(pathname);
    const enPath = stripRu(pathname);
    const enUrl = `${SITE}${enPath}`;
    const ruUrl = `${SITE}${addRu(enPath)}`;
    canonical = ru ? ruUrl : enUrl;

    let html: string;
    const propMatch = enPath.match(/^\/properties\/([^/?#]+)/);
    const devMatch = enPath.match(/^\/developments\/([^/?#]+)/);
    if (propMatch) {
      html = await renderProperty(supabase, propMatch[1], canonical);
    } else if (devMatch) {
      html = await renderDevelopment(supabase, devMatch[1], canonical);
    } else if (enPath === '/properties' || enPath === '/properties/') {
      html = await renderPropertiesIndex(supabase, canonical);
    } else if (enPath === '/' || enPath === '') {
      html = renderHome(canonical);
    } else {
      html = renderStatic(enPath, canonical);
    }

    html = injectHreflang(html, enUrl, ruUrl);
    if (ru) html = await localizeToRu(html);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    });

  } catch (err) {
    return new Response(`<!doctype html><html><body><h1>Error</h1><p>${(err as Error).message}</p></body></html>`, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }
});
