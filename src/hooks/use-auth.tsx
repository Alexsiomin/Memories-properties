import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { consumeAuthNext, peekAuthNext } from '@/lib/auth-redirect';

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

function saveLastUser(u: User) {
  try {
    const meta = u.user_metadata || {};
    const name = meta.full_name || meta.name || meta.given_name || (u.email ? u.email.split('@')[0] : '') || '';
    const data = {
      name,
      email: u.email || '',
      avatar: meta.avatar_url || '',
    };
    localStorage.setItem('memories:lastUser', JSON.stringify(data));
  } catch { /* noop */ }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recordActivity = async (uid: string) => {
      const { data: last } = await supabase
        .from('login_history')
        .select('created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last && Date.now() - new Date(last.created_at).getTime() < 5 * 60 * 1000) return;
      const ip = await fetch('https://api.ipify.org?format=json')
        .then(r => r.json()).catch(() => ({ ip: null }));
      await supabase.from('login_history').insert({
        user_id: uid,
        user_agent: navigator.userAgent,
        ip_address: ip?.ip ?? null,
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && s?.user) {
        const uid = s.user.id;
        saveLastUser(s.user);
        const next = peekAuthNext();
        if (next && window.location.pathname !== next) {
          window.history.replaceState({}, '', consumeAuthNext('/account'));
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        setTimeout(() => { recordActivity(uid); }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        saveLastUser(s.user);
        recordActivity(s.user.id);
      }
    });

    // Heartbeat every 4 minutes so "online" status stays fresh
    const hb = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (s?.user) recordActivity(s.user.id);
      });
    }, 4 * 60 * 1000);

    return () => { subscription.unsubscribe(); clearInterval(hb); };
  }, []);

  const signOut = async () => {
    // Clear local state first so the UI updates immediately, even if the
    // network request hangs or the session is already invalid.
    setSession(null);
    setUser(null);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('Sign out error', e);
    }
  };

  return <Ctx.Provider value={{ user, session, loading, signOut }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
