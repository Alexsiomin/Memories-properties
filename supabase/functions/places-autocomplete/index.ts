const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';

type LocalPlace = {
  name: string;
  district: 'Paphos' | 'Limassol';
  aliases?: string[];
};

const LOCAL_PLACES: LocalPlace[] = [
  { name: 'Paphos', district: 'Paphos', aliases: ['Paphos city', 'Pafos'] },
  { name: 'Kato Paphos', district: 'Paphos', city: 'Paphos' },
  { name: 'Universal', district: 'Paphos', city: 'Paphos' },
  { name: 'Mouttalos', district: 'Paphos', city: 'Paphos' },
  { name: 'Agios Pavlos', district: 'Paphos', city: 'Paphos' },
  { name: 'Agios Theodoros', district: 'Paphos', city: 'Paphos' },
  { name: 'Agios Spyridon', district: 'Paphos', city: 'Paphos' },
  { name: 'Agios Kendeas', district: 'Paphos', city: 'Paphos' },
  { name: 'Anavargos', district: 'Paphos', city: 'Paphos' },
  { name: 'Mesogi', district: 'Paphos', city: 'Paphos' },
  { name: 'Konia', district: 'Paphos', city: 'Paphos' },
  { name: 'Geroskipou', district: 'Paphos', aliases: ['Yeroskipou'] },
  { name: 'Koloni', district: 'Paphos', city: 'Paphos' },
  { name: 'Achelia', district: 'Paphos' },
  { name: 'Peyia', district: 'Paphos', aliases: ['Pegeia'] },
  { name: 'Coral Bay', district: 'Paphos' },
  { name: 'Sea Caves', district: 'Paphos' },
  { name: 'Agios Georgios', district: 'Paphos', aliases: ['Agios Georgios Pegeia', 'Agios Georgios Peyia'] },
  { name: 'Polis Chrysochous', district: 'Paphos', aliases: ['Polis'] },
  { name: 'Chrysochous', district: 'Paphos' },
  { name: 'Prodromi', district: 'Paphos' },
  { name: 'Latchi', district: 'Paphos', aliases: ['Latsi'] },
  { name: 'Chloraka', district: 'Paphos' },
  { name: 'Kissonerga', district: 'Paphos' },
  { name: 'Lemba', district: 'Paphos' },
  { name: 'Tala', district: 'Paphos' },
  { name: 'Tremithousa', district: 'Paphos' },
  { name: 'Emba', district: 'Paphos', aliases: ['Empa'] },
  { name: 'Kallepia', district: 'Paphos' },
  { name: 'Letymbou', district: 'Paphos' },
  { name: 'Polemi', district: 'Paphos' },
  { name: 'Stroumpi', district: 'Paphos' },
  { name: 'Kathikas', district: 'Paphos' },
  { name: 'Pano Akourdaleia', district: 'Paphos' },
  { name: 'Kato Akourdaleia', district: 'Paphos' },
  { name: 'Theletra', district: 'Paphos' },
  { name: 'Giolou', district: 'Paphos' },
  { name: 'Drouseia', district: 'Paphos' },
  { name: 'Inia', district: 'Paphos' },
  { name: 'Pano Arodes', district: 'Paphos' },
  { name: 'Kato Arodes', district: 'Paphos' },
  { name: 'Kritou Terra', district: 'Paphos' },
  { name: 'Neo Chorio', district: 'Paphos' },
  { name: 'Argaka', district: 'Paphos' },
  { name: 'Pomos', district: 'Paphos' },
  { name: 'Pachyammos', district: 'Paphos' },
  { name: 'Kato Pyrgos', district: 'Paphos' },
  { name: 'Pano Pyrgos', district: 'Paphos' },
  { name: 'Steni', district: 'Paphos' },
  { name: 'Goudi', district: 'Paphos' },
  { name: 'Skoulli', district: 'Paphos' },
  { name: 'Lysos', district: 'Paphos' },
  { name: 'Peristerona', district: 'Paphos' },
  { name: 'Nea Dimmata', district: 'Paphos' },
  { name: 'Makounta', district: 'Paphos' },
  { name: 'Karamoullides', district: 'Paphos' },
  { name: 'Agia Marina Chrysochous', district: 'Paphos', aliases: ['Agia Marina'] },
  { name: 'Episkopi', district: 'Paphos' },
  { name: 'Salamiou', district: 'Paphos' },
  { name: 'Statos-Agios Fotios', district: 'Paphos', aliases: ['Statos', 'Agios Fotios'] },
  { name: 'Pano Panagia', district: 'Paphos' },
  { name: 'Kannaviou', district: 'Paphos' },
  { name: 'Asprogia', district: 'Paphos' },
  { name: 'Kelokedara', district: 'Paphos' },
  { name: 'Choulou', district: 'Paphos' },
  { name: 'Lemona', district: 'Paphos' },
  { name: 'Psathi', district: 'Paphos' },
  { name: 'Pentalia', district: 'Paphos' },
  { name: 'Galataria', district: 'Paphos' },
  { name: 'Koilineia', district: 'Paphos' },
  { name: 'Mesana', district: 'Paphos' },
  { name: 'Mamonia', district: 'Paphos' },
  { name: 'Nata', district: 'Paphos' },
  { name: 'Axylou', district: 'Paphos' },
  { name: 'Eledio', district: 'Paphos' },
  { name: 'Maronas', district: 'Paphos' },
  { name: 'Trachypedoula', district: 'Paphos' },
  { name: 'Pitargou', district: 'Paphos' },
  { name: 'Amargeti', district: 'Paphos' },
  { name: 'Agios Nikolaos', district: 'Paphos' },
  { name: 'Kedares', district: 'Paphos' },
  { name: 'Praitori', district: 'Paphos' },
  { name: 'Mousere', district: 'Paphos' },
  { name: 'Vretsia', district: 'Paphos' },
  { name: 'Phasoula', district: 'Paphos' },
  { name: 'Kissousa', district: 'Paphos' },
  { name: 'Timi', district: 'Paphos' },
  { name: 'Mandria', district: 'Paphos' },
  { name: 'Nikoklia', district: 'Paphos' },
  { name: 'Kouklia', district: 'Paphos' },
  { name: 'Aphrodite Hills', district: 'Paphos' },
  { name: 'Secret Valley', district: 'Paphos' },
  { name: 'Petra tou Romiou', district: 'Paphos' },
  { name: 'Anarita', district: 'Paphos' },
  { name: 'Foinikas', district: 'Paphos' },
  { name: 'Choletria', district: 'Paphos' },
  { name: 'Kidasi', district: 'Paphos' },
  { name: 'Souskiou', district: 'Paphos' },
  { name: 'Tsada', district: 'Paphos' },
  { name: 'Koili', district: 'Paphos' },
  { name: 'Marathounta', district: 'Paphos' },
  { name: 'Armou', district: 'Paphos' },
  { name: 'Akoursos', district: 'Paphos' },
  { name: 'Fyti', district: 'Paphos' },
  { name: 'Milia', district: 'Paphos' },
  { name: 'Simou', district: 'Paphos' },
  { name: 'Lasa', district: 'Paphos' },
  { name: 'Drymou', district: 'Paphos' },
  { name: 'Kourdaka', district: 'Paphos' },
  { name: 'Anadiou', district: 'Paphos' },
  { name: 'Limassol', district: 'Limassol', aliases: ['Limassol city', 'Lemesos'] },
  { name: 'Agios Athanasios', district: 'Limassol', city: 'Limassol' },
  { name: 'Mesa Geitonia', district: 'Limassol', city: 'Limassol' },
  { name: 'Germasogeia', district: 'Limassol', city: 'Limassol', aliases: ['Yermasoyia', 'Potamos Germasogeias'] },
  { name: 'Agios Tychon', district: 'Limassol', city: 'Limassol' },
  { name: 'Pyrgos', district: 'Limassol' },
  { name: 'Pissouri', district: 'Limassol' },
  { name: 'Parekklisia', district: 'Limassol' },
  { name: 'Mouttagiaka', district: 'Limassol', city: 'Limassol' },
  { name: 'Episkopi', district: 'Limassol' },
  { name: 'Ypsonas', district: 'Limassol', aliases: ['Ipsonas'] },
  { name: 'Zakaki', district: 'Limassol', city: 'Limassol' },
  { name: 'Agia Fyla', district: 'Limassol', city: 'Limassol' },
  { name: 'Kapsalos', district: 'Limassol', city: 'Limassol' },
  { name: 'Neapolis', district: 'Limassol', city: 'Limassol' },
  { name: 'Kolossi', district: 'Limassol' },
  { name: 'Erimi', district: 'Limassol' },
  { name: 'Trachoni', district: 'Limassol' },
  { name: 'Paramali', district: 'Limassol' },
  { name: 'Moni', district: 'Limassol' },
  { name: 'Monagroulli', district: 'Limassol' },
  { name: 'Souni-Zanakia', district: 'Limassol', aliases: ['Souni', 'Zanakia'] },
  { name: 'Palodia', district: 'Limassol' },
  { name: 'Fasoula', district: 'Limassol' },
  { name: 'Armenochori', district: 'Limassol' },
  { name: 'Ayios Amvrosios', district: 'Limassol', aliases: ['Agios Ambrosios', 'Agios Amvrosios'] },
];

const TARGET_DISTRICT = /\b(paphos|pafos|limassol|lemesos)\b/i;
const LOCAL_LOOKUP = new Map(
  LOCAL_PLACES.flatMap((place) => [place.name, ...(place.aliases ?? [])].map((name) => [normalize(name), place] as const)),
);

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

function display(place: LocalPlace): string {
  return place.city
    ? `${place.name}, ${place.city}, ${place.district}`
    : `${place.name}, ${place.district}`;
}

function placeNames(place: LocalPlace): string[] {
  return [place.name, ...(place.aliases ?? [])];
}

function findLocalPlace(parts: string[]): LocalPlace | undefined {
  const primary = normalize(parts[0] ?? '');
  if (!primary) return undefined;
  const candidates = LOCAL_PLACES.filter((place) => placeNames(place).some((name) => normalize(name) === primary));
  if (!candidates.length) return undefined;

  const context = parts.slice(1).join(' ');
  if (/paphos|pafos/i.test(context)) return candidates.find((place) => place.district === 'Paphos') ?? candidates[0];
  if (/limassol|lemesos/i.test(context)) return candidates.find((place) => place.district === 'Limassol') ?? candidates[0];
  return candidates[0];
}

function matchScore(input: string, place: LocalPlace): number | null {
  const values = [place.name, place.district, ...(place.aliases ?? [])].map(normalize);
  let best: number | null = null;
  for (const value of values) {
    if (!value) continue;
    const score = value === input ? 0 : value.startsWith(input) ? 1 : value.split(' ').some((part) => part.startsWith(input)) ? 2 : value.includes(input) ? 3 : null;
    if (score !== null && (best === null || score < best)) best = score;
  }
  return best;
}

function localSuggestions(input: string): string[] {
  const q = normalize(input);
  if (q.length < 2) return [];

  return LOCAL_PLACES
    .map((place, index) => ({ place, index, score: matchScore(q, place) }))
    .filter((item): item is { place: LocalPlace; index: number; score: number } => item.score !== null)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({ place }) => display(place))
    .slice(0, 10);
}

function formatPlace(text: string): string {
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  const local = findLocalPlace(parts);
  if (local) return display(local);
  if (parts.length > 1 && /cyprus/i.test(parts[parts.length - 1])) parts.pop();
  return parts.slice(0, 2).join(', ');
}

function isAllowedSuggestion(text: string): boolean {
  const formatted = formatPlace(text);
  const primary = normalize(formatted.split(',')[0] ?? '');
  return LOCAL_LOOKUP.has(primary) || TARGET_DISTRICT.test(formatted);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();
    const q = typeof input === 'string' ? input.trim() : '';
    if (q.length < 2) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing connector credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const seen = new Set<string>();
    const suggestions: string[] = [];
    const add = (raw: string) => {
      if (!raw) return;
      const formatted = formatPlace(raw);
      const key = formatted.toLowerCase();
      if (formatted && isAllowedSuggestion(formatted) && !seen.has(key)) {
        seen.add(key);
        suggestions.push(formatted);
      }
    };

    localSuggestions(q).forEach(add);

    const requests = [q, `${q} Paphos`, `${q} Limassol`].map(async (input) => {
      const res = await fetch(`${GATEWAY_URL}/places/v1/places:autocomplete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          includedRegionCodes: ['CY'],
          // Only return geographic areas (cities, towns, villages, neighborhoods),
          // never businesses like restaurants or shops.
          includedPrimaryTypes: ['(regions)'],
          // Bias toward the Paphos / Limassol area (between the two cities).
          locationBias: {
            circle: {
              center: { latitude: 34.7754, longitude: 32.6539 },
              radius: 50000,
            },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) return;
      (data.suggestions ?? [])
        .map((s: any) => s?.placePrediction?.text?.text as string)
        .filter((text: string) => typeof text === 'string')
        .forEach(add);
    });

    await Promise.allSettled(requests);

    return new Response(JSON.stringify({ suggestions: suggestions.slice(0, 10) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
