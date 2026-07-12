// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Pulls dynamic property pages from the database so the sitemap stays in sync.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { LOCATIONS } from "../src/lib/locations";
import { curatedSearchSlugs } from "../src/lib/searchFacets";

const BASE_URL = "https://memoriesproperties.com";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://wlugjzfztcwmlmgqfgno.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdWdqemZ6dGN3bWxtZ3FmZ25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTQ2NjcsImV4cCI6MjA5Mjg5MDY2N30.C6bBd3wby17yWRtiZ4SkBOktnbLzJIWDf8JeVMLyvWw";

interface SitemapImage {
  loc: string;
  title?: string;
}

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
  images?: SitemapImage[];
}

const BUILD_DATE = new Date().toISOString().slice(0, 10);

/** Escape a string for safe inclusion in XML text/attribute content. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Static, public, indexable routes.
export const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/properties", changefreq: "daily", priority: "0.9" },
  { path: "/developments", changefreq: "daily", priority: "0.9" },
  { path: "/sold-projects", changefreq: "weekly", priority: "0.6" },
  { path: "/sold-properties", changefreq: "weekly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/advisory", changefreq: "monthly", priority: "0.7" },
  { path: "/our-expertise", changefreq: "monthly", priority: "0.7" },
  { path: "/sell", changefreq: "monthly", priority: "0.7" },
  { path: "/insights", changefreq: "weekly", priority: "0.7" },
  { path: "/insights/limassol", changefreq: "weekly", priority: "0.7" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/common-questions", changefreq: "monthly", priority: "0.6" },
  { path: "/project-buyer-faqs", changefreq: "monthly", priority: "0.6" },
  { path: "/guides/off-market-investing", changefreq: "monthly", priority: "0.6" },
  { path: "/transfer-fees-calculator", changefreq: "monthly", priority: "0.5" },
  { path: "/selling-expenses-calculator", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/legal-notice", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/cookies", changefreq: "yearly", priority: "0.3" },
  { path: "/disclosure", changefreq: "yearly", priority: "0.3" },
  { path: "/sitemap", changefreq: "monthly", priority: "0.3" },
].map((e) => ({ lastmod: BUILD_DATE, ...e })) as SitemapEntry[];

// Region landing pages (/properties/region/:region). Mirrors REGIONS in src/pages/RegionPage.tsx.
const REGION_SLUGS = ["paphos", "limassol"] as const;
export const regionEntries: SitemapEntry[] = REGION_SLUGS.map((slug) => ({
  path: `/properties/region/${slug}`,
  changefreq: "weekly" as const,
  priority: "0.8",
  lastmod: BUILD_DATE,
}));

// Location (city/district) SEO landing pages.
export const locationEntries: SitemapEntry[] = [
  { path: "/locations", changefreq: "weekly", priority: "0.7", lastmod: BUILD_DATE },
  ...LOCATIONS.map((l) => ({
    path: `/locations/${l.slug}`,
    changefreq: "weekly" as const,
    priority: l.isCity ? "0.8" : "0.7",
    lastmod: BUILD_DATE,
  })),
];

export const searchEntries: SitemapEntry[] = curatedSearchSlugs().map((slug) => ({
  path: `/property-search/${slug}`,
  changefreq: "weekly" as const,
  priority: "0.6",
  lastmod: BUILD_DATE,
}));

const EXCLUDED_CITIES = new Set(['nicosia', 'larnaca', 'famagusta']);

async function fetchPropertyEntries(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?select=id,slug,updated_at,city,region,title,cover_image,images`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) {
      console.warn(`sitemap: properties fetch failed (${res.status}), skipping`);
      return [];
    }
    const rows: { id: string; slug: string | null; updated_at?: string; city?: string | null; region?: string | null; title?: string | null; cover_image?: string | null; images?: string[] | null }[] =
      await res.json();
    return rows
      .filter((row) => {
        const c = (row.city ?? '').toLowerCase();
        const r = (row.region ?? '').toLowerCase();
        return !EXCLUDED_CITIES.has(c) && !EXCLUDED_CITIES.has(r);
      })
      .map((row) => {
        const imgUrls = Array.from(
          new Set(
            [row.cover_image, ...(Array.isArray(row.images) ? row.images : [])].filter(
              (u): u is string => typeof u === "string" && u.startsWith("http")
            )
          )
        ).slice(0, 10); // Google caps at 1,000 images/page; keep it lean
        return {
          path: `/properties/${row.slug || row.id}`,
          lastmod: row.updated_at ? row.updated_at.slice(0, 10) : undefined,
          changefreq: "weekly" as const,
          priority: "0.8",
          images: imgUrls.map((loc) => ({
            loc,
            title: row.title ?? undefined,
          })),
        };
      });
  } catch (err) {
    console.warn("sitemap: could not fetch properties, skipping", err);
    return [];
  }
}

/** Slugify a project name for a development URL (mirrors src/lib/developments.ts). */
function projectSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Project name = part of the unit title before " - ". */
function projectName(title?: string | null): string {
  if (!title) return "";
  const idx = title.indexOf(" - ");
  return (idx === -1 ? title : title.slice(0, idx)).trim();
}

type DevUnit = {
  title: string | null;
  price_value: number | null;
  location: string | null;
  status: string | null;
  listing_type: string | null;
  updated_at?: string;
};

const isSold = (u: { status: string | null }) => /\bsold\b/i.test(u.status ?? "");

/** Build the development URL slug — mirrors developmentSlug() in src/lib/developments.ts. */
export function developmentSlug(unitCount: number, minPrice: number | null, location: string | null): string {
  const loc = (location ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const pricePart = minPrice != null && minPrice > 0 ? `-from${Math.round(minPrice)}` : "";
  const locPart = loc ? `-${loc}` : "";
  return `${unitCount}units${pricePart}${locPart}`;
}

/**
 * Group rows into developments the same way the app does, then generate the
 * unique slug (with name-derived suffix on collisions) so every URL resolves.
 */
function buildDevSlugs(rows: DevUnit[], mode: "active" | "sold"): { slug: string; lastmod?: string }[] {
  const map = new Map<string, DevUnit[]>();
  for (const row of rows) {
    const keep = mode === "sold" ? true : (row.listing_type ?? "sale") === "sale" && !isSold(row);
    if (!keep) continue;
    const name = projectName(row.title);
    if (!name) continue;
    const list = map.get(name) ?? [];
    list.push(row);
    map.set(name, list);
  }

  const devs: { name: string; slug: string; lastmod?: string }[] = [];
  for (const [name, units] of map) {
    if (mode === "sold" && !units.every((u) => isSold(u))) continue;
    const prices = units.map((u) => u.price_value).filter((v): v is number => v != null && v > 0);
    const minPrice = prices.length ? Math.min(...prices) : null;
    const location = (() => {
      const raw = units.find((u) => u.location)?.location ?? null;
      if (!raw) return null;
      const idx = raw.indexOf(" · ");
      return idx === -1 ? raw : raw.slice(0, idx).trim();
    })();
    const lastmod = units
      .map((u) => u.updated_at?.slice(0, 10))
      .filter(Boolean)
      .sort()
      .pop();
    devs.push({ name, slug: developmentSlug(units.length, minPrice, location), lastmod });
  }

  // Deterministic unique-slug suffixing — mirrors buildDevelopments().
  devs.sort((a, b) => a.name.localeCompare(b.name));
  const counts = new Map<string, number>();
  for (const d of devs) {
    const base = d.slug;
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    if (seen > 0) {
      const suffix = projectSlug(d.name).slice(0, 12) || `d${seen}`;
      d.slug = `${base}-${suffix}`;
      if ((counts.get(d.slug) ?? 0) > 0) d.slug = `${d.slug}-${seen}`;
      counts.set(d.slug, (counts.get(d.slug) ?? 0) + 1);
    }
  }
  return devs.map(({ slug, lastmod }) => ({ slug, lastmod }));
}

async function fetchDevelopmentEntries(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?select=title,price_value,location,status,listing_type,updated_at&developer_id=not.is.null`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) {
      console.warn(`sitemap: developments fetch failed (${res.status}), skipping`);
      return [];
    }
    const rows: DevUnit[] = await res.json();
    // Both active (Projects for Sale) and fully-sold (Sold Projects) pages are reachable.
    const seen = new Set<string>();
    const entries: SitemapEntry[] = [];
    for (const mode of ["active", "sold"] as const) {
      for (const { slug, lastmod } of buildDevSlugs(rows, mode)) {
        if (seen.has(slug)) continue;
        seen.add(slug);
        entries.push({
          path: `/developments/${slug}`,
          lastmod,
          changefreq: "weekly" as const,
          priority: "0.8",
        });
      }
    }
    return entries;
  } catch (err) {
    console.warn("sitemap: could not fetch developments, skipping", err);
    return [];
  }
}


function categorySlug(tag: string): string {
  return tag
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchBlogEntries(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,tags,updated_at,published_at,is_published&is_published=eq.true`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) {
      console.warn(`sitemap: blog fetch failed (${res.status}), skipping`);
      return [];
    }
    const rows: { slug: string | null; tags?: string[] | null; updated_at?: string; published_at?: string | null }[] =
      await res.json();

    const postEntries: SitemapEntry[] = rows
      .filter((row) => !!row.slug)
      .map((row) => ({
        path: `/blog/${row.slug}`,
        lastmod: (row.updated_at || row.published_at || undefined)?.slice(0, 10),
        changefreq: "monthly" as const,
        priority: "0.7",
      }));

    // Category (tag) landing pages — one indexable URL per unique tag.
    const seen = new Set<string>();
    const categoryEntries: SitemapEntry[] = [];
    for (const row of rows) {
      for (const raw of row.tags ?? []) {
        const slug = categorySlug((raw ?? "").trim());
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        categoryEntries.push({
          path: `/blog/category/${slug}`,
          changefreq: "weekly" as const,
          priority: "0.6",
          lastmod: BUILD_DATE,
        });
      }
    }

    return [...categoryEntries, ...postEntries];
  } catch (err) {
    console.warn("sitemap: could not fetch blog posts, skipping", err);
    return [];
  }
}



// hreflang alternates shared by an EN/RU URL pair.
function altLinks(enPath: string): string[] {
  const ruPath = enPath === "/" ? "/ru" : `/ru${enPath}`;
  return [
    `    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${enPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="ru" href="${BASE_URL}${ruPath}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${enPath}" />`,
  ];
}

/**
 * Render a single <url> block.
 * `mode` controls image inclusion so the same entries can feed both a lean
 * page-URL sitemap and a dedicated image sitemap.
 */
function buildUrl(
  e: SitemapEntry,
  locPath: string,
  mode: "pages" | "images"
): string {
  const imageBlocks =
    mode === "images"
      ? (e.images ?? []).map((img) =>
          [
            `    <image:image>`,
            `      <image:loc>${xmlEscape(img.loc)}</image:loc>`,
            img.title ? `      <image:title>${xmlEscape(img.title)}</image:title>` : null,
            `    </image:image>`,
          ]
            .filter(Boolean)
            .join("\n")
        )
      : [];
  return [
    `  <url>`,
    `    <loc>${BASE_URL}${locPath}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    mode === "pages" && e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    mode === "pages" && e.priority ? `    <priority>${e.priority}</priority>` : null,
    ...(mode === "pages" ? altLinks(e.path) : []),
    ...imageBlocks,
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Build a <urlset> document. In "pages" mode each entry emits its EN + RU URL
 * with hreflang alternates; in "images" mode only entries that carry images are
 * emitted (EN URL only) as an image sitemap.
 */
function generateUrlSet(entries: SitemapEntry[], mode: "pages" | "images"): string {
  const urls =
    mode === "images"
      ? entries
          .filter((e) => (e.images?.length ?? 0) > 0)
          .map((e) => buildUrl(e, e.path, "images"))
      : entries.flatMap((e) => [
          buildUrl(e, e.path, "pages"),
          buildUrl(e, e.path === "/" ? "/ru" : `/ru${e.path}`, "pages"),
        ]);

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

function generateSitemapIndex(files: string[]): string {
  const entries = files.map((f) =>
    [
      `  <sitemap>`,
      `    <loc>${BASE_URL}/${f}</loc>`,
      `    <lastmod>${BUILD_DATE}</lastmod>`,
      `  </sitemap>`,
    ].join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries,
    `</sitemapindex>`,
  ].join("\n");
}

/** Split a list into chunks of at most `size` items. */
function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Sitemaps protocol caps each file at 50,000 URLs. Each page entry emits 2 URLs
// (EN + RU), so keep well under the cap.
const MAX_PAGE_ENTRIES = 20000; // -> up to 40,000 <url> tags per file
const MAX_IMAGE_ENTRIES = 45000;

async function main() {
  const [propertyEntries, developmentEntries, blogEntries] = await Promise.all([
    fetchPropertyEntries(),
    fetchDevelopmentEntries(),
    fetchBlogEntries(),
  ]);

  // "web": every non-property page. "properties": property page URLs (lean, no
  // images). "images": property image sitemap.
  const webEntries = [
    ...staticEntries,
    ...regionEntries,
    ...locationEntries,
    ...searchEntries,
    ...blogEntries,
    ...developmentEntries,
  ];

  const childFiles: string[] = [];

  const writeChunks = (
    baseName: string,
    entries: SitemapEntry[],
    mode: "pages" | "images",
    max: number
  ) => {
    // For image mode, only entries with images count toward the file.
    const relevant =
      mode === "images" ? entries.filter((e) => (e.images?.length ?? 0) > 0) : entries;
    const groups = chunk(relevant, max);
    groups.forEach((group, i) => {
      const name = groups.length > 1 ? `${baseName}-${i + 1}.xml` : `${baseName}.xml`;
      writeFileSync(resolve(`public/${name}`), generateUrlSet(group, mode));
      childFiles.push(name);
      console.log(`${name} written (${group.length} entries)`);
    });
  };

  writeChunks("sitemap-web", webEntries, "pages", MAX_PAGE_ENTRIES);
  writeChunks("sitemap-properties", propertyEntries, "pages", MAX_PAGE_ENTRIES);
  writeChunks("sitemap-images", propertyEntries, "images", MAX_IMAGE_ENTRIES);

  // Root sitemap.xml is now the index that points at every child sitemap.
  writeFileSync(resolve("public/sitemap.xml"), generateSitemapIndex(childFiles));
  console.log(`sitemap.xml (index) written (${childFiles.length} sitemaps)`);
}

// Only run when executed directly (predev/prebuild), not when imported by tests.
const isDirectRun =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  /generate-sitemap\.(ts|js|mjs)$/.test(process.argv[1] ?? "");
if (isDirectRun) {
  main();
}
