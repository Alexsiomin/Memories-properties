import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { consumeAuthNext, peekAuthNext, storeAuthNext } from '@/lib/auth-redirect';

const AUTH_KEYS = new Set([
  'access_token',
  'refresh_token',
  'expires_in',
  'expires_at',
  'token_type',
  'provider_token',
  'provider_refresh_token',
  'state',
  'type',
]);

function readAuthParams() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);
  const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
  return { accessToken, refreshToken };
}

function removeAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  AUTH_KEYS.forEach((key) => url.searchParams.delete(key));

  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  let hadAuthHash = false;
  AUTH_KEYS.forEach((key) => {
    if (hashParams.has(key)) hadAuthHash = true;
    hashParams.delete(key);
  });

  const cleanedHash = hashParams.toString();
  url.hash = cleanedHash && !hadAuthHash ? `#${cleanedHash}` : '';
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

const AuthSessionBridge = () => {
  const navigate = useNavigate();
  const handlingRef = useRef(false);

  useEffect(() => {
    const completeRedirectSession = async () => {
      if (handlingRef.current) return;
      const { accessToken, refreshToken } = readAuthParams();
      if (!accessToken || !refreshToken) return;

      handlingRef.current = true;
      const fallback = window.location.pathname === '/auth/callback' ? '/account' : window.location.pathname;
      const next = peekAuthNext() || fallback;

      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          storeAuthNext(next);
          return;
        }

        removeAuthParamsFromUrl();
        const target = consumeAuthNext(next);
        if (target && `${window.location.pathname}${window.location.search}${window.location.hash}` !== target) {
          navigate(target, { replace: true });
        }
      } finally {
        handlingRef.current = false;
      }
    };

    completeRedirectSession();
    window.addEventListener('hashchange', completeRedirectSession);
    return () => window.removeEventListener('hashchange', completeRedirectSession);
  }, [navigate]);

  return null;
};

export default AuthSessionBridge;