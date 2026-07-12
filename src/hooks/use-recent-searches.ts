import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'recent-property-searches';
const MAX_ITEMS = 6;

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(read());
  }, []);

  const addRecent = useCallback((termRaw: string) => {
    const term = termRaw.trim();
    if (!term) return;
    setRecent((prev) => {
      const next = [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_ITEMS);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const removeRecent = useCallback((term: string) => {
    setRecent((prev) => {
      const next = prev.filter((t) => t !== term);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  return { recent, addRecent, removeRecent, clearRecent };
}
