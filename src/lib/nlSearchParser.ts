// Parses a free-text property search query (e.g. "3 bed villa near the sea in
// Paphos under €1.5M") into the same structured filters the Properties page
// already uses. This is a deterministic, rule-based parser — no external API
// call, no cost, no key to manage — tuned to how people actually phrase
// Cyprus property searches.

import { PROPERTY_FEATURE_GROUPS } from '@/lib/property-features';

// Same district/town list used by the admin bulk-project tool, so location
// matching stays consistent with how the rest of the app understands Cyprus
// geography.
const CY_TOWNS: Record<string, string[]> = {
  Limassol: ['Limassol', 'Germasogeia', 'Agios Tychon', 'Pyrgos', 'Pissouri', 'Parekklisia', 'Mouttagiaka', 'Episkopi'],
  Paphos: [
    'Paphos', 'Mouttalos', 'Agios Pavlos', 'Agios Theodoros', 'Agios Spyridon', 'Agios Kendeas',
    'Kato Paphos', 'Universal', 'Anavargos', 'Mesogi', 'Konia',
    'Geroskipou', 'Koloni', 'Achelia',
    'Peyia', 'Pegeia', 'Coral Bay', 'Sea Caves', 'Agios Georgios',
    'Polis Chrysochous', 'Polis', 'Chrysochous', 'Prodromi', 'Latchi',
    'Chloraka', 'Kissonerga', 'Lemba', 'Tala', 'Tremithousa', 'Emba', 'Kallepia', 'Letymbou', 'Polemi',
    'Stroumpi', 'Kathikas', 'Akourdaleia', 'Theletra', 'Giolou', 'Drouseia',
    'Inia', 'Arodes', 'Kritou Terra', 'Neo Chorio', 'Argaka', 'Pomos',
    'Pachyammos', 'Kato Pyrgos', 'Pano Pyrgos', 'Steni', 'Goudi', 'Skoulli', 'Lysos',
    'Peristerona', 'Nea Dimmata', 'Makounta', 'Karamoullides', 'Agia Marina',
    'Salamiou', 'Statos-Agios Fotios', 'Pano Panagia', 'Kannaviou', 'Asprogia',
    'Kelokedara', 'Choulou', 'Lemona', 'Psathi', 'Pentalia', 'Galataria', 'Koilineia', 'Mesana',
    'Mamonia', 'Nata', 'Axylou', 'Eledio', 'Maronas', 'Trachypedoula', 'Pitargou', 'Amargeti',
    'Agios Nikolaos', 'Kedares', 'Praitori', 'Mousere', 'Vretsia', 'Phasoula',
    'Kissousa', 'Timi', 'Mandria', 'Nikoklia', 'Kouklia', 'Aphrodite Hills', 'Secret Valley',
    'Petra tou Romiou', 'Anarita', 'Foinikas', 'Choletria', 'Kidasi', 'Souskiou',
    'Tsada', 'Koili', 'Marathounta', 'Armou', 'Akoursos',
    'Fyti', 'Milia', 'Simou', 'Lasa', 'Drymou', 'Kourdaka', 'Anadiou',
  ],
};

const ALL_LOCATIONS = Object.entries(CY_TOWNS).flatMap(([district, towns]) => [district, ...towns]);

const CATEGORY_ALIASES: Record<string, string> = {
  apartment: 'Apartment', apartments: 'Apartment', flat: 'Apartment', flats: 'Apartment',
  villa: 'Villa', villas: 'Villa',
  plot: 'Land / Plot', plots: 'Land / Plot', land: 'Land / Plot',
  studio: 'Studio', studios: 'Studio',
  'semi-detached': 'Semi-detached', 'semi detached': 'Semi-detached', semi: 'Semi-detached',
  maisonette: 'Maisonette', maisonettes: 'Maisonette',
  commercial: 'Commercial',
  hotel: 'Hotel', 'boutique hotel': 'Hotel',
};

// A handful of common phrasings mapped to a feature from the existing
// catalogue (src/lib/property-features.ts) — kept intentionally small so it
// only fires on confident, common phrases rather than guessing.
const FEATURE_PHRASE_OVERRIDES: Record<string, string> = {
  'sea view': 'Sea view',
  'near the sea': 'Sea view',
  seafront: 'Beachfront',
  'sea front': 'Beachfront',
  beachfront: 'Beachfront',
  seaview: 'Sea view',
  'swimming pool': 'Private pool',
  pool: 'Private pool',
  garden: 'Garden',
  'landscaped garden': 'Landscaped garden',
  garage: 'Garage',
  'mountain view': 'Mountain view',
  furnished: 'Furnished',
};

const ALL_FEATURES = PROPERTY_FEATURE_GROUPS.flatMap((g) => g.items);

export interface ParsedSearch {
  locations: string[];
  categories: string[];
  tags: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  maxBeds: number | null;
  minBaths: number | null;
  mode: 'Buy' | 'Rent' | null;
  /** Whatever text wasn't consumed by a recognized pattern — shown back to the person so they can see what wasn't understood. */
  leftover: string;
}

// A price token: an optional currency symbol, digits (with optional
// thousands separators/decimals), and an optional magnitude word or letter —
// e.g. "€1.5M", "500k", "1.2 million", "800 thousand".
const MONEY = String.raw`[€$£]?[\d][\d.,]*\s*(?:million|thousand|mil|m|k)?`;

function parseMoneyToken(raw: string): number | null {
  let s = raw.trim().toLowerCase().replace(/[€$£,]/g, '').replace(/\s+/g, ' ').trim();
  let multiplier = 1;
  if (/(million|mil|m)$/.test(s)) { multiplier = 1_000_000; s = s.replace(/\s*(million|mil|m)$/, ''); }
  else if (/(thousand|k)$/.test(s)) { multiplier = 1_000; s = s.replace(/\s*(thousand|k)$/, ''); }
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  return Math.round(n * multiplier);
}

export function parseNaturalLanguageQuery(input: string): ParsedSearch {
  let text = ` ${input.trim()} `;
  const consume = (re: RegExp) => { text = text.replace(re, ' '); };

  const result: ParsedSearch = {
    locations: [], categories: [], tags: [],
    minPrice: null, maxPrice: null, minBeds: null, maxBeds: null, minBaths: null,
    mode: null, leftover: '',
  };

  // Rent vs Buy
  if (/\b(to rent|for rent|rental|rentals|renting)\b/i.test(text)) {
    result.mode = 'Rent';
    consume(/\b(to rent|for rent|rentals?|renting)\b/gi);
  } else if (/\b(for sale|to buy|buying)\b/i.test(text)) {
    result.mode = 'Buy';
    consume(/\b(for sale|to buy|buying)\b/gi);
  }

  // Price range: "between X and Y", "from X to Y", "under X" / "up to X" / "max X", "over X" / "from X" / "min X"
  const between =
    text.match(new RegExp(String.raw`\bbetween\s+(${MONEY})\s+(?:and|-|to)\s+(${MONEY})\b`, 'i')) ??
    text.match(new RegExp(String.raw`\bfrom\s+(${MONEY})\s+to\s+(${MONEY})\b`, 'i'));
  if (between) {
    result.minPrice = parseMoneyToken(between[1]);
    result.maxPrice = parseMoneyToken(between[2]);
    consume(new RegExp(String.raw`\bbetween\s+(${MONEY})\s+(?:and|-|to)\s+(${MONEY})\b`, 'gi'));
    consume(new RegExp(String.raw`\bfrom\s+(${MONEY})\s+to\s+(${MONEY})\b`, 'gi'));
  } else {
    const under = text.match(new RegExp(String.raw`\b(?:under|up to|below|max(?:imum)?|less than)\s+(${MONEY})\b`, 'i'));
    if (under) { result.maxPrice = parseMoneyToken(under[1]); consume(new RegExp(String.raw`\b(?:under|up to|below|max(?:imum)?|less than)\s+(${MONEY})\b`, 'gi')); }
    const over = text.match(new RegExp(String.raw`\b(?:over|from|min(?:imum)?|more than|starting at)\s+(${MONEY})\b`, 'i'));
    if (over) { result.minPrice = parseMoneyToken(over[1]); consume(new RegExp(String.raw`\b(?:over|from|min(?:imum)?|more than|starting at)\s+(${MONEY})\b`, 'gi')); }
  }
  // A bare "€1.5M" / "$500k" with no qualifier — treat as a max price (most common intent).
  if (result.minPrice == null && result.maxPrice == null) {
    const bare = text.match(new RegExp(String.raw`[€$£]\s?${MONEY}`, 'i'));
    if (bare) { result.maxPrice = parseMoneyToken(bare[0]); consume(new RegExp(String.raw`[€$£]\s?${MONEY}`, 'gi')); }
  }

  // Beds: "3 bed", "3-bedroom", "3+ beds", "at least 3 bedrooms"
  const bedsPlus = text.match(/\b(\d+)\s*\+\s*(?:bed|beds|bedroom|bedrooms)\b/i);
  if (bedsPlus) { result.minBeds = Number(bedsPlus[1]); consume(/\b(\d+)\s*\+\s*(?:bed|beds|bedroom|bedrooms)\b/gi); }
  else {
    const bedsRange = text.match(/\b(\d+)\s*-\s*(\d+)\s*(?:bed|beds|bedroom|bedrooms)\b/i);
    if (bedsRange) {
      result.minBeds = Number(bedsRange[1]); result.maxBeds = Number(bedsRange[2]);
      consume(/\b(\d+)\s*-\s*(\d+)\s*(?:bed|beds|bedroom|bedrooms)\b/gi);
    } else {
      const beds = text.match(/\b(\d+)[\s-]*(?:bed|beds|bedroom|bedrooms)\b/i);
      if (beds) { result.minBeds = Number(beds[1]); consume(/\b(\d+)[\s-]*(?:bed|beds|bedroom|bedrooms)\b/gi); }
    }
  }

  // Baths: "2 bath", "2+ bathrooms"
  const bathsPlus = text.match(/\b(\d+)\s*\+\s*(?:bath|baths|bathroom|bathrooms)\b/i);
  if (bathsPlus) { result.minBaths = Number(bathsPlus[1]); consume(/\b(\d+)\s*\+\s*(?:bath|baths|bathroom|bathrooms)\b/gi); }
  else {
    const baths = text.match(/\b(\d+)[\s-]*(?:bath|baths|bathroom|bathrooms)\b/i);
    if (baths) { result.minBaths = Number(baths[1]); consume(/\b(\d+)[\s-]*(?:bath|baths|bathroom|bathrooms)\b/gi); }
  }

  // Category
  for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
    const re = new RegExp(`\\b${alias}\\b`, 'i');
    if (re.test(text) && !result.categories.includes(category)) {
      result.categories.push(category);
      consume(new RegExp(`\\b${alias}\\b`, 'gi'));
    }
  }

  // Feature phrases (longest phrases first, so "sea view" wins over a bare "sea")
  const featurePhrases = Object.keys(FEATURE_PHRASE_OVERRIDES).sort((a, b) => b.length - a.length);
  for (const phrase of featurePhrases) {
    const re = new RegExp(`\\b${phrase}\\b`, 'i');
    if (re.test(text)) {
      const tag = FEATURE_PHRASE_OVERRIDES[phrase];
      if (!result.tags.includes(tag)) result.tags.push(tag);
      consume(new RegExp(`\\b${phrase}\\b`, 'gi'));
    }
  }
  // Also check the full feature catalogue directly for verbatim mentions.
  for (const feature of ALL_FEATURES) {
    const re = new RegExp(`\\b${feature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text) && !result.tags.includes(feature)) {
      result.tags.push(feature);
      consume(new RegExp(`\\b${feature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'));
    }
  }

  // Locations — longest names first so "Kato Paphos" wins over bare "Paphos"
  const sortedLocations = [...ALL_LOCATIONS].sort((a, b) => b.length - a.length);
  for (const loc of sortedLocations) {
    const re = new RegExp(`\\b${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text) && !result.locations.some((l) => l.toLowerCase() === loc.toLowerCase())) {
      result.locations.push(loc);
      consume(new RegExp(`\\b${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'));
    }
  }

  // Strip filler words so "leftover" reflects genuinely unrecognized text
  consume(/\b(in|near|the|with|and|a|an|for|of|to|show me|find me|looking for|i want|i'm after|please)\b/gi);
  result.leftover = text.replace(/\s+/g, ' ').trim();

  return result;
}
