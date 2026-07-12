import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { consumeAuthNext } from '@/lib/auth-redirect';

import { useAuth } from '@/hooks/use-auth';
import { AlertCircle, Loader2 } from 'lucide-react';

type Status = 'working' | 'error';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<Status>('working');
  const [errorMessage, setErrorMessage] = useState('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Pull any error the provider handed back, from either the query string or the hash.
    const readProviderError = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const code = params.get('error') || hash.get('error');
      if (!code) return null;
      const desc =
        params.get('error_description') ||
        hash.get('error_description') ||
        params.get('error_code') ||
        hash.get('error_code') ||
        '';
      const readable = decodeURIComponent(desc.replace(/\+/g, ' ')).trim();
      return readable ? `${readable} (${code})` : code;
    };

    const fail = (message: string) => {
      if (cancelled) return;
      setErrorMessage(message);
      setStatus('error');
    };

    const finish = async () => {
      const providerError = readProviderError();
      if (providerError) {
        fail(providerError);
        return;
      }

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      const code = new URLSearchParams(window.location.search).get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (error) {
          fail(error.message);
          return;
        }
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        if (error) {
          fail(error.message);
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error) {
        fail(error.message);
        return;
      }
      if (data.session?.user) {
        navigate(consumeAuthNext('/account'), { replace: true });
        return;
      }
      // No session and auth context has settled with no user → sign-in didn't complete.
      if (!loading && !user) {
        fail('We couldn’t complete your sign-in. The session was not established. Please try again.');
      }
    };

    finish();
    const timer = window.setTimeout(finish, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [navigate, user, loading]);

  // Google sign-in temporarily disabled — no retry available.

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Sign-in didn’t complete</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Something went wrong while signing you in with Google. You can try again below.
          </p>
          {errorMessage && (
            <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4 text-left">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Error details</p>
              <p className="mt-1 break-words text-sm text-foreground">{errorMessage}</p>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => navigate('/', { replace: true })}
              className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Return to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
