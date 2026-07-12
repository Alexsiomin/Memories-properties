/**
 * Public display helpers for property listings.
 *
 * Project/developer titles are stored in the database with the project name
 * prefixed, e.g. "Pearl Park Residences - Apartment No. 104 / Block 2".
 * On public-facing pages we hide the project name and show only the unit
 * reference, e.g. "Apartment No. 104 / Block 2".
 *
 * The full title (with project name) is kept in the database and used in
 * admin/internal views.
 */
export function publicTitle(title?: string | null): string {
  if (!title) return '';
  const idx = title.indexOf(' - ');
  if (idx === -1) return title;
  return title.slice(idx + 3).trim() || title;
}

type LocationInput = {
  location?: string | null;
  city?: string | null;
  region?: string | null;
  district?: string | null;
};

/**
 * Hide project/development names that are stored after the location separator.
 * Public pages should show only the real place/district, never the project name.
 */
export function publicLocation(input: LocationInput): string {
  const rawParts = (input.location ?? '').split('·').map((part) => part.trim()).filter(Boolean);
  const baseLocation = (input.city || rawParts[0] || '').split(',')[0].trim();
  if (!baseLocation) return '';

  const region = input.region?.trim();
  const district = input.district?.trim();
  const secondPart = rawParts[1];
  const hiddenProjectPart = secondPart && region && district &&
    region.toLowerCase() === district.toLowerCase() &&
    secondPart.toLowerCase() !== region.toLowerCase()
    ? secondPart.toLowerCase()
    : undefined;
  const secondary = [district, region].find((part) => {
    if (!part) return false;
    const normalized = part.toLowerCase();
    return normalized !== baseLocation.toLowerCase() && normalized !== hiddenProjectPart;
  });

  return [baseLocation, secondary].filter(Boolean).join(' · ');
}

/**
 * Return a clean, human-friendly reference code for a property.
 * Valid stored codes (3 letters + 5 digits) are kept; anything else
 * (including legacy/garbage values) is normalised to a stable MEM##### code
 * derived from the property id.
 */
export function displayReference(referenceCode?: string | null, id?: string | null): string {
  const raw = (referenceCode || '').trim();
  if (/^[A-Za-z]{3}\d{5}$/.test(raw)) return raw.toUpperCase();

  const hex = (id || '').replace(/-/g, '').slice(0, 12) || '0';
  const number = (parseInt(hex, 16) % 100000).toString().padStart(5, '0');
  return `MEM${number}`;
}

export function publicPrice(
  price?: string | null,
  priceValue?: number | null,
  status?: string | null,
): string {
  if (/reserved/i.test(status ?? '')) return 'Reserved';
  if (/sold|under offer|closed/i.test(status ?? '')) return 'Sold';

  const raw = (price ?? '').trim();
  const abbreviated = raw.match(/^€?\s*([\d,.]+)\s*k$/i);
  if (abbreviated) {
    const value = Number(abbreviated[1].replace(/,/g, '')) * 1000;
    if (Number.isFinite(value) && value > 0) {
      return `€${Math.round(value).toLocaleString('en-US')}`;
    }
  }

  if (raw) return raw;

  if (priceValue != null && Number.isFinite(priceValue) && priceValue > 0) {
    return `€${Math.round(priceValue).toLocaleString('en-US')}`;
  }

  return 'Price on request';
}
