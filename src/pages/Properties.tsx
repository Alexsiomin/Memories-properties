import { Fragment, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import TourDialog from '@/components/TourDialog';
import Thumbnail from '@/components/Thumbnail';
import ListingGallery from '@/components/ListingGallery';
import { PriceSelect } from '@/components/PriceSelect';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import MultiLocationSearch from '@/components/MultiLocationSearch';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useFavorites } from '@/hooks/use-favorites';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';

import { toast } from 'sonner';
import { BookmarkPlus, ArrowUpRight, Lock, Clock, Navigation, MapPin } from 'lucide-react';
import { trackSearch } from '@/lib/visitor-journey';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  SlidersHorizontal,
  Circle,
  ChevronRight,
  X,
  Mountain,
  Wheat,
  Waves,
  Building2,
  Factory,
  Landmark,
  Leaf,
  Store,
  Star,
  Calendar,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EnquiryDialog, { type EnquiryProperty } from '@/components/EnquiryDialog';
import PrivateDossierDialog from '@/components/PrivateDossierDialog';
import PresetsMenu, { type FilterPreset } from '@/components/PresetsMenu';
import SEO from '@/components/SEO';
import { publicLocation, publicTitle, displayReference, publicPrice } from '@/lib/propertyDisplay';
import residential from '@/assets/proj-residential.jpg';
import vineyard from '@/assets/proj-vineyard.jpg';
import coastal from '@/assets/proj-coastal.jpg';
import mixed from '@/assets/proj-mixed.jpg';
import hero from '@/assets/hero-land.jpg';
import skyline from '@/assets/hero-skyline.jpg';
import desert from '@/assets/feat-desert.jpg';
import library from '@/assets/feat-library.jpg';
import markets from '@/assets/feat-markets.jpg';
import tech from '@/assets/feat-tech.jpg';
import PropertyAlertDialog from '@/components/PropertyAlertDialog';

const IMAGE_MAP: Record<string, string> = {
  residential, vineyard, coastal, mixed, hero, skyline, desert, library, markets, tech,
};

interface Property {
  id?: string;
  slug?: string;
  img: string;
  images?: string[];
  cat: string;
  title: string;
  location: string;
  city?: string;
  region?: string;
  district?: string;
  price: string;
  priceValue: number; // EUR millions for sort
  status: string;
  yield: string;
  beds?: number;
  baths?: number;
  size?: string;
  tags: string[];
  description?: string;
  energyRating?: string;
  createdAt: number; // for sort
  lat?: number;
  lng?: number;
  isProject?: boolean;
  unitCount?: number;
  listing_type?: string;
  internalArea?: string;
  coveredVerandas?: string;
}

const parseAreaNum = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const m = s.match(/[\d,]+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/,/g, ''));
  return isNaN(n) ? null : n;
};

function formatTotalCoveredArea(p: Property): string | null {
  const internalNum = parseAreaNum(p.internalArea);
  const coveredNum = parseAreaNum(p.coveredVerandas);
  const totalNum = internalNum != null && coveredNum != null ? internalNum + coveredNum : parseAreaNum(p.size);
  if (totalNum != null) {
    return `${totalNum.toLocaleString(undefined, { maximumFractionDigits: 2 })} m²`;
  }
  return p.size ?? null;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatPropertyLocation(p: Property): string {
  return publicLocation(p);
}




type SearchSuggestion =
  | {
      kind: 'location' | 'category' | 'feature';
      label: string;
      subtitle: string;
      query: string;
    }
  | {
      kind: 'property';
      label: string;
      subtitle: string;
      price: string;
      img: string;
      id?: string;
      slug?: string;
    };

const FALLBACK_PROPERTIES: Property[] = [
  { img: hero, cat: 'Development Land', title: 'Pre-Zoned A4 Corridor Parcel · 412 ha', location: 'Pilsen Region, Czech Republic', price: '€18,400,000', priceValue: 18.4, status: 'In Diligence', yield: '21–24% IRR (modelled)', size: '412 ha', tags: ['Development', 'Pre-zoned', 'Land'], createdAt: 12 },
  { img: residential, cat: 'Residential', title: 'Nordhavn Build-to-Rent Towers · 186 Apartments', location: 'Nordhavn, Copenhagen', price: '€42,000,000', priceValue: 42, status: 'Closed 2025', yield: '6.8% net yield', beds: 186, baths: 186, tags: ['BTR', 'City views', 'Penthouse'], createdAt: 11 },
  { img: vineyard, cat: 'Agricultural Estate', title: 'Domaine de Saint-Aubin · Working Vineyard, 94 ha', location: 'Sancerre, Loire Valley', price: '€7,200,000', priceValue: 7.2, status: 'Under Offer', yield: '4.2% net + appreciation', size: '94 ha', tags: ['Agricultural', 'Heritage'], createdAt: 10 },
  { img: coastal, cat: 'Coastal Land', title: 'Cliff-Top Plot with Class-A Tourism Permit', location: 'Paros, Cyclades', price: '€2,800,000', priceValue: 2.8, status: 'Available', yield: '12 ha · permitted', size: '12 ha', tags: ['Beachfront', 'Ocean views', 'Tourism'], createdAt: 9 },
  { img: mixed, cat: 'Mixed-Use', title: '88 Boulevard Anspach · Office & Retail', location: 'Brussels, Belgium', price: '€16,500,000', priceValue: 16.5, status: 'Closed 2024', yield: '7.1% net yield', tags: ['Mixed-use', 'CBD'], createdAt: 8 },
  { img: skyline, cat: 'Urban Tower', title: 'Mainzer Landstraße Office Tower · 38 Floors', location: 'Bankenviertel, Frankfurt', price: '€124,000,000', priceValue: 124, status: 'Closed 2024', yield: '5.4% net yield', tags: ['CBD', 'City views', 'Office'], createdAt: 7 },
  { img: desert, cat: 'Strategic Land', title: 'Sierra Morena Solar-Ready Plateau · 1,240 ha', location: 'Jaén, Andalusia', price: '€31,600,000', priceValue: 31.6, status: 'Available', yield: 'PPA-linked, 9.2% IRR', size: '1,240 ha', tags: ['Solar', 'Land', 'Strategic'], createdAt: 6 },
  { img: library, cat: 'Heritage Conversion', title: 'Listed Carnegie Library, George IV Bridge', location: 'Edinburgh New Town', price: '€9,800,000', priceValue: 9.8, status: 'In Planning', yield: '14% IRR (modelled)', tags: ['Heritage', 'Conversion'], createdAt: 5 },
  { img: markets, cat: 'Retail', title: 'Mercado da Ribeira · Covered Market Hall', location: 'Cais do Sodré, Lisbon', price: '€11,300,000', priceValue: 11.3, status: 'Under Offer', yield: '6.1% net yield', tags: ['Retail', 'Heritage'], createdAt: 4 },
  { img: tech, cat: 'Logistics', title: 'Maasvlakte II Last-Mile Campus · 64,000 m²', location: 'Port of Rotterdam', price: '€56,700,000', priceValue: 56.7, status: 'Closed 2025', yield: '7.8% net yield', tags: ['Logistics', 'Industrial'], createdAt: 3 },
  { img: residential, cat: 'Residential', title: 'Cais das Pedras Riverside Block · 64 Units', location: 'Ribeira, Porto', price: '€22,500,000', priceValue: 22.5, status: 'Available', yield: '5.9% net yield', beds: 64, baths: 64, tags: ['BTR', 'City views'], createdAt: 13 },
  { img: coastal, cat: 'Coastal Land', title: 'Cala Ginepro Private Bay Holding · 38 ha', location: 'Orosei, Sardinia', price: '€14,900,000', priceValue: 14.9, status: 'Available', yield: 'Permitted resort scheme', size: '38 ha', tags: ['Beachfront', 'Ocean views', 'Tourism'], createdAt: 14 },
  { img: vineyard, cat: 'Agricultural Estate', title: 'Masseria Sant\u2019Angelo Olive Estate & Mill', location: 'Ostuni, Puglia', price: '€5,600,000', priceValue: 5.6, status: 'Available', yield: '3.8% net + appreciation', size: '220 ha', tags: ['Agricultural', 'Heritage'], createdAt: 15 },
  { img: skyline, cat: 'Urban Tower', title: 'Złota 24 Mixed-Use Tower · 24 Floors', location: 'Śródmieście, Warsaw', price: '€78,200,000', priceValue: 78.2, status: 'In Diligence', yield: '6.4% net yield', tags: ['CBD', 'Mixed-use', 'City views'], createdAt: 16 },
  { img: desert, cat: 'Strategic Land', title: 'Sierra de Alcubierre Wind-Ready Ridge · 860 ha', location: 'Huesca, Aragón', price: '€19,400,000', priceValue: 19.4, status: 'Under Offer', yield: '8.6% IRR (modelled)', size: '860 ha', tags: ['Solar', 'Land', 'Strategic'], createdAt: 17 },
  { img: library, cat: 'Heritage Conversion', title: 'Palazzo del Lloyd Boutique Hotel Conversion', location: 'Trieste, Friuli', price: '€12,700,000', priceValue: 12.7, status: 'In Planning', yield: '11% IRR (modelled)', tags: ['Heritage', 'Conversion', 'Tourism'], createdAt: 18 },
  { img: markets, cat: 'Retail', title: 'Meir 78 High-Street Retail Parade · 11 Units', location: 'Meir, Antwerp', price: '€8,900,000', priceValue: 8.9, status: 'Available', yield: '5.7% net yield', tags: ['Retail', 'CBD'], createdAt: 19 },
  { img: tech, cat: 'Logistics', title: 'Saint-Quentin-Fallavier Cold-Chain Warehouse', location: 'Lyon Metropolitan Area', price: '€34,100,000', priceValue: 34.1, status: 'Available', yield: '7.2% net yield', tags: ['Logistics', 'Industrial'], createdAt: 20 },
  { img: hero, cat: 'Development Land', title: 'Ülemiste Greenfield Tech Park · 180 ha', location: 'Tallinn, Estonia', price: '€11,800,000', priceValue: 11.8, status: 'Available', yield: '18% IRR (modelled)', size: '180 ha', tags: ['Development', 'Land', 'Strategic'], createdAt: 21 },
  { img: mixed, cat: 'Mixed-Use', title: 'Avenue Louise 287 · Office & Residential Block', location: 'Ixelles, Brussels', price: '€48,600,000', priceValue: 48.6, status: 'Under Offer', yield: '6.2% net yield', tags: ['Mixed-use', 'CBD'], createdAt: 22 },
  { img: residential, cat: 'Residential', title: 'Bogenhausen Senior Living Community · 120 Beds', location: 'Bogenhausen, Munich', price: '€29,300,000', priceValue: 29.3, status: 'Closed 2024', yield: '6.0% net yield', beds: 120, baths: 120, tags: ['BTR'], createdAt: 23 },
  { img: coastal, cat: 'Coastal Land', title: 'ACI Marina-Front Plot with Permits', location: 'Split, Dalmatia', price: '€6,400,000', priceValue: 6.4, status: 'Available', yield: 'Tourism-zoned', size: '5.2 ha', tags: ['Beachfront', 'Ocean views', 'Tourism'], createdAt: 24 },
  { img: vineyard, cat: 'Agricultural Estate', title: 'Maison Verzenay Champagne Estate · 41 ha', location: 'Montagne de Reims', price: '€38,500,000', priceValue: 38.5, status: 'In Diligence', yield: '5.1% net + appreciation', size: '41 ha', tags: ['Agricultural', 'Heritage'], createdAt: 25 },
  { img: desert, cat: 'Strategic Land', title: 'Núñez de Balboa Solar Operating Asset · 240 MW', location: 'Usagre, Extremadura', price: '€96,000,000', priceValue: 96, status: 'Available', yield: 'PPA-linked, 7.9% IRR', size: '520 ha', tags: ['Solar', 'Land'], createdAt: 26 },
  { img: skyline, cat: 'Urban Tower', title: 'Schubertring Hotel & Office Tower · 31 Floors', location: 'Innere Stadt, Vienna', price: '€142,000,000', priceValue: 142, status: 'Closed 2025', yield: '5.8% net yield', tags: ['CBD', 'Mixed-use', 'Penthouse'], createdAt: 27 },
  { img: residential, cat: 'Residential', title: 'Jægersborggade Garden Quarter · 88 Apartments', location: 'Nørrebro, Copenhagen', price: '€36,800,000', priceValue: 36.8, status: 'Available', yield: '5.4% net yield', beds: 88, baths: 88, tags: ['BTR', 'City views'], createdAt: 28 },
  { img: vineyard, cat: 'Agricultural Estate', title: 'Castello di Greve Tuscan Estate · 160 ha', location: 'Greve in Chianti, Tuscany', price: '€18,200,000', priceValue: 18.2, status: 'Available', yield: '4.6% net + appreciation', size: '160 ha', tags: ['Agricultural', 'Heritage'], createdAt: 29 },
  { img: coastal, cat: 'Coastal Land', title: 'Praia da Luz Cliff Resort Plot · 22 ha', location: 'Lagos, Algarve', price: '€9,700,000', priceValue: 9.7, status: 'In Diligence', yield: 'Tourism-permitted', size: '22 ha', tags: ['Beachfront', 'Ocean views', 'Tourism'], createdAt: 30 },
  { img: mixed, cat: 'Mixed-Use', title: 'Prinsengracht 320 Canal-Side Block', location: 'Jordaan, Amsterdam', price: '€54,200,000', priceValue: 54.2, status: 'Available', yield: '5.9% net yield', tags: ['Mixed-use', 'Heritage'], createdAt: 31 },
  { img: skyline, cat: 'Urban Tower', title: 'Torre Picasso Annex · Class-A Office, 28 Floors', location: 'Azca, Madrid', price: '€98,500,000', priceValue: 98.5, status: 'Under Offer', yield: '5.6% net yield', tags: ['CBD', 'Office', 'City views'], createdAt: 32 },
  { img: desert, cat: 'Strategic Land', title: 'Larderello Geothermal-Ready Plateau · 540 ha', location: 'Pomarance, Tuscany', price: '€22,400,000', priceValue: 22.4, status: 'Available', yield: '8.1% IRR (modelled)', size: '540 ha', tags: ['Solar', 'Land', 'Strategic'], createdAt: 33 },
  { img: library, cat: 'Heritage Conversion', title: 'Théâtre Fémina Belle Époque Conversion', location: 'Bordeaux, Nouvelle-Aquitaine', price: '€14,600,000', priceValue: 14.6, status: 'In Planning', yield: '12% IRR (modelled)', tags: ['Heritage', 'Conversion'], createdAt: 34 },
  { img: markets, cat: 'Retail', title: 'Galleria San Carlo Boutique Arcade · 18 Units', location: 'Brera, Milan', price: '€26,800,000', priceValue: 26.8, status: 'Available', yield: '6.4% net yield', tags: ['Retail', 'CBD', 'Heritage'], createdAt: 35 },
  { img: tech, cat: 'Logistics', title: 'HafenCity Cross-Dock Hub · 58,000 m²', location: 'Port of Hamburg', price: '€71,300,000', priceValue: 71.3, status: 'Closed 2025', yield: '7.5% net yield', tags: ['Logistics', 'Industrial'], createdAt: 36 },
  { img: hero, cat: 'Development Land', title: 'Kalasatama Smart-City Masterplan · 320 ha', location: 'Helsinki, Uusimaa', price: '€26,900,000', priceValue: 26.9, status: 'In Diligence', yield: '17% IRR (modelled)', size: '320 ha', tags: ['Development', 'Land', 'Strategic'], createdAt: 37 },
  { img: residential, cat: 'Residential', title: 'Friedrichstraße Co-Living Tower · 240 Units', location: 'Mitte, Berlin', price: '€62,500,000', priceValue: 62.5, status: 'Available', yield: '5.7% net yield', beds: 240, baths: 240, tags: ['BTR', 'City views'], createdAt: 38 },
  { img: coastal, cat: 'Coastal Land', title: 'Cala Sant Francesc Beachfront · 18 ha', location: 'Blanes, Costa Brava', price: '€11,800,000', priceValue: 11.8, status: 'Available', yield: 'Resort-permitted', size: '18 ha', tags: ['Beachfront', 'Ocean views', 'Tourism'], createdAt: 39 },
  { img: vineyard, cat: 'Agricultural Estate', title: 'Quinta do Vale Meão · Douro Valley, 76 ha', location: 'Vila Nova de Foz Côa, Douro', price: '€15,400,000', priceValue: 15.4, status: 'Under Offer', yield: '4.4% net + appreciation', size: '76 ha', tags: ['Agricultural', 'Heritage'], createdAt: 40 },
  { img: skyline, cat: 'Urban Tower', title: 'Norra Bantorget Residential Spire · 46 Floors', location: 'Norrmalm, Stockholm', price: '€118,000,000', priceValue: 118, status: 'In Diligence', yield: '5.3% net yield', tags: ['CBD', 'City views', 'Penthouse'], createdAt: 41 },
  { img: mixed, cat: 'Mixed-Use', title: 'Bahnhofstrasse 42 Station-Adjacent Block', location: 'Kreis 1, Zürich', price: '€88,600,000', priceValue: 88.6, status: 'Available', yield: '6.0% net yield', tags: ['Mixed-use', 'CBD'], createdAt: 42 },
];

const FEATURE_TAGS = [
  { label: 'Beachfront', icon: Waves },
  { label: 'City views', icon: Building2 },
  { label: 'Ocean views', icon: Waves },
  { label: 'Penthouse', icon: Landmark },
  { label: 'Heritage', icon: Landmark },
  { label: 'Agricultural', icon: Wheat },
  { label: 'Land', icon: Mountain },
  { label: 'Logistics', icon: Factory },
  { label: 'Solar', icon: Leaf },
  { label: 'Retail', icon: Store },
];

const MODES = ['Buy', 'Invest', 'Land', 'Projects', 'Sold'] as const;
type Mode = typeof MODES[number];

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-desc', label: 'Price · high to low' },
  { value: 'price-asc', label: 'Price · low to high' },
] as const;
type Sort = typeof SORTS[number]['value'];

// Price options in € millions (matches realestate.com.au-style ladder)
const PRICE_STEPS = [
  '0.25', '0.5', '0.75', '1', '1.25', '1.5', '2', '2.5', '3', '4', '5',
  '6', '7', '8', '10', '12', '15', '20', '25', '30', '40', '50',
  '60', '75', '100', '125', '150',
];

const CATEGORY_ALIASES: Record<string, string> = {
  apartment: 'Apartment',
  apartments: 'Apartment',
  villa: 'Villa',
  villas: 'Villa',
  plot: 'Land / Plot',
  plots: 'Land / Plot',
  land: 'Land / Plot',
  'land / plot': 'Land / Plot',
  'boutique hotel': 'Hotel',
  hotel: 'Hotel',
};

const normalizePropertyCategory = (category: string | null | undefined) => {
  const trimmed = (category ?? '').trim();
  return CATEGORY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
};

const findCategoryFromTerm = (term: string, categories: string[]) => {
  const normalized = normalizePropertyCategory(term).toLowerCase();
  if (!normalized) return undefined;
  const singular = normalized.endsWith('s') ? normalized.slice(0, -1) : normalized;
  return (
    categories.find((category) => category.toLowerCase() === normalized) ??
    categories.find((category) => category.toLowerCase() === singular) ??
    categories.find((category) => {
      const c = category.toLowerCase();
      const cSingular = c.endsWith('s') ? c.slice(0, -1) : c;
      return cSingular === singular;
    }) ??
    categories.find((category) => {
      const c = category.toLowerCase();
      return c.includes(normalized) || normalized.includes(c);
    })
  );
};

const Properties = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<EnquiryProperty | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPrivateDossier, setOpenPrivateDossier] = useState(false);
  const [openTour, setOpenTour] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined' && document.body) setPortalTarget(document.body);
  }, []);

  const normalizeMode = (raw: string | null): Mode => {
    if (!raw) return 'Buy';
    const found = MODES.find((m) => m.toLowerCase() === raw.toLowerCase());
    return found ?? 'Buy';
  };
  const [mode, setMode] = useState<Mode>(normalizeMode(params.get('mode')));
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<string[]>(
    params.get('locs')?.split('|').filter(Boolean) ??
    (params.get('q') ? params.get('q')!.split(',').map((s) => s.trim()).filter(Boolean) : [])
  );
  const [keywords, setKeywords] = useState<string[]>(
    params.get('kw')?.split(',').map((k) => k.trim()).filter(Boolean) ?? []
  );
  const [keywordInput, setKeywordInput] = useState('');
  const [kwSuggestOpen, setKwSuggestOpen] = useState(false);
  const [region, setRegion] = useState(params.get('region') ?? '');
  const [activeTags, setActiveTags] = useState<string[]>(
    params.get('tags')?.split(',').filter(Boolean) ?? []
  );
  const [sort, setSort] = useState<Sort>('newest');
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listingTab, setListingTab] = useState<'Buy' | 'Rent' | 'Sold'>('Buy');
  const [surrounding, setSurrounding] = useState(false);
  const [page, setPage] = useState<number>(Math.max(1, Number(params.get('page') ?? 1)));
  const PAGE_SIZE = 24;

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [filtersOpen]);
  const [minPrice, setMinPrice] = useState<string>(params.get('min') ?? '');
  const [maxPrice, setMaxPrice] = useState<string>(params.get('max') ?? '');
  const [minBeds, setMinBeds] = useState<number>(Number(params.get('beds') ?? 0));
  const [maxBeds, setMaxBeds] = useState<number>(Number(params.get('maxbeds') ?? 0));
  const [minBaths, setMinBaths] = useState<number>(Number(params.get('baths') ?? 0));
  const [activeCats, setActiveCats] = useState<string[]>(
    params.get('cats')?.split(',').map(normalizePropertyCategory).filter(Boolean) ?? []
  );
  const [energyRatings, setEnergyRatings] = useState<string[]>(
    params.get('energy')?.split(',').filter(Boolean) ?? []
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [locating, setLocating] = useState(false);
  const parseNear = (raw: string | null): { lat: number; lng: number; label: string } | null => {
    if (!raw) return null;
    const [lat, lng, ...rest] = raw.split(',');
    const latN = Number(lat);
    const lngN = Number(lng);
    if (Number.isNaN(latN) || Number.isNaN(lngN)) return null;
    return { lat: latN, lng: lngN, label: rest.join(',') || 'My location' };
  };
  const [nearMe, setNearMe] = useState<{ lat: number; lng: number; label: string } | null>(
    parseNear(params.get('near'))
  );
  const { recent, addRecent, removeRecent, clearRecent } = useRecentSearches();
  const { isFavorite, toggle } = useFavorites();
  const { user } = useAuth();

  const addLocation = (loc: string) => {
    const trimmed = loc.trim();
    if (!trimmed) return;
    setLocations((prev) => {
      if (prev.some((p) => p.toLowerCase() === trimmed.toLowerCase())) return prev;
      if (prev.length >= 5) return prev;
      return [...prev, trimmed];
    });
  };
  const removeLocation = (loc: string) =>
    setLocations((prev) => prev.filter((p) => p !== loc));

  const useCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Location is not supported on this device');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let label = 'My location';
        try {
          const { data } = await supabase.functions.invoke('reverse-geocode', {
            body: { lat, lng },
          });
          if (data?.locality) label = data.locality;
        } catch {
          // keep generic label
        } finally {
          setNearMe({ lat, lng, label });
          addRecent(`${label} (within 2 km)`);
          setLocating(false);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          const inIframe = typeof window !== 'undefined' && window.self !== window.top;
          toast.error(
            inIframe
              ? 'Location is blocked in the preview. Open the published site to use it, or allow location access in your browser.'
              : 'Location permission denied. Please allow location access in your browser settings.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          toast.error('Your location is currently unavailable. Please try again.');
        } else if (err.code === err.TIMEOUT) {
          toast.error('Getting your location timed out. Please try again.');
        } else {
          toast.error('Could not get your location.');
        }
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const removeNearMe = () => setNearMe(null);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (error || !data) { setLoading(false); return; }
      // Every property/unit is shown individually as its own card.
      const mapped: Property[] = (data as any[]).map((row: any) => ({
        id: row.id,
        slug: row.slug,
        img: row.cover_image || (row.images && row.images[0]) || IMAGE_MAP[row.image_key] || hero,
        images: (() => {
          const list = [row.cover_image, ...(Array.isArray(row.images) ? row.images : [])].filter(Boolean);
          const unique = Array.from(new Set(list));
          return unique.length ? unique : undefined;
        })(),
        cat: normalizePropertyCategory(row.category),
        title: row.title,
        location: row.location,
        city: row.city ?? undefined,
        region: row.region ?? undefined,
        district: (row as any).district ?? undefined,
        price: row.price,
        priceValue: Number(row.price_value) / 1_000_000,
        status: row.status,
        yield: row.yield ?? '',
        beds: row.beds ?? undefined,
        baths: row.baths ?? row.beds ?? undefined,
        size: row.size ?? undefined,
        tags: row.tags ?? [],
        description: row.description ?? '',
        energyRating: row.energy_rating ?? undefined,
        createdAt: row.created_at ? new Date(row.created_at).getTime() : (row.sort_order ?? 0),
        lat: row.latitude != null ? Number(row.latitude) : undefined,
        lng: row.longitude != null ? Number(row.longitude) : undefined,
        listing_type: row.listing_type ?? undefined,
        internalArea: row.internal_area ?? undefined,
        coveredVerandas: row.covered_verandas ?? undefined,
        isProject: typeof row.title === 'string' && row.title.includes(' - '),
      }));
      setProperties(mapped);
      setLoading(false);

    })();
    return () => { cancelled = true; };
  }, []);

  // Keep filters in sync with the URL when navigating between query strings on this page
  useEffect(() => {
    setQuery('');
    setMode(normalizeMode(params.get('mode')));
    setLocations(
      params.get('locs')?.split('|').filter(Boolean) ??
      (params.get('q') ? params.get('q')!.split(',').map((s) => s.trim()).filter(Boolean) : [])
    );
    setRegion(params.get('region') ?? '');
    setNearMe(parseNear(params.get('near')));
    setKeywords(params.get('kw')?.split(',').map((k) => k.trim()).filter(Boolean) ?? []);
    setActiveTags(params.get('tags')?.split(',').filter(Boolean) ?? []);
    setActiveCats(params.get('cats')?.split(',').map(normalizePropertyCategory).filter(Boolean) ?? []);
    setMinPrice(params.get('min') ?? '');
    setMaxPrice(params.get('max') ?? '');
    setMinBeds(Number(params.get('beds') ?? 0));
    setMaxBeds(Number(params.get('maxbeds') ?? 0));
    setMinBaths(Number(params.get('baths') ?? 0));
    setEnergyRatings(params.get('energy')?.split(',').filter(Boolean) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const openEnquiry = (p: Property) => {
    setSelected({
      ...p,
      title: publicTitle(p.title),
      location: formatPropertyLocation(p),
      referenceCode: displayReference((p as any).reference_code, p.id),
    });
    setOpenDialog(true);
  };

  const saveCurrentSearch = async () => {
    if (!user) {
      toast.error('Sign in to save searches', { action: { label: 'Sign in', onClick: () => (window.location.href = '/auth') } });
      return;
    }
    const locLabel = locations.length ? ` · ${locations.join(', ')}` : '';
    const name = window.prompt('Name this search', `${mode}${locLabel}${region ? ` · ${region}` : ''}`);
    if (!name) return;
    const { error } = await supabase.from('saved_searches').insert({
      user_id: user.id, name, mode, query: locations.length ? locations.join('|') : null, region: region || null, tags: activeTags.length ? activeTags : null,
    });
    if (error) toast.error(error.message);
    else toast.success('Search saved to your account');
  };

  const toggleTag = (t: string) => {
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const addKeyword = (raw: string) => {
    const k = raw.trim();
    if (!k) return;
    setKeywords((prev) => (prev.some((x) => x.toLowerCase() === k.toLowerCase()) ? prev : [...prev, k]));
    setKeywordInput('');
    setKwSuggestOpen(false);
  };
  const removeKeyword = (k: string) => setKeywords((prev) => prev.filter((x) => x !== k));

  // Set of known location strings (full + comma-split parts), lowercased.
  const locationVocab = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      if (!p.location) return;
      set.add(p.location.toLowerCase());
      p.location.split(',').forEach((part) => {
        const v = part.trim().toLowerCase();
        if (v) set.add(v);
      });
    });
    return set;
  }, [properties]);

  const isLocationTerm = (term: string) => {
    const t = term.trim().toLowerCase();
    if (!t) return false;
    return Array.from(locationVocab).some((loc) => loc.includes(t) || t.includes(loc));
  };

  const addLocationRecent = (term: string) => {
    if (isLocationTerm(term)) addRecent(term);
  };

  const keywordVocab = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => {
      (p.tags ?? []).forEach((t) => set.add(t));
      if (p.cat) set.add(p.cat);
      if (p.location) p.location.split(',').forEach((part) => { const v = part.trim(); if (v) set.add(v); });
    });
    return Array.from(set);
  }, [properties]);

  const keywordSuggestions = useMemo(() => {
    const q = keywordInput.trim().toLowerCase();
    if (!q) return [];
    return keywordVocab
      .filter((v) => v.toLowerCase().includes(q) && !keywords.some((k) => k.toLowerCase() === v.toLowerCase()))
      .slice(0, 6);
  }, [keywordInput, keywordVocab, keywords]);

  const buildParams = () => {
    const next = new URLSearchParams();
    next.set('mode', mode.toLowerCase());
    if (locations.length) next.set('locs', locations.join('|'));
    if (keywords.length) next.set('kw', keywords.join(','));
    if (region.trim()) next.set('region', region.trim());
    if (activeTags.length) next.set('tags', activeTags.join(','));
    if (activeCats.length) next.set('cats', activeCats.join(','));
    if (minPrice) next.set('min', minPrice);
    if (maxPrice) next.set('max', maxPrice);
    if (minBeds > 0) next.set('beds', String(minBeds));
    if (maxBeds > 0) next.set('maxbeds', String(maxBeds));
    if (minBaths > 0) next.set('baths', String(minBaths));
    if (energyRatings.length) next.set('energy', energyRatings.join(','));
    return next;
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addLocation(query.trim());
      addLocationRecent(query.trim());
      setQuery('');
    }
    setParams(buildParams(), { replace: true });
  };

  const applyFilters = () => {
    setParams(buildParams(), { replace: true });
    setFiltersOpen(false);
  };

  const allCategories = useMemo(
    () => Array.from(new Set(properties.map((p) => p.cat).filter(Boolean))).sort(),
    [properties]
  );

  const keywordCategoryFilter = useMemo(
    () => Array.from(new Set(keywords.map((kw) => findCategoryFromTerm(kw, allCategories)).filter(Boolean) as string[])),
    [keywords, allCategories]
  );

  const effectiveActiveCats = keywordCategoryFilter.length ? keywordCategoryFilter : activeCats;

  useEffect(() => {
    if (!keywordCategoryFilter.length || !activeCats.length) return;
    if (activeCats.every((cat) => keywordCategoryFilter.includes(cat))) return;
    setActiveCats(keywordCategoryFilter);
  }, [keywordCategoryFilter, activeCats]);

  const filtered = useMemo(() => {
    let list = [...properties];

    if (mode === 'Sold') list = list.filter((p) => /closed|sold/i.test(p.status));
    else if (mode === 'Projects')
      list = list.filter((p) => p.isProject && !/closed|sold/i.test(p.status));
    else if (mode === 'Land')
      list = list.filter((p) => /land|estate|coastal|strategic/i.test(p.cat));
    else if (mode === 'Invest')
      list = list.filter((p) => p.listing_type === 'rent' && !/closed|sold/i.test(p.status));
    else if (mode === 'Buy')
      list = list.filter((p) => !/closed|sold/i.test(p.status));

    if (locations.length > 0 || nearMe) {
      list = list.filter((p) => {
        const loc = p.location.toLowerCase();
        const matchesText = locations.some((q) => {
          const qq = q.toLowerCase();
          const parts = qq.split(',').map((s) => s.trim()).filter(Boolean);
          // Only match on the primary (most specific) part of a "Place, District"
          // suggestion — e.g. "Chloraka, Paphos" must match "Chloraka" specifically,
          // not just any property that happens to be in the Paphos district.
          const primary = parts[0] ?? qq;
          const matches = (hay: string) =>
            hay.includes(qq) || hay.includes(primary) || primary.includes(hay);
          return matches(loc);
        });
        const matchesRadius =
          !!nearMe &&
          p.lat != null &&
          p.lng != null &&
          haversineKm(nearMe.lat, nearMe.lng, p.lat, p.lng) <= 2;
        return matchesText || matchesRadius;
      });
    }


    if (keywords.length) {
      list = list.filter((p) =>
        keywords.every((kw) => {
          const k = kw.toLowerCase();
          // If the keyword names a category, match by category only
          // so e.g. "apartment" doesn't surface a plot whose description
          // merely mentions the word "apartments".
          const categoryMatch = findCategoryFromTerm(kw, allCategories);
          if (categoryMatch) {
            return p.cat === categoryMatch;
          }
          return (
            p.title.toLowerCase().includes(k) ||
            p.cat.toLowerCase().includes(k) ||
            p.location.toLowerCase().includes(k) ||
            (p.description ?? '').toLowerCase().includes(k) ||
            (p.tags ?? []).some((t) => t.toLowerCase().includes(k))
          );
        })
      );
    }


    if (region.trim()) {
      const r = region.toLowerCase();
      list = list.filter((p) => p.location.toLowerCase().includes(r));
    }

    if (activeTags.length) {
      list = list.filter((p) => activeTags.every((t) => p.tags.includes(t)));
    }

    if (effectiveActiveCats.length) {
      list = list.filter((p) => effectiveActiveCats.includes(p.cat));
    }

    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    if (min !== null && !Number.isNaN(min)) list = list.filter((p) => p.priceValue >= min);
    if (max !== null && !Number.isNaN(max)) list = list.filter((p) => p.priceValue <= max);

    if (minBeds > 0) list = list.filter((p) => (p.beds ?? 0) >= minBeds);
    if (maxBeds > 0) list = list.filter((p) => (p.beds ?? 0) <= maxBeds);
    if (minBaths > 0) list = list.filter((p) => (p.baths ?? 0) >= minBaths);

    if (energyRatings.length) {
      list = list.filter((p) => p.energyRating && energyRatings.includes(p.energyRating));
    }

    if (sort === 'price-asc' || sort === 'price-desc') {
      // Keep "Price on request" (no price) items at the bottom regardless of direction.
      list.sort((a, b) => {
        const aHas = a.priceValue > 0;
        const bHas = b.priceValue > 0;
        if (aHas !== bHas) return aHas ? -1 : 1;
        return sort === 'price-asc'
          ? a.priceValue - b.priceValue
          : b.priceValue - a.priceValue;
      });
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return list;
  }, [mode, locations, nearMe, keywords, region, activeTags, effectiveActiveCats, minPrice, maxPrice, minBeds, maxBeds, minBaths, energyRatings, sort, properties, allCategories]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleCount = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const paged = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  useEffect(() => { setPage(1); }, [mode, locations, nearMe, keywords, region, activeTags, effectiveActiveCats, minPrice, maxPrice, minBeds, maxBeds, minBaths, energyRatings, sort]);

  useEffect(() => {
    if (!region && !effectiveActiveCats.length && !minPrice && !maxPrice && !minBeds) return;
    trackSearch({
      region: region || null,
      category: effectiveActiveCats[0] || null,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      beds: minBeds ? Number(minBeds) : null,
    });
  }, [region, effectiveActiveCats, minPrice, maxPrice, minBeds]);

  // ItemList structured data so search engines understand the property grid.
  const listJsonLd = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';
    const items = paged
      .filter((p) => p.id || p.slug)
      .slice(0, 25)
      .map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}/properties/${p.slug || p.id}`,
        name: p.title,
      }));
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Properties for sale in Cyprus',
      numberOfItems: items.length,
      itemListElement: items,
    };
  }, [paged]);

  const goToPage = (n: number) => {
    const next = Math.min(Math.max(1, n), totalPages);
    setPage(next);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilterCount =
    locations.length +
    (nearMe ? 1 : 0) +
    activeTags.length +
    effectiveActiveCats.length +
    keywords.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minBeds > 0 ? 1 : 0) +
    (maxBeds > 0 ? 1 : 0) +
    (minBaths > 0 ? 1 : 0) +
    energyRatings.length;

  // Heading location reflects the searched location(s); defaults to Paphos.
  const headingLocation = useMemo(() => {
    if (!locations.length) return 'Paphos';
    const cities = Array.from(
      new Set(
        locations.map((loc) => {
          const parts = loc.split(',').map((s) => s.trim()).filter(Boolean);
          return parts[parts.length - 1] || loc;
        }),
      ),
    );
    if (cities.length === 1) return cities[0];
    if (cities.length === 2) return `${cities[0]} & ${cities[1]}`;
    return `${cities.slice(0, -1).join(', ')} & ${cities[cities.length - 1]}`;
  }, [locations]);

  const headingText =
    mode === 'Invest'
      ? `Rent Property in ${headingLocation}`
      : mode === 'Sold'
        ? `Sold Property in ${headingLocation}`
        : mode === 'Projects'
          ? `New Projects in ${headingLocation}`
          : `Buy Property in ${headingLocation}`;

  const priceHistogram = useMemo(() => {
    const values = properties.map((p) => p.priceValue).filter((v) => v > 0);
    if (!values.length) return { bins: [] as number[], max: 0, min: 0, ceil: 0 };
    const lo = 0;
    const hi = Math.ceil(Math.max(...values) / 10) * 10;
    const BINS = 48;
    const bins = new Array(BINS).fill(0);
    const step = (hi - lo) / BINS;
    values.forEach((v) => {
      const i = Math.min(BINS - 1, Math.floor((v - lo) / step));
      bins[i]++;
    });
    return { bins, max: Math.max(...bins), min: lo, ceil: hi };
  }, [properties]);

  const resetFilters = () => {
    setLocations([]);
    setNearMe(null);
    setQuery('');
    setActiveTags([]);
    setActiveCats([]);
    setMinPrice('');
    setMaxPrice('');
    setMinBeds(0);
    setMaxBeds(0);
    setMinBaths(0);
    setEnergyRatings([]);
    setKeywords([]);
    setKeywordInput('');
  };

  const [alertOpen, setAlertOpen] = useState(false);
  const alertCriteria = useMemo(() => ({
    listing_type: mode === 'Invest' ? 'rent' : mode === 'Buy' ? 'sale' : null,
    categories: activeCats,
    regions: [...locations, ...(region ? [region] : [])],
    budget_min: minPrice ? Number(minPrice) : null,
    budget_max: maxPrice ? Number(maxPrice) : null,
    min_beds: minBeds || null,
    min_baths: minBaths || null,
    tags: activeTags,
  }), [mode, activeCats, locations, region, minPrice, maxPrice, minBeds, minBaths, activeTags]);
  const alertSummary = useMemo(() => {
    const parts: string[] = [];
    if (alertCriteria.listing_type) parts.push(alertCriteria.listing_type === 'rent' ? 'For rent' : 'For sale');
    if (alertCriteria.categories.length) parts.push(alertCriteria.categories.join(', '));
    if (alertCriteria.regions.length) parts.push(`in ${alertCriteria.regions.join(', ')}`);
    if (alertCriteria.budget_min || alertCriteria.budget_max)
      parts.push(`€${alertCriteria.budget_min || 0}–${alertCriteria.budget_max || '∞'}`);
    if (alertCriteria.min_beds) parts.push(`${alertCriteria.min_beds}+ beds`);
    if (alertCriteria.min_baths) parts.push(`${alertCriteria.min_baths}+ baths`);
    if (alertCriteria.tags.length) parts.push(alertCriteria.tags.join(', '));
    return parts.length ? parts.join(' · ') : 'Any new property';
  }, [alertCriteria]);

  return (
    <>
    <SEO
      title="Property for Sale in Cyprus — Paphos & Limassol Real Estate"
      description="Browse houses, villas, apartments and land for sale in Cyprus. Explore Paphos and Limassol real estate listings and off-market investment opportunities with Memories."
      jsonLd={listJsonLd}
    />
    <div className="bg-white text-[hsl(212_100%_10%)] [--foreground:212_100%_10%] [--background:0_0%_100%] [--muted:0_0%_94%] min-h-screen">
      {/* Marshall White-style search header */}
      <div className="bg-white border-b border-[hsl(212_100%_10%)]/10">
        <div className="container mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-10">
          <h1 className="text-center font-semibold tracking-tight text-[hsl(212_100%_10%)] uppercase text-2xl sm:text-4xl mb-8 sm:mb-10">
            <span className="sr-only">
              {headingText}
            </span>
            <span aria-hidden="true">{headingText}</span>
          </h1>
          <form onSubmit={onSearch} className="w-full max-w-[974px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-0 sm:bg-[hsl(0_0%_94%)] sm:h-[54px]">
              {/* Mode selector (BUY / RENT) */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="group/ctrl relative inline-flex items-center justify-between gap-3 px-4 sm:pl-6 sm:pr-10 h-11 sm:h-full bg-[hsl(212_100%_10%)] text-white uppercase tracking-[0.2em] sm:tracking-[0.08em] font-montserrat font-extrabold hover:opacity-95 transition-opacity whitespace-nowrap text-xs sm:text-base shrink-0 w-full sm:w-[166px]"
                  >
                    <span>{mode === 'Invest' ? 'RENT' : mode === 'Sold' ? 'SOLD' : mode === 'Projects' ? 'PROJECTS' : 'BUY'}</span>
                    <ChevronDown size={14} className="absolute right-3 opacity-80 transition-transform duration-200 group-data-[state=open]/ctrl:rotate-180" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={0} className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border border-[hsl(212_100%_10%)]/15 rounded-none shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] z-[60]">
                  {(['Buy', 'Invest'] as Mode[]).map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`w-full text-left px-5 py-3.5 text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-widest font-semibold transition-colors ${
                        i > 0 ? 'border-t border-[hsl(212_100%_10%)]/10' : ''
                      } ${
                        mode === m ? 'bg-[hsl(212_100%_10%)] text-white' : 'text-[hsl(212_100%_10%)] hover:text-accent transition-colors text-xs'
                      }`}
                    >
                      {m === 'Invest' ? 'Rent' : m}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => navigate('/developments')}
                    className="w-full text-left px-5 py-3.5 text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-widest font-semibold transition-colors border-t border-[hsl(212_100%_10%)]/10 text-[hsl(212_100%_10%)] hover:text-accent transition-colors text-xs"
                  >
                    Projects
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('Sold')}
                    className={`w-full text-left px-5 py-3.5 text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-widest font-semibold transition-colors border-t border-[hsl(212_100%_10%)]/10 ${
                      mode === 'Sold' ? 'bg-[hsl(212_100%_10%)] text-white' : 'text-[hsl(212_100%_10%)] hover:text-accent transition-colors text-xs'
                    }`}
                  >
                    Sold
                  </button>
                </PopoverContent>
              </Popover>

              <div className="relative w-full sm:flex-1 flex items-center bg-white border border-[hsl(212_100%_10%)]/15 sm:bg-transparent sm:border-0 h-[40px] sm:h-auto">
                <MultiLocationSearch
                  locations={locations}
                  onAdd={addLocation}
                  onRemove={removeLocation}
                  recent={recent}
                  onAddRecent={addRecent}
                  onRemoveRecent={removeRecent}
                  onClearRecent={clearRecent}
                  onUseCurrentLocation={useCurrentLocation}
                  locating={locating}
                  nearMeLabel={nearMe ? `${nearMe.label} + 2 km` : null}
                  onRemoveNearMe={removeNearMe}
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="sm:hidden inline-flex items-center justify-center w-10 h-full text-foreground shrink-0"
                >
                  <Search size={18} strokeWidth={2} />
                </button>
              </div>

              {/* Filter pill (desktop) */}
              <div className="hidden sm:flex items-center pr-3 bg-[hsl(0_0%_94%)] py-1.5 pl-2">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 h-8 bg-white text-foreground text-xs font-medium border border-[hsl(212_100%_10%)]/10 hover:border-accent/40 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Filter</span>
                  <span className="text-base leading-none">+</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Desktop search submit (icon only) */}
              <button
                type="submit"
                aria-label="Search"
                className="hidden sm:inline-flex items-center justify-center w-14 h-full text-foreground hover:text-accent transition-colors text-xs shrink-0 bg-[hsl(0_0%_94%)]"
              >
                <Search size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Mobile filter row — full width, with + on the right */}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="sm:hidden mt-2 inline-flex items-center justify-between px-5 h-10 max-h-10 bg-white border border-[hsl(212_100%_10%)]/15 text-[hsl(212_100%_10%)] text-sm font-medium w-full"
            >
              <span>Filter</span>
              <span className="inline-flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                    {activeFilterCount}
                  </span>
                )}
                <span className="text-lg leading-none">+</span>
              </span>
            </button>

            {/* Filters portal host */}
            <div className="hidden">

                {filtersOpen && createPortal(
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-[100] bg-[hsl(212_100%_10%)]/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
                      onClick={() => setFiltersOpen(false)}
                      aria-hidden
                    />
                    {/* Panel — full-screen on mobile, centered modal on desktop */}
                    <div
                      className="fixed z-[110] inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[560px] sm:max-h-[88vh] flex flex-col bg-white text-foreground sm:rounded-xl sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in-0 sm:zoom-in-95 slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200"
                      role="dialog"
                      aria-label="Filters"
                    >
                      {/* Sticky header — centered title with close */}
                      <div className="sticky top-0 z-10 flex items-center justify-center px-4 sm:px-6 h-14 sm:h-auto sm:pt-8 sm:pb-2 bg-white">
                        <button
                          type="button"
                          onClick={() => setFiltersOpen(false)}
                          aria-label="Close filters"
                          className="sm:hidden absolute left-2 w-10 h-10 inline-flex items-center justify-center rounded-full text-foreground hover:bg-foreground/10"
                        >
                          <ChevronLeft size={22} />
                        </button>
                        <h3 className="text-base sm:text-xl font-bold uppercase tracking-[0.22em] text-foreground">Filters</h3>
                        <button
                          type="button"
                          onClick={() => setFiltersOpen(false)}
                          aria-label="Close filters"
                          className="absolute right-3 sm:right-5 top-3 sm:top-5 w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/10"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Scrollable body */}
                      <div className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-10 py-6 space-y-8">
                        {/* Mode tabs */}
                        <div className="grid grid-cols-3 gap-0 border border-foreground/20">
                          {(['Buy', 'Rent', 'Sold'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setListingTab(t)}
                              className={`h-[38px] uppercase tracking-[0.28em] font-semibold transition-colors text-sm ${
                                listingTab === t
                                  ? 'bg-foreground text-white'
                                  : 'bg-transparent text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Search input */}
                        <div className="-mt-2">
                          <LocationAutocomplete
                            value={query}
                            onChange={setQuery}
                            placeholder="Search by Location"
                            className="w-full bg-foreground/10 px-5 h-[43px] text-foreground placeholder:text-foreground/50 text-sm focus:outline-none focus:bg-foreground/15 border border-foreground/20"
                          />
                        </div>

                        {/* Property type */}
                        <section>
                          <h3 className="font-bold uppercase tracking-tight mb-5 text-lg text-[hsl(222_47%_20%)]">Property type</h3>
                          <div className="grid grid-cols-2 gap-2.5">
                            {(() => {
                              const isAny = activeCats.length === 0;
                              return (
                                <label
                                  className={`flex items-center gap-3 cursor-pointer border px-3.5 py-3 text-sm leading-snug transition-colors ${
                                    isAny
                                      ? 'border-foreground bg-foreground/[0.06] text-foreground font-medium'
                                      : 'border-foreground/15 text-foreground/80 hover:border-foreground/40 hover:bg-foreground/[0.03]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isAny}
                                    onChange={() => setActiveCats([])}
                                    className="w-4 h-4 shrink-0 accent-foreground"
                                  />
                                  Any
                                </label>
                              );
                            })()}
                            {allCategories.map((c) => {
                              const checked = effectiveActiveCats.includes(c);
                              return (
                                <label
                                  key={c}
                                  className={`flex items-center gap-3 cursor-pointer border px-3.5 py-3 text-sm leading-snug transition-colors ${
                                    checked
                                      ? 'border-foreground bg-foreground/[0.06] text-foreground font-medium'
                                      : 'border-foreground/15 text-foreground/80 hover:border-foreground/40 hover:bg-foreground/[0.03]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      setActiveCats((prev) =>
                                        prev.includes(c)
                                          ? prev.filter((x) => x !== c)
                                          : [...prev, c]
                                      )
                                    }
                                    className="w-4 h-4 shrink-0 accent-foreground"
                                  />
                                  {c}
                                </label>
                              );
                            })}
                          </div>
                        </section>


                        {/* Price */}
                        <section>
                          <h3 className="font-bold uppercase tracking-tight mb-5 text-lg text-[hsl(222_47%_20%)]">Price</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <PriceSelect
                              value={minPrice}
                              onChange={setMinPrice}
                              placeholder="Min"
                              options={PRICE_STEPS.map((v) => ({
                                value: v,
                                label: `€${v}M`,
                                disabled: !!maxPrice && Number(v) >= Number(maxPrice),
                              }))}
                            />
                            <PriceSelect
                              value={maxPrice}
                              onChange={setMaxPrice}
                              placeholder="Max"
                              options={PRICE_STEPS.map((v) => ({
                                value: v,
                                label: `€${v}M`,
                                disabled: !!minPrice && Number(v) <= Number(minPrice),
                              }))}
                            />
                          </div>
                        </section>

                        {/* Bedrooms */}
                        <section>
                          <h3 className="font-bold uppercase tracking-tight mb-5 text-base text-[hsl(222_47%_20%)]">Bedrooms</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <PriceSelect
                              value={minBeds ? String(minBeds) : ''}
                              onChange={(v) => setMinBeds(v ? Number(v) : 0)}
                              placeholder="Min"
                              options={[1, 2, 3, 4, 5].map((b) => ({
                                value: String(b),
                                label: `${b}+`,
                                disabled: !!maxBeds && b >= maxBeds,
                              }))}
                            />
                            <PriceSelect
                              value={maxBeds ? String(maxBeds) : ''}
                              onChange={(v) => setMaxBeds(v ? Number(v) : 0)}
                              placeholder="Max"
                              options={[1, 2, 3, 4, 5].map((b) => ({
                                value: String(b),
                                label: `${b}+`,
                                disabled: !!minBeds && b <= minBeds,
                              }))}
                            />
                          </div>
                        </section>

                        {/* Bathrooms */}
                        <section>
                          <h3 className="font-bold uppercase tracking-tight mb-5 text-lg text-[hsl(222_47%_20%)]">Bathrooms</h3>
                          <PriceSelect
                            value={minBaths ? String(minBaths) : ''}
                            onChange={(v) => setMinBaths(v ? Number(v) : 0)}
                            placeholder="Any"
                            options={[1, 2, 3, 4, 5].map((b) => ({
                              value: String(b),
                              label: `${b}+`,
                            }))}
                          />
                        </section>

                        {/* Keyword search */}
                        <section>
                          <h3 className="font-bold uppercase tracking-tight mb-5 text-lg text-[hsl(222_47%_20%)]">Keyword search</h3>
                          {keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {keywords.map((kw) => (
                                <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[hsl(212_100%_10%)]/5 text-[hsl(212_100%_10%)] text-xs">
                                  {kw}
                                  <button type="button" onClick={() => removeKeyword(kw)} aria-label={`Remove ${kw}`}>
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="relative">
                            <input
                              type="text"
                              value={keywordInput}
                              onChange={(e) => { setKeywordInput(e.target.value); setKwSuggestOpen(true); }}
                              onFocus={() => setKwSuggestOpen(true)}
                              onBlur={() => setTimeout(() => setKwSuggestOpen(false), 150)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addKeyword(keywordInput); }
                                else if (e.key === 'Backspace' && !keywordInput && keywords.length) removeKeyword(keywords[keywords.length - 1]);
                              }}
                              placeholder="Add keyword and press Enter"
                              className="w-full bg-white px-5 h-[43px] text-foreground placeholder:text-foreground/50 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/30 border border-foreground/20"
                            />
                            {kwSuggestOpen && keywordSuggestions.length > 0 && (
                              <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-foreground/20 shadow-lg max-h-56 overflow-auto">
                                {keywordSuggestions.map((s) => (
                                  <li key={s}>
                                    <button
                                      type="button"
                                      onMouseDown={(e) => { e.preventDefault(); addKeyword(s); }}
                                      className="w-full text-left px-5 py-2 text-sm text-foreground hover:bg-[hsl(212_100%_10%)]/5"
                                    >
                                      {s}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </section>





                        {/* Surrounding regions */}
                        <label className="flex items-center gap-3 cursor-pointer text-foreground">
                          <input
                            type="checkbox"
                            checked={surrounding}
                            onChange={(e) => setSurrounding(e.target.checked)}
                            className="w-4 h-4 accent-foreground"
                          />
                          <span className="text-sm">Include surrounding regions</span>
                        </label>
                      </div>


                      {/* Sticky footer */}
                      <div className="sticky bottom-0 bg-white border-t border-foreground/15 px-6 sm:px-10 py-2 sm:py-4 pb-[max(env(safe-area-inset-bottom),1rem)] flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="story-link text-base tracking-[0.22em] font-medium text-foreground/60 hover:text-accent transition-colors"
                        >
                          Reset Filters
                        </button>
                        <button
                          type="button"
                          onClick={applyFilters}
                          className="btn-cta-solid btn-cta-sm px-8"
                        >
                          Search
                        </button>
                      </div>


                    </div>
                  </>,
                  document.body
                )}
              </div>
          </form>

          {/* Active filters */}
          {(activeTags.length > 0 || keywords.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {keywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => removeKeyword(kw)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[hsl(212_100%_10%)]/5 text-[hsl(212_100%_10%)] label hover:text-accent transition-colors text-xs"
                >
                  {kw}
                  <X size={12} />
                </button>
              ))}
              {activeTags.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[hsl(212_100%_10%)]/5 text-[hsl(212_100%_10%)] label hover:text-accent transition-colors text-xs"
                >
                  {t}
                  <X size={12} />
                </button>
              ))}
              <button
                onClick={() => { setActiveTags([]); setKeywords([]); }}
                className="label text-[hsl(212_100%_10%)]/60 hover:text-accent transition-colors text-xs ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result toolbar */}
      <div className="container mx-auto px-4 sm:px-6 mt-6">
        <div className="flex items-center justify-between gap-4 border-b border-[hsl(212_100%_10%)]/10 pb-4">
          <p className="text-sm text-[hsl(212_100%_10%)]/60">
            {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'Result' : 'Results'}`}
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <label className="sr-only" htmlFor="property-sort">Sort by</label>
            <div className="relative w-full max-w-[10.5rem] sm:w-44 sm:max-w-none shrink-0">
              <select
                id="property-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                className="w-full h-10 appearance-none truncate rounded-none bg-foreground text-background text-xs sm:text-sm pl-4 pr-8 focus:outline-none focus:ring-0 border-none uppercase tracking-[0.12em] sm:tracking-[0.2em] font-montserrat font-extrabold cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-white text-foreground normal-case font-normal">
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-background/80" />
            </div>
            {/* Grid size toggle */}
            <div className="hidden lg:flex items-center gap-1">
              {([2, 3, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} columns`}
                  onClick={() => setGridCols(n)}
                  className={`h-10 px-2 inline-flex items-center gap-[3px] transition-colors ${
                    gridCols === n ? 'text-[hsl(212_100%_10%)]' : 'text-[hsl(212_100%_10%)]/30 hover:text-accent transition-colors text-xs'
                  }`}
                >
                  {Array.from({ length: n }).map((_, j) => (
                    <span key={j} className="w-[3px] h-4 bg-current" />
                  ))}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* Listings */}
      <section className="container mx-auto px-0 sm:px-6 mt-8 mb-20">
        {loading ? (
          <div className="py-32 text-center text-foreground/50 text-base">Loading properties…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 px-6 text-center border border-white/15 bg-menu mx-4 sm:mx-0">
            <div className="mx-auto w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center">
              <Search size={24} strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl sm:text-3xl mt-5 font-semibold text-white">
              No properties match your filters
            </h2>
            <p className="text-white/60 mt-3 max-w-md mx-auto text-base">
              Try broadening your search, or clear the filters to see everything we have right now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7 h-[50px]">
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setQuery('');
                  setRegion('');
                  setParams(new URLSearchParams({ mode: mode.toLowerCase() }), { replace: true });
                }}
                className="btn-cta btn-cta-block sm:w-56 group bg-white text-foreground border-white hover:bg-transparent hover:text-white"
              >
                {'Reset all filters'.split('').map((char, i) => (
                  <span key={i} className="letter-underline">{char === ' ' ? '\u00A0' : char}</span>
                ))}
              </button>
              <button
                type="button"
                onClick={() => setAlertOpen(true)}
                className="btn-cta btn-cta-block sm:w-56 group border-white/40 text-white hover:bg-white hover:text-foreground"
              >
                {'Create an alert'.split('').map((char, i) => (
                  <span key={i} className="letter-underline">{char === ' ' ? '\u00A0' : char}</span>
                ))}
              </button>
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-10 ${gridCols === 2 ? 'lg:grid-cols-2' : gridCols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            {paged.map((p, i) => {
              const isLocked = false; // Google sign-in temporarily disabled
              const showBanner = i === Math.floor(paged.length / 2);
              return (
              <Fragment key={p.id ?? p.title}>
              {showBanner && !user && (
                <section className="col-span-full -mx-4 sm:mx-0 my-2 sm:my-6 bg-[#00101f] text-white rounded-none overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center px-8 sm:px-14 py-7 sm:py-11">
                    <h2 className="font-montserrat font-extrabold uppercase tracking-tight leading-[1.05] text-xl sm:text-3xl">
                      Stay ahead of the market
                    </h2>
                    <div>
                      <p className="text-white/70 text-base sm:text-lg leading-relaxed">
                        Refine your buyer profile to receive tailored alerts for homes that match your preferences, including pre-release and off-market opportunities.
                      </p>
                      <Link
                        to="/auth"
                        className="btn-cta-solid btn-cta group mt-6"
                      >
                        Register
                        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </Link>
                    </div>
                  </div>
                </section>
              )}
              <article
                onClick={async () => {
                  if (isLocked) return;
                  return p.slug ? navigate(`/properties/${p.slug}`) : p.id ? navigate(`/properties/${p.id}`) : openEnquiry(p);
                }}
                className="group cursor-pointer rounded-none overflow-hidden bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative">
                  <ListingGallery
                    images={p.images && p.images.length ? p.images : [p.img]}
                    alt={`${publicTitle(p.title)} — ${formatPropertyLocation(p)}`}
                    eager={i < 6}
                  />



                  {/* Status badge (top-left) */}
                  {!isLocked && (
                    <span className="absolute top-0 left-0 inline-flex items-center px-3 py-1.5 rounded-none bg-foreground text-background text-[11px] font-semibold uppercase tracking-wide">
                      {/sold|closed|under offer/i.test(p.status) ? 'Sold' : p.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                    </span>
                  )}

                  {/* Energy class badge (bottom-left) */}
                  {!isLocked && (() => {
                    const energy = p.tags?.find((t) => t.toLowerCase().startsWith('energy '));
                    if (!energy) return null;
                    const cls = energy.replace(/energy\s+/i, '').toUpperCase();
                    return (
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-none bg-emerald-600 text-white font-semibold text-base tracking-wide shadow-sm">
                        <span aria-hidden>⚡</span> Energy {cls}
                      </span>
                    );
                  })()}

                  {/* Save (top-right) */}
                  {!isLocked && (() => {
                    const favKey = p.id ?? p.slug ?? p.title;
                    return (
                      <button
                        type="button"
                        aria-label={isFavorite(favKey) ? 'Remove from watchlist' : 'Save to watchlist'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle({
                            property_id: favKey,
                            property_title: publicTitle(p.title),
                            property_location: formatPropertyLocation(p),
                            property_price: p.price,
                            property_image: p.img,
                          });
                        }}
                        className={`absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-none backdrop-blur transition-colors text-xs shadow-sm ${
                          isFavorite(favKey)
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-white/90 hover:text-accent transition-colors text-xs text-foreground'
                        }`}
                      >
                        <Star size={14} fill={isFavorite(favKey) ? 'currentColor' : 'none'} />
                      </button>
                    );
                  })()}



                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg sm:text-xl font-semibold text-foreground tracking-wider break-words">{publicPrice(p.price, p.priceValue ? p.priceValue * 1_000_000 : undefined, p.status)}</p>
                    {isLocked ? (
                      <Lock size={18} className="mt-1 text-foreground/70" />
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEnquiry(p); }}
                        aria-label="More options"
                        className="size-7 -mr-1 inline-flex items-center justify-center rounded-none text-accent hover:text-accent transition-colors text-xs"
                      >
                        <span className="text-lg leading-none tracking-tighter">•••</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-base">
                    {p.isProject
                      ? [
                          /closed|sold/i.test(p.status) ? p.status : null,
                          p.cat === 'Land / Plot'
                            ? (p.beds !== undefined ? `${p.beds}% Building density` : null)
                            : (p.beds !== undefined ? `${p.beds} Bed` : null),
                          p.cat === 'Land / Plot'
                            ? (p.baths !== undefined ? `${p.baths}% Cover factor` : null)
                            : (p.baths !== undefined ? `${p.baths} Baths` : null),
                          p.size,
                          p.unitCount ? `${p.unitCount} ${p.unitCount === 1 ? 'home' : 'homes'} available` : null,
                          p.cat,
                        ].filter(Boolean).join(' | ')
                      : [
                          p.cat === 'Land / Plot'
                            ? (p.beds !== undefined ? `${p.beds}% Building density` : null)
                            : (p.beds !== undefined ? `${p.beds} Bed` : null),
                          p.cat === 'Land / Plot'
                            ? (p.baths !== undefined ? `${p.baths}% Cover factor` : null)
                            : (p.baths !== undefined ? `${p.baths} Baths` : null),
                          p.size,
                          p.cat,
                        ].filter(Boolean).join(' | ')}
                  </p>
                  <p className="text-foreground/60 mt-0.5 text-base text-slate-700">
                    {isLocked ? 'Sign in to reveal location' : formatPropertyLocation(p)}
                  </p>
                </div>
              </article>
              </Fragment>
            );})}
          </div>
        )}

        {/* Load more */}
        {filtered.length > PAGE_SIZE && (
          <nav
            aria-label="Pagination"
            className="mt-12 px-6 sm:px-0 flex flex-col items-center gap-4"
          >
            <p className="text-sm text-foreground/60 text-center">
              Viewing <span className="font-semibold text-foreground">{visibleCount}</span> of{' '}
              <span className="font-semibold text-foreground">{filtered.length}</span> results
            </p>
            <div className="h-1 w-56 max-w-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${(visibleCount / filtered.length) * 100}%` }}
              />
            </div>
            {visibleCount < filtered.length && (
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="btn-cta mt-1"
              >
                Load More
              </button>
            )}
          </nav>
        )}


      </section>

      <EnquiryDialog property={selected} open={openDialog} onOpenChange={setOpenDialog} />
      <PrivateDossierDialog open={openPrivateDossier} onOpenChange={setOpenPrivateDossier} />
      <PropertyAlertDialog open={alertOpen} onOpenChange={setAlertOpen} criteria={alertCriteria} summary={alertSummary} />


    </div>
    </>
  );
};

export default Properties;
