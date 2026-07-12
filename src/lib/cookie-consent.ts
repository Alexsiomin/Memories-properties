export type CookieCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export interface CookieConsent {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of when consent was recorded */
  updatedAt: string;
  /** Schema version, bump to re-prompt all users */
  version: number;
}

export const CONSENT_VERSION = 1;
const STORAGE_KEY = 'memories_cookie_consent';
export const CONSENT_EVENT = 'memories:consent-changed';

export const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  updatedAt: '',
  version: CONSENT_VERSION,
};

export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return { ...parsed, necessary: true };
  } catch {
    return null;
  }
}

export function saveConsent(consent: Omit<CookieConsent, 'updatedAt' | 'version' | 'necessary'>) {
  const full: CookieConsent = {
    ...consent,
    necessary: true,
    updatedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: full }));
  return full;
}

export function clearConsent() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}

export function hasConsent(category: CookieCategory): boolean {
  const c = getConsent();
  if (!c) return category === 'necessary';
  return !!c[category];
}
