/**
 * Helpers for grouping individual property/unit rows into "developments".
 *
 * A development is identified purely by the project name, which is the part of
 * the listing title BEFORE the first " - " separator. For example:
 *   "Agnades Village - Villa No. 1"  ->  project "Agnades Village"
 *   "AKAKIA RESIDENCES - 101"        ->  project "AKAKIA RESIDENCES"
 *
 * Only available, for-sale units are considered (anything not marked sold).
 */

export type UnitRow = {
  id: string;
  slug: string | null;
  title: string;
  location: string | null;
  category: string | null;
  price: string | null;
  price_value: number | null;
  beds: number | null;
  baths: number | null;
  status: string | null;
  listing_type: string | null;
  cover_image: string | null;
  images: string[] | null;
  internal_area?: string | null;
  size?: string | null;
  covered_verandas?: string | null;
  tags?: string[] | null;
  lot_size?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type Development = {
  name: string;
  slug: string;
  units: UnitRow[];
  unitCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  maxBeds: number | null;
  minBaths: number | null;
  maxBaths: number | null;
  categories: string[];
  location: string | null;
  cover: string | null;
};

/** Extract the project name from a unit title. */
export function projectName(title?: string | null): string {
  if (!title) return '';
  const idx = title.indexOf(' - ');
  return (idx === -1 ? title : title.slice(0, idx)).trim();
}

/** Extract the lot/unit label from a unit title (part after " - "). */
export function unitLabel(title?: string | null): string {
  if (!title) return '';
  const idx = title.indexOf(' - ');
  return (idx === -1 ? title : title.slice(idx + 3)).trim();
}

/** Slugify a project name for use in a URL. */
export function projectSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build a development URL slug from its stats, e.g. "34units-from706000-peyia".
 * Format: {unitCount}units-from{minPrice}-{location}
 */
export function developmentSlug(
  unitCount: number,
  minPrice: number | null,
  location: string | null,
): string {
  const loc = (location ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const pricePart = minPrice != null && minPrice > 0 ? `-from${Math.round(minPrice)}` : '';
  const locPart = loc ? `-${loc}` : '';
  return `${unitCount}units${pricePart}${locPart}`;
}

/** True when a unit is genuinely sold (not merely reserved / under offer). */
export function isSold(u: { status: string | null }): boolean {
  return /\bsold\b/i.test(u.status ?? '');
}

/** True when a unit is reserved / under offer (held, but not yet sold). */
export function isReserved(u: { status: string | null }): boolean {
  return /reserved|under offer/i.test(u.status ?? '');
}

/** True when a unit is an available, for-sale listing (not sold, not reserved). */
export function isAvailableForSale(u: { status: string | null; listing_type: string | null }): boolean {
  return (u.listing_type ?? 'sale') === 'sale' && !isSold(u) && !isReserved(u);
}

/** Format a numeric EUR value, e.g. 215000 -> "€215,000". */
export function formatEur(n: number | null): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return '';
  return `€${Math.round(n).toLocaleString('en-US')}`;
}

/**
 * Group unit rows into developments.
 * - Default: only available, for-sale units.
 * - { sold: true }: only developments where EVERY unit is sold (fully sold-out).
 * - { all: true }: every unit regardless of status (sold ones still grouped).
 */
export function buildDevelopments(rows: UnitRow[], opts?: { sold?: boolean; all?: boolean }): Development[] {
  // For sold mode we need every unit of a project to judge "fully sold", so
  // group all units first and filter afterwards.
  const map = new Map<string, UnitRow[]>();
  for (const row of rows) {
    const keep = opts?.all || opts?.sold
      ? true
      // Active list: keep everything not yet sold (available + reserved) so a
      // project only leaves once every unit is genuinely sold.
      : ((row.listing_type ?? 'sale') === 'sale' && !isSold(row));
    if (!keep) continue;
    const name = projectName(row.title);
    if (!name) continue;
    const list = map.get(name) ?? [];
    list.push(row);
    map.set(name, list);
  }

  const developments: Development[] = [];
  for (const [name, allUnits] of map) {
    // In sold mode, only keep projects where every unit is sold.
    if (opts?.sold && !allUnits.every((u) => isSold(u))) continue;
    const units = allUnits;
    const prices = units.map((u) => u.price_value).filter((v): v is number => v != null && v > 0);
    const beds = units.map((u) => u.beds).filter((v): v is number => v != null && v > 0);
    const baths = units.map((u) => u.baths).filter((v): v is number => v != null && v > 0);
    const categories = Array.from(new Set(units.map((u) => u.category).filter(Boolean) as string[]));
    const cover = units.find((u) => u.cover_image)?.cover_image
      ?? units.find((u) => u.images && u.images.length)?.images?.[0]
      ?? null;
    const unitCount = units.length;
    const minPrice = prices.length ? Math.min(...prices) : null;
    const location = (() => {
      const raw = units.find((u) => u.location)?.location ?? null;
      if (!raw) return null;
      const idx = raw.indexOf(' · ');
      return idx === -1 ? raw : raw.slice(0, idx).trim();
    })();
    developments.push({
      name,
      slug: developmentSlug(unitCount, minPrice, location),
      units,
      unitCount,
      minPrice,
      maxPrice: prices.length ? Math.max(...prices) : null,
      minBeds: beds.length ? Math.min(...beds) : null,
      maxBeds: beds.length ? Math.max(...beds) : null,
      minBaths: baths.length ? Math.min(...baths) : null,
      maxBaths: baths.length ? Math.max(...baths) : null,
      categories,
      location,
      cover,
    });
  }

  // Guarantee unique slugs: if two developments produce the same slug, append a
  // short deterministic suffix derived from the project name so every project
  // has its own reachable URL. Sort by name first so the suffixing is stable.
  developments.sort((a, b) => a.name.localeCompare(b.name));
  const slugCounts = new Map<string, number>();
  for (const d of developments) {
    const base = d.slug;
    const seen = slugCounts.get(base) ?? 0;
    slugCounts.set(base, seen + 1);
    if (seen > 0) {
      const suffix = projectSlug(d.name).slice(0, 12) || `d${seen}`;
      d.slug = `${base}-${suffix}`;
      // In the extremely unlikely case the suffixed slug still collides, add an index.
      if ((slugCounts.get(d.slug) ?? 0) > 0) d.slug = `${d.slug}-${seen}`;
      slugCounts.set(d.slug, (slugCounts.get(d.slug) ?? 0) + 1);
    }
  }

  // Largest developments first, then alphabetical.
  developments.sort((a, b) => b.unitCount - a.unitCount || a.name.localeCompare(b.name));
  return developments;
}

export type SoldStats = {
  total: number;
  sold: number;
  available: number;
  pct: number;
  soldValue: number;
};

/**
 * Compute sold progress per project from ALL unit rows.
 * Returns a map keyed by project name.
 */
export function soldStatsByProject(rows: UnitRow[]): Map<string, SoldStats> {
  const map = new Map<string, UnitRow[]>();
  for (const row of rows) {
    const name = projectName(row.title);
    if (!name) continue;
    const list = map.get(name) ?? [];
    list.push(row);
    map.set(name, list);
  }
  const out = new Map<string, SoldStats>();
  for (const [name, units] of map) {
    const total = units.length;
    const soldUnits = units.filter((u) => isSold(u));
    const sold = soldUnits.length;
    const soldValue = soldUnits.reduce((sum, u) => sum + (u.price_value ?? 0), 0);
    out.set(name, {
      total,
      sold,
      available: total - sold,
      pct: total ? Math.round((sold / total) * 100) : 0,
      soldValue,
    });
  }
  return out;
}

/** Render a bed range, e.g. "1–3 bedrooms" or "3 bedrooms". */
export function bedRange(d: Development): string {
  if (d.minBeds == null) return '';
  if (d.minBeds === d.maxBeds) return `${d.minBeds} bedroom${d.minBeds === 1 ? '' : 's'}`;
  return `${d.minBeds}–${d.maxBeds} bedrooms`;
}

/** Render a bath range, e.g. "1–3 bathrooms" or "3 bathrooms". */
export function bathRange(d: Development): string {
  if (d.minBaths == null) return '';
  if (d.minBaths === d.maxBaths) return `${d.minBaths} bathroom${d.minBaths === 1 ? '' : 's'}`;
  return `${d.minBaths}–${d.maxBaths} bathrooms`;
}

const parseAreaNum = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const n = parseFloat(s.replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
};

/** Compute a total covered area range for a development's units. */
export function totalCoveredAreaRange(units: UnitRow[]): string | null {
  const areas: number[] = [];
  for (const u of units) {
    const internal = parseAreaNum(u.internal_area);
    const covered = parseAreaNum(u.covered_verandas);
    const total = internal != null && covered != null ? internal + covered : parseAreaNum(u.size);
    if (total != null) areas.push(total);
  }
  if (!areas.length) return null;
  const min = Math.min(...areas);
  const max = Math.max(...areas);
  if (min === max) return `${min.toFixed(2).replace(/\.00$/, '')} m²`;
  return `${min.toFixed(2).replace(/\.00$/, '')}–${max.toFixed(2).replace(/\.00$/, '')} m²`;
}

/** Render a price range, e.g. "€215,000 – €1.3M". */
export function priceRange(d: Development): string {
  if (d.minPrice == null) return '';
  if (d.minPrice === d.maxPrice) return formatEur(d.minPrice);
  return `${formatEur(d.minPrice)} – ${formatEur(d.maxPrice)}`;
}
