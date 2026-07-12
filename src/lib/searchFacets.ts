/**
 * Faceted search SEO landing pages — shared data + helpers.
 *
 * Generates clean, human-readable, crawlable URLs for the most common property
 * searches (location × property type × bedrooms × price) so search engines and
 * AI assistants can ground answers on a stable, descriptive URL such as:
 *
 *   /property-search/villas-in-paphos
 *   /property-search/2-bedroom-apartments-in-kato-paphos
 *   /property-search/3-bedroom-villas-in-limassol-under-1000000
 *   /property-search/property-in-cyprus-under-500000
 *
 * Framework-agnostic (no browser-only imports) so it can be consumed by the
 * React page (src/pages/PropertySearch.tsx) and the sitemap generator
 * (scripts/generate-sitemap.ts).
 */

import { LOCATIONS, getLocation, matchesLocation, type LocationDef } from "./locations";

/** Canonical property types we expose as facets (matched against DB `category`). */
export type FacetType = "villa" | "apartment" | "semi-detached" | "maisonette";

export interface SearchFacets {
  /** Location slug (matches LOCATIONS) or null for the whole island ("cyprus"). */
  location: string | null;
  /** Property type or null for "any type". */
  type: FacetType | null;
  /** Minimum bedrooms (1–5) or null for "any". */
  beds: number | null;
  /** Maximum price in EUR (one of ALLOWED_PRICES) or null for "any". */
  maxPrice: number | null;
}

export const ALLOWED_BEDS = [1, 2, 3, 4, 5] as const;
export const ALLOWED_PRICES = [300000, 500000, 750000, 1000000, 2000000] as const;

const TYPE_TO_PLURAL: Record<FacetType, string> = {
  villa: "villas",
  apartment: "apartments",
  "semi-detached": "semi-detached-homes",
  maisonette: "maisonettes",
};

const PLURAL_TO_TYPE: Record<string, FacetType> = Object.entries(TYPE_TO_PLURAL).reduce(
  (acc, [type, plural]) => {
    acc[plural] = type as FacetType;
    return acc;
  },
  {} as Record<string, FacetType>,
);

const TYPE_LABEL: Record<FacetType, string> = {
  villa: "Villas",
  apartment: "Apartments",
  "semi-detached": "Semi-Detached Homes",
  maisonette: "Maisonettes",
};

/** Build the canonical slug for a set of facets. */
export function buildSearchSlug(f: SearchFacets): string {
  const noun = f.type ? TYPE_TO_PLURAL[f.type] : "property";
  const bedsPart = f.beds ? `${f.beds}-bedroom-` : "";
  const locSlug = f.location ?? "cyprus";
  const pricePart = f.maxPrice ? `-under-${f.maxPrice}` : "";
  return `${bedsPart}${noun}-in-${locSlug}${pricePart}`;
}

const SLUG_RE =
  /^(?:(\d)-bedroom-)?(villas|apartments|semi-detached-homes|maisonettes|property)-in-([a-z-]+?)(?:-under-(\d+))?$/;

/** Parse a slug into facets, or null if it is not a valid/known search. */
export function parseSearchSlug(slug: string): SearchFacets | null {
  const m = SLUG_RE.exec(slug);
  if (!m) return null;
  const [, bedsRaw, noun, locRaw, priceRaw] = m;

  // Beds
  let beds: number | null = null;
  if (bedsRaw) {
    beds = Number(bedsRaw);
    if (!ALLOWED_BEDS.includes(beds as (typeof ALLOWED_BEDS)[number])) return null;
  }

  // Type
  let type: FacetType | null = null;
  if (noun !== "property") {
    type = PLURAL_TO_TYPE[noun] ?? null;
    if (!type) return null;
  }

  // Location
  let location: string | null = null;
  if (locRaw !== "cyprus") {
    if (!getLocation(locRaw)) return null;
    location = locRaw;
  }

  // Price
  let maxPrice: number | null = null;
  if (priceRaw) {
    maxPrice = Number(priceRaw);
    if (!ALLOWED_PRICES.includes(maxPrice as (typeof ALLOWED_PRICES)[number])) return null;
  }

  return { location, type, beds, maxPrice };
}

/** Human-readable label for the place. */
export function facetPlaceName(f: SearchFacets): string {
  if (!f.location) return "Cyprus";
  return getLocation(f.location)?.name ?? "Cyprus";
}

export function facetLocationDef(f: SearchFacets): LocationDef | null {
  return f.location ? getLocation(f.location) : null;
}

/** Place name including the country, without duplicating "Cyprus". */
function placeWithCountry(f: SearchFacets): string {
  const place = facetPlaceName(f);
  return place === "Cyprus" ? "Cyprus" : `${place}, Cyprus`;
}

/** Pretty title for the search, e.g. "2-Bedroom Villas for Sale in Paphos, Cyprus". */
export function facetHeading(f: SearchFacets): string {
  const beds = f.beds ? `${f.beds}-Bedroom ` : "";
  const noun = f.type ? TYPE_LABEL[f.type] : "Property";
  const price = f.maxPrice ? ` Under €${f.maxPrice.toLocaleString("en-GB")}` : "";
  return `${beds}${noun} for Sale in ${placeWithCountry(f)}${price}`;
}

/** Short meta description. */
export function facetDescription(f: SearchFacets): string {
  const beds = f.beds ? `${f.beds}-bedroom ` : "";
  const noun = f.type ? TYPE_LABEL[f.type].toLowerCase() : "property";
  const price = f.maxPrice ? ` priced under €${f.maxPrice.toLocaleString("en-GB")}` : "";
  return `Browse ${beds}${noun} for sale in ${placeWithCountry(f)}${price}. Curated, up-to-date listings from Memories — view prices, photos and enquire privately.`;
}

/** Editorial intro paragraph used on the page. */
export function facetIntro(f: SearchFacets): string {
  const beds = f.beds ? `${f.beds}-bedroom ` : "";
  const noun = f.type ? TYPE_LABEL[f.type].toLowerCase() : "homes and investment property";
  const price = f.maxPrice
    ? ` with an asking price under €${f.maxPrice.toLocaleString("en-GB")}`
    : "";
  return `This page collects ${beds}${noun} currently for sale in ${placeWithCountry(f)}${price}. Listings update as our portfolio changes, so it reflects live availability rather than a static brochure.`;
}

/** True if a property row satisfies all active facets. `cat` and `beds` come from the DB. */
export function matchesFacets(
  f: SearchFacets,
  row: {
    category?: string | null;
    beds?: number | null;
    price_value?: number | null;
    location?: string | null;
    city?: string | null;
    region?: string | null;
    status?: string | null;
  },
): boolean {
  if (/closed|sold/i.test(row.status ?? "")) return false;
  if (f.type && (row.category ?? "").trim().toLowerCase() !== f.type) return false;
  if (f.beds && (row.beds ?? 0) < f.beds) return false;
  if (f.maxPrice && (!row.price_value || row.price_value > f.maxPrice)) return false;
  if (f.location) {
    const loc = getLocation(f.location);
    if (!loc) return false;
    if (!matchesLocation(loc, row.location, row.city, row.region)) return false;
  }
  return true;
}

/**
 * Curated, high-value search combinations for the sitemap and internal linking.
 * Kept deliberately focused (single- and double-facet pages over the most
 * searched locations) to avoid thin/duplicate pages.
 */
const FEATURED_LOCATIONS = [
  "paphos",
  "limassol",
  "kato-paphos",
  "peyia",
  "coral-bay",
  "chloraka",
  "geroskipou",
  "polis-chrysochous",
  "tala",
  "germasogeia",
];

export function curatedSearchFacets(): SearchFacets[] {
  const out: SearchFacets[] = [];
  const seen = new Set<string>();
  const push = (f: SearchFacets) => {
    const slug = buildSearchSlug(f);
    if (seen.has(slug)) return;
    seen.add(slug);
    out.push(f);
  };

  for (const location of FEATURED_LOCATIONS) {
    // Type facets
    push({ location, type: "villa", beds: null, maxPrice: null });
    push({ location, type: "apartment", beds: null, maxPrice: null });
    // Bedroom facets
    push({ location, type: null, beds: 2, maxPrice: null });
    push({ location, type: null, beds: 3, maxPrice: null });
    // Price facets
    push({ location, type: null, beds: null, maxPrice: 500000 });
    push({ location, type: null, beds: null, maxPrice: 1000000 });
    // Popular double facets
    push({ location, type: "apartment", beds: 2, maxPrice: null });
    push({ location, type: "villa", beds: 3, maxPrice: null });
  }

  // Island-wide price entry points
  for (const maxPrice of [500000, 1000000] as const) {
    push({ location: null, type: null, beds: null, maxPrice });
  }

  return out;
}

export function curatedSearchSlugs(): string[] {
  return curatedSearchFacets().map(buildSearchSlug);
}

/** Related searches to surface as internal links from a given facet page. */
export function relatedSearches(f: SearchFacets): { slug: string; label: string }[] {
  const variants: SearchFacets[] = [];
  // Same place, different bedrooms
  for (const beds of [2, 3, 4]) {
    if (beds !== f.beds) variants.push({ ...f, beds, maxPrice: null });
  }
  // Same place, by type
  for (const type of ["villa", "apartment"] as FacetType[]) {
    if (type !== f.type) variants.push({ ...f, type, beds: null, maxPrice: null });
  }
  // Same place, by price
  for (const maxPrice of [500000, 1000000] as const) {
    if (maxPrice !== f.maxPrice) variants.push({ ...f, maxPrice, beds: null });
  }

  const seen = new Set<string>([buildSearchSlug(f)]);
  const out: { slug: string; label: string }[] = [];
  for (const v of variants) {
    const slug = buildSearchSlug(v);
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, label: facetHeading(v).replace(/, Cyprus.*/, "") });
    if (out.length >= 8) break;
  }
  return out;
}

export const ALL_LOCATIONS_FOR_SEARCH = LOCATIONS;
