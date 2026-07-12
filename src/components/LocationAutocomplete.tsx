import { useEffect, useRef, useState } from "react";
import { fetchLocationSuggestions } from "@/lib/places";

interface Suggestion {
  text: string;
}


interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const sessionTokenRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipFetchRef = useRef(false);




  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    const input = value.trim();
    if (input.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const mapped = await fetchLocationSuggestions(input);
        if (cancelled) return;
        setSuggestions(mapped.map((text) => ({ text })));
        setOpen(mapped.length > 0);
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setOpen(false);
        }
      }
    }, 250);


    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [value]);

  const select = (text: string) => {
    skipFetchRef.current = true;
    // Use the primary locality name (before the first comma) so it matches
    // how property locations are stored, and drop generic district/country suffixes.
    const primary = text.split(",")[0].trim();
    onChange(primary);
    if (onSelect) onSelect(primary);
    setOpen(false);
    setSuggestions([]);
    sessionTokenRef.current = null;
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-foreground/20 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.text}-${i}`}>
              <button
                type="button"
                onClick={() => select(s.text)}
                className="w-full text-left px-5 py-2.5 text-sm text-foreground hover:bg-foreground/10"
              >
                {s.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
