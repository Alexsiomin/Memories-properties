/**
 * Location SEO landing pages — shared data + helpers.
 *
 * This module is intentionally framework-agnostic (no browser-only imports) so
 * it can be consumed by:
 *   - the React page  src/pages/LocationPage.tsx   (route /locations/:slug)
 *   - the sitemap generator  scripts/generate-sitemap.ts
 *   - the static prerenderer  scripts/prerender.ts
 *
 * Each entry is a dedicated, unique landing page for a Cyprus city or district,
 * with its own heading, editorial copy, FAQs and internal links. Adding a new
 * entry here automatically wires it into routing, the sitemap and prerendering.
 */

export interface LocationDef {
  slug: string;
  /** Display name, e.g. "Kato Paphos". */
  name: string;
  /** Parent region used to group sibling areas for internal links. */
  region: "Paphos" | "Limassol";
  /** True for a top-level city page (broad), false for a district/area page. */
  isCity?: boolean;
  /** Lowercase substrings matched against a property's location/city/region. */
  matchTerms: string[];
  /** One-line tagline shown under the H1. */
  tagline: string;
  /** Unique 2–3 sentence introduction. */
  intro: string;
  /** Unique paragraph on the local property market. */
  market: string;
  /** Three short selling-point bullets. */
  highlights: string[];
  /** Location-specific FAQs. */
  faqs: { question: string; answer: string }[];
}

export const LOCATIONS: LocationDef[] = [
  {
    slug: "paphos",
    name: "Paphos",
    region: "Paphos",
    isCity: true,
    matchTerms: ["paphos", "pafos"],
    tagline: "Property for sale across the Paphos region, Cyprus",
    intro:
      "Paphos is the south-western jewel of Cyprus — a UNESCO World Heritage city where ancient mosaics, a working harbour and a 300-day sunshine climate sit beside modern marina-side living. It remains the island's most popular choice for international buyers seeking holiday homes, retirement villas and permanent-residency investments.",
    market:
      "The Paphos market spans everything from affordable town-centre apartments to clifftop villas at Sea Caves and Coral Bay. Demand is driven by relocating families, EU and non-EU investors using the permanent-residency route, and a steady rental market fed by year-round tourism. New-build developments dominate supply, with strong off-plan activity in Kato Paphos, Chloraka and Emba.",
    highlights: [
      "UNESCO heritage city with an international airport 15 minutes away",
      "Strong rental yields from year-round tourism and long-term lets",
      "Popular for Cyprus permanent-residency property investment",
    ],
    faqs: [
      {
        question: "Is Paphos a good place to buy property?",
        answer:
          "Yes. Paphos combines lower entry prices than Limassol with strong rental demand, an international airport, excellent healthcare and a large established expat community — making it one of Cyprus' most reliable markets for both lifestyle and investment buyers.",
      },
      {
        question: "Can foreigners buy property in Paphos?",
        answer:
          "Yes. EU citizens buy on the same terms as locals. Non-EU buyers may purchase property with a straightforward permit from the Council of Ministers, which is routinely granted. We coordinate the legal process end-to-end with vetted Cypriot lawyers.",
      },
    ],
  },
  {
    slug: "kato-paphos",
    name: "Kato Paphos",
    region: "Paphos",
    matchTerms: ["kato paphos", "kato pafos"],
    tagline: "Harbour-side apartments and villas in lower Paphos",
    intro:
      "Kato Paphos is the lively coastal heart of the city, wrapped around the medieval harbour and the Tombs of the Kings. Walkable, tourist-friendly and lined with restaurants and hotels, it is the prime choice for buyers who want a rental-ready apartment steps from the sea.",
    market:
      "Apartments dominate here, from compact studios to large penthouses with sea views. Proximity to the harbour and archaeological sites underpins one of the strongest short-let rental markets in Cyprus, making Kato Paphos a favourite for buy-to-let investors.",
    highlights: [
      "Walk to the harbour, beaches and Tombs of the Kings",
      "Excellent short-term rental demand",
      "Wide choice of apartments and penthouses",
    ],
    faqs: [
      {
        question: "What kind of property can I buy in Kato Paphos?",
        answer:
          "Mostly apartments and penthouses, many within resort-style developments with shared pools. Sea-view units near the harbour command a premium and rent strongly to holidaymakers.",
      },
    ],
  },
  {
    slug: "paphos-town-centre",
    name: "Paphos Town Centre",
    region: "Paphos",
    matchTerms: ["city center", "city centre", "paphos city", "town centre", "universal"],
    tagline: "Central city living in the heart of Paphos",
    intro:
      "Paphos Town Centre (Ktima) is the administrative and commercial core of the city, including the popular Universal area. It offers everyday convenience — shops, schools, markets and municipal services — within walking distance, appealing to year-round residents rather than seasonal visitors.",
    market:
      "Property here leans towards apartments and townhouses at accessible price points, with the Universal neighbourhood especially popular for long-term rentals. It is a practical choice for buyers prioritising amenities and a genuine local community over a beachfront address.",
    highlights: [
      "Central amenities, schools and transport on the doorstep",
      "Strong long-term rental demand",
      "Value pricing relative to coastal districts",
    ],
    faqs: [
      {
        question: "Is Paphos Town Centre good for long-term living?",
        answer:
          "Yes. The town centre and Universal area offer the best day-to-day convenience in Paphos, with shops, healthcare and schools nearby — ideal for residents and long-term tenants.",
      },
    ],
  },
  {
    slug: "emba",
    name: "Emba",
    region: "Paphos",
    matchTerms: ["emba", "empa"],
    tagline: "Hillside villages just north of Paphos",
    intro:
      "Emba (Empa) is a tranquil residential village a few minutes inland from Kato Paphos, prized for its elevated position, sea views and village atmosphere while staying close to the coast. It is one of the most active new-build areas in the Paphos region.",
    market:
      "Detached and semi-detached villas dominate, often in small gated communities with pools. Buyers are typically families and retirees who want space, views and quiet without sacrificing access to the city — a combination that keeps Emba in steady demand.",
    highlights: [
      "Elevated sea views minutes from the coast",
      "Modern villa developments with private pools",
      "Quiet village setting close to the city",
    ],
    faqs: [
      {
        question: "Why is Emba popular with buyers?",
        answer:
          "Emba offers a rare mix of sea views, a quiet village feel and proximity to Kato Paphos — at prices below the seafront. It is especially popular for new-build villas with pools.",
      },
    ],
  },
  {
    slug: "chloraka",
    name: "Chloraka",
    region: "Paphos",
    matchTerms: ["chloraka", "chlorakas"],
    tagline: "Coastal village living north of Paphos harbour",
    intro:
      "Chloraka is a coastal village stretching from the Paphos seafront up into the hills, blending traditional Cypriot character with a wave of contemporary development. Its beachside promenade and easy access to the city make it a consistent favourite among international buyers.",
    market:
      "The area offers both apartments along the coast and larger villas on the upper slopes with panoramic sea views. New developments have expanded the supply considerably, giving buyers a broad choice across price points.",
    highlights: [
      "Beachfront promenade and coastal walks",
      "Mix of apartments and hillside view villas",
      "Active new-build market",
    ],
    faqs: [
      {
        question: "Is Chloraka close to Paphos?",
        answer:
          "Yes — Chloraka borders the northern edge of Paphos and is only a short drive from the harbour, the airport and the city centre, while keeping a relaxed coastal-village feel.",
      },
    ],
  },
  {
    slug: "peyia",
    name: "Peyia",
    region: "Paphos",
    matchTerms: ["peyia", "pegeia"],
    tagline: "Sea-view villages above Coral Bay",
    intro:
      "Peyia (Pegeia) rises in terraces above Coral Bay, delivering some of the most dramatic sea views in the Paphos district. Long established with international residents, it combines a friendly village core with sought-after villa neighbourhoods.",
    market:
      "Villas — frequently with infinity pools and unobstructed Mediterranean panoramas — are the hallmark of Peyia. The proximity to Coral Bay's beaches and the Akamas peninsula sustains strong lifestyle demand and holiday-rental potential.",
    highlights: [
      "Panoramic sea views above Coral Bay",
      "Established expat community",
      "Gateway to the Akamas peninsula",
    ],
    faqs: [
      {
        question: "What is Peyia known for?",
        answer:
          "Peyia is known for elevated villas with sweeping sea views, its position above Coral Bay's beaches and close access to the unspoilt Akamas peninsula — a strong draw for lifestyle and holiday-home buyers.",
      },
    ],
  },
  {
    slug: "coral-bay",
    name: "Coral Bay",
    region: "Paphos",
    matchTerms: ["coral bay"],
    tagline: "Beachfront resort living west of Paphos",
    intro:
      "Coral Bay is Paphos' most famous Blue Flag beach resort, a crescent of golden sand backed by a lively strip of restaurants and bars. Property here is all about beachside lifestyle and holiday-rental performance.",
    market:
      "Demand centres on apartments and villas within walking distance of the beach, which let exceptionally well through the long Cyprus season. Limited beachfront land keeps prime Coral Bay property in tight supply.",
    highlights: [
      "Blue Flag beach and resort amenities",
      "Outstanding holiday-rental demand",
      "Limited, high-demand beachside supply",
    ],
    faqs: [
      {
        question: "Is Coral Bay good for holiday rentals?",
        answer:
          "Very. Coral Bay's Blue Flag beach and resort strip drive one of the strongest seasonal rental markets in Paphos, making beach-adjacent apartments and villas attractive to investors.",
      },
    ],
  },
  {
    slug: "sea-caves",
    name: "Sea Caves",
    region: "Paphos",
    matchTerms: ["sea caves"],
    tagline: "Exclusive clifftop villas on the Akamas edge",
    intro:
      "Sea Caves (Peyia Sea Caves) is one of the most exclusive coastal enclaves in Cyprus, a low-density stretch of clifftop and seafront villas on the threshold of the protected Akamas peninsula. It is synonymous with privacy, space and luxury.",
    market:
      "This is the premium end of the Paphos market: large detached villas on generous plots, many with direct sea access or private pools facing the open Mediterranean. Scarcity and protected surroundings underpin long-term values.",
    highlights: [
      "Low-density luxury clifftop villas",
      "Bordering the protected Akamas peninsula",
      "Privacy, space and long-term value",
    ],
    faqs: [
      {
        question: "Why is Sea Caves so exclusive?",
        answer:
          "Its position on the edge of the protected Akamas limits development, so plots are large and supply is scarce. The result is a private, low-density area of high-end villas with uninterrupted sea views.",
      },
    ],
  },
  {
    slug: "tremithousa",
    name: "Tremithousa",
    region: "Paphos",
    matchTerms: ["tremithousa"],
    tagline: "Peaceful inland village close to Paphos",
    intro:
      "Tremithousa is a quiet hillside village a short drive inland from Paphos, offering green surroundings, fresh air and excellent value. It has become a popular choice for buyers who want a modern villa with space at a sensible price.",
    market:
      "New-build villas and bungalows make up most of the supply, typically on larger plots than coastal districts. The combination of value, views and quick city access keeps Tremithousa firmly on buyers' shortlists.",
    highlights: [
      "Green, peaceful inland setting",
      "Larger plots and strong value",
      "Quick access to Paphos and the airport",
    ],
    faqs: [
      {
        question: "Is Tremithousa good value?",
        answer:
          "Yes. Being slightly inland, Tremithousa offers larger plots and lower prices than coastal areas while staying within a short drive of Paphos — appealing to value-focused villa buyers.",
      },
    ],
  },
  {
    slug: "kissonerga",
    name: "Kissonerga",
    region: "Paphos",
    matchTerms: ["kissonerga"],
    tagline: "Coastal countryside north of Paphos",
    intro:
      "Kissonerga is a coastal village set among banana plantations and orchards just north of Chloraka, balancing rural calm with proximity to the sea and the city. It appeals to buyers seeking space and a slower pace without isolation.",
    market:
      "Detached villas and bungalows on sizeable plots dominate, with newer developments adding modern, pool-equipped homes. Prices remain attractive relative to neighbouring coastal districts.",
    highlights: [
      "Rural-coastal setting among orchards",
      "Spacious plots at attractive prices",
      "Close to Chloraka beaches and Paphos",
    ],
    faqs: [
      {
        question: "What is Kissonerga like?",
        answer:
          "Kissonerga is a relaxed coastal village surrounded by greenery, offering larger villas and bungalows at good value while remaining close to the beach and to Paphos amenities.",
      },
    ],
  },
  {
    slug: "geroskipou",
    name: "Geroskipou",
    region: "Paphos",
    matchTerms: ["geroskipou", "yeroskipou", "geroskipou", "kato paphos geroskipou"],
    tagline: "Historic seaside town east of Paphos",
    intro:
      "Geroskipou (Yeroskipou) is one of the oldest towns in the Paphos district, famous for its five-domed Byzantine church and traditional Cyprus delight. It pairs genuine local character with a popular sandy coastline and easy reach of the city.",
    market:
      "The market mixes affordable apartments and townhouses near the centre with coastal villas towards the sea. Established amenities and a strong local community make it attractive for both residents and long-term lets.",
    highlights: [
      "Historic town with a sandy coastline",
      "Affordable apartments and coastal villas",
      "Established year-round community",
    ],
    faqs: [
      {
        question: "Is Geroskipou a good area to live?",
        answer:
          "Yes. Geroskipou offers an authentic Cypriot town atmosphere, good amenities and a sandy coast, all minutes from central Paphos — a practical choice for residents and long-term tenants.",
      },
    ],
  },
  {
    slug: "tala",
    name: "Tala",
    region: "Paphos",
    matchTerms: ["tala"],
    tagline: "Sought-after hillside village with sweeping views",
    intro:
      "Tala is a charming traditional village set high in the hills above Paphos, long favoured by international buyers for its cooler air, panoramic coastal views and picturesque village square. It enjoys a strong reputation and enduring demand.",
    market:
      "Villas and bungalows with sea and mountain views are the mainstay, including many established resale homes alongside new developments. Tala's popularity keeps values resilient.",
    highlights: [
      "Cooler hillside climate and big views",
      "Pretty village square and community feel",
      "Resilient, well-established market",
    ],
    faqs: [
      {
        question: "Why do buyers like Tala?",
        answer:
          "Tala combines a higher, cooler setting with panoramic views, a welcoming village centre and a long-standing international community — qualities that keep it consistently in demand.",
      },
    ],
  },
  {
    slug: "tsada",
    name: "Tsada",
    region: "Paphos",
    matchTerms: ["tsada"],
    tagline: "Golf-country living in the Paphos hills",
    intro:
      "Tsada sits among vineyards and pine in the hills above Paphos, best known for its championship golf course. It offers an upscale, green and peaceful setting for buyers who value space and scenery.",
    market:
      "Property is largely detached villas on generous plots, many oriented to golf, valley or sea views. The area's exclusivity and natural surroundings appeal to lifestyle buyers.",
    highlights: [
      "Championship golf and vineyard surroundings",
      "Spacious villas with valley and sea views",
      "Upscale, low-density setting",
    ],
    faqs: [
      {
        question: "Is Tsada good for golf buyers?",
        answer:
          "Yes. Tsada is home to one of Cyprus' leading golf courses, with villas set among vineyards and hills — an ideal base for golf-focused lifestyle buyers seeking space and views.",
      },
    ],
  },
  {
    slug: "konia",
    name: "Konia",
    region: "Paphos",
    matchTerms: ["konia"],
    tagline: "Upmarket village minutes from Paphos",
    intro:
      "Konia is an affluent village on the eastern edge of Paphos, popular for its quiet streets, sea and city views and very quick access to the centre. It blends a residential village feel with genuine convenience.",
    market:
      "Modern villas and quality apartments characterise the area, often with views back over the city to the sea. Proximity to Paphos and a desirable address keep Konia in steady demand.",
    highlights: [
      "Quiet, upmarket village close to the city",
      "Sea and city views",
      "Modern villas and quality apartments",
    ],
    faqs: [
      {
        question: "How far is Konia from Paphos?",
        answer:
          "Konia is just a few minutes' drive from central Paphos, giving residents village peace with immediate access to city amenities, the harbour and the airport road.",
      },
    ],
  },
  {
    slug: "mesogi",
    name: "Mesogi",
    region: "Paphos",
    matchTerms: ["mesogi"],
    tagline: "Leafy residential village on the Paphos fringe",
    intro:
      "Mesogi is a green, established residential village immediately north of Paphos town, valued for its mature gardens, convenience and relaxed pace. It is a popular long-term residential choice rather than a tourist area.",
    market:
      "The mix includes villas, bungalows and apartments at accessible prices, with mature neighbourhoods and good local amenities. Its proximity to the town centre supports steady year-round demand.",
    highlights: [
      "Leafy, established residential streets",
      "Accessible prices near the town centre",
      "Strong year-round living appeal",
    ],
    faqs: [
      {
        question: "Is Mesogi a residential area?",
        answer:
          "Yes. Mesogi is primarily a green residential village on the edge of Paphos town, well suited to permanent living with good amenities and easy access to the centre.",
      },
    ],
  },
  {
    slug: "polis-chrysochous",
    name: "Polis Chrysochous",
    region: "Paphos",
    matchTerms: ["polis", "chrysochous", "latchi", "latsi"],
    tagline: "Unspoilt coast and countryside in the north-west",
    intro:
      "Polis Chrysochous and neighbouring Latchi occupy the unspoilt north-west of the Paphos district, beside the Akamas peninsula and the Blue Lagoon. The area offers an authentic, nature-led alternative to the busier southern coast.",
    market:
      "Property ranges from village townhouses and stone homes to seafront apartments and rural plots. Lower density and protected surroundings give the area a distinctive, tranquil appeal for nature-focused buyers.",
    highlights: [
      "Beside the Akamas and the Blue Lagoon",
      "Authentic, low-density coastal living",
      "Marina and traditional villages at Latchi",
    ],
    faqs: [
      {
        question: "Is Polis different from Paphos town?",
        answer:
          "Yes. Polis Chrysochous is quieter, greener and more traditional than Paphos, set beside the protected Akamas and Latchi marina — ideal for buyers who prioritise nature and tranquillity.",
      },
    ],
  },
  {
    slug: "venus-rock",
    name: "Venus Rock",
    region: "Paphos",
    matchTerms: ["venus rock"],
    tagline: "Golf-resort living on the Paphos coast",
    intro:
      "Venus Rock is a large coastal golf-resort destination between Paphos and Limassol, planned around championship golf, a beach club and integrated leisure amenities. It is a flagship master-planned community for resort-style ownership.",
    market:
      "Supply is dominated by new-build villas and apartments within the resort, designed for both lifestyle owners and investors seeking managed, amenity-rich property near the sea and golf.",
    highlights: [
      "Master-planned golf and beach resort",
      "New-build villas and apartments",
      "Coastal position between Paphos and Limassol",
    ],
    faqs: [
      {
        question: "What is Venus Rock?",
        answer:
          "Venus Rock is a large master-planned coastal resort built around championship golf and a beach club, offering new villas and apartments aimed at lifestyle and investment buyers.",
      },
    ],
  },
  {
    slug: "limassol",
    name: "Limassol",
    region: "Limassol",
    isCity: true,
    matchTerms: ["limassol", "lemesos"],
    tagline: "Cyprus' cosmopolitan business and seafront city",
    intro:
      "Limassol is the commercial powerhouse of Cyprus — a cosmopolitan coastal city of marinas, high-rise seafront towers, international business and a vibrant cultural scene. It commands the island's premium property prices and its most dynamic urban market.",
    market:
      "From landmark seafront towers and marina residences to suburban family villas, Limassol attracts international executives, investors and HNW buyers. Prime seafront and marina property leads the Cyprus market on value, with strong rental demand from the business community.",
    highlights: [
      "Marina living and landmark seafront towers",
      "International business hub with deep rental demand",
      "Cyprus' premium urban property market",
    ],
    faqs: [
      {
        question: "Why is property in Limassol more expensive?",
        answer:
          "Limassol is the island's main business and financial centre with limited seafront land, strong international demand and landmark developments — factors that place it at the top of the Cyprus property market.",
      },
    ],
  },
  {
    slug: "germasogeia",
    name: "Germasogeia",
    region: "Limassol",
    matchTerms: ["germasogeia", "germasoyia"],
    tagline: "The tourist heart of Limassol's coast",
    intro:
      "Germasogeia spans the popular tourist area of Limassol, from the beachfront and Dasoudi up to the green Germasogeia village and dam. It is one of the city's most desirable addresses for both lifestyle and rental buyers.",
    market:
      "The coastal strip offers premium apartments and seafront towers, while the upper village provides villas with views. Tourist appeal and proximity to the city centre sustain strong values and rental demand.",
    highlights: [
      "Beachfront, Dasoudi park and tourist strip",
      "Premium apartments and seafront living",
      "Village villas with views inland",
    ],
    faqs: [
      {
        question: "Is Germasogeia a good area in Limassol?",
        answer:
          "Yes. Germasogeia covers Limassol's prime tourist coast and a desirable hillside village, offering everything from seafront apartments to view villas — with strong demand from residents and tenants alike.",
      },
    ],
  },
  {
    slug: "zakaki",
    name: "Zakaki",
    region: "Limassol",
    matchTerms: ["zakaki"],
    tagline: "Marina-side regeneration in western Limassol",
    intro:
      "Zakaki sits on the western edge of Limassol beside the marina, the casino-resort and the city's major retail and leisure hub. Rapid regeneration has turned it into one of Limassol's most talked-about up-and-coming districts.",
    market:
      "New apartment developments dominate, drawing buyers attracted by the marina, leisure amenities and growth potential. The area suits investors looking to enter Limassol with a forward-looking position.",
    highlights: [
      "Beside the marina and integrated resort",
      "Major retail and leisure on the doorstep",
      "Fast-regenerating growth district",
    ],
    faqs: [
      {
        question: "Is Zakaki a good investment area?",
        answer:
          "Zakaki is one of Limassol's fastest-developing districts, anchored by the marina and a large integrated resort. Ongoing regeneration and new-build supply make it appealing to forward-looking investors.",
      },
    ],
  },
];

const LOCATION_MAP: Record<string, LocationDef> = Object.fromEntries(
  LOCATIONS.map((l) => [l.slug, l]),
);

export function getLocation(slug?: string | null): LocationDef | null {
  if (!slug) return null;
  return LOCATION_MAP[slug.toLowerCase()] ?? null;
}

/** Does a property's free-text location/city/region match this location? */
export function matchesLocation(loc: LocationDef, ...fields: (string | null | undefined)[]): boolean {
  const hay = fields
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!hay) return false;
  return loc.matchTerms.some((t) => hay.includes(t));
}

/** Sibling areas in the same region (for internal links), excluding self. */
export function siblingLocations(loc: LocationDef): LocationDef[] {
  return LOCATIONS.filter((l) => l.region === loc.region && l.slug !== loc.slug);
}
