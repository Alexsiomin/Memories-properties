import { lovable } from '@/integrations/lovable/index';

const OAUTH_NEXT_KEY = 'memories:oauth-next';

export function sanitizeAuthNext(nextPath = '/account') {
  if (typeof window === 'undefined') return '/account';
  try {
    const url = new URL(nextPath, window.location.origin);
    if (url.origin !== window.location.origin) return '/account';
    return `${url.pathname}${url.search}${url.hash}` || '/account';
  } catch {
    return '/account';
  }
}

export function storeAuthNext(nextPath?: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(OAUTH_NEXT_KEY, sanitizeAuthNext(nextPath));
}

export function consumeAuthNext(fallback = '/account') {
  if (typeof window === 'undefined') return fallback;
  const next = sessionStorage.getItem(OAUTH_NEXT_KEY);
  sessionStorage.removeItem(OAUTH_NEXT_KEY);
  return sanitizeAuthNext(next || fallback);
}

export function peekAuthNext() {
  if (typeof window === 'undefined') return null;
  const next = sessionStorage.getItem(OAUTH_NEXT_KEY);
  return next ? sanitizeAuthNext(next) : null;
}

export async function signInWithGoogle(nextPath = '/account', extraParams?: Record<string, string>) {
  storeAuthNext(nextPath);

  return lovable.auth.signInWithOAuth('google', {
    redirect_uri: window.location.origin,
    extraParams,
  });
}