import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type Lang = 'en' | 'ru' | 'el' | 'de';

/** Non-English language codes that get a URL prefix (e.g. /ru, /el, /de). */
export const LANG_CODES: Exclude<Lang, 'en'>[] = ['ru', 'el', 'de'];
export const LANG_LABELS: Record<Lang, string> = { en: 'EN', ru: 'RU', el: 'EL', de: 'DE' };

/** True when a pathname is under a given language's URL prefix. */
export const isLangPath = (path: string, code: string) => path === `/${code}` || path.startsWith(`/${code}/`);
/** True when a pathname is under the /ru language prefix. Kept for backward compatibility. */
export const isRuPath = (path: string) => isLangPath(path, 'ru');
/** The language prefix a path is under, or null if it's an unprefixed (English) path. */
export const langOfPath = (path: string): Exclude<Lang, 'en'> | null =>
  LANG_CODES.find((c) => isLangPath(path, c)) ?? null;
/** Strip any known language prefix to get the canonical English path. */
export const stripLangPrefix = (path: string) => {
  const code = langOfPath(path);
  return code ? path.replace(new RegExp(`^/${code}`), '') || '/' : path;
};
/** Add a language's prefix to an English path. */
export const addLangPrefix = (path: string, code: Exclude<Lang, 'en'>) => (path === '/' ? `/${code}` : `/${code}${path}`);
/** Add the /ru prefix to an English path. Kept for backward compatibility. */
export const addRuPrefix = (path: string) => addLangPrefix(path, 'ru');

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  translating: boolean;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  toggle: () => {},
  translating: false,
});

const STORAGE_KEY = 'site-lang';
const cacheKeyFor = (l: Lang) => `translation-cache-v3-${l}`;


// Skip these elements entirely (their text should never be translated / touched).
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);

const loadCache = (l: Lang): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(cacheKeyFor(l)) || '{}');
  } catch {
    return {};
  }
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // URL is the source of truth for indexable pages; localStorage remembers the
  // user's preference so plain in-app links (without a language prefix) stay
  // in that language too.
  const [pref, setPref] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem(STORAGE_KEY) as Lang) || 'en';
  });
  const urlLang = langOfPath(location.pathname);
  const lang: Lang = urlLang ?? pref;
  const [translating, setTranslating] = useState(false);


  const cacheRef = useRef<Record<string, string>>(loadCache(lang));
  // Reload the cache whenever the active language changes — each language
  // keeps its own cache bucket so switching back and forth stays instant.
  useEffect(() => {
    cacheRef.current = loadCache(lang);
  }, [lang]);
  // Maps a text node -> its original English string, so we can restore on switch back.
  const originalsRef = useRef<Map<Text, string>>(new Map());
  // The exact value we last wrote to each node, to detect (and ignore) our own edits.
  const appliedRef = useRef<Map<Text, string>>(new Map());
  const observerRef = useRef<MutationObserver | null>(null);
  const pendingRef = useRef<Set<Text>>(new Set());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveCache = useCallback(() => {
    try {
      localStorage.setItem(cacheKeyFor(lang), JSON.stringify(cacheRef.current));
    } catch {
      /* quota — ignore */
    }
  }, [lang]);

  const isTranslatable = (node: Text): boolean => {
    const value = node.nodeValue;
    if (!value || !value.trim()) return false;
    // Ignore pure numbers / symbols / prices.
    if (!/[a-zA-Z]/.test(value)) return false;
    let el: HTMLElement | null = node.parentElement;
    while (el) {
      if (SKIP_TAGS.has(el.tagName)) return false;
      if (el.getAttribute && (el.getAttribute('translate') === 'no' || el.classList.contains('notranslate'))) return false;
      el = el.parentElement;
    }
    return true;
  };

  const collectTextNodes = (root: Node): Text[] => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        isTranslatable(n as Text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const out: Text[] = [];
    let cur = walker.nextNode();
    while (cur) {
      out.push(cur as Text);
      cur = walker.nextNode();
    }
    return out;
  };

  const applyToNode = (node: Text, translated: string) => {
    if (!originalsRef.current.has(node)) {
      originalsRef.current.set(node, node.nodeValue || '');
    }
    // Preserve leading/trailing whitespace of the original.
    const orig = node.nodeValue || '';
    const lead = orig.match(/^\s*/)?.[0] ?? '';
    const trail = orig.match(/\s*$/)?.[0] ?? '';
    const next = lead + translated.trim() + trail;
    if (node.nodeValue === next) return; // no-op, avoid spurious mutations
    node.nodeValue = next;
    appliedRef.current.set(node, next);
  };

  const flush = useCallback(async () => {
    if (lang === 'en') return;
    const nodes = Array.from(pendingRef.current);
    pendingRef.current.clear();
    if (nodes.length === 0) return;

    // Resolve from cache first.
    const uncachedMap = new Map<string, Text[]>();
    const cache = cacheRef.current;
    for (const node of nodes) {
      const key = (node.nodeValue || '').trim();
      if (!key) continue;
      if (cache[key]) {
        applyToNode(node, cache[key]);
      } else {
        const arr = uncachedMap.get(key) || [];
        arr.push(node);
        uncachedMap.set(key, arr);
      }
    }

    const uniqueTexts = Array.from(uncachedMap.keys());
    if (uniqueTexts.length === 0) return;

    setTranslating(true);
    try {
      // Batch in chunks to keep requests reasonable.
      const CHUNK = 60;
      for (let i = 0; i < uniqueTexts.length; i += CHUNK) {
        const chunk = uniqueTexts.slice(i, i + CHUNK);
        let data: any, error: any;
        try {
          const res = await supabase.functions.invoke('translate', {
            body: { texts: chunk, target: lang },
          });
          data = res.data; error = res.error;
        } catch {
          continue;
        }
        if (error || !data?.translations) continue;
        const translations: string[] = data.translations;
        chunk.forEach((text, idx) => {
          const tr = translations[idx];
          if (typeof tr === 'string' && tr.length) {
            cache[text] = tr;
            for (const node of uncachedMap.get(text) || []) {
              // Only apply if the language hasn't changed mid-flight.
              if (lang !== 'en') applyToNode(node, tr);
            }
          }
        });
      }
      saveCache();
    } finally {
      setTranslating(false);
    }
  }, [lang, saveCache]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      flush();
    }, 250);
  }, [flush]);

  const queueNodes = useCallback(
    (nodes: Text[]) => {
      for (const n of nodes) pendingRef.current.add(n);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const restoreOriginals = useCallback(() => {
    for (const [node, original] of originalsRef.current.entries()) {
      try {
        node.nodeValue = original;
      } catch {
        /* node detached — ignore */
      }
    }
    originalsRef.current.clear();
    appliedRef.current.clear();
  }, []);

  // A directly-opened localized URL (e.g. a shared or crawled /el/... link)
  // should persist that language preference so subsequent un-prefixed
  // navigation stays in the same language.
  useEffect(() => {
    if (urlLang && pref !== urlLang) {
      setPref(urlLang);
      localStorage.setItem(STORAGE_KEY, urlLang);
    }
  }, [urlLang, pref]);

  // Main effect: react to language changes. Always restore to the original
  // English text first, then re-translate if needed — this correctly handles
  // switching directly between two non-English languages (e.g. RU -> EL)
  // without trying to re-translate already-translated text.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.lang = lang;

    observerRef.current?.disconnect();
    observerRef.current = null;
    pendingRef.current.clear();
    restoreOriginals();

    if (lang !== 'en') {
      queueNodes(collectTextNodes(document.body));

      const observer = new MutationObserver((mutations) => {
        const added: Text[] = [];
        for (const m of mutations) {
          if (m.type === 'childList') {
            m.addedNodes.forEach((n) => {
              if (n.nodeType === Node.TEXT_NODE) {
                if (isTranslatable(n as Text)) added.push(n as Text);
              } else if (n.nodeType === Node.ELEMENT_NODE) {
                added.push(...collectTextNodes(n));
              }
            });
          } else if (m.type === 'characterData') {
            const t = m.target as Text;
            if (!isTranslatable(t)) continue;
            // Ignore the edit we just made ourselves.
            if (appliedRef.current.get(t) === t.nodeValue) continue;
            // Genuine content change → re-capture original and re-translate.
            originalsRef.current.delete(t);
            appliedRef.current.delete(t);
            added.push(t);
          }
        }
        if (added.length) queueNodes(added);
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      observerRef.current = observer;

      return () => {
        observer.disconnect();
        observerRef.current = null;
      };
    }
  }, [lang, queueNodes, restoreOriginals]);

  const setLang = useCallback(
    (l: Lang) => {
      localStorage.setItem(STORAGE_KEY, l);
      setPref(l);
      // Reflect the choice in the URL so the page is a real, shareable, indexable
      // localized URL (/ru/... /el/... /de/... for non-English, un-prefixed for English).
      const base = stripLangPrefix(location.pathname);
      const target = l === 'en' ? base : addLangPrefix(base, l);
      const full = target + location.search + location.hash;
      if (full !== location.pathname + location.search + location.hash) {
        navigate(full);
      }
    },
    [location, navigate],
  );


  // Cycles through all languages in order — mainly kept for API compatibility;
  // the UI uses setLang directly for explicit language selection.
  const ALL_LANGS: Lang[] = ['en', ...LANG_CODES];
  const toggle = useCallback(() => {
    const next = ALL_LANGS[(ALL_LANGS.indexOf(lang) + 1) % ALL_LANGS.length];
    setLang(next);
  }, [lang, setLang]);

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, translating }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLanguage = () => useContext(LangContext);
