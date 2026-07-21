// Postbuild static pre-rendering.
//
// Vite ships a single-page app: every route returns the same dist/index.html,
// whose <head> describes only the homepage. Search crawlers that don't execute
// JavaScript (and crawlers that index before rendering) therefore see identical
// titles/descriptions for every URL, which suppresses how many pages get
// indexed.
//
// This script clones dist/index.html for every public route and bakes in a
// unique <title>, meta description, canonical, Open Graph + Twitter tags, and
// (for property pages) RealEstateListing JSON-LD — all without a headless
// browser, so it runs reliably in any Node build. The body still hydrates
// client-side exactly as before; we only rewrite the static <head>.
//
// It is strictly additive: if the host ever falls back to the SPA index.html
// for a route, behaviour is unchanged from today.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { LOCATIONS } from "../src/lib/locations";

const BASE_URL = "https://memoriesproperties.com";
const DIST = resolve("dist");
const TEMPLATE_PATH = resolve(DIST, "index.html");

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://wlugjzfztcwmlmgqfgno.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdWdqemZ6dGN3bWxtZ3FmZ25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTQ2NjcsImV4cCI6MjA5Mjg5MDY2N30.C6bBd3wby17yWRtiZ4SkBOktnbLzJIWDf8JeVMLyvWw";

const SITE_NAME = "Memories";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

interface RouteMeta {
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Static HTML baked into #root so crawlers see content without running JS. */
  bodyHtml?: string;
}

const EXCLUDED_CITIES = new Set(["nicosia", "larnaca", "famagusta"]);

// ---- helpers ---------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(s: string, n = 160): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "\u2026" : s;
}

function publicTitle(title?: string | null): string {
  if (!title) return "";
  const idx = title.indexOf(" - ");
  if (idx === -1) return title;
  return title.slice(idx + 3).trim() || title;
}

function projectSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function projectName(title?: string | null): string {
  if (!title) return "";
  const idx = title.indexOf(" - ");
  return (idx === -1 ? title : title.slice(0, idx)).trim();
}

// ---- static routes ---------------------------------------------------------

const staticRoutes: RouteMeta[] = [
  {
    path: "/",
    title: "Memories \u2014 Private Real Estate \u00b7 Investment Projects & Land",
    description:
      "Private real estate practice sourcing off-market investment projects and land for a discreet roster of clients. By introduction only.",
  },
  {
    path: "/properties",
    title: "Properties \u2014 Investment Land & Off-Market Real Estate",
    description:
      "Browse Memories' curated portfolio of investment projects, development land, agricultural estates, and off-market real estate opportunities.",
  },
  {
    path: "/developments",
    title: "New Developments for Sale | Memories",
    description:
      "Browse new-build developments and projects for sale \u2014 apartment blocks, villa communities and more, with prices from the lowest available unit.",
  },
  {
    path: "/sold-projects",
    title: "Sold Projects | Memories",
    description:
      "Explore our portfolio of sold-out developments and completed projects \u2014 a track record of successful new-build communities.",
  },
  {
    path: "/sold-properties",
    title: "Sold Properties | Memories",
    description:
      "Browse our track record of sold properties \u2014 individual homes and villas we have successfully closed.",
  },
  {
    path: "/our-expertise",
    title: "Our Expertise \u2014 Buy, Sell & Projects in Cyprus",
    description:
      "Discover the Memories Properties expertise: bespoke buying, strategic selling, premium leasing and off-the-plan projects across Cyprus.",
  },
  {
    path: "/project-expertise",
    title: "Project Expertise | Memories",
    description:
      "How Memories Properties works with developers to bring new projects to market across Cyprus.",
  },
  {
    path: "/project-buyer-faqs",
    title: "Project Buyer FAQs \u2014 Off-the-Plan Property in Cyprus | Memories",
    description:
      "Everything off-the-plan buyers need to know about Cyprus property: how buying new works, downsizer and first home buyer guidance, investor insights and our points of difference.",
  },
  {
    path: "/blog",
    title: "Cyprus Property Blog \u2014 Paphos & Limassol Real Estate News",
    description:
      "Expert guides, market updates and area spotlights on buying, selling and investing in property in Paphos, Limassol and across Cyprus.",
  },
  {
    path: "/insights/limassol",
    title: "Limassol Property Market Insights & Sold Prices | Memories",
    description:
      "Track Limassol real estate trends, recent sales, asset mix and price benchmarks with Memories' market insights.",
  },
  {
    path: "/about",
    title: "Our Story \u2014 A Decade of Real Estate Leadership",
    description:
      "Since 2014 Memories has led a private real estate practice grounded in deep local knowledge, refined strategy and an uncompromising commitment to service.",
  },
  {
    path: "/advisory",
    title: "Buyer Advisory",
    description:
      "A buyer\u2019s advisor can be your professional advantage \u2014 finding the right property, negotiating on your behalf, and securing the deal across Cyprus.",
  },
  {
    path: "/sell",
    title: "Sell Your Property With Memories",
    description:
      "Experience the difference with Memories. Expert agents, world-class marketing campaigns, and a commitment to exceptional results across Cyprus.",
  },
  {
    path: "/insights",
    title: "Insights \u2014 Selectivity, Asset Mix & Market Briefings",
    description:
      "Quarterly insights on Memories' mandate selectivity, asset mix, ticket sizes, and market data across the active book.",
  },
  {
    path: "/common-questions",
    title: "Common Questions \u2014 Memories",
    description:
      "Answers to frequently asked questions about off-market real estate, private viewings, property types, and working with Memories.",
  },
  {
    path: "/guides/off-market-investing",
    title: "How to Find Off-Market Investment Properties",
    description:
      "A practical guide to sourcing off-market investment properties \u2014 how private deals work, where they come from, and how to access them through a private practice.",
    type: "article",
  },
  {
    path: "/transfer-fees-calculator",
    title: "Cyprus Property Transfer Fees Calculator",
    description:
      "Estimate the property transfer fees payable to the Department of Lands and Surveys of Cyprus, including the 50% resale reduction and VAT exemption.",
  },
  {
    path: "/selling-expenses-calculator",
    title: "Cyprus Property Selling Expenses Calculator",
    description:
      "Estimate the costs of selling a property in Cyprus: agency commission, Capital Gains Tax, legal fees and other charges \u2014 and see your net proceeds.",
  },
  {
    path: "/contact",
    title: "Contact Memories \u2014 Begin a Conversation",
    description:
      "Introductions, off-market opportunities, and quarterly investment briefings \u2014 by request only. All correspondence treated in confidence.",
  },
];

// ---- location (city/district) landing pages -------------------------------

const locationIndexRoute: RouteMeta = {
  path: "/locations",
  title: "Property by Location in Cyprus \u2014 Cities & Districts",
  description:
    "Explore property for sale by city and district across Cyprus \u2014 Paphos, Limassol and their most sought-after areas, each with a dedicated local guide.",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Property Locations in Cyprus",
    url: `${BASE_URL}/locations`,
  },
};

const locationRoutes: RouteMeta[] = LOCATIONS.map((l) => {
  const url = `${BASE_URL}/locations/${l.slug}`;
  return {
    path: `/locations/${l.slug}`,
    title: `Property for Sale in ${l.name}, Cyprus`,
    description: truncate(`${l.tagline}. ${l.intro}`),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `Property for Sale in ${l.name}, Cyprus`,
        description: l.intro,
        url,
        about: { "@type": "Place", name: `${l.name}, ${l.region}, Cyprus` },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: l.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };
});

// ---- dynamic routes --------------------------------------------------------

async function fetchJson(url: string): Promise<unknown[]> {
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    console.warn(`prerender: fetch failed (${res.status}) ${url}`);
    return [];
  }
  return (await res.json()) as unknown[];
}

async function fetchPropertyRoutes(): Promise<RouteMeta[]> {
  try {
    const rows = (await fetchJson(
      `${SUPABASE_URL}/rest/v1/properties?select=id,slug,title,location,price,price_value,cover_image,beds,baths,size,category,city,region,status,reference_code,description,share_title,share_description,share_image`,
    )) as Array<{
      id: string;
      slug: string | null;
      title: string | null;
      location: string | null;
      price: string | null;
      price_value: number | null;
      cover_image: string | null;
      beds: number | string | null;
      baths: number | string | null;
      size: string | null;
      category: string | null;
      city: string | null;
      region: string | null;
      status: string | null;
      reference_code: string | null;
      description: string | null;
      share_title: string | null;
      share_description: string | null;
      share_image: string | null;
    }>;

    return rows
      .filter((r) => {
        const c = (r.city ?? "").toLowerCase();
        const rg = (r.region ?? "").toLowerCase();
        return !EXCLUDED_CITIES.has(c) && !EXCLUDED_CITIES.has(rg);
      })
      .map((r) => {
        const name = publicTitle(r.title) || "Property";
        const loc = r.location || "Cyprus";
        const path = `/properties/${r.slug || r.id}`;
        const url = `${BASE_URL}${path}`;

        const locShort = (r.location || "").split("\u00b7")[0].split(",")[0].trim();
        const ref = r.reference_code || r.id;
        const bedsPart = r.beds != null ? `${r.beds} Bed ` : "";
        const bathsPart = r.baths != null ? `${r.baths} Bath ` : "";
        const categorySingular = (r.category ?? "Property").replace(/s$/i, "");
        const status = (r.status ?? "").toLowerCase();
        const isSold = /closed|sold/i.test(status);
        const listingVerb = status.includes("rent") ? "For Rent in" : "For Sale in";
        const sizeNum = r.size ? parseFloat(r.size.replace(/[^\d.]/g, "")) : null;
        const sizeShort =
          sizeNum != null && !isNaN(sizeNum) ? `${Math.round(sizeNum)} m\u00b2` : null;

        // Full price (e.g. "€560,000"), never abbreviated. Falls back to the stored price string.
        const priceStr =
          r.price_value != null && Number(r.price_value) > 0
            ? `\u20ac${Math.round(Number(r.price_value)).toLocaleString("en-US")}`
            : r.price;
        // Auto format, e.g. "2 Bed 2 Bath Apartment For Sale in Paphos - €310,000" (no ID in title).
        const autoTitle = `${bedsPart}${bathsPart}${categorySingular} ${listingVerb}${locShort ? ` ${locShort}` : ""}${priceStr ? ` - ${priceStr}` : ""}`;
        const autoDescription = `${bedsPart}${bathsPart}${categorySingular} in ${locShort || loc}.${priceStr ? ` ${priceStr}` : ""}${sizeShort ? ` \u00b7 ${sizeShort}` : ""}. Ref: ${ref}.`;

        // Custom overrides take precedence when set on the property.
        const title =
          r.share_title && r.share_title.trim() ? r.share_title.trim() : autoTitle;
        const description =
          r.share_description && r.share_description.trim()
            ? r.share_description.trim()
            : autoDescription;

        const shareImgRaw =
          r.share_image && /^https?:\/\//i.test(r.share_image.trim())
            ? r.share_image.trim()
            : null;
        const image =
          shareImgRaw ||
          (r.cover_image && /^https?:\/\//i.test(r.cover_image)
            ? r.cover_image
            : DEFAULT_IMAGE);

        const jsonLd: Record<string, unknown> = {
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          "@id": `${url}#listing`,
          url,
          name,
          description: `${name} in ${loc}. ${r.category ?? ""}`.trim(),
          image,
          offers: {
            "@type": "Offer",
            url,
            ...(r.price_value ? { price: r.price_value, priceCurrency: "EUR" } : {}),
            availability: isSold
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
            seller: { "@type": "Organization", name: SITE_NAME },
          },
        };
        const facts = [
          r.beds != null ? `<li>${esc(String(r.beds))} bedrooms</li>` : "",
          r.baths != null ? `<li>${esc(String(r.baths))} bathrooms</li>` : "",
          sizeShort ? `<li>Size: ${esc(sizeShort)}</li>` : "",
          r.category ? `<li>Type: ${esc(r.category)}</li>` : "",
          r.status ? `<li>Status: ${esc(r.status)}</li>` : "",
          `<li>Reference: ${esc(ref)}</li>`,
        ]
          .filter(Boolean)
          .join("");
        const aboutText = (r.description && r.description.trim()) || description;
        const bodyHtml = `<main>
  <nav aria-label="Breadcrumb"><a href="${BASE_URL}/">Home</a> &rsaquo; <a href="${BASE_URL}/properties">Properties</a> &rsaquo; <span>${esc(locShort || loc)}</span></nav>
  <article>
    <h1>${esc(name)}</h1>
    <p><strong>${esc(priceStr || "")}</strong> &middot; ${esc(loc)}</p>
    <img src="${esc(image)}" alt="${esc(name)} — ${esc(loc)}" width="1200" height="750" loading="eager" />
    <ul>${facts}</ul>
    <h2>About this property</h2>
    <p>${esc(truncate(aboutText, 600))}</p>
    <p><a href="${BASE_URL}/contact">Enquire about this property</a></p>
  </article>
</main>`;
        return {
          path,
          title,
          description,
          image,
          type: "article" as const,
          jsonLd,
          bodyHtml,
        };
      });
  } catch (err) {
    console.warn("prerender: could not fetch properties", err);
    return [];
  }
}

async function fetchDevelopmentRoutes(): Promise<RouteMeta[]> {
  try {
    const rows = (await fetchJson(
      `${SUPABASE_URL}/rest/v1/properties?select=title,location,price_value,beds,category,cover_image,images&developer_id=not.is.null`,
    )) as Array<{
      title: string | null;
      location: string | null;
      price_value: number | null;
      beds: number | null;
      category: string | null;
      cover_image: string | null;
      images: string[] | null;
    }>;
    const groups = new Map<string, typeof rows>();
    for (const row of rows) {
      const name = projectName(row.title);
      if (!name) continue;
      const list = groups.get(name) ?? [];
      list.push(row);
      groups.set(name, list);
    }
    const fmtEur = (n: number | null) =>
      n != null && Number.isFinite(n) && n > 0 ? `\u20ac${Math.round(n).toLocaleString("en-US")}` : "";
    const devSlug = (uCount: number, mPrice: number | null, loc: string) => {
      const l = loc
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const pricePart = mPrice != null && mPrice > 0 ? `-from${Math.round(mPrice)}` : "";
      const locPart = l ? `-${l}` : "";
      return `${uCount}units${pricePart}${locPart}`;
    };
    return Array.from(groups.entries()).map(([, units]) => {
      const name = projectName(units[0].title);
      const prices = units.map((u) => u.price_value).filter((v): v is number => v != null && v > 0);
      const minPrice = prices.length ? Math.min(...prices) : null;
      const beds = units.map((u) => u.beds).filter((v): v is number => v != null && v > 0);
      const categories = Array.from(new Set(units.map((u) => u.category).filter(Boolean) as string[]));
      const location = (() => {
        const raw = units.find((u) => u.location)?.location ?? "";
        const idx = raw.indexOf(" \u00b7 ");
        return (idx === -1 ? raw : raw.slice(0, idx)).trim();
      })();
      const coverRaw =
        units.find((u) => u.cover_image)?.cover_image ??
        units.find((u) => u.images && u.images.length)?.images?.[0] ??
        null;
      const image = coverRaw
        ? coverRaw.startsWith("http")
          ? coverRaw
          : `${BASE_URL}${coverRaw}`
        : DEFAULT_IMAGE;
      const fromPart = minPrice ? ` - From ${fmtEur(minPrice)}` : "";
      const bedRange = beds.length
        ? Math.min(...beds) !== Math.max(...beds)
          ? `${Math.min(...beds)}\u2013${Math.max(...beds)} bed`
          : `${Math.min(...beds)} bed`
        : "";
      const description = [
        `${name} \u2014 a new-build development in ${location || "Cyprus"}.`,
        `${units.length} unit${units.length === 1 ? "" : "s"}${minPrice ? ` from ${fmtEur(minPrice)}` : ""}.`,
        bedRange ? `${bedRange}${categories.length ? ` ${categories.join(", ").toLowerCase()}` : ""}.` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const devBodyHtml = `<main>
  <nav aria-label="Breadcrumb"><a href="${BASE_URL}/">Home</a> &rsaquo; <a href="${BASE_URL}/developments">Developments</a> &rsaquo; <span>${esc(location || "Cyprus")}</span></nav>
  <article>
    <h1>${esc(name)}</h1>
    <p>${esc(description)}</p>
    <img src="${esc(image)}" alt="${esc(name)} — ${esc(location || "Cyprus")}" width="1200" height="750" loading="eager" />
    <p><a href="${BASE_URL}/contact">Enquire about this development</a></p>
  </article>
</main>`;
      return {
        path: `/developments/${devSlug(units.length, minPrice, location)}`,
        title: `New Development in ${location || "Cyprus"}${fromPart}`,
        description,
        image,
        type: "website" as const,
        bodyHtml: devBodyHtml,
      };
    });
  } catch (err) {
    console.warn("prerender: could not fetch developments", err);
    return [];
  }
}


// ---- head rewriting --------------------------------------------------------

function buildHtml(template: string, route: RouteMeta): string {
  const url = `${BASE_URL}${route.path}`;
  const fullTitle = route.title.includes(SITE_NAME)
    ? route.title
    : `${route.title} | ${SITE_NAME}`;
  const desc = truncate(route.description);
  const image = route.image || DEFAULT_IMAGE;
  const type = route.type || "website";

  let html = template;

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`);

  // meta description
  html = html.replace(
    /<meta name="description" content="[\s\S]*?" \/>/,
    `<meta name="description" content="${esc(desc)}" />`,
  );

  // robots — every prerendered route here is a public, indexable page (the
  // few noindex pages like /account aren't part of this route list), so bake
  // the same directive the client-side <SEO> component renders by default.
  // Keeps the existing noai/noimageai (AI-training opt-out) directive too.
  html = html.replace(
    /<meta name="robots" content="[\s\S]*?" \/>/,
    `<meta name="robots" content="noai, noimageai, index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
  );

  // canonical
  html = html.replace(
    /<link rel="canonical" href="[\s\S]*?" \/>/,
    `<link rel="canonical" href="${esc(url)}" />`,
  );

  // open graph
  html = html
    .replace(
      /<meta property="og:title" content="[\s\S]*?" \/>/,
      `<meta property="og:title" content="${esc(fullTitle)}" />`,
    )
    .replace(
      /<meta property="og:description" content="[\s\S]*?" \/>/,
      `<meta property="og:description" content="${esc(desc)}" />`,
    )
    .replace(
      /<meta property="og:type" content="[\s\S]*?" \/>/,
      `<meta property="og:type" content="${esc(type)}" />`,
    )
    .replace(
      /<meta property="og:url" content="[\s\S]*?" \/>/,
      `<meta property="og:url" content="${esc(url)}" />`,
    )
    .replace(
      /<meta property="og:image" content="[\s\S]*?" \/>/,
      `<meta property="og:image" content="${esc(image)}" />`,
    );

  // twitter
  html = html
    .replace(
      /<meta name="twitter:title" content="[\s\S]*?" \/>/,
      `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    )
    .replace(
      /<meta name="twitter:description" content="[\s\S]*?" \/>/,
      `<meta name="twitter:description" content="${esc(desc)}" />`,
    )
    .replace(
      /<meta name="twitter:image" content="[\s\S]*?" \/>/,
      `<meta name="twitter:image" content="${esc(image)}" />`,
    );

  // route-specific JSON-LD (appended before </head>)
  if (route.jsonLd) {
    const blocks = (Array.isArray(route.jsonLd) ? route.jsonLd : [route.jsonLd])
      .map(
        (obj) =>
          `<script type="application/ld+json">${JSON.stringify(obj)}</script>`,
      )
      .join("\n    ");
    html = html.replace("</head>", `    ${blocks}\n  </head>`);
  }

  // Bake crawlable content into #root. React (createRoot) clears and re-renders
  // this container on hydration, so real users are unaffected; crawlers that
  // don't execute JS still get a full, indexable document body.
  if (route.bodyHtml) {
    html = html.replace(
      /<div id="root">\s*<\/div>/,
      `<div id="root">${route.bodyHtml}</div>`,
    );
  }

  return html;
}

function writeRoute(template: string, route: RouteMeta): void {
  // "/" -> dist/index.html (already exists, overwrite with same-but-canonical)
  const rel = route.path === "/" ? "index.html" : `${route.path.replace(/^\//, "")}/index.html`;
  const out = resolve(DIST, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buildHtml(template, route));
}

async function main() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.warn("prerender: dist/index.html not found, skipping");
    return;
  }
  const template = readFileSync(TEMPLATE_PATH, "utf8");

  const [propertyRoutes, developmentRoutes] = await Promise.all([
    fetchPropertyRoutes(),
    fetchDevelopmentRoutes(),
  ]);

  const routes = [
    ...staticRoutes,
    locationIndexRoute,
    ...locationRoutes,
    ...developmentRoutes,
    ...propertyRoutes,
  ];
  for (const route of routes) writeRoute(template, route);

  console.log(`prerender: wrote ${routes.length} static HTML pages`);
}

main().catch((err) => {
  // Never fail the build — prerendering is an enhancement, not a requirement.
  console.warn("prerender: skipped due to error", err);
});
