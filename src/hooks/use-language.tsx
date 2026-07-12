import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/** True when a pathname is under the /ru language prefix. */
export const isRuPath = (path: string) => path === '/ru' || path.startsWith('/ru/');
/** Strip the /ru prefix to get the canonical English path. */
export const stripLangPrefix = (path: string) => (isRuPath(path) ? path.replace(/^\/ru/, '') || '/' : path);
/** Add the /ru prefix to an English path. */
export const addRuPrefix = (path: string) => (path === '/' ? '/ru' : `/ru${path}`);

type Lang = 'en' | 'ru';

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
const CACHE_KEY = 'ru-translation-cache-v3';

// Skip these elements entirely (their text should never be translated / touched).
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);

const loadCache = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  // URL is the source of truth for indexable pages; localStorage remembers the
  // user's preference so plain in-app links (without /ru) still stay Russian.
  const [pref, setPref] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem(STORAGE_KEY) as Lang) || 'en';
  });
  const urlRu = isRuPath(location.pathname);
  const lang: Lang = urlRu ? 'ru' : pref;
  const [translating, setTranslating] = useState(false);


  const cacheRef = useRef<Record<string, string>>(loadCache());
  // Maps a text node -> its original English string, so we can restore on switch back.
  const originalsRef = useRef<Map<Text, string>>(new Map());
  // The exact value we last wrote to each node, to detect (and ignore) our own edits.
  const appliedRef = useRef<Map<Text, string>>(new Map());
  const observerRef = useRef<MutationObserver | null>(null);
  const pendingRef = useRef<Set<Text>>(new Set());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveCache = useCallback(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheRef.current));
    } catch {
      /* quota — ignore */
    }
  }, []);

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
    if (lang !== 'ru') return;
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
            body: { texts: chunk, target: 'ru' },
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
              // Only apply if still in ru mode and node still shows original.
              if (lang === 'ru') applyToNode(node, tr);
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

  // A directly-opened /ru URL (e.g. a shared or crawled link) should persist the
  // Russian preference so subsequent un-prefixed navigation stays Russian.
  useEffect(() => {
    if (urlRu && pref !== 'ru') {
      setPref('ru');
      localStorage.setItem(STORAGE_KEY, 'ru');
    }
  }, [urlRu, pref]);

  // Main effect: react to language changes.

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.lang = lang;

    if (lang === 'ru') {
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
    } else {
      // Switch back to English.
      observerRef.current?.disconnect();
      observerRef.current = null;
      pendingRef.current.clear();
      restoreOriginals();
    }
  }, [lang, queueNodes, restoreOriginals]);

  const setLang = useCallback(
    (l: Lang) => {
      localStorage.setItem(STORAGE_KEY, l);
      setPref(l);
      // Reflect the choice in the URL so the page is a real, shareable, indexable
      // localized URL (/ru/... for Russian, un-prefixed for English).
      const base = stripLangPrefix(location.pathname);
      const target = l === 'ru' ? addRuPrefix(base) : base;
      const full = target + location.search + location.hash;
      if (full !== location.pathname + location.search + location.hash) {
        navigate(full);
      }
    },
    [location, navigate],
  );


  const toggle = useCallback(() => {
    setLang(lang === 'ru' ? 'en' : 'ru');
  }, [lang, setLang]);

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, translating }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLanguage = () => useContext(LangContext);
