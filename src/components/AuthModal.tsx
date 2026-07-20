import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { signInWithGoogle } from '@/lib/auth-redirect';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Eye, EyeOff } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { setRememberSession } from '@/lib/session-bootstrap';

// Compact logo mark, mirrored from Masthead's monogram — drawn inline so it
// inherits color via currentColor without depending on an external asset.
const MonogramIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 726.010389 470.801074" className={className} fill="currentColor" aria-hidden="true">
    <g transform="translate(-263.994806,887.794883) scale(0.1,-0.1)">
      <path d="M4919 8873 c-4 -36 -5 -113 -7 -495 l-2 -437 -437 4 c-241 2 -448 2
-460 -2 l-23 -5 0 -259 0 -259 -255 0 -255 0 0 259 0 258 -62 5 c-35 2 -223 4
-418 3 l-355 0 -3 -1888 -2 -1887 1595 0 1595 0 2 733 3 732 452 3 453 2 2
-732 3 -733 1578 -3 1577 -2 -2 1886 -3 1885 -395 0 -395 -1 -3 -260 -2 -260
-255 0 -255 0 -2 260 -3 261 -395 0 c-217 0 -423 3 -457 6 l-63 5 -2 462 -3
461 -1372 3 c-755 1 -1373 -1 -1374 -5z" />
    </g>
  </svg>
);

type Mode = 'signin' | 'signup' | 'forgot';

const AuthModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('memories:rememberEmail') ?? ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const open = searchParams.get('auth') === '1';

  const handleClose = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('auth');
    navigate(
      { pathname: location.pathname, search: next.toString() ? `?${next.toString()}` : '', hash: location.hash },
      { replace: true }
    );
  }, [navigate, location.pathname, location.hash, searchParams]);

  useEffect(() => {
    if (open && user) handleClose();
  }, [open, user, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) { toast.error('Please enter your email.'); return; }

    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('Password reset link sent. Check your inbox.');
        setMode('signin');
        return;
      }

      if (!password || password.length < 6) {
        toast.error('Password must be at least 6 characters.');
        setBusy(false);
        return;
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: name.trim() ? { display_name: name.trim(), full_name: name.trim() } : undefined,
          },
        });
        if (error) throw error;
        setRememberSession(true);
        toast.success('Account created! You are now signed in.');
        handleClose();
        return;
      }

      // signin
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) throw error;
      setRememberSession(remember);
      try {
        if (remember) localStorage.setItem('memories:rememberEmail', cleanEmail);
        else localStorage.removeItem('memories:rememberEmail');
      } catch { /* storage unavailable */ }
      toast.success('Signed in.');
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Sign in to Memories';
  const subtitle = mode === 'signup'
    ? 'Save favorites, set alerts, and manage your enquiries.'
    : mode === 'forgot'
    ? 'Enter your email and we will send you a reset link.'
    : 'Log in to access your saved listings and alerts.';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md bg-[#00101f] text-white border-0 p-0 gap-0 max-h-[92vh] overflow-y-auto [&>button]:text-white/70 [&>button:hover]:text-white [&>button]:top-4 [&>button]:right-4">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div className="flex flex-col items-center gap-3 pt-10 pb-6">
          <MonogramIcon className="h-9 w-auto text-white" />
          <span className="font-light uppercase tracking-[0.32em] text-white text-2xl">
            Memories
          </span>
        </div>

        <div className="w-full max-w-[400px] mx-auto flex flex-col gap-4 px-6 pb-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white leading-snug tracking-tight">{title}</h2>
            <p className="text-sm text-white/60 mt-1.5 leading-relaxed">{subtitle}</p>
          </div>

          <button
            type="button"
            disabled={googleBusy}
            onClick={async () => {
              setGoogleBusy(true);
              const result = await signInWithGoogle('/account');
              if (result.error) {
                toast.error('Could not sign in with Google');
                setGoogleBusy(false);
              }
            }}
            className="btn-cta btn-cta-solid btn-cta-block bg-white text-[#00101f]"
          >
            {googleBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/15" />
            <span className="text-xs uppercase tracking-[0.15em] text-white/40">or</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                className="w-full h-12 px-4 bg-white/[0.06] border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-accent transition-colors"
              />
            )}
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              required
              className="w-full h-12 px-4 bg-white/[0.06] border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-accent transition-colors"
            />
            {mode !== 'forgot' && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  className="w-full h-12 pl-4 pr-12 bg-white/[0.06] border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}


            {mode === 'signin' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-white/60 hover:text-white cursor-pointer select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 accent-accent cursor-pointer"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-white/60 hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}


            <button
              type="submit"
              disabled={busy}
              className="btn-cta btn-cta-solid btn-cta-block relative z-10 bg-white text-[#00101f]"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
            </button>
          </form>

          <div className="text-center text-sm text-white/60">
            {mode === 'signin' && (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={() => setMode('signup')} className="text-white font-medium underline underline-offset-2 hover:text-accent transition-colors">
                  Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('signin')} className="text-white font-medium underline underline-offset-2 hover:text-accent transition-colors">
                  Sign in
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <button type="button" onClick={() => setMode('signin')} className="text-white font-medium underline underline-offset-2 hover:text-accent transition-colors">
                Back to sign in
              </button>
            )}
          </div>

          <p className="text-[11px] text-white/50 text-center leading-relaxed">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
