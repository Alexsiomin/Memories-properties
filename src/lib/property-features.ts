// Shared catalogue of property features, grouped by category. Used by:
// - Admin listing form (selectable chips)
// - Property detail page (full grid grouped by category)

export interface FeatureGroup {
  title: string;
  items: string[];
}

export const PROPERTY_FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: 'Views',
    items: [
      'City view',
      'Countryside view',
      'Forest view',
      'Garden view',
      'Golf course view',
      'Harbour view',
      'Lake view',
      'Marina view',
      'Mountain view',
      'Panoramic sea view',
      'Partial sea view',
      'Pool view',
      'Sea view',
      'Sunrise view',
      'Sunset view',
      'Unobstructed sea view',
      'Vineyard view',
    ],
  },
  {
    title: 'Location',
    items: [
      'Beachfront',
      'Close to airport',
      'Close to marina',
      'Close to motorway',
      'Cul-de-sac',
      'Near hospital',
      'Near international school',
      'Near university',
      'Quiet area',
      'Residential area',
      'Seafront promenade',
      'Tourist area',
      'Town centre',
      'Village setting',
      'Walking distance to amenities',
      'Walking distance to beach',
      'Walking distance to restaurants',
      'Walking distance to schools',
      'Walking distance to shops',
    ],
  },
  {
    title: 'Pool & Outdoor',
    items: [
      'Automatic irrigation',
      'Balcony',
      'BBQ area',
      'Children\u2019s pool',
      'Communal pool',
      'Courtyard',
      'Covered veranda',
      'Fire pit',
      'Garden',
      'Heated pool',
      'Hot tub',
      'Infinity pool',
      'Irrigation system',
      'Jacuzzi',
      'Landscaped garden',
      'Lawn',
      'Mature garden',
      'Multiple balconies',
      'Outdoor dining',
      'Outdoor jacuzzi',
      'Outdoor kitchen',
      'Outdoor shower',
      'Patio',
      'Pergola',
      'Pool bar',
      'Private pool',
      'Roof terrace',
      'Saltwater pool',
      'Sauna',
      'Steam room',
      'Veranda',
    ],
  },
  {
    title: 'Interior',
    items: [
      'Attic',
      'Basement',
      'Cinema room',
      'Double-height ceilings',
      'En-suite',
      'Floor-to-ceiling windows',
      'Guest WC',
      'Gym room',
      'High ceilings',
      'Laundry room',
      'Library',
      'Loft conversion',
      'Maid\u2019s room',
      'Master en-suite',
      'Mezzanine',
      'Office / study',
      'Open-plan living',
      'Pantry',
      'Playroom',
      'Staff quarters',
      'Utility room',
      'Walk-in wardrobe',
      'Wine cellar',
    ],
  },
  {
    title: 'Kitchen',
    items: [
      'American fridge',
      'Breakfast bar',
      'Coffee machine',
      'Designer kitchen',
      'Double oven',
      'Gas hob',
      'Granite worktops',
      'Induction hob',
      'Integrated appliances',
      'Italian kitchen',
      'Kitchen island',
      'Modern kitchen',
      'Quartz worktops',
      'Wine fridge',
    ],
  },
  {
    title: 'Finishes & Materials',
    items: [
      'Double glazing',
      'Engineered wood floors',
      'Marble floors',
      'Porcelain tiles',
      'Smart lighting',
      'Soundproofing',
      'Thermal insulation',
      'Travertine',
      'Triple glazing',
      'Underfloor heating',
      'Wooden floors',
    ],
  },
  {
    title: 'Tech & Smart Home',
    items: [
      'Alarm system',
      'Battery storage',
      'CCTV',
      'EV charging point',
      'Fibre internet',
      'Greywater system',
      'Home automation',
      'Intercom',
      'Photovoltaics',
      'Pre-wired for internet',
      'Rainwater harvesting',
      'Satellite TV',
      'Smart home system',
      'Smart locks',
      'Smart thermostat',
      'Solar water heater',
      'Video intercom',
    ],
  },
  {
    title: 'Climate',
    items: [
      'A/C in bedrooms',
      'A/C throughout',
      'Ceiling fans',
      'Central heating',
      'Diesel heating',
      'Fireplace',
      'Gas heating',
      'Heat pump',
      'Mosquito nets',
      'Provision for A/C',
      'Underfloor heating throughout',
      'Wood-burning stove',
    ],
  },
  {
    title: 'Parking & Storage',
    items: [
      'Bike storage',
      'Carport',
      'Covered parking',
      'Double garage',
      'External storeroom',
      'Garage',
      'Storage room',
      'Underground parking',
      'Visitor parking',
    ],
  },
  {
    title: 'Security & Access',
    items: [
      '24/7 security',
      'Concierge',
      'Electric gates',
      'Fenced plot',
      'Gated community',
      'Reception',
      'Roller shutters',
      'Safe',
    ],
  },
  {
    title: 'Building Amenities',
    items: [
      'Basketball court',
      'Children\u2019s playground',
      'Clubhouse',
      'Communal BBQ',
      'Communal gardens',
      'Lift',
      'Mini-football pitch',
      'On-site management',
      'Padel court',
      'Pet area',
      'Tennis court',
    ],
  },
  {
    title: 'Furnishing',
    items: [
      'Designer furniture',
      'Furnished',
      'Luxury finishes',
      'Partly furnished',
      'Unfurnished',
      'White goods included',
    ],
  },
  {
    title: 'Energy & Certification',
    items: [
      'Eco-friendly',
      'Energy class A',
      'Energy class A+',
      'Energy class B',
      'EPC certified',
      'Net-zero ready',
      'Passive house design',
    ],
  },
  {
    title: 'Legal & Status',
    items: [
      'Building permit issued',
      'Citizenship-eligible',
      'Key ready',
      'Move-in ready',
      'New build',
      'No VAT',
      'Off-plan',
      'Permanent residency eligible',
      'Permit to Reside (PR) eligible',
      'Planning permission approved',
      'Recently refurbished',
      'Renovated',
      'Resale',
      'Separate title deeds',
      'Title deeds',
      'Title deeds pending',
      'Under construction',
      'VAT 19%',
      'VAT 5% eligible',
    ],
  },
  {
    title: 'Investment',
    items: [
      'Airbnb friendly',
      'Buy-to-let',
      'High rental yield',
      'Investment opportunity',
      'Long-term tenant in place',
      'Short-term rental licence',
      'Tenanted',
      'Vacant possession',
    ],
  },
  {
    title: 'Accessibility & Lifestyle',
    items: [
      'Family friendly',
      'Pet friendly',
      'Senior friendly',
      'Step-free access',
      'Wheelchair accessible',
    ],
  },
  {
    title: 'Land & Plot',
    items: [
      'Agricultural land',
      'Buildable plot',
      'Corner plot',
      'Flat plot',
      'Residential zone',
      'Sea views from plot',
      'Touristic zone',
    ],
  },
];

export const PROPERTY_FEATURES: string[] = PROPERTY_FEATURE_GROUPS.flatMap(
  (g) => g.items,
).sort((a, b) => a.localeCompare(b));

// ---- Smart tag matching ------------------------------------------------

// Strip measurements (e.g. "72.81 m2", "150sqm"), punctuation and accents so
// "Covered veranda 72.81 m2" normalises to "covered veranda".
function normalizeFeature(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b\d+([.,]\d+)?\s*(m2|m²|sqm|sq\.?m|sq|m)\b/g, ' ')
    .replace(/\b\d+([.,]\d+)?\b/g, ' ')
    .replace(/[^a-z]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Groups of equivalent terms. A property tag and a catalogue feature match when
// they share the same normalized form OR appear in the same synonym group.
const SYNONYM_GROUPS: string[][] = [
  ['swimming pool', 'private pool', 'pool'],
  ['communal pool', 'shared pool'],
  ['parking space', 'parking', 'covered parking', 'car park'],
  ['gated', 'gated community', 'gated complex'],
  ['bbq area', 'bbq', 'barbecue', 'communal bbq'],
  ['close to amenities', 'walking distance to amenities', 'near amenities'],
  ['close to beach', 'walking distance to beach', 'near beach'],
  ['ac', 'a c throughout', 'a c in bedrooms', 'air conditioning', 'air condition'],
  ['title deeds', 'separate title deeds'],
  ['furnished', 'fully furnished'],
];

function synonymKey(norm: string): string | null {
  for (const group of SYNONYM_GROUPS) {
    if (group.some((g) => normalizeFeature(g) === norm)) return group[0];
  }
  return null;
}

// Does a property tag match a catalogue feature?
export function tagMatchesFeature(tag: string, feature: string): boolean {
  const t = normalizeFeature(tag);
  const f = normalizeFeature(feature);
  if (!t || !f) return false;
  if (t === f) return true;
  const tk = synonymKey(t);
  const fk = synonymKey(f);
  if (tk && fk && tk === fk) return true;
  return false;
}

// Given a property's tags, return the catalogue features it activates and the
// "real" tags that didn't map onto any catalogue feature.
export function matchPropertyFeatures(tags: string[] | null | undefined) {
  const list = tags ?? [];
  const activeFeatures = new Set<string>();
  const matchedTags = new Set<string>();

  for (const feature of PROPERTY_FEATURES) {
    for (const tag of list) {
      if (tagMatchesFeature(tag, feature)) {
        activeFeatures.add(feature);
        matchedTags.add(tag);
      }
    }
  }

  const extraTags = list.filter(
    (t) => !matchedTags.has(t) && !/^hidden:/i.test(t.trim())
  );
  return { activeFeatures, extraTags };
}
