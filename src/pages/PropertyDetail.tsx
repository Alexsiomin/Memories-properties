import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { trackPropertyView } from '@/lib/visitor-journey';
import {
  ChevronRight,
  ChevronLeft,
  MapPin,
  Star,
  Share2,
  Plus,
  Calendar,
  Tag,
  BedDouble,
  Bath,
  Building,
  LandPlot,
  Ruler,
  Home as HomeIcon,
  Phone,
  X,
  ArrowUpRight,
  ZoomIn,
  ZoomOut,
  MessageCircle,
  Layers,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useFavorites } from '@/hooks/use-favorites';
import EnquiryDialog, { type EnquiryProperty } from '@/components/EnquiryDialog';
import TourDialog, { type TourProperty } from '@/components/TourDialog';
import Thumbnail from '@/components/Thumbnail';
import PropertyMap from '@/components/PropertyMap';
import { optimizeImage } from '@/lib/img';
import SEO from '@/components/SEO';

import { publicLocation, publicTitle, publicPrice } from '@/lib/propertyDisplay';
import { toast } from 'sonner';
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
import { PROPERTY_FEATURE_GROUPS, matchPropertyFeatures } from '@/lib/property-features';

const parseAreaNum = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const m = s.match(/[\d,]+(?:\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/,/g, ''));
  return isNaN(n) ? null : n;
};

const IMAGE_MAP: Record<string, string> = {
  residential, vineyard, coastal, mixed, hero, skyline, desert, library, markets, tech,
};

interface PropertyRow {
  id: string;
  slug: string | null;
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
  image_key: string;
  description?: string | null;
  cover_image?: string | null;
  images?: string[] | null;
  address_line?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  reference_code?: string | null;
  share_title?: string | null;
  share_description?: string | null;
  share_image?: string | null;
  internal_area?: string | null;
  covered_verandas?: string | null;
  lot_size?: string | null;
  year_built?: number | null;
  listing_type?: string | null;
  floor?: number | null;
  total_floors?: number | null;
  parking_spaces?: number | null;
  furnished?: string | null;
  heating?: string | null;
  cooling?: string | null;
  condition?: string | null;
  energy_rating?: string | null;
  orientation?: string | null;
  available_from?: string | null;
  pet_friendly?: boolean | null;
  vat_included?: boolean | null;
  hoa_fees?: string | null;
  developer_id?: string | null;
  seller_type?: string | null;
  district?: string | null;
  floor_plans?: { url: string; label: string }[] | null;
}

interface LotRow {
  id: string;
  slug: string | null;
  title: string;
  reference_code: string | null;
  cover_image: string | null;
  image_key: string;
  internal_area: string | null;
  size: string | null;
  covered_verandas: string | null;
  beds: number | null;
  baths: number | null;
  price: string;
  price_value: number;
  tags: string[] | null;
  lot_size: string | null;
  status: string | null;
}

interface RelatedProperty {
  id: string;
  slug: string | null;
  title: string;
  location: string;
  price: string;
  price_value: number | null;
  category: string;
  region: string | null;
  city: string | null;
  district: string | null;
  image_key: string;
  cover_image: string | null;
  beds: number | null;
  baths: number | null;
  status: string | null;
  internal_area?: string | null;
  covered_verandas?: string | null;
  size?: string | null;
}

interface LightboxSliderProps {
  gallery: string[];
  displayTitle: string;
  total: number;
  initialIndex: number;
  onClose: () => void;
  labels?: (string | null)[];
  ariaLabel?: string;
}

// Compact logo mark, mirrored from Masthead's monogram — drawn inline so it
// inherits color via currentColor without depending on an external asset.
const MonogramIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 726.010389 470.801074" className={className} fill="currentColor" aria-hidden="true">
    <g transform="translate(-263.994806,887.794883) scale(0.1,-0.1)">
      <path d="M4919 8873 c-4 -36 -5 -113 -7 -495 l-2 -437 -437 4 c-241 2 -448 2
-460 -2 l-23 -5 0 -259 0 -259 -255 0 -255 0 0 259 0 258 -62 5 c-35 2 -223 4
-418 3 l-355 0 -3 -1888 -2 -1887 1595 0 1595 0 2 733 3 732 452 3 453 2 2
-732 3 -733 1578 -3 1577 -2 -2 1886 -3 1885 -395 0 -395 -1 -3 -260 -2 -260
-255 0 -255 0 -2 260 -3 261 -395 0 c-217 0 -423 3 -457 6 l-63 5 -2 462 -3
461 -1372 3 c-755 1 -1373 -1 -1374 -5z" />
    </g>
  </svg>
);

const LightboxSlider = ({ gallery, displayTitle, total, initialIndex, onClose, labels, ariaLabel }: LightboxSliderProps) => {
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  // Scroll to the active slide whenever the internal index changes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slideWidth = track.clientWidth;
    const target = index * slideWidth;
    if (Math.abs(track.scrollLeft - target) < 2) return;
    track.scrollLeft = target;
  }, [index]);

  // Update internal index after any scroll (swipe/drag or snap) completes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScrollEnd = () => {
      const slideWidth = track.clientWidth;
      const newIndex = Math.round(track.scrollLeft / slideWidth);
      setIndex(Math.max(0, Math.min(total - 1, newIndex)));
      setZoomed(false);
    };
    track.addEventListener('scrollend', onScrollEnd);
    return () => track.removeEventListener('scrollend', onScrollEnd);
  }, [total]);

  const goPrev = () => { setZoomed(false); setIndex((i) => Math.max(0, i - 1)); };
  const goNext = () => { setZoomed(false); setIndex((i) => Math.min(total - 1, i + 1)); };
  const toggleZoom = () => setZoomed((z) => !z);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    isSwiping.current = false;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    // Mark as a swipe when horizontal movement dominates and exceeds threshold.
    // Native snap-scrolling handles the actual slide change; we just avoid
    // treating the end of a swipe as a backdrop tap.
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 24) {
      isSwiping.current = true;
    }
  };

  const onTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    // Reset the swipe flag after a short delay so it doesn't block future taps.
    setTimeout(() => { isSwiping.current = false; }, 200);
  };

  const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close on a true tap/click of the backdrop, not after a swipe.
    if (!isSwiping.current && e.target === e.currentTarget) {
      onClose();
    }
  };

  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] bg-[#00101f] animate-in fade-in-0 duration-200 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? 'Property photos'}
      onKeyDown={onKeyDown}
      tabIndex={-1}
      ref={dialogRef}
    >
      {/* Sticky header */}
      <div className="shrink-0 z-10 flex items-center justify-between px-4 sm:px-6 h-14 bg-[#00101f]/80 backdrop-blur text-white">
        <MonogramIcon className="h-6 w-auto text-white" />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleZoom}
            aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
            aria-pressed={zoomed}
            className="w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-white/10 hover:text-accent transition-colors text-xs"
          >
            {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photos"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-white/10 hover:text-accent transition-colors text-xs"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Horizontal slide track */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={trackRef}
          className={`absolute inset-0 flex overscroll-x-contain snap-x snap-mandatory scroll-smooth no-scrollbar ${zoomed ? 'overflow-hidden' : 'overflow-x-auto'}`}
          style={{ touchAction: zoomed ? 'pan-x pan-y' : 'pan-x' }}
          onClick={onTrackClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {gallery.map((src, i) => (
            <div
              key={src + i}
              className={`relative shrink-0 w-full h-full snap-start flex items-center justify-center px-2 sm:px-6 ${zoomed ? 'overflow-auto' : 'overflow-hidden'}`}
            >
              <img
                src={optimizeImage(src, 1600)}
                alt={labels?.[i] ? `${displayTitle} — ${labels[i]}` : `${displayTitle} — photo ${i + 1} of ${total}`}
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
                className={`object-contain bg-[#00101f] transition-transform duration-200 ${zoomed ? 'max-w-none max-h-none scale-[1.75] cursor-zoom-out' : 'max-w-full max-h-full'}`}
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={goPrev}
              disabled={index === 0}
              className="absolute z-10 left-4 sm:left-8 bottom-6 sm:bottom-8 size-10 sm:size-12 rounded-full bg-transparent text-white border border-white/70 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs"
            >
              <ChevronLeft size={22} className="sm:hidden" />
              <ChevronLeft size={26} className="hidden sm:block" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={goNext}
              disabled={index === total - 1}
              className="absolute z-10 right-4 sm:right-8 bottom-6 sm:bottom-8 size-10 sm:size-12 rounded-full bg-transparent text-white border border-white/70 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-xs"
            >
              <ChevronRight size={22} className="sm:hidden" />
              <ChevronRight size={26} className="hidden sm:block" />
            </button>
            <span className="absolute z-10 left-1/2 -translate-x-1/2 bottom-9 sm:bottom-11 text-white text-sm tracking-wide">
              {labels?.[index] ? labels[index] : `${index + 1} / ${total} photo${total === 1 ? '' : 's'}`}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

const PropertyDetail = () => {
  const { id: idOrSlug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [related, setRelated] = useState<RelatedProperty[]>([]);
  const [lots, setLots] = useState<LotRow[]>([]);
  const [lotSort, setLotSort] = useState<'price-asc' | 'price-desc' | 'area-asc' | 'area-desc'>('price-asc');
  const relatedScrollRef = useRef<HTMLDivElement>(null);
  const [relatedActive, setRelatedActive] = useState(0);

  useEffect(() => {
    const el = relatedScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const children = Array.from(el.firstElementChild?.children ?? []) as HTMLElement[];
      if (!children.length) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      children.forEach((c, i) => {
        const mid = c.offsetLeft + c.offsetWidth / 2;
        const d = Math.abs(mid - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setRelatedActive(best);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [related.length]);
  const [loading, setLoading] = useState(true);
  const [openEnquiry, setOpenEnquiry] = useState(false);
  const [openTour, setOpenTour] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const { isFavorite, toggle } = useFavorites();

  // Mount portal target only on the client, after document.body exists.
  useEffect(() => {
    if (typeof document !== 'undefined' && document.body) {
      setPortalTarget(document.body);
    }
  }, []);

  // Lock body scroll + close on Escape while lightbox or floor plan viewer is open
  useEffect(() => {
    if (!lightboxOpen && !floorPlanOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setLightboxOpen(false); setFloorPlanOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [lightboxOpen, floorPlanOpen]);

  useEffect(() => {
    if (!idOrSlug) return;
    let cancelled = false;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    (async () => {
      setLoading(true);
      const q = supabase.from('properties').select('*');
      const { data, error } = isUuid
        ? await q.eq('id', idOrSlug).maybeSingle()
        : await q.eq('slug', idOrSlug).maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setProperty(null);
        setLoading(false);
        return;
      }
      const row = data as PropertyRow;
      setProperty(row);
      setLoading(false);
      trackPropertyView(row.id, row.title, row.slug ?? null);

      // Redirect old UUID URLs to slug URL for SEO
      if (isUuid && row.slug && row.slug !== idOrSlug) {
        navigate(`/properties/${row.slug}`, { replace: true });
      }

      // Fetch related properties — smart tiered matching, available listings only:
      // 1) same project (developer + title), 2) same area + similar budget, 3) same type.
      const selectCols = 'id, slug, title, location, price, price_value, category, region, city, district, image_key, cover_image, beds, baths, status, internal_area, covered_verandas, size';
      const RELATED_LIMIT = 6;
      const excludeSold = <T,>(q: T): T =>
        (q as any)
          .not('status', 'ilike', '%sold%')
          .not('status', 'ilike', '%reserved%')
          .not('status', 'ilike', '%under offer%') as T;

      let relList: RelatedProperty[] = [];
      const seen = new Set<string>([row.id]);

      // Tier 1: other available units in the same project.
      if (row.seller_type === 'developer' && row.developer_id) {
        let q = supabase
          .from('properties')
          .select(selectCols)
          .eq('developer_id', row.developer_id)
          .eq('title', row.title)
          .neq('id', row.id);
        q = excludeSold(q);
        const { data } = await q.order('price_value', { ascending: true }).limit(RELATED_LIMIT);
        relList = (data ?? []) as RelatedProperty[];
        relList.forEach((r) => seen.add(r.id));
      }

      // Tier 2: same area + same type, similar budget (±60%), available.
      if (relList.length < RELATED_LIMIT && row.region) {
        let q = supabase
          .from('properties')
          .select(selectCols)
          .eq('category', row.category)
          .eq('region', row.region)
          .not('id', 'in', `(${[...seen].join(',')})`);
        q = excludeSold(q);
        if (row.price_value) {
          q = q.gte('price_value', Math.round(row.price_value * 0.4)).lte('price_value', Math.round(row.price_value * 1.6));
        }
        const { data } = await q.order('sort_order', { ascending: true }).limit(RELATED_LIMIT - relList.length);
        const extra = (data ?? []) as RelatedProperty[];
        relList = [...relList, ...extra];
        extra.forEach((r) => seen.add(r.id));
      }

      // Tier 3: same type, any area, available — fills out the rest.
      if (relList.length < RELATED_LIMIT) {
        let q = supabase
          .from('properties')
          .select(selectCols)
          .eq('category', row.category)
          .not('id', 'in', `(${[...seen].join(',')})`);
        q = excludeSold(q);
        const { data } = await q.order('sort_order', { ascending: true }).limit(RELATED_LIMIT - relList.length);
        relList = [...relList, ...((data ?? []) as RelatedProperty[])];
      }

      if (!cancelled) setRelated(relList);

      // Fetch sibling lots for developer projects (same developer + same title)
      if (row.seller_type === 'developer' && row.developer_id) {
        const { data: lotData } = await supabase
          .from('properties')
          .select('id, slug, title, reference_code, cover_image, image_key, internal_area, size, covered_verandas, beds, baths, price, price_value, tags, lot_size, status')
          .eq('developer_id', row.developer_id)
          .eq('title', row.title)
          .order('reference_code', { ascending: true });
        if (!cancelled) setLots((lotData ?? []) as LotRow[]);
      } else {
        if (!cancelled) setLots([]);
      }
    })();
    return () => { cancelled = true; };
  }, [idOrSlug, navigate]);

  const gallery = useMemo(() => {
    if (!property) return [hero];
    const uploaded = (property.images && property.images.length > 0)
      ? property.images.filter(Boolean)
      : [];
    if (uploaded.length > 0) {
      const withCover = property.cover_image && !uploaded.includes(property.cover_image)
        ? [property.cover_image, ...uploaded]
        : uploaded;
      return withCover.slice(0, 12);
    }
    const primary = property.cover_image || IMAGE_MAP[property.image_key] || hero;
    const pool = [primary, hero, skyline, coastal, vineyard, mixed, residential];
    const seen = new Set<string>();
    return pool.filter((src) => (seen.has(src) ? false : (seen.add(src), true))).slice(0, 5);
  }, [property]);

  useEffect(() => { setGalleryIndex(0); }, [property?.id]);

  const img = gallery[galleryIndex] ?? gallery[0];
  const total = gallery.length;
  const goPrev = () => setGalleryIndex((i) => (i - 1 + total) % total);
  const goNext = () => setGalleryIndex((i) => (i + 1) % total);

  const onShare = async () => {
    const url = window.location.href;
    const title = publicTitle(property?.title) || 'Property';

    // 1) Native share (mobile / supported browsers, top-level only)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && window.top === window.self) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // user cancelled
        // fall through to clipboard
      }
    }

    // 2) Async clipboard API
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
        return;
      }
    } catch { /* fall through */ }

    // 3) Legacy execCommand fallback (works in iframes / older browsers)
    try {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) {
        toast.success('Link copied to clipboard');
        return;
      }
    } catch { /* fall through */ }

    // 4) Last resort — show the URL so the user can copy manually
    toast.message('Copy this link', { description: url });
  };

  if (loading) {
    return (
      <main className="bg-background min-h-screen">
        <div className="container mx-auto px-4 md:px-8 py-10">
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          <div className="mt-5 font-semibold text-foreground text-lg aspect-[16/10] w-full bg-muted animate-pulse rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="bg-background min-h-screen">
        <div className="container mx-auto px-4 md:px-8 py-24 text-center">
          <p className="label text-accent">Not found</p>
          <h1 className="text-4xl mt-3 text-foreground">This property is no longer listed</h1>
          <Link to="/properties" className="inline-block mt-5 font-semibold text-foreground text-lg label text-accent story-link">
            ← Back to all properties
          </Link>
        </div>
      </main>
    );
  }

  const enquiryProp: EnquiryProperty = {
    img,
    title: publicTitle(property.title),
    location: publicLocation(property),
    price: property.price,
    cat: property.category,
    status: property.status,
    referenceCode: displayReference(property.reference_code, property.id),
  };

  const fav = isFavorite(property.title);
  const displayTitle = publicTitle(property.title);

  // Build absolute OG image URL — prefer cover_image, then first uploaded image, then mapped fallback
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';
  const rawCover =
    property.cover_image ||
    (property.images && property.images.length > 0 ? property.images[0] : null) ||
    IMAGE_MAP[property.image_key] ||
    '';
  const ogImage = rawCover.startsWith('http') ? rawCover : `${origin}${rawCover}`;
  const galleryImages = (property.images && property.images.length > 0
    ? property.images
    : [rawCover]
  ).map((u) => (u && u.startsWith('http') ? u : `${origin}${u}`));

  const internalNum = parseAreaNum(property.internal_area);
  const coveredNum = parseAreaNum(property.covered_verandas);
  const computedTotalNum = (internalNum ?? 0) + (coveredNum ?? 0);
  const totalCoveredArea = computedTotalNum > 0
    ? `${computedTotalNum.toFixed(2).replace(/\.00$/, '')} m²`
    : property.size;
  const sizeNumeric = totalCoveredArea ? parseFloat(totalCoveredArea.replace(/[^\d.]/g, '')) : null;
  const isSold = property.status?.toLowerCase().includes('sold');
  const locationWithDistrict = publicLocation(property);
  const locationName = locationWithDistrict.split('·')[0]?.trim() || '';
  const safeDescription = `${displayTitle} in ${locationWithDistrict}. ${property.category}.`;

  // Share/meta title & description — matches the prerender edge function format
  // e.g. "2 Bed 2 Bath Apartment For Sale in Paphos - €310,000"
  const shareLocShort = locationName || locationWithDistrict;
  const shareCategory = (property.category || '').replace(/s$/i, '');
  const shareBedsPart = property.beds ? `${property.beds} Bed ` : '';
  const shareBathsPart = property.baths ? `${property.baths} Bath ` : '';
  const shareSaleLabel = property.listing_type === 'rent' ? 'For Rent' : 'For Sale';
  // Always show the actual price in the share title, even for reserved/sold listings.
  const sharePrice = publicPrice(property.price, property.price_value, null);
  const autoShareTitle = `${shareBedsPart}${shareBathsPart}${shareCategory} ${shareSaleLabel} in ${shareLocShort}${sharePrice ? ` - ${sharePrice}` : ''}`.replace(/\s+/g, ' ').trim();
  const autoShareDescription = `${shareBedsPart}${shareBathsPart}${shareCategory} in ${shareLocShort}. ${sharePrice}${property.size ? ` · ${property.size}` : ''}${property.reference_code ? `. Ref: ${property.reference_code}` : ''}.`.replace(/\s+/g, ' ').trim();
  const metaTitle = (property.share_title && property.share_title.trim()) || autoShareTitle;
  const metaDescription = (property.share_description && property.share_description.trim()) || autoShareDescription;

  // The single source of truth for "visible features" — used by both the
  // on-page Features list and the amenityFeature SEO structured data below,
  // so what's indexed always matches what's actually shown.
  const visibleFeatureTags = (property.tags ?? []).filter(
    (t) => !t.toLowerCase().startsWith('energy ') && !t.startsWith('hidden:')
  );

  const realEstateJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': property.category?.toLowerCase().includes('land') ? 'Place' : 'Residence',
    '@id': `${origin}/properties/${property.id}#place`,
    name: displayTitle,
    description: safeDescription,
    url: `${origin}/properties/${property.id}`,
    image: galleryImages,
    ...(property.address_line || property.city
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(property.address_line ? { streetAddress: property.address_line } : {}),
            ...(property.city ? { addressLocality: property.city } : {}),
            ...(property.region ? { addressRegion: property.region } : {}),
            ...(property.postal_code ? { postalCode: property.postal_code } : {}),
            ...(property.country ? { addressCountry: property.country } : {}),
          },
        }
      : {}),
    ...(property.latitude != null && property.longitude != null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: property.latitude,
            longitude: property.longitude,
          },
        }
      : {}),
    ...(sizeNumeric
      ? {
          floorSize: {
            '@type': 'QuantitativeValue',
            value: sizeNumeric,
            unitCode: 'MTK',
          },
        }
      : {}),
    ...(property.beds != null ? { numberOfRooms: property.beds } : {}),
    ...(property.baths != null ? { numberOfBathroomsTotal: property.baths } : {}),
    ...(property.year_built ? { yearBuilt: property.year_built } : {}),
    ...(visibleFeatureTags.length > 0
      ? {
          amenityFeature: visibleFeatureTags.map((t) => ({
            '@type': 'LocationFeatureSpecification',
            name: t,
            value: true,
          })),
        }
      : {}),
  };

  const breadcrumbJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Buy', item: `${origin}/properties` },
      { '@type': 'ListItem', position: 3, name: locationName, item: `${origin}/properties/${property.id}` },
    ],
  };

  const isDomenica = property.developer_id === '0dfa87d8-824d-42f4-a743-f48714231daf';
  const colHidden = (key: string) => property.tags?.includes(`hidden:${key}`);
  const showRow = (val: string | null | undefined) => !isDomenica || (val != null && val !== '');
  const tagArea = (re: RegExp) => {
    const t = property.tags?.find((x) => re.test(x));
    return t ? t.replace(re, '') : null;
  };
  const uncovered = tagArea(/^uncovered verandas?\s+/i);
  const basement = tagArea(/^basement\s+/i);
  const storage = tagArea(/^storage room\s+/i);
  const plot = (() => {
    const t = property.tags?.find((x) => x.toLowerCase().startsWith('plot '));
    return t ? t.replace(/^plot\s+/i, '') : property.lot_size;
  })();
  // Category data has inconsistent singular/plural values ("Villa" vs
  // "Villas"), so match case-insensitively on the root word rather than an
  // exact string.
  const isVilla = /^villas?$/i.test((property.category ?? '').trim());

  // RealEstateListing ties the offer to the listing page for property rich results.
  const realEstateListingJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `${origin}/properties/${property.id}#listing`,
    url: `${origin}/properties/${property.id}`,
    name: displayTitle,
    description: safeDescription,
    image: galleryImages,
    mainEntity: { '@id': `${origin}/properties/${property.id}#place` },
    offers: {
      '@type': 'Offer',
      url: `${origin}/properties/${property.id}`,
      price: property.price_value,
      priceCurrency: 'EUR',
      availability: isSold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Memories' },
    },
  };

  return (
    <main className="bg-background min-h-screen pb-40 lg:pb-16">
      <SEO
        title={metaTitle}
        description={metaDescription}
        type="article"
        image={ogImage}
        preloadImage={img}
        jsonLd={[realEstateListingJsonLd, realEstateJsonLd, breadcrumbJsonLd]}
      />
      {/* Breadcrumb — desktop only; mobile shows it below the full-bleed hero photo instead */}
      <div className="hidden md:block container mx-auto px-4 md:px-8 pt-3 pb-2">
        <nav className="flex items-center gap-2 text-muted-foreground text-base">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight size={14} />
          {/closed|sold/i.test(property.status) ? (
            <Link to="/properties?mode=Sold" className="hover:text-accent transition-colors">Sold</Link>
          ) : (
            <Link to="/properties" className="hover:text-accent transition-colors">Buy</Link>
          )}
          <ChevronRight size={14} />
          <span className="text-foreground truncate">{locationName}</span>
        </nav>
      </div>

      {/* Gallery + sticky right card */}
      <section className="container mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 items-start">
        {/* LEFT — Gallery */}
        <div className="lg:col-span-1 min-w-0">
          <div className="relative overflow-hidden bg-muted group -mx-4 md:mx-0">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="View all photos"
              className="block w-full text-left cursor-zoom-in"
            >
              <img
                src={optimizeImage(img, 1600)}
                alt={`${displayTitle} — photo ${galleryIndex + 1} of ${total}`}
                width={1920}
                height={1200}
                loading="eager"
                decoding="async"
                // @ts-expect-error - fetchpriority is valid HTML, missing in React types
                fetchpriority="high"
                className="w-full h-[75vh] md:h-auto md:aspect-[3/2] object-cover"
              />
            </button>

            {/* top-right action chips */}
            <div className="absolute top-4 right-4 flex items-center gap-2" />

            {total > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={goPrev}
                  className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 size-9 md:size-11 rounded-full bg-white/95 text-foreground border border-border shadow-sm flex items-center justify-center hover:text-accent transition-colors text-xs"
                >
                  <ChevronLeft size={18} className="md:hidden" />
                  <ChevronLeft size={20} className="hidden md:block" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={goNext}
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 size-9 md:size-11 rounded-full bg-white/95 text-foreground border border-border shadow-sm flex items-center justify-center hover:text-accent transition-colors text-xs"
                >
                  <ChevronRight size={18} className="md:hidden" />
                  <ChevronRight size={20} className="hidden md:block" />
                </button>

                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-foreground/75 text-background text-xs backdrop-blur">
                  {galleryIndex + 1} / {total}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {total > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {gallery.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setGalleryIndex(i)}
                  aria-label={`View photo ${i + 1}`}
                  className={`relative shrink-0 w-32 overflow-hidden aspect-[4/3] bg-muted transition-all ${
                    i === galleryIndex ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={optimizeImage(src, 256)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Title + location below gallery (mobile/tablet primary read) */}
          <div className="mt-8 lg:hidden">
            <p className="font-semibold text-foreground text-xl sm:text-2xl break-words">{publicPrice(property.price, property.price_value, property.status)}</p>
            <h1 className="mt-2 font-semibold leading-tight text-foreground text-xl">{publicTitle(property.title)}</h1>
            <p className="mt-1 text-base text-muted-foreground flex items-center gap-1.5 text-base">
              <MapPin size={16} /> {locationWithDistrict}
            </p>
          </div>

          {/* Key facts row */}
          <div className={`mt-10 grid grid-cols-2 gap-3 ${isVilla ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
            {property.category === 'Land / Plot' ? (
              <FactCard icon={<Building size={18} />} label="Building density" value={property.beds != null ? String(property.beds) : '—'} />
            ) : (
              <FactCard icon={<BedDouble size={18} />} label="Beds" value={property.beds ? String(property.beds) : '—'} />
            )}
            {property.category === 'Land / Plot' ? (
              <FactCard icon={<LandPlot size={18} />} label="Cover factor" value={property.baths != null ? String(property.baths) : '—'} />
            ) : (
              <FactCard icon={<Bath size={18} />} label="Baths" value={(property.baths ?? property.beds) ? String(property.baths ?? property.beds) : '—'} />
            )}
            <FactCard icon={<Ruler size={18} />} label="Total Covered Area" value={totalCoveredArea ?? '—'} />
            <FactCard icon={<HomeIcon size={18} />} label="Type" value={property.category} />
            {isVilla && (
              <FactCard icon={<LandPlot size={18} />} label="Plot Size" value={plot ?? '—'} />
            )}
          </div>

          {/* Property details list */}
          <div className="mt-6 border border-border bg-card p-5">
            <h3 className="font-montserrat font-extrabold text-foreground text-xl">Property details</h3>
            {isVilla ? (
              // Villa-specific order: Status, Category, Bedrooms, Bathrooms,
              // Total covered area, Internal area, Covered verandas,
              // Uncovered verandas, Storage room, Plot size, Parking spaces,
              // Location, Energy class, VAT, Reference.
              <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-base">
                <DetailRow label="Status" value={property.status} />
                {property.category && <DetailRow label="Category" value={property.category} />}
                {property.beds != null && <DetailRow label="Bedrooms" value={String(property.beds)} />}
                {!property.tags?.includes('hidden:baths') && (property.baths ?? property.beds) != null && (
                  <DetailRow label="Bathrooms" value={String(property.baths ?? property.beds)} />
                )}
                {totalCoveredArea != null && <DetailRow label="Total covered area" value={totalCoveredArea} />}
                {!colHidden('internal_area') && property.internal_area && <DetailRow label="Internal area" value={property.internal_area} />}
                {!colHidden('covered_verandas') && property.covered_verandas && <DetailRow label="Covered verandas" value={property.covered_verandas} />}
                {!colHidden('uncovered_verandas') && uncovered && <DetailRow label="Uncovered verandas" value={uncovered} />}
                {!colHidden('storage_room') && storage && <DetailRow label="Storage room" value={storage} />}
                {!colHidden('lot_size') && plot && <DetailRow label="Plot size" value={plot} />}
                {property.parking_spaces != null && <DetailRow label="Parking spaces" value={String(property.parking_spaces)} />}
                <DetailRow label="Location" value={locationWithDistrict} />
                {(property.energy_rating || property.tags?.find((x) => x.toLowerCase().startsWith('energy '))) && (
                  <DetailRow
                    label="Energy class"
                    value={
                      property.energy_rating ||
                      property.tags!.find((x) => x.toLowerCase().startsWith('energy '))!.replace(/^energy\s+/i, '').toUpperCase()
                    }
                  />
                )}
                {property.vat_included != null && <DetailRow label="VAT" value={property.vat_included ? 'Included in price' : 'Not included'} />}
                <DetailRow label="Reference" value={displayReference(property.reference_code, property.id)} mono />
              </dl>
            ) : (
            <>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-base">
              <dl className="flex flex-col gap-2">
                {property.beds != null && (
                  <DetailRow label={property.category === 'Land / Plot' ? 'Building density' : 'Bedrooms'} value={String(property.beds)} />
                )}
                {!property.tags?.includes('hidden:baths') && (property.baths ?? property.beds) != null && (
                  <DetailRow label={property.category === 'Land / Plot' ? 'Cover factor' : 'Bathrooms'} value={String(property.baths ?? property.beds)} />
                )}
                {property.category && <DetailRow label="Category" value={property.category} />}
              </dl>
              <dl className="flex flex-col gap-2">
                {totalCoveredArea != null && <DetailRow label="Total covered area" value={totalCoveredArea} />}
                {!colHidden('internal_area') && property.internal_area && <DetailRow label="Internal area" value={property.internal_area} />}
                {!colHidden('covered_verandas') && property.covered_verandas && <DetailRow label="Covered verandas" value={property.covered_verandas} />}
                {!colHidden('uncovered_verandas') && uncovered && <DetailRow label="Uncovered verandas" value={uncovered} />}
              </dl>
            </div>
            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-base border-t border-border pt-3">
              <DetailRow label="Status" value={property.status} />
              <DetailRow label="Location" value={locationWithDistrict} />
              {property.address_line && <DetailRow label="Address" value={property.address_line} />}
              {property.postal_code && <DetailRow label="Postal code" value={property.postal_code} />}
              {!colHidden('basement') && basement && <DetailRow label="Basement" value={basement} />}
              {!colHidden('storage_room') && storage && <DetailRow label="Storage room" value={storage} />}
              {!colHidden('lot_size') && property.category !== 'Apartment' && plot && <DetailRow label="Plot size" value={plot} />}
              {property.floor != null && <DetailRow label="Floor" value={property.total_floors ? `${property.floor} of ${property.total_floors}` : String(property.floor)} />}
              {property.orientation && <DetailRow label="Orientation" value={property.orientation} />}
              {property.parking_spaces != null && <DetailRow label="Parking spaces" value={String(property.parking_spaces)} />}
              {property.year_built && <DetailRow label="Year built" value={String(property.year_built)} />}
              {property.condition && <DetailRow label="Condition" value={property.condition} />}
              {property.furnished && <DetailRow label="Furnished" value={property.furnished} />}
              {property.heating && <DetailRow label="Heating" value={property.heating} />}
              {property.cooling && <DetailRow label="Cooling" value={property.cooling} />}
              {(property.energy_rating || property.tags?.find((x) => x.toLowerCase().startsWith('energy '))) && (
                <DetailRow
                  label="Energy class"
                  value={
                    property.energy_rating ||
                    property.tags!.find((x) => x.toLowerCase().startsWith('energy '))!.replace(/^energy\s+/i, '').toUpperCase()
                  }
                />
              )}
              {property.available_from && <DetailRow label="Available from" value={new Date(property.available_from).toLocaleDateString()} />}
              {property.hoa_fees && <DetailRow label="Service charges" value={property.hoa_fees} />}
              {property.listing_type === 'rent' && property.pet_friendly != null && <DetailRow label="Pet friendly" value={property.pet_friendly ? 'Yes' : 'No'} />}
              {property.vat_included != null && <DetailRow label="VAT" value={property.vat_included ? 'Included in price' : 'Not included'} />}
              {property.yield && <DetailRow label="Yield" value={property.yield} />}
              <DetailRow label="Reference" value={displayReference(property.reference_code, property.id)} mono />
            </dl>
            </>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={onShare}
              type="button"
              aria-label="Share this property"
              className="btn-cta btn-cta-sm flex-1"
            >
              Share
              <Plus size={16} />
            </button>

            <button
              onClick={() => toggle({
                property_id: property.id,
                property_title: displayTitle,
                property_location: locationWithDistrict,
                property_price: property.price,
                property_image: img,
              })}
              type="button"
              aria-pressed={fav}
              aria-label={fav ? 'Remove from saved' : 'Save property'}
              className="btn-cta btn-cta-sm flex-1"
            >
              <Star size={16} fill={fav ? 'currentColor' : 'none'} />
              {fav ? 'Saved' : 'Save'}
            </button>

            <a
              href={`https://wa.me/35797947862?text=${encodeURIComponent(
                `Hi, I'm interested in ${displayTitle}${property.reference_code ? ` (Ref: ${property.reference_code})` : ''} — ${window.location.href}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ask about this property on WhatsApp"
              className="btn-cta btn-cta-sm flex-1"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>

          {Array.isArray(property.floor_plans) && property.floor_plans.length > 0 && (
            <button
              onClick={() => setFloorPlanOpen(true)}
              type="button"
              className="mt-3 w-full btn-cta btn-cta-sm justify-center"
            >
              <Layers size={16} />
              View Floor Plan{property.floor_plans.length > 1 ? 's' : ''}
            </button>
          )}

          {/* Available lots — sibling units within same developer project */}
          {lots.length > 1 && (
            <section className="mt-10" aria-labelledby="available-lots-heading">
              <div className="flex items-end justify-between gap-4 mb-4">
                <h3 id="available-lots-heading" className="font-semibold text-foreground text-2xl">
                  All lots
                </h3>
                <select
                  value={lotSort}
                  onChange={(e) => setLotSort(e.target.value as typeof lotSort)}
                  className="w-full sm:w-auto max-w-[60%] sm:max-w-none truncate h-10 text-xs sm:text-sm bg-transparent border border-border rounded-none px-2 sm:px-3 text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <option value="price-asc">By price — ascending</option>
                  <option value="price-desc">By price — descending</option>
                  <option value="area-asc">By area — ascending</option>
                  <option value="area-desc">By area — descending</option>
                </select>
              </div>

              {(() => {
                const sampleTags = lots[0]?.tags;
                const showInternal = !sampleTags?.includes('hidden:internal_area');
                const showCovered = !sampleTags?.includes('hidden:covered_verandas');
                const showUncovered = !sampleTags?.includes('hidden:uncovered_verandas');
                const showBasement = !sampleTags?.includes('hidden:basement');
                const showStorage = !sampleTags?.includes('hidden:storage_room');
                const showRoofGarden = !sampleTags?.includes('hidden:roof_garden');
                const showCoveredParking = !sampleTags?.includes('hidden:covered_parking');
                const showBeds = !sampleTags?.includes('hidden:beds');
                const showBaths = true;
                const showLand = !sampleTags?.includes('hidden:lot_size');

                const gridTemplate = [
                  '64px', '1.6fr',
                  showInternal ? '0.9fr' : null,
                  showCovered ? '1fr' : null,
                  '0.9fr',
                  showUncovered ? '1fr' : null,
                  showBasement ? '0.9fr' : null,
                  showStorage ? '0.9fr' : null,
                  showRoofGarden ? '0.9fr' : null,
                  showCoveredParking ? '0.9fr' : null,
                  showBeds ? '0.7fr' : null,
                  showBaths ? '0.7fr' : null,
                  showLand ? '1fr' : null,
                  '1fr',
                ].filter((c): c is string => !!c).join(' ');

                return (
                  <div className="rounded-2xl bg-muted/40 p-4" style={{ '--grid-cols': gridTemplate } as React.CSSProperties}>
                    <div className="hidden md:grid grid-cols-[var(--grid-cols)] gap-4 px-4 py-2 text-xs uppercase tracking-wider text-menu-foreground font-bold bg-menu">
                      <div>Plan</div>
                      <div>Lot</div>
                      {showInternal && <div>Internal area</div>}
                      {showCovered && <div>Covered veranda</div>}
                      <div>Total area</div>
                      {showUncovered && <div>Uncovered veranda</div>}
                      {showBasement && <div>Basement</div>}
                      {showStorage && <div>Storage room</div>}
                      {showRoofGarden && <div>Roof garden</div>}
                      {showCoveredParking && <div>Covered parking</div>}
                      {showBeds && <div>BEDS</div>}
                      {showBaths && <div>BATHS</div>}
                      {showLand && <div>Land</div>}
                      <div className="text-right">Price</div>
                    </div>

                    <div className="space-y-2">
                      {[...lots]
                        .sort((a, b) => {
                          const aArea = parseFloat((a.internal_area || a.size || '0').replace(/[^0-9.]/g, '')) || 0;
                          const bArea = parseFloat((b.internal_area || b.size || '0').replace(/[^0-9.]/g, '')) || 0;
                          switch (lotSort) {
                            case 'price-desc': return b.price_value - a.price_value;
                            case 'area-asc': return aArea - bArea;
                            case 'area-desc': return bArea - aArea;
                            default: return a.price_value - b.price_value;
                          }
                        })
                        .map((lot) => {
                          const isCurrent = lot.id === property.id;
                          const img = lot.cover_image || IMAGE_MAP[lot.image_key] || hero;
                          const href = `/properties/${lot.slug ?? lot.id}`;
                          const uncovered = lot.tags?.find((x) => /^uncovered verandas?\s+/i.test(x))?.replace(/^uncovered verandas?\s+/i, '') ?? null;
                          const basement = lot.tags?.find((x) => /^basement\s+/i.test(x))?.replace(/^basement\s+/i, '') ?? null;
                          const storage = lot.tags?.find((x) => /^storage room\s+/i.test(x))?.replace(/^storage room\s+/i, '') ?? null;
                          const roofGarden = lot.tags?.find((x) => /^roof garden\s+/i.test(x))?.replace(/^roof garden\s+/i, '') ?? null;
                          const coveredParking = lot.tags?.find((x) => /^covered parking\s+/i.test(x))?.replace(/^covered parking\s+/i, '') ?? null;
                          return (
                            <Link
                              key={lot.id}
                              to={href}
                              aria-current={isCurrent ? 'page' : undefined}
                              className={`grid grid-cols-1 md:grid-cols-[var(--grid-cols)] md:gap-4 md:items-center px-4 py-3 border transition-all duration-200 text-xs ${
                                isCurrent ? 'bg-menu text-menu-foreground ring-1 ring-menu-foreground/20' : 'bg-card border-transparent hover:border-accent/60 hover:bg-accent/10 hover:text-accent hover:shadow-sm'
                              }`}
                            >
                              {/* Mobile header / desktop first two columns */}
                              <div className="order-1 flex items-center gap-3 md:contents">
                                <div className="w-16 h-16 md:size-12 overflow-hidden bg-muted shrink-0 relative">
                                  <img src={optimizeImage(img, 96)} alt="" className="w-full h-full object-cover" loading="lazy" />
                                </div>
                                <div className={`flex-1 min-w-0 text-sm md:text-base font-medium truncate ${isCurrent ? 'text-menu-foreground' : 'text-foreground'}`}>
                                  {lot.reference_code ? lot.reference_code : publicTitle(lot.title)}
                                </div>
                              </div>

                              {/* Mobile metrics grid / desktop columns */}
                              <div className="order-3 grid grid-cols-2 gap-x-4 gap-y-1 mt-2 md:mt-0 md:contents">
                                {showInternal && <LotMetric label="Internal" value={lot.internal_area} highlighted={isCurrent} />}
                                {showCovered && <LotMetric label="Veranda" value={lot.covered_verandas} highlighted={isCurrent} />}
                                <LotMetric label="Total" value={lot.size} highlighted={isCurrent} />
                                {showUncovered && <LotMetric label="Uncovered" value={uncovered} highlighted={isCurrent} />}
                                {showBasement && <LotMetric label="Basement" value={basement} highlighted={isCurrent} />}
                                {showStorage && <LotMetric label="Storage" value={storage} highlighted={isCurrent} />}
                                {showRoofGarden && <LotMetric label="Roof garden" value={roofGarden} highlighted={isCurrent} />}
                                {showCoveredParking && <LotMetric label="Covered parking" value={coveredParking} highlighted={isCurrent} />}
                                {showBeds && <LotMetric label="Beds" value={lot.beds != null ? String(lot.beds) : null} highlighted={isCurrent} />}
                                {showBaths && <LotMetric label="Baths" value={lot.baths != null ? String(lot.baths) : null} highlighted={isCurrent} />}
                                {showLand && <LotMetric label="Land" value={lot.lot_size} highlighted={isCurrent} />}
                              </div>

                              {/* Mobile price / desktop last column */}
                              <div className="order-2 md:contents">
                                <div className={`text-sm md:text-base font-semibold text-right whitespace-nowrap mt-1 md:mt-0 ${isCurrent ? 'text-menu-foreground' : 'text-foreground'} ${/reserved|sold/i.test(lot.status ?? '') ? 'text-muted-foreground' : ''}`}>
                                  {/reserved|sold/i.test(lot.status ?? '') ? lot.status : publicPrice(lot.price, lot.price_value, lot.status)}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                    </div>
                  </div>
                );
              })()}
            </section>
          )}

          {/* All available property features, grouped by category */}
          {(() => {
            const { activeFeatures, extraTags } = matchPropertyFeatures(property.tags);
            const isPlot = property.category === 'Land / Plot';
            return (
          <div className="mt-10 border border-border bg-card p-6">
            <h3 className="font-montserrat font-extrabold text-foreground text-xl">Property features</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Features present on this listing.
            </p>
            <div className="mt-8 space-y-8">
              {PROPERTY_FEATURE_GROUPS.map((group) => {
                const activeItems = group.items.filter((f) => activeFeatures.has(f));
                if (activeItems.length === 0) return null;
                return (
                <div key={group.title}>
                  <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-3 text-sm">
                    {group.title}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {activeItems.map((f) => (
                      <span
                        key={f}
                        tabIndex={0}
                        role="listitem"
                        className="inline-flex items-center px-4 py-2 uppercase tracking-wider text-xs font-bold transition-colors duration-150 cursor-default bg-[#deebff] text-[#151923] border border-[#151923]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                );
              })} 

              {extraTags.length > 0 && (
                <div>
                  <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-3 text-sm">
                    Other features on this listing
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {extraTags.map((t) => (
                      <span
                        key={t}
                        tabIndex={0}
                        role="listitem"
                        className="inline-flex items-center px-4 py-2 uppercase tracking-wider text-xs font-bold bg-[#deebff] text-[#151923] border border-[#151923]/15 cursor-default"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
            );
          })()}

          {/* Overview */}
          <div className="mt-12">
            <h2 className="text-2xl font-montserrat font-extrabold text-foreground uppercase">About this Property</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
              {property.description?.trim() ? (
                property.description.trim().split(/\n+/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">{para}</p>
                ))
              ) : (
                <p>
                  {displayTitle} is positioned in {locationWithDistrict} as a {property.category.toLowerCase()} mandate currently {property.status.toLowerCase()}. The asset has been curated for investors seeking exposure to durable European real-estate themes with a clear capital plan.
                </p>
              )}
              {property.yield && (
                <p>Indicative performance: {property.yield}.</p>
              )}
            </div>
          </div>

          {/* Energy class */}
          {(() => {
            const energy = property.tags?.find((t) => t.toLowerCase().startsWith('energy '));
            const cls = energy ? energy.replace(/energy\s+/i, '').toUpperCase() : null;
            return (
              <div className="mt-10 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <span
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-lg font-bold ${
                    cls ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {cls ?? '—'}
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Energy class</p>
                  <p className="text-base font-semibold text-foreground">
                    {cls ? `Class ${cls}` : 'Not provided yet'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Location map */}
          {property.latitude != null && property.longitude != null && (
            <div className="mt-10">
              <h3 className="text-2xl font-montserrat font-extrabold text-foreground uppercase">Location</h3>
              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                title={displayTitle}
                className="mt-5 w-full h-[350px] overflow-hidden border border-border bg-muted"
                locked
                onLockedInteract={() => setOpenEnquiry(true)}
              />
            </div>
          )}

        </div>

        {/* RIGHT — CTA card */}
        <aside className="lg:col-span-1 lg:sticky lg:top-24">
          <div>
            <div className="border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-6 border-slate-300">
                {/* Price block */}
                <div className="hidden lg:block">
                  <p className="font-montserrat font-extrabold text-foreground text-xl sm:text-2xl leading-tight break-words">{publicPrice(property.price, property.price_value, property.status)}</p>
                  
                  <p className="mt-1 text-muted-foreground flex items-center gap-1.5 text-base">
                    <MapPin size={14} /> {locationWithDistrict}
                  </p>
                </div>

                <div className="hidden lg:flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-5 pb-5 border-b border-border text-muted-foreground text-sm">
                  <span className="inline-flex items-center gap-1"><BedDouble size={14} /> {property.beds ?? '—'} bd</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1"><Bath size={14} /> {property.baths ?? property.beds ?? '—'} ba</span>
                  {totalCoveredArea && <><span className="text-muted-foreground/40">·</span><span>{totalCoveredArea}</span></>}
                </div>

                {/* Zillow-style tour scheduler quick-pick */}
                <div className="mt-5">
                  <p className="font-montserrat font-extrabold text-foreground mb-2 text-lg whitespace-pre-line">TOUR PROPERTY{"\n"}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[0, 1, 2].map((i) => {
                      const d = new Date();
                      d.setHours(0, 0, 0, 0);
                      // skip Sundays (0)
                      let added = 0;
                      let offset = 0;
                      while (added < 3) {
                        const check = new Date(d);
                        check.setDate(d.getDate() + offset);
                        if (check.getDay() !== 0) {
                          if (added === i) {
                            d.setDate(d.getDate() + offset);
                            break;
                          }
                          added++;
                        }
                        offset++;
                      }
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setOpenTour(true)}
                          className="h-[50px] flex flex-col items-center justify-center border border-border hover:border-accent hover:text-accent transition-colors text-center text-sm"
                        >
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}
                          </p>
                          <p className="text-lg font-semibold text-foreground leading-none mt-1">{d.getDate()}</p>
                          <p className="text-xs uppercase text-muted-foreground mt-0.5">
                            {d.toLocaleDateString(undefined, { month: 'short' })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  onClick={() => setOpenTour(true)}
                  className="btn-cta-solid btn-cta btn-cta-block mt-3"
                >
                  <Calendar size={16} /> Request a tour
                </button>

                {/* Secondary CTA */}
                <button
                  onClick={() => setOpenEnquiry(true)}
                  className="btn-cta btn-cta-block mt-3"
                >
                  Contact Agent
                </button>
              </div>

            </div>
          </div>
        </aside>
      </section>

      {/* Related properties — internal linking for SEO. Full-width, outside the
          sticky CTA card's grid so that card finishes scrolling before this
          section begins. Carousel on mobile/tablet, responsive grid on desktop
          (3 columns, 4 on extra-large screens) since there's room to show more. */}
      {related.length > 0 && (
        <section className="container mx-auto px-4 md:px-8 mt-14 pt-10 border-t border-border" aria-labelledby="related-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="related-heading" className="font-montserrat font-extrabold text-foreground text-2xl uppercase">
                Related Listings
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {property.region
                  ? `Similar ${property.category.toLowerCase()} opportunities across ${property.region} and beyond.`
                  : `Other ${property.category.toLowerCase()} opportunities curated by Memories.`}
              </p>
            </div>
            <div className="flex lg:hidden items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Previous"
                disabled={relatedActive === 0}
                onClick={() => {
                  const el = relatedScrollRef.current;
                  const card = el?.querySelector('a') as HTMLElement | null;
                  const step = card ? card.getBoundingClientRect().width + 24 : (el?.clientWidth ?? 0) * 0.85;
                  el?.scrollBy({ left: -step, behavior: 'smooth' });
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-all hover:border-[#00101f] hover:bg-[#00101f] hover:text-white hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border disabled:hover:shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next"
                disabled={relatedActive >= related.length - 1}
                onClick={() => {
                  const el = relatedScrollRef.current;
                  const card = el?.querySelector('a') as HTMLElement | null;
                  const step = card ? card.getBoundingClientRect().width + 24 : (el?.clientWidth ?? 0) * 0.85;
                  el?.scrollBy({ left: step, behavior: 'smooth' });
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-all hover:border-[#00101f] hover:bg-[#00101f] hover:text-white hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-foreground disabled:hover:border-border disabled:hover:shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div
            ref={relatedScrollRef}
            className="mt-6 -mx-4 sm:mx-0 flex gap-6 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth no-scrollbar px-4 sm:px-0 lg:grid lg:grid-cols-3 xl:grid-cols-4 lg:overflow-visible lg:snap-none lg:px-0"
            style={{ touchAction: 'pan-x' }}
          >
            {related.map((r) => {
              const relImg = r.cover_image || IMAGE_MAP[r.image_key] || hero;
              const href = `/properties/${r.slug ?? r.id}`;
              return (
                <Link
                  key={r.id}
                  to={href}
                  className="group snap-start shrink-0 basis-[85%] xs:basis-[70%] sm:basis-[calc(50%-0.75rem)] lg:basis-auto lg:shrink overflow-hidden bg-card border border-border rounded-none hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative">
                    <Thumbnail
                      src={relImg}
                      alt={`${publicTitle(r.title)} — ${publicLocation(r)}`}
                      wrapperClassName="aspect-[4/3]"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-lg sm:text-xl font-semibold text-foreground break-words">{publicPrice(r.price, undefined, r.status)}</p>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-base">
                      {(() => {
                        const rInternal = parseAreaNum(r.internal_area);
                        const rCovered = parseAreaNum(r.covered_verandas);
                        const rTotal = (rInternal ?? 0) + (rCovered ?? 0);
                        const rArea = rTotal > 0
                          ? `${rTotal.toFixed(2).replace(/\.00$/, '')} m²`
                          : r.size;
                        return [
                          r.beds && r.beds > 0 ? `${r.beds} bds` : null,
                          r.baths && r.baths > 0 ? `${r.baths} ba` : null,
                          rArea || null,
                          `${r.category} · ${r.status ?? ''}`,
                        ].filter(Boolean).join(' | ');
                      })()}
                    </p>
                    <p className="text-foreground/60 mt-0.5 text-base">
                      {publicLocation(r)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          {related.length > 1 && (
            <div className="mt-4 flex lg:hidden justify-center gap-1.5">
              {related.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => {
                    const el = relatedScrollRef.current;
                    const child = el?.firstElementChild?.children[i] as HTMLElement | undefined;
                    if (el && child) el.scrollTo({ left: child.offsetLeft - 16, behavior: 'smooth' });
                  }}
                  className={`h-1.5 rounded-full transition-all ${i === relatedActive ? 'w-6 bg-foreground' : 'w-1.5 bg-foreground/25'}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Lightbox — horizontal slide gallery */}
      {lightboxOpen && portalTarget && createPortal(
        <LightboxSlider
          gallery={gallery}
          displayTitle={displayTitle}
          total={total}
          initialIndex={galleryIndex}
          onClose={() => setLightboxOpen(false)}
        />,
        portalTarget
      )}

      {/* Floor plan viewer — same slider, driven by floor_plans instead of photos */}
      {floorPlanOpen && portalTarget && Array.isArray(property.floor_plans) && property.floor_plans.length > 0 && createPortal(
        <LightboxSlider
          gallery={property.floor_plans.map((f) => f.url)}
          labels={property.floor_plans.map((f) => f.label || null)}
          displayTitle={displayTitle}
          total={property.floor_plans.length}
          initialIndex={0}
          onClose={() => setFloorPlanOpen(false)}
          ariaLabel="Floor plans"
        />,
        portalTarget
      )}

      {/* Mobile sticky bottom action bar — portaled to body so it sits above the mobile bottom nav.
          Falls back to in-tree rendering if the portal target isn't available. */}
      {!openTour && (() => {
        const stickyBar = (
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 z-[60] flex items-stretch border-t border-border"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <button
              onClick={() => setOpenTour(true)}
              className="btn-cta-solid btn-cta flex-1 rounded-none"
            >
              Enquire Now
            </button>
          </div>
        );

        if (!portalTarget) return stickyBar;
        try {
          return createPortal(stickyBar, portalTarget);
        } catch {
          return stickyBar;
        }
      })()}

      <EnquiryDialog open={openEnquiry} onOpenChange={setOpenEnquiry} property={enquiryProp} />
      <TourDialog
        open={openTour}
        onOpenChange={setOpenTour}
        property={{
          id: property.id,
          title: displayTitle,
          location: locationWithDistrict,
          image: img,
          price: property.price,
          category: property.category,
          beds: property.beds,
          baths: property.baths,
          size: property.size,
          totalCoveredArea,
          status: property.status,
        }}
      />
    </main>
  );
};

// Public references must always be 3 letters followed by 5 numbers.
const displayReference = (referenceCode: string | null | undefined, id: string) => {
  const raw = (referenceCode || '').trim();
  if (/^[A-Za-z]{3}\d{5}$/.test(raw)) return raw.toUpperCase();

  const hex = id.replace(/-/g, '').slice(0, 12) || '0';
  const number = (parseInt(hex, 16) % 100000).toString().padStart(5, '0');
  return `MEM${number}`;
};

const FactCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (

  <div className="border border-border bg-card p-4">
    <div className="text-muted-foreground">{icon}</div>
    <p className="mt-2 font-semibold text-foreground leading-none truncate text-xl">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
  </div>
);

const DetailRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0 text-base">
    <dt className="text-base text-muted-foreground">{label}</dt>
    <dd className={`text-base text-foreground font-medium text-right truncate ${mono ? 'font-mono' : ''}`}>{value}</dd>
  </div>
);

const LotMetric = ({ label, value, highlighted }: { label: string; value: string | null | undefined; highlighted?: boolean }) => (
  <div className={`text-sm md:text-base ${highlighted ? 'text-menu-foreground' : 'text-foreground'}`}>
    <span className={`md:hidden text-xs mr-1 ${highlighted ? 'text-menu-foreground/70' : 'text-muted-foreground'}`}>{label}:</span>
    {value && value !== '' ? value : <span className={highlighted ? 'text-menu-foreground/70' : 'text-muted-foreground'}>—</span>}
  </div>
);

export default PropertyDetail;
