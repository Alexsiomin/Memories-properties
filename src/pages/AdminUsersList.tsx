import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';

interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  phone_country: string | null;
  phone_number: string | null;
  whatsapp_verified: boolean | null;
  dob: string | null;
  situation: string | null;
  is_admin?: boolean;
  last_login?: string | null;
  login_count?: number;
  favorites_count?: number;
  saved_searches_count?: number;
}

const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—');
const formatDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const isOnline = (d?: string | null) => !!d && Date.now() - new Date(d).getTime() < ONLINE_WINDOW_MS;
const relativeTime = (d?: string | null) => {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
};

const ageFrom = (dob?: string | null) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

export default function AdminUsersList() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: profiles }, { data: roles }, { data: logins }, { data: favs }, { data: searches }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, display_name, avatar_url, created_at, updated_at, first_name, middle_name, last_name, phone_country, phone_number, whatsapp_verified, dob, situation')
          .order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id').eq('role', 'admin'),
        supabase.from('login_history').select('user_id, created_at').order('created_at', { ascending: false }),
        supabase.from('favorites').select('user_id'),
        supabase.from('saved_searches').select('user_id'),
      ]);

      const adminIds = new Set((roles ?? []).map((r: any) => r.user_id));
      const lastLoginByUser = new Map<string, string>();
      const loginCount = new Map<string, number>();
      (logins ?? []).forEach((l: any) => {
        if (!lastLoginByUser.has(l.user_id)) lastLoginByUser.set(l.user_id, l.created_at);
        loginCount.set(l.user_id, (loginCount.get(l.user_id) ?? 0) + 1);
      });
      const favCount = new Map<string, number>();
      (favs ?? []).forEach((f: any) => favCount.set(f.user_id, (favCount.get(f.user_id) ?? 0) + 1));
      const searchCount = new Map<string, number>();
      (searches ?? []).forEach((s: any) => searchCount.set(s.user_id, (searchCount.get(s.user_id) ?? 0) + 1));

      setRows((profiles ?? []).map((p: any) => ({
        ...p,
        is_admin: adminIds.has(p.id),
        last_login: lastLoginByUser.get(p.id) ?? null,
        login_count: loginCount.get(p.id) ?? 0,
        favorites_count: favCount.get(p.id) ?? 0,
        saved_searches_count: searchCount.get(p.id) ?? 0,
      })));
      setLoading(false);
    })();
  }, [isAdmin]);

  if (authLoading || adminLoading) return <div className="container mx-auto px-6 py-24">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1></div>;

  const filtered = rows.filter(r => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    const haystack = [
      r.display_name, r.first_name, r.middle_name, r.last_name,
      r.phone_number, r.situation, r.id,
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <div className="container mx-auto px-6 py-16 max-w-5xl">
      <h1 className="text-4xl mb-3">Users</h1>
      <p className="text-base text-muted-foreground mb-8">
        {rows.length} total user{rows.length === 1 ? '' : 's'} · {rows.filter(r => r.is_admin).length} admin{rows.filter(r => r.is_admin).length === 1 ? '' : 's'}
      </p>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, phone, situation, or user id…"
        className="mb-6"
      />

      {loading ? (
        <div className="text-muted-foreground">Loading users…</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const fullName = [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || r.display_name || '(no name)';
            const phone = [r.phone_country, r.phone_number].filter(Boolean).join(' ');
            const age = ageFrom(r.dob);
            return (
              <div key={r.id} className="border p-4 flex items-start gap-4 text-lg">
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-base font-medium shrink-0">
                    {(fullName ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-base">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{fullName}</span>
                    {isOnline(r.last_login) && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    )}
                    {r.is_admin && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/15 text-accent font-semibold">
                        Admin
                      </span>
                    )}
                    {r.whatsapp_verified && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-semibold">
                        WhatsApp ✓
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-base">
                    {phone && <span>📞 {phone}</span>}
                    {r.situation && <span>· {r.situation}</span>}
                    {r.dob && <span>· DOB {formatDate(r.dob)}{age != null ? ` (${age}y)` : ''}</span>}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-base">
                    <span>Joined {formatDate(r.created_at)}</span>
                    {r.updated_at && r.updated_at !== r.created_at && (
                      <span>· Updated {formatDate(r.updated_at)}</span>
                    )}
                    <span>· Last login {formatDateTime(r.last_login)}{r.last_login ? ` (${relativeTime(r.last_login)})` : ''}</span>
                    <span>· {r.login_count} login{r.login_count === 1 ? '' : 's'}</span>
                    <span>· {r.favorites_count} favorite{r.favorites_count === 1 ? '' : 's'}</span>
                    <span>· {r.saved_searches_count} saved search{r.saved_searches_count === 1 ? '' : 'es'}</span>
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground/70 font-mono truncate">{r.id}</div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-muted-foreground">No users match your search.</div>
          )}
        </div>
      )}
    </div>
  );
}
