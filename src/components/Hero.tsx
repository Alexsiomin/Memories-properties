import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, X, ChevronLeft } from 'lucide-react';
// Hero images live in /public with stable names so they can be statically
// preloaded from index.html (the LCP image) without a hashed filename.
const heroImageAvif = '/hero-estate.avif';
const heroImageWebp = '/hero-estate.webp';
const heroImage = '/hero-estate.jpg';
const heroImage640Avif = '/hero-estate-640.avif';
const heroImage640Webp = '/hero-estate-640.webp';
const heroImage640 = '/hero-estate-640.jpg';
const heroImage1280Avif = '/hero-estate-1280.avif';
const heroImage1280Webp = '/hero-estate-1280.webp';
const heroImage1280 = '/hero-estate-1280.jpg';
import Picture from '@/components/Picture';
import ValuationDialog from '@/components/ValuationDialog';
import MultiLocationSearch from '@/components/MultiLocationSearch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { toast } from 'sonner';

const TABS = ['Buy', 'Rent', 'Sold'] as const;
type Tab = 'Buy' | 'Rent' | 'Projects' | 'Sold';

const MODE_BY_TAB: Record<Tab, string> = {
  Buy: 'Buy',
  Rent: 'Invest',
  Projects: 'Projects',
  Sold: 'Sold',
};

const TYPES = [
  'Villa', 'Apartment', 'Land / Plot', 'Studio', 'Semi-detached',
  'Maisonette', 'Commercial', 'Hotel',
  'Commercial and Residential Building',
] as const;
type PropertyType = typeof TYPES[number];

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5] as const;

const Hero = () => {
  const [valuationOpen, setValuationOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('Buy');
  const [cats, setCats] = useState<string[]>([]);
  const [surroundingRegions, setSurroundingRegions] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10]);
  const [minBeds, setMinBeds] = useState<number | null>(null);
  const [openPopover, setOpenPopover] = useState<null | 'type' | 'price' | 'filters'>(null);
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [nearMe, setNearMe] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const { recent, addRecent, removeRecent, clearRecent } = useRecentSearches();
  const navigate = useNavigate();

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
    setLocations((prev) => prev.filter((l) => l !== loc));

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

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'Projects') {
      // "Projects" is its own page (grouped developments), not a filter on
      // the flat Properties listing.
      navigate('/developments');
      return;
    }
    const params = new URLSearchParams();
    params.set('mode', MODE_BY_TAB[tab] ?? 'Buy');
    if (cats.length) params.set('cats', cats.join(','));
    if (locations.length) params.set('locs', locations.join('|'));
    if (nearMe) params.set('near', `${nearMe.lat},${nearMe.lng},${nearMe.label}`);
    if (priceRange[0] > 0) params.set('min', String(priceRange[0]));
    if (priceRange[1] < 10) params.set('max', String(priceRange[1]));
    if (minBeds) params.set('beds', String(minBeds));
    navigate(`/properties?${params.toString()}`);
  };

  const sharedSearchProps = {
    locations,
    onAdd: addLocation,
    onRemove: removeLocation,
    recent,
    onAddRecent: addRecent,
    onRemoveRecent: removeRecent,
    onClearRecent: clearRecent,
    onUseCurrentLocation: useCurrentLocation,
    locating,
    nearMeLabel: nearMe ? `${nearMe.label} + 2 km` : null,
    onRemoveNearMe: removeNearMe,
  };

  return (
    <section className="relative w-full h-screen min-h-[600px] -mt-px">
      <Picture
        src={heroImage}
        responsive={[
          { width: 640, src: heroImage640, webpSrc: heroImage640Webp, avifSrc: heroImage640Avif },
          { width: 1280, src: heroImage1280, webpSrc: heroImage1280Webp, avifSrc: heroImage1280Avif },
          { width: 1920, src: heroImage, webpSrc: heroImageWebp, avifSrc: heroImageAvif },
        ]}
        sizes="100vw"
        alt="Mediterranean coastal estate at golden hour"
        width={1920}
        height={1080}
        loading="eager"
        decoding="async"
        // @ts-expect-error - fetchpriority is valid HTML, missing in React types
        fetchpriority="high"
        className="absolute inset-0 z-0 w-full h-full object-cover"
      />

      {/* Gradient overlay for search-bar legibility (bottom only) */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[hsl(212_100%_10%)]/65" />
      <div
        className={`fixed inset-0 z-40 bg-foreground/45 transition-opacity duration-200 pointer-events-none ${
          openPopover ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      />

      {/* Centered headline */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <h2 className="font-montserrat font-extrabold tracking-tighter leading-[0.95] text-2xl md:text-3xl uppercase text-white text-center reveal pointer-events-auto">
          Real estate moments that matter
        </h2>
      </div>

      {/* Bottom-anchored search bar (Marshall White style) */}
      <div className="relative z-10 h-full flex flex-col justify-end px-4 sm:px-8 pb-16 sm:pb-28">
        {/* Search bar — Marshall White style */}
        <form
          onSubmit={onSearch}
          className="w-full max-w-[778px] mx-auto reveal"
          data-reveal-delay="200"
        >
          {/* MOBILE: stacked navy rows (Marshall White pattern) */}
          <div className="sm:hidden flex flex-col gap-1 text-white">
            {/* BUY row */}
            <Popover open={mobileTabOpen} onOpenChange={setMobileTabOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group/ctrl flex items-center justify-between w-full h-[42px] px-5 bg-[hsl(212_100%_10%)] text-white uppercase tracking-[0.12em] font-bold text-sm border border-[hsl(212_100%_10%)]"
                >
                  <span>{tab}</span>
                  <ChevronDown size={16} className="opacity-80 transition-transform duration-200 group-data-[state=open]/ctrl:rotate-180" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={-1} className="w-[var(--radix-popover-trigger-width)] p-0 bg-[hsl(212_100%_10%)] border border-t-0 border-white/50 z-[60] rounded-none overflow-hidden shadow-[0_24px_50px_-20px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 duration-200">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTab(t); setMobileTabOpen(false); }}
                    className={`w-full text-left px-5 h-12 flex items-center justify-between text-sm uppercase tracking-[0.12em] font-bold border-b border-white/10 last:border-b-0 transition-colors duration-200 ${
                      tab === t
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{t}</span>
                    {tab === t && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </button>
                ))}
                {(['Projects'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setMobileTabOpen(false); navigate('/developments'); }}
                    className={`w-full text-left px-5 h-12 flex items-center justify-between text-sm uppercase tracking-[0.12em] font-bold border-b border-white/10 last:border-b-0 transition-colors duration-200 ${
                      tab === t
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{t}</span>
                    {tab === t && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>


            {/* Search row */}
            <div className="relative w-full bg-white border border-white/50 flex items-center">
              <MultiLocationSearch {...sharedSearchProps} />
              <button type="submit" aria-label="Search" className="inline-flex items-center justify-center w-[42px] h-[42px] text-foreground shrink-0">
                <Search size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Filter row */}
            <button
              type="button"
              onClick={() => setOpenPopover('filters')}
              className="flex items-center justify-between w-full h-[40px] max-h-[40px] px-5 bg-transparent text-white text-sm font-normal border border-white/50"
            >
              <span className="inline-flex items-center gap-2">
                Filter
                {(minBeds !== null || surroundingRegions || cats.length > 0 || priceRange[0] !== 0 || priceRange[1] !== 10) && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                    {(minBeds !== null ? 1 : 0) + (surroundingRegions ? 1 : 0) + (cats.length > 0 ? 1 : 0) + ((priceRange[0] !== 0 || priceRange[1] !== 10) ? 1 : 0)}
                  </span>
                )}
              </span>
              <span className="text-xl leading-none">+</span>
            </button>
          </div>

          {/* DESKTOP: single horizontal bar */}
          <div className="hidden sm:flex items-stretch bg-[hsl(0_0%_90%)] gap-0 pr-3">
            {/* Mode selector (BUY / RENT) */}
            <Popover open={openPopover === 'type'} onOpenChange={(o) => setOpenPopover(o ? 'type' : null)}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group/ctrl inline-flex items-center justify-between gap-3 w-44 pl-6 pr-5 h-[48px] bg-[hsl(212_100%_10%)] text-white uppercase tracking-[0.08em] font-montserrat font-extrabold hover:opacity-95 transition-opacity whitespace-nowrap text-xs"
                >
                  <span>{tab}</span>
                  <ChevronDown size={18} className="opacity-80 transition-transform duration-200 group-data-[state=open]/ctrl:rotate-180" />
                </button>

              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={0} className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none bg-white border border-[hsl(212_100%_10%)]/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] z-[60]">
                {TABS.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTab(t); setOpenPopover(null); }}
                    className={`w-full text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold transition-colors ${
                      i > 0 ? 'border-t border-[hsl(212_100%_10%)]/10' : ''
                    } ${
                      tab === t ? 'bg-[hsl(212_100%_10%)] text-white' : 'text-[hsl(212_100%_10%)] hover:text-accent transition-colors'
                    }`}
                  >
                    {t}
                  </button>
                ))}
                  {(['Projects'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setOpenPopover(null); navigate('/developments'); }}
                      className={`w-full text-left px-5 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold transition-colors border-t border-[hsl(212_100%_10%)]/10 ${
                        tab === t ? 'bg-[hsl(212_100%_10%)] text-white' : 'text-[hsl(212_100%_10%)] hover:text-accent transition-colors'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
              </PopoverContent>
            </Popover>


            {/* Search input with autocomplete (shared with Properties) */}
            <MultiLocationSearch {...sharedSearchProps} />

            {/* Filter button — small white rounded pill, matching the
                reference's bordered rounded "Filter +" control. */}
            <div className="flex items-center bg-[hsl(0_0%_90%)] py-1.5 pl-2">
              <button
                type="button"
                onClick={() => setOpenPopover('filters')}
                className="inline-flex items-center justify-center gap-1.5 px-4 h-8 bg-white text-foreground text-xs font-medium border border-[hsl(212_100%_10%)]/10 hover:border-accent/40 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Filter</span>
                <span className="text-base leading-none">+</span>
                {(minBeds !== null || surroundingRegions || cats.length > 0 || priceRange[0] !== 0 || priceRange[1] !== 10) && (
                  <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                    {(minBeds !== null ? 1 : 0) + (surroundingRegions ? 1 : 0) + (cats.length > 0 ? 1 : 0) + ((priceRange[0] !== 0 || priceRange[1] !== 10) ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Search submit (icon only) — desktop */}
            <button
              type="submit"
              aria-label="Search"
              className="inline-flex items-center justify-center w-10 h-[48px] text-foreground hover:text-foreground/70 transition-colors shrink-0"
            >
              <Search size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Filters dialog (shared) */}
          <Dialog open={openPopover === 'filters'} onOpenChange={(o) => setOpenPopover(o ? 'filters' : null)}>
            <DialogContent className="w-full max-w-full sm:w-[560px] sm:max-w-[560px] h-[100dvh] sm:h-auto sm:max-h-[88vh] flex flex-col bg-white text-[hsl(212_100%_10%)] border-0 p-0 gap-0 overflow-hidden rounded-none sm:rounded-xl top-0 translate-y-0 sm:top-[50%] sm:translate-y-[-50%] [&>button]:hidden">
                {/* Sticky header */}
                <div className="sticky top-0 z-10 flex items-center justify-center px-4 sm:px-6 h-14 sm:h-auto sm:pt-8 sm:pb-2 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenPopover(null)}
                    aria-label="Close filters"
                    className="sm:hidden absolute left-2 w-10 h-10 inline-flex items-center justify-center rounded-full text-[hsl(212_100%_10%)] hover:bg-black/5"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <DialogTitle className="sr-only">Filters</DialogTitle>
                  <h3 className="text-base sm:text-xl font-bold uppercase tracking-[0.22em] text-[hsl(212_100%_10%)]">Filters</h3>
                  <button
                    type="button"
                    onClick={() => setOpenPopover(null)}
                    aria-label="Close filters"
                    className="absolute right-3 sm:right-5 top-3 sm:top-5 w-8 h-8 inline-flex items-center justify-center rounded-full text-[hsl(212_100%_10%)]/60 hover:text-[hsl(212_100%_10%)] hover:bg-black/5"
                  >
                    <X size={18} />
                  </button>
                </div>


                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-10 py-6 space-y-6">
                  {/* Mode tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    {TABS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`h-10 uppercase tracking-[0.28em] font-semibold transition-colors text-sm text-white ${
                          tab === t
                            ? 'bg-[hsl(212_100%_10%)]'
                            : 'bg-[hsl(214_18%_74%)] hover:bg-[hsl(214_18%_68%)]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>


                  {/* Search input inside modal (shared) */}
                  <div>
                    <MultiLocationSearch {...sharedSearchProps} />
                  </div>


                  {/* Property type */}
                  <section>
                    <h3 className="font-bold uppercase tracking-[0.22em] mb-5 text-base sm:text-xl text-[hsl(212_100%_10%)]">Property type</h3>
                    <div className="grid grid-cols-2 gap-y-4">
                      <label className="flex items-center gap-3 cursor-pointer text-sm text-[hsl(212_100%_10%)]">
                        <input
                          type="checkbox"
                          checked={cats.length === 0}
                          onChange={() => setCats([])}
                          className="w-4 h-4 accent-[hsl(212_100%_10%)]"
                        />
                        Any
                      </label>
                      {TYPES.map((t) => (
                        <label key={t} className="flex items-center gap-3 cursor-pointer text-sm text-[hsl(212_100%_10%)]">
                          <input
                            type="checkbox"
                            checked={cats.includes(t)}
                            onChange={() =>
                              setCats((prev) =>
                                prev.includes(t)
                                  ? prev.filter((x) => x !== t)
                                  : [...prev, t]
                              )
                            }
                            className="w-4 h-4 accent-[hsl(212_100%_10%)]"
                          />
                          {t}
                        </label>
                      ))}
                    </div>
                  </section>


                  {/* Price */}
                  <section>
                    <h3 className="text-base sm:text-xl font-bold uppercase tracking-[0.22em] mb-5 text-[hsl(212_100%_10%)]">Price</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="h-[45px] px-4 border border-[hsl(213_15%_85%)] bg-white text-[hsl(212_100%_10%)] text-sm focus:outline-none focus:border-[hsl(212_100%_10%)]"
                      >
                        <option value={0}>Min</option>
                        {[
                          { v: 0.3, label: '€300,000' },
                          { v: 1, label: '€1,000,000' },
                          { v: 2, label: '€2,000,000' },
                          { v: 3, label: '€3,000,000' },
                          { v: 5, label: '€5,000,000' },
                          { v: 7, label: '€7,000,000' },
                        ].map(({ v, label }) => (
                          <option key={v} value={v}>{label}</option>
                        ))}
                      </select>
                      <select
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="h-[45px] px-4 border border-[hsl(213_15%_85%)] bg-white text-[hsl(212_100%_10%)] text-sm focus:outline-none focus:border-[hsl(212_100%_10%)]"
                      >
                        <option value={10}>Max</option>
                        {[
                          { v: 1, label: '€1,000,000' },
                          { v: 2, label: '€2,000,000' },
                          { v: 3, label: '€3,000,000' },
                          { v: 5, label: '€5,000,000' },
                          { v: 7, label: '€7,000,000' },
                          { v: 10, label: '€10,000,000+' },
                        ].map(({ v, label }) => (
                          <option key={v} value={v}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </section>

                  {/* Bedrooms */}
                  <section>
                    <h3 className="font-bold uppercase tracking-[0.22em] mb-5 text-base sm:text-xl text-[hsl(212_100%_10%)]">Bedrooms</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={minBeds ?? ''}
                        onChange={(e) => setMinBeds(e.target.value ? Number(e.target.value) : null)}
                        className="h-[45px] px-4 border border-[hsl(213_15%_85%)] bg-white text-[hsl(212_100%_10%)] text-sm focus:outline-none focus:border-[hsl(212_100%_10%)]"
                      >
                        <option value="">Min</option>
                        {BEDROOM_OPTIONS.map((b) => (
                          <option key={b} value={b}>{b}+</option>
                        ))}
                      </select>
                      <select
                        defaultValue=""
                        className="h-[45px] px-4 border border-[hsl(213_15%_85%)] bg-white text-[hsl(212_100%_10%)] text-sm focus:outline-none focus:border-[hsl(212_100%_10%)]"
                      >
                        <option value="">Max</option>
                        {BEDROOM_OPTIONS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </section>


                  {/* Surrounding regions */}
                  <label className="flex items-center gap-3 cursor-pointer text-[hsl(212_100%_10%)]">
                    <input
                      type="checkbox"
                      checked={surroundingRegions}
                      onChange={(e) => setSurroundingRegions(e.target.checked)}
                      className="w-4 h-4 accent-[hsl(212_100%_10%)]"
                    />
                    <span className="text-sm">Include surrounding regions</span>
                  </label>
                </div>

                {/* Sticky footer */}
                <div className="sticky bottom-0 bg-white border-t border-[hsl(213_15%_88%)] px-6 sm:px-10 py-4 sm:py-6 pb-[max(env(safe-area-inset-bottom),1rem)] flex items-center justify-between gap-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPriceRange([0, 10]);
                      setMinBeds(null);
                      setSurroundingRegions(false);
                      setCats([]);
                      setLocations([]);
                      setNearMe(null);
                    }}
                    className="text-xs uppercase tracking-[0.22em] font-medium text-[hsl(212_100%_10%)]/60 hover:text-[hsl(212_100%_10%)] transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { setOpenPopover(null); onSearch(e as unknown as React.FormEvent); }}
                    className="btn-cta btn-cta-solid px-10"
                  >
                    Search
                  </button>
                </div>

              </DialogContent>
            </Dialog>
        </form>
      </div>

      <ValuationDialog open={valuationOpen} onOpenChange={setValuationOpen} />
    </section>
  );
};

export default Hero;
