import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PriceOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface PriceSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: PriceOption[];
  placeholder: string;
}

export const PriceSelect = ({ value, onChange, options, placeholder }: PriceSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-12 w-full px-4 pr-10 flex items-center text-left bg-background text-foreground text-sm border transition-colors focus:outline-none",
          open ? "border-primary ring-1 ring-primary" : "border-foreground/20 hover:border-foreground/40"
        )}
      >
        {selected ? selected.label : placeholder}
        <ChevronDown
          className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-foreground/70 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-background border border-foreground/20 shadow-lg"
        >
          <li>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm border-b border-foreground/10 transition-colors",
                value === ""
                  ? "bg-foreground text-white"
                  : "text-primary hover:bg-foreground/5"
              )}
            >
              {placeholder}
            </button>
          </li>
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                disabled={o.disabled}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm border-b border-foreground/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                  value === o.value
                    ? "bg-foreground text-white"
                    : "text-primary hover:bg-foreground/5"
                )}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
