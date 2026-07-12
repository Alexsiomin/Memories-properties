import { useState, useRef, useEffect } from 'react';
import { fetchLocationSuggestions } from '@/lib/places';
import { X, Clock, Navigation, MapPin } from 'lucide-react';

interface MultiLocationSearchProps {
  locations: string[];
  onAdd: (loc: string) => void;
  onRemove: (loc: string) => void;
  recent: string[];
  onAddRecent: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  onClearRecent: () => void;
  onUseCurrentLocation: () => void;
  locating: boolean;
  nearMeLabel?: string | null;
  onRemoveNearMe?: () => void;
}

export default function MultiLocationSearch({
  locations,
  onAdd,
  onRemove,
  recent,
  onAddRecent,
  onRemoveRecent,
  onClearRecent,
  onUseCurrentLocation,
  locating,
  nearMeLabel,
  onRemoveNearMe,
}: MultiLocationSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const places = await fetchLocationSuggestions(q);
        if (cancelled) return;
        setSuggestions(places);
        // Keep the dropdown open even with no matches so the
        // "Use my current location" option stays reachable.
        setOpen(true);
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setOpen(true);
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  const select = (text: string) => {
    onAdd(text);
    onAddRecent(text);
    setQuery('');
    setOpen(false);
    setSuggestions([]);
  };

  const canAddMore = locations.length < 5;

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0">
      <div
        className="flex flex-wrap items-center gap-2 bg-[hsl(0_0%_94%)] min-h-[40px] h-[40px] sm:h-auto sm:min-h-full px-3 sm:px-4 py-0 sm:py-2 overflow-hidden"
        onClick={() => {
          if (canAddMore) {
            const input = wrapperRef.current?.querySelector('input');
            input?.focus();
          }
        }}
      >
        {nearMeLabel && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 text-accent text-sm border border-accent/30">
            <Navigation size={13} />
            <span className="truncate max-w-[220px]">{nearMeLabel}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveNearMe?.();
              }}
              aria-label="Remove current location"
              className="text-accent/60 hover:text-accent transition-colors"
            >
              <X size={13} />
            </button>
          </span>
        )}
        {locations.map((loc) => (
          <span
            key={loc}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-[hsl(212_100%_10%)] text-sm border border-[hsl(212_100%_10%)]/10"
          >
            <MapPin size={13} />
            <span className="truncate max-w-[180px]">{loc}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(loc);
              }}
              aria-label={`Remove ${loc}`}
              className="text-[hsl(212_100%_10%)]/40 hover:text-accent transition-colors"
            >
              <X size={13} />
            </button>
          </span>
        ))}
        {canAddMore && (
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                e.preventDefault();
                select(query.trim());
              } else if (e.key === 'Backspace' && !query && locations.length > 0) {
                onRemove(locations[locations.length - 1]);
              }
            }}
            placeholder={locations.length === 0 ? 'Search location or district' : 'Add another location'}
            className="flex-1 min-w-[120px] bg-transparent h-7 sm:h-8 text-sm sm:text-base leading-tight text-[hsl(222_24%_7%)] placeholder:text-[hsl(222_24%_7%)]/70 focus:outline-none py-0"
          />
        )}
        {!canAddMore && (
          <span className="text-sm text-foreground/50">Max 5 locations</span>
        )}
      </div>

      {open && (
        (() => {
          const q = query.trim();
          const showCurrent = locations.length === 0 && !nearMeLabel;
          const showRecent = recent.length > 0 && locations.length === 0 && query.length === 0;
          const showSuggestions = !!q && suggestions.length > 0;
          const showNoMatches = q.length >= 2 && suggestions.length === 0;
          if (!showCurrent && !showRecent && !showSuggestions && !showNoMatches) return null;
          return (
        <div className="absolute z-50 left-0 right-0 top-full mt-0 bg-white border border-[hsl(212_100%_10%)]/12 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
          {/* Current location */}
          {locations.length === 0 && !nearMeLabel && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                onUseCurrentLocation();
              }}
              disabled={locating}
              className="w-full flex items-center gap-3 px-5 py-4 text-left border-b border-[hsl(212_100%_10%)]/8 hover:bg-[hsl(0_0%_96%)] transition-colors disabled:opacity-60"
            >
              <Navigation size={17} strokeWidth={2} className={`flex-shrink-0 text-[hsl(212_100%_10%)] ${locating ? 'animate-pulse' : ''}`} />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-[hsl(212_100%_10%)] tracking-tight">
                  {locating ? 'Detecting location…' : 'Use my current location + 2 km'}
                </div>
                <div className="text-[13px] text-[hsl(212_100%_10%)]/55">Properties within a 2 km radius</div>
              </div>
            </button>
          )}

          {/* Recent searches */}
          {recent.length > 0 && locations.length === 0 && query.length === 0 && (
            <>
              <div className="flex items-center justify-between px-5 pt-3 pb-1">
                <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[hsl(212_100%_10%)]/45">Recent searches</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onClearRecent}
                  className="text-[11px] uppercase tracking-[0.12em] text-[hsl(212_100%_10%)]/45 hover:text-accent transition-colors"
                >
                  Clear
                </button>
              </div>
              <ul>
                {recent.map((term) => (
                  <li key={term} className="flex items-center">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        select(term);
                      }}
                      className="flex-1 min-w-0 flex items-center gap-3 px-5 py-3 text-left hover:bg-[hsl(0_0%_96%)] transition-colors"
                    >
                      <Clock size={15} className="flex-shrink-0 text-[hsl(212_100%_10%)]/40" />
                      <span className="text-[15px] text-[hsl(212_100%_10%)] truncate">{term}</span>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onRemoveRecent(term)}
                      aria-label={`Remove ${term}`}
                      className="px-4 py-3 text-[hsl(212_100%_10%)]/35 hover:text-accent transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Typed suggestions */}
          {query.trim() && suggestions.length > 0 && (
            <ul role="listbox">
              {suggestions.map((label) => (
                <li key={label} className="border-t border-[hsl(212_100%_10%)]/8 first:border-t-0">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(label)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[hsl(0_0%_96%)] transition-colors group"
                  >
                    <MapPin size={16} strokeWidth={2} className="flex-shrink-0 text-[hsl(212_100%_10%)]/45 group-hover:text-accent transition-colors" />
                    <span className="text-[15px] text-[hsl(212_100%_10%)] truncate">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* No matches */}
          {query.trim().length >= 2 && suggestions.length === 0 && (
            <div className="px-5 py-3.5 text-[14px] text-[hsl(212_100%_10%)]/50 border-t border-[hsl(212_100%_10%)]/8">
              No matching locations
            </div>
          )}
        </div>
          );
        })()
      )}
    </div>
  );
}
