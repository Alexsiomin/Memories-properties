// Pluggable XML feed adapters.
// Every adapter normalizes a developer's XML into the SAME ParsedProperty shape
// so the rest of the site can render results consistently.

import { supabase } from '@/integrations/supabase/client';

export interface ParsedProperty {
  title: string;
  location: string;
  category: string;
  status: string;
  price: string;
  price_value: number;
  yield: string | null;
  size: string | null;
  beds: number | null;
  baths: number | null;
  tags: string[];
  sort_order: number;
  image_key: string;
  description: string | null;
  images: string[];
  cover_image: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  reference_code?: string | null;
  external_ref?: string | null;
  internal_area?: string | null;
  covered_verandas?: string | null;
  vat_included?: boolean;
}

export type FeedFormat = 'auto' | 'flat' | 'xml2u' | 'aristo' | 'islandblue';

export const FEED_FORMAT_OPTIONS: { value: FeedFormat; label: string; desc: string }[] = [
  { value: 'auto', label: 'Auto-detect', desc: 'Try every known adapter and use the first match.' },
  { value: 'flat', label: 'Flat (sample)', desc: '<property><title/><location/><price/>… simple flat tags.' },
  { value: 'xml2u', label: 'XML2U / nested', desc: 'XML2U-style with <Address>, <Price>, <Description>, <images>.' },
  { value: 'aristo', label: 'Aristo Developers', desc: 'Aristo feed: <Title>, <Type>, <Area>, <Price> string, <gallery><image>.' },
  { value: 'islandblue', label: 'Island Blue (units)', desc: 'Island Blue units feed: <Property> with <Price><Value>, <Features>, <Attributes>. Use the /units link.' },
];

// ---------- helpers ----------

const parseDoc = (xmlText: string): Document => {
  const cleaned = xmlText.trim().replace(/^\uFEFF/, '');
  const doc = new DOMParser().parseFromString(cleaned, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
  return doc;
};

const propertyNodes = (doc: Document): Element[] =>
  Array.from(doc.getElementsByTagName('*')).filter(
    (n) => n.tagName.toLowerCase() === 'property',
  );

const txt = (el: Element | null | undefined, tag: string) => {
  if (!el) return '';
  const found = Array.from(el.getElementsByTagName('*')).find(
    (n) => n.tagName.toLowerCase() === tag.toLowerCase() && n.parentElement === el,
  );
  return found?.textContent?.trim() ?? '';
};

const deepTxt = (el: Element | null | undefined, tag: string) => {
  if (!el) return '';
  const found = Array.from(el.getElementsByTagName('*')).find(
    (n) => n.tagName.toLowerCase() === tag.toLowerCase(),
  );
  return found?.textContent?.trim() ?? '';
};

const findChild = (el: Element | null | undefined, tag: string): Element | null => {
  if (!el) return null;
  return Array.from(el.children).find((n) => n.tagName.toLowerCase() === tag.toLowerCase()) ?? null;
};

const cleanTitle = (type: string, location: string) => {
  const t = type?.trim();
  const loc = location?.trim();
  if (t && loc) return `${t} in ${loc}`;
  if (t) return t;
  if (loc) return `Property in ${loc}`;
  return 'Property';
};

// ---------- adapters ----------

interface Adapter {
  format: FeedFormat;
  /** Quickly check whether this adapter can handle the document. */
  detect: (doc: Document) => boolean;
  /** Convert the document into normalized rows. */
  parse: (doc: Document) => ParsedProperty[];
}

const flatAdapter: Adapter = {
  format: 'flat',
  detect: (doc) => {
    const nodes = propertyNodes(doc);
    if (!nodes.length) return false;
    const el = nodes[0];
    return !!txt(el, 'title') && !!txt(el, 'location');
  },
  parse: (doc) => {
    const nodes = propertyNodes(doc);
    return nodes.map((el) => {
      const tagsRaw = txt(el, 'tags');
      return {
        title: txt(el, 'title'),
        location: txt(el, 'location'),
        category: txt(el, 'category'),
        status: txt(el, 'status'),
        price: txt(el, 'price'),
        price_value: Number(txt(el, 'price_value') || 0),
        yield: txt(el, 'yield') || null,
        size: txt(el, 'size') || null,
        beds: txt(el, 'beds') ? Number(txt(el, 'beds')) : null,
        baths: txt(el, 'baths') ? Number(txt(el, 'baths')) : null,
        tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [],
        sort_order: Number(txt(el, 'sort_order') || 0),
        image_key: txt(el, 'image_key'),
        description: txt(el, 'description') || null,
        images: [],
        cover_image: '',
        reference_code: txt(el, 'reference_code') || txt(el, 'reference') || null,
      };
    });
  },
};

const xml2uAdapter: Adapter = {
  format: 'xml2u',
  detect: (doc) => {
    const nodes = propertyNodes(doc);
    if (!nodes.length) return false;
    const el = nodes[0];
    return !!findChild(el, 'Address') || !!findChild(el, 'Price') || !!findChild(el, 'Description');
  },
  parse: (doc) => {
    const nodes = propertyNodes(doc);
    return nodes.map((el): ParsedProperty => {
      const addr = findChild(el, 'Address');
      const priceEl = findChild(el, 'Price');
      const desc = findChild(el, 'Description');
      const imagesEl = findChild(el, 'images');

      const locParts = [txt(addr, 'location'), txt(addr, 'region'), txt(addr, 'country')].filter(Boolean);
      const location = locParts.join(' · ');

      const priceNum = Number(txt(priceEl, 'price') || 0);
      const currency = txt(priceEl, 'currency') || 'EUR';
      const priceDisplay = priceNum
        ? `${currency === 'EUR' ? '€' : currency + ' '}${priceNum.toLocaleString()}`
        : 'Price on request';

      const beds = txt(desc, 'bedrooms');
      const baths = txt(desc, 'fullBathrooms');
      const floorSize = deepTxt(findChild(desc, 'FloorSize'), 'floorSize');
      const sizeUnit = deepTxt(findChild(desc, 'FloorSize'), 'floorSizeUnits') || 'm²';
      const propertyType = txt(desc, 'propertyType');
      const status = txt(priceEl, 'status') || txt(el, 'category');
      const ref = txt(priceEl, 'reference') || txt(el, 'propertyid');

      let descText = '';
      const descNode = findChild(desc, 'description');
      if (descNode) {
        const en = findChild(descNode, 'en');
        descText = (en?.textContent || descNode.textContent || '').trim();
      }
      if (!descText) descText = txt(desc, 'shortDescription');

      const imageUrls: string[] = [];
      if (imagesEl) {
        Array.from(imagesEl.children).forEach((imgWrap) => {
          const innerImg = findChild(imgWrap, 'image');
          let url = innerImg?.textContent?.trim() || '';
          if (url && url.startsWith('//')) url = 'https:' + url;
          if (url) imageUrls.push(url);
        });
      }

      return {
        title: cleanTitle(propertyType, txt(addr, 'location')),
        location,
        category: propertyType || txt(el, 'category'),
        status: status || 'For sale',
        price: priceDisplay,
        price_value: priceNum,
        yield: null,
        size: floorSize ? `${floorSize} ${sizeUnit}` : null,
        beds: beds ? Number(beds) : null,
        baths: baths ? Number(baths) : null,
        tags: [],
        sort_order: 0,
        image_key: ref || '',
        description: descText || null,
        images: imageUrls,
        cover_image: imageUrls[0] || '',
        latitude: txt(addr, 'latitude') ? Number(txt(addr, 'latitude')) : null,
        longitude: txt(addr, 'longitude') ? Number(txt(addr, 'longitude')) : null,
        city: txt(addr, 'location') || null,
        region: txt(addr, 'region') || null,
        country: txt(addr, 'country') || null,
        reference_code: ref || null,
      };
    });
  },
};

const aristoAdapter: Adapter = {
  format: 'aristo',
  detect: (doc) => {
    const nodes = propertyNodes(doc);
    if (!nodes.length) return false;
    const el = nodes[0];
    // Aristo uses capitalized flat tags incl. Property_Reference / Type / Area / gallery
    return !!(
      txt(el, 'Property_Reference') ||
      (txt(el, 'Type') && txt(el, 'Area') && findChild(el, 'gallery'))
    );
  },
  parse: (doc) => {
    const nodes = propertyNodes(doc);
    return nodes.map((el): ParsedProperty => {
      const title = txt(el, 'Title');
      const type = txt(el, 'Type');
      const area = txt(el, 'Area');
      const project = txt(el, 'Project');
      const ref = txt(el, 'Property_Reference') || txt(el, 'Unit_Number');
      const status = txt(el, 'Status') || 'For sale';

      const priceRaw = txt(el, 'Price'); // e.g. "€494,000" — net of VAT
      const priceNetNum = Number(priceRaw.replace(/[^0-9.]/g, '')) || 0;

      // VAT — read from feed (e.g. <VAT>19</VAT>, <Vat>5%</Vat>, <VAT_Rate>0.19</VAT_Rate>)
      const vatRaw =
        txt(el, 'VAT') ||
        txt(el, 'Vat') ||
        txt(el, 'VAT_Rate') ||
        txt(el, 'Vat_Rate') ||
        txt(el, 'VATRate') ||
        '';
      let vatRate = 0;
      if (vatRaw) {
        const n = Number(vatRaw.replace(/[^0-9.]/g, ''));
        if (!isNaN(n) && n > 0) vatRate = n > 1 ? n / 100 : n; // accept "19", "19%", "0.19"
      }
      const priceNum = vatRate > 0 ? Math.round(priceNetNum * (1 + vatRate)) : priceNetNum;
      const priceDisplay = priceNum
        ? `€${priceNum.toLocaleString()}`
        : (priceRaw || 'Price on request');

      const beds = txt(el, 'Bedrooms');
      const bedsNum = beds && /^\d+$/.test(beds) ? Number(beds) : null;
      const baths = txt(el, 'Bathrooms');
      const bathsNum = baths && /^\d+$/.test(baths) ? Number(baths) : bedsNum;

      const totalCovered = txt(el, 'Total_Covered_Areas') || txt(el, 'Internal_Covered_Areas');
      const size = totalCovered ? `${totalCovered} m²` : null;
      const internalAreaRaw = txt(el, 'Internal_Covered_Areas') || txt(el, 'Internal_Area');
      const internal_area = internalAreaRaw ? `${internalAreaRaw} m²` : null;
      const verandasRaw = txt(el, 'Covered_Verandas') || txt(el, 'Covered_Veranda') || txt(el, 'Verandas');
      const covered_verandas = verandasRaw ? `${verandasRaw} m²` : null;
      const uncoveredVerandasRaw =
        txt(el, 'Uncovered_Verandas') ||
        txt(el, 'Uncovered_Veranda') ||
        txt(el, 'Open_Verandas');
      const plotAreaRaw =
        txt(el, 'Plot_Area') ||
        txt(el, 'Plot_Size') ||
        txt(el, 'Land_Area') ||
        txt(el, 'Plot');

      const lat = txt(el, 'Latitude');
      const lng = txt(el, 'Longitude');

      const locParts = [area, project].filter(Boolean);
      const location = locParts.join(' · ') || area || 'Cyprus';

      const descRaw = txt(el, 'Description');
      // Strip HTML tags for plain description
      const description = descRaw ? descRaw.replace(/<[^>]+>/g, '').trim() : null;

      const galleryEl = findChild(el, 'gallery');
      const imageUrls: string[] = [];
      if (galleryEl) {
        Array.from(galleryEl.children).forEach((node) => {
          let url = node.textContent?.trim() || '';
          if (url && url.startsWith('//')) url = 'https:' + url;
          if (url) imageUrls.push(url);
        });
      }

      const tags: string[] = [];
      const yes = (v: string) => v?.toLowerCase() === 'yes' || v?.toLowerCase() === 'true' || v === '1';
      const flagMap: Array<[string, string]> = [
        ['Swimming_Pool', 'pool'],
        ['Private_Pool', 'private pool'],
        ['Communal_Pool', 'communal pool'],
        ['Sea_View', 'sea view'],
        ['Mountain_View', 'mountain view'],
        ['Garden', 'garden'],
        ['Private_Garden', 'private garden'],
        ['Air_Conditioning', 'a/c'],
        ['AC', 'a/c'],
        ['Central_Heating', 'central heating'],
        ['Underfloor_Heating', 'underfloor heating'],
        ['Solar_Water_Heating', 'solar'],
        ['Solar_Panels', 'solar panels'],
        ['Photovoltaic', 'photovoltaic'],
        ['Alarm', 'alarm'],
        ['Alarm_System', 'alarm'],
        ['CCTV', 'cctv'],
        ['Storage', 'storage'],
        ['Storage_Room', 'storage'],
        ['Pressure_System', 'pressure system'],
        ['Double_Glazing', 'double glazing'],
        ['Fireplace', 'fireplace'],
        ['BBQ', 'bbq'],
        ['Smart_Home', 'smart home'],
        ['Furnished', 'furnished'],
        ['Lift', 'lift'],
        ['Elevator', 'lift'],
        ['Parking', 'parking'],
        ['Covered_Parking', 'covered parking'],
        ['En_Suite', 'en-suite'],
        ['Walk_In_Wardrobe', 'walk-in wardrobe'],
        ['Beachfront', 'beachfront'],
        ['Gated_Community', 'gated community'],
      ];
      for (const [tag, label] of flagMap) {
        if (yes(txt(el, tag)) && !tags.includes(label)) tags.push(label);
      }
      const stage = txt(el, 'Construction_Stage');
      if (stage) tags.push(stage.toLowerCase());
      const energy = txt(el, 'Energy_Class') || txt(el, 'Energy_Efficiency');
      if (energy) tags.push(`energy ${energy.toUpperCase()}`);
      if (verandasRaw) tags.push(`covered verandas ${verandasRaw} m²`);
      if (uncoveredVerandasRaw) tags.push(`uncovered verandas ${uncoveredVerandasRaw} m²`);
      if (plotAreaRaw) tags.push(`plot ${plotAreaRaw} m²`);
      if (vatRate > 0) {
        const pct = Math.round(vatRate * 100);
        tags.push(`VAT ${pct}%`);
      }

      return {
        title: title || `${type || 'Property'} ${ref}`.trim(),
        location,
        category: type || 'Property',
        status,
        price: priceDisplay,
        price_value: priceNum,
        yield: null,
        size,
        beds: bedsNum,
        baths: bathsNum,
        tags,
        sort_order: 0,
        image_key: ref || '',
        description,
        images: imageUrls,
        cover_image: imageUrls[0] || '',
        latitude: lat ? Number(lat) : null,
        longitude: lng ? Number(lng) : null,
        city: area || null,
        region: area || null,
        country: 'Cyprus',
        reference_code: ref || null,
        internal_area,
        covered_verandas,
        vat_included: vatRate > 0,
      };
    });
  },
};

// Island Blue units feed: <Properties><Property>… with nested <Price><Value>,
// <Features><Feature><Name/><Value/>>, <Attributes><Attribute><Name/><Value/>>.
const islandBlueAdapter: Adapter = {
  format: 'islandblue',
  detect: (doc) => {
    const nodes = propertyNodes(doc);
    if (!nodes.length) return false;
    const el = nodes[0];
    const priceEl = findChild(el, 'Price');
    return (
      !!findChild(el, 'PropertyType') &&
      (!!findChild(el, 'Attributes') || !!findChild(el, 'ReferenceNo')) &&
      !!priceEl && !!findChild(priceEl, 'Value')
    );
  },
  parse: (doc) => {
    const nodes = propertyNodes(doc);

    // Build a lookup of name/value pairs from <Features> or <Attributes>.
    const pairs = (container: Element | null): Map<string, string> => {
      const map = new Map<string, string>();
      if (!container) return map;
      Array.from(container.children).forEach((node) => {
        const name = txt(node, 'Name').toLowerCase();
        const value = txt(node, 'Value');
        if (name) map.set(name, value);
      });
      return map;
    };

    return nodes.map((el): ParsedProperty => {
      const name = txt(el, 'Name');
      const projectName = txt(el, 'ProjectName');
      const propertyType = txt(el, 'PropertyType');
      const ref = txt(el, 'ReferenceNo');
      const status = txt(el, 'Status') || 'For sale';
      const locationRaw = txt(el, 'Location');

      const priceEl = findChild(el, 'Price');
      const priceNum = Number(txt(priceEl, 'Value').replace(/[^0-9.]/g, '')) || 0;
      const currency = txt(priceEl, 'Currency') || 'EUR';
      const priceDisplay = priceNum
        ? `${currency === 'EUR' ? '€' : currency + ' '}${priceNum.toLocaleString()}`
        : 'Price on request';

      const attrs = pairs(findChild(el, 'Attributes'));
      const feats = findChild(el, 'Features');

      const beds = attrs.get('bedroom(s)') || attrs.get('bedrooms');
      const bedsNum = beds && /^\d+$/.test(beds.trim()) ? Number(beds.trim()) : null;
      const baths = attrs.get('bathroom(s)') || attrs.get('bathrooms');
      const bathsNum = baths && /^\d+$/.test(baths.trim()) ? Number(baths.trim()) : null;

      const internalRaw = attrs.get('covered internal area') || attrs.get('total built area') || '';
      const size = internalRaw ? internalRaw.trim() : null;
      const internal_area = attrs.get('covered internal area')?.trim() || null;
      const covered_verandas = attrs.get('covered veranda')?.trim() || null;

      // Coordinates: "34.803027, 32.420470"
      const coords = txt(el, 'Coordinates');
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (coords.includes(',')) {
        const [la, lo] = coords.split(',').map((s) => Number(s.trim()));
        if (!isNaN(la)) latitude = la;
        if (!isNaN(lo)) longitude = lo;
      }

      const descRaw = txt(el, 'DescriptionEnglish');
      const description = descRaw ? descRaw.replace(/<[^>]+>/g, '').trim() : null;

      const photosEl = findChild(el, 'Photos');
      const imageUrls: string[] = [];
      if (photosEl) {
        Array.from(photosEl.children).forEach((node) => {
          let url = node.textContent?.trim() || '';
          if (url && url.startsWith('//')) url = 'https:' + url;
          if (url && url.startsWith('http://')) url = url.replace(/^http:\/\//, 'https://');
          if (url) imageUrls.push(url);
        });
      }

      // Features with Value "Yes" become tags.
      const tags: string[] = [];
      if (feats) {
        Array.from(feats.children).forEach((node) => {
          const fName = txt(node, 'Name');
          const fVal = txt(node, 'Value').toLowerCase();
          if (fName && (fVal === 'yes' || fVal === 'true' || fVal === '1')) {
            tags.push(fName.toLowerCase());
          }
        });
      }
      if (covered_verandas) tags.push(`covered veranda ${covered_verandas}`);
      const uncovered = attrs.get('uncovered veranda')?.trim();
      if (uncovered) tags.push(`uncovered veranda ${uncovered}`);

      const locParts = [locationRaw, projectName].filter(Boolean);
      const location = locParts.join(' · ') || locationRaw || 'Cyprus';
      const title = name || cleanTitle(propertyType, locationRaw);

      return {
        title,
        location,
        category: propertyType || 'Property',
        status,
        price: priceDisplay,
        price_value: priceNum,
        yield: null,
        size,
        beds: bedsNum,
        baths: bathsNum,
        tags,
        sort_order: 0,
        image_key: ref || '',
        description,
        images: imageUrls,
        cover_image: imageUrls[0] || '',
        latitude,
        longitude,
        city: locationRaw || null,
        region: locationRaw || null,
        country: 'Cyprus',
        reference_code: ref || null,
        internal_area,
        covered_verandas,
      };
    });
  },
};

// Order matters for auto-detect: most specific first.
const ADAPTERS: Adapter[] = [islandBlueAdapter, aristoAdapter, xml2uAdapter, flatAdapter];

// ---------- public API ----------

export function parsePropertiesXml(xmlText: string, format: FeedFormat = 'auto'): ParsedProperty[] {
  const doc = parseDoc(xmlText);
  if (!propertyNodes(doc).length) throw new Error('No <Property> entries found in XML');

  if (format !== 'auto') {
    const adapter = ADAPTERS.find((a) => a.format === format);
    if (!adapter) throw new Error(`Unknown feed format: ${format}`);
    return adapter.parse(doc);
  }

  for (const a of ADAPTERS) {
    if (a.detect(doc)) return a.parse(doc);
  }
  throw new Error('Could not auto-detect XML format. Set the developer feed format manually.');
}

export async function fetchFeedXml(url: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('fetch-xml', { body: { url } });
  if (error) throw new Error(error.message || 'Failed to load XML URL');
  if (!data?.xml) throw new Error(data?.error || 'Failed to load XML URL');
  return data.xml as string;
}

/**
 * Sync a developer's XML feed: fetch, parse with the developer's chosen format,
 * then upsert by (developer_id, reference_code).
 */
export async function syncDeveloperFeed(
  developerId: string,
  xmlUrl: string,
  format: FeedFormat = 'auto',
) {
  const xml = await fetchFeedXml(xmlUrl);
  const parsed = parsePropertiesXml(xml, format);

  // The feed's <reference> belongs to the developer, not us.
  // Move it into external_ref and let our DB generate our own reference_code.
  const remapped: ParsedProperty[] = parsed.map((p) => ({
    ...p,
    external_ref: p.reference_code || null,
    reference_code: null,
  }));

  // Dedupe within the feed itself by external_ref (last one wins)
  const seen = new Map<string, ParsedProperty>();
  const noRef: ParsedProperty[] = [];
  for (const p of remapped) {
    if (p.external_ref) seen.set(p.external_ref, p);
    else noRef.push(p);
  }
  const stamped = [...Array.from(seen.values()), ...noRef].map((p) => ({
    ...p,
    developer_id: developerId,
  }));

  const withRef = stamped.filter((p) => p.external_ref);
  const withoutRef = stamped.filter((p) => !p.external_ref);

  let inserted = 0;
  let updated = 0;

  // For rows that have an external_ref, look up existing matches for THIS developer
  // and update by id; insert the rest. This avoids touching reference_code at all.
  if (withRef.length) {
    const refs = withRef.map((p) => p.external_ref) as string[];
    const { data: existing, error: exErr } = await supabase
      .from('properties')
      .select('id, external_ref')
      .eq('developer_id', developerId)
      .in('external_ref', refs);
    if (exErr) throw new Error(exErr.message);

    const byRef = new Map<string, string>();
    (existing || []).forEach((r: any) => { if (r.external_ref) byRef.set(r.external_ref, r.id); });

    const toInsert: any[] = [];
    for (const row of withRef) {
      const id = byRef.get(row.external_ref!);
      if (id) {
        // update existing — strip reference_code so we don't overwrite our own ID
        const { reference_code: _omit, ...rest } = row;
        const { error } = await supabase.from('properties').update(rest).eq('id', id);
        if (!error) updated++;
      } else {
        toInsert.push(row);
      }
    }

    if (toInsert.length) {
      const { error, count } = await supabase
        .from('properties')
        .insert(toInsert, { count: 'exact' });
      if (error) throw new Error(error.message);
      inserted += count ?? toInsert.length;
    }
  }

  if (withoutRef.length) {
    const { error, count } = await supabase
      .from('properties')
      .insert(withoutRef, { count: 'exact' });
    if (error) throw new Error(error.message);
    inserted += count ?? withoutRef.length;
  }

  return { total: parsed.length, inserted, updated };
}
