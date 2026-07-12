import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { signInWithGoogle } from '@/lib/auth-redirect';
import { toast } from 'sonner';

const DISMISS_KEY = 'g_onetap_dismissed';

const GoogleOneTapPrompt = () => {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || user) return;
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    const t = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(t);
  }, [loading, user]);

  useEffect(() => {
    if (user && visible) setVisible(false);
  }, [user, visible]);

  if (!visible || user) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  const handleContinue = async () => {
    setBusy(true);
    const result = await signInWithGoogle('/welcome');
    if (result.error) {
      toast.error('Could not sign in with Google');
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[40] w-[min(92vw,380px)] rounded-[var(--radius)] border border-foreground/10 bg-white text-foreground shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] animate-in slide-in-from-bottom-4 fade-in duration-300"
      role="dialog"
      aria-label="Sign in with Google"
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-foreground/10">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Sign in to Memories with Google</span>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="w-7 h-7 -mr-1 flex items-center justify-center text-foreground/40 hover:text-foreground/70 text-xl leading-none rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
        >
          ×
        </button>
      </div>

      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold">
            M
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Continue with Google</p>
            <p className="text-xs text-foreground/60">Log in securely using your Google account to unlock your personalized dashboard. By signing in, you can save your favorite real estate listings, set up customized search alerts for land and investments in Cyprus, and manage your property enquiries directly with our team.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={busy}
          className="mt-4 w-full h-11 rounded-full bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {busy ? 'Please wait…' : 'Continue with Google'}
        </button>

        <p className="mt-3 text-[11px] leading-relaxed text-foreground/50">
          To continue, Google will share your name, email address, and profile picture with this site. See our{' '}
          <a href="/privacy" className="underline underline-offset-2 hover:text-accent">privacy policy</a> and{' '}
          <a href="/terms" className="underline underline-offset-2 hover:text-accent">terms of service</a>.
        </p>
      </div>
    </div>
  );
};

export default GoogleOneTapPrompt;
