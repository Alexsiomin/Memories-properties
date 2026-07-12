import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Star, Search, Trash2, LogOut, Save, MessageCircle, Clock, LogIn, User as UserIcon, Mail, ShieldCheck, Sparkles, BadgeCheck, X, Home, Key, FileCheck2, SearchCheck, Camera, Loader2, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { publicTitle } from '@/lib/propertyDisplay';

interface Favorite {
  id: string;
  property_id: string;
  property_title: string;
  property_location: string | null;
  property_price: string | null;
  property_image: string | null;
  created_at: string;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string | null;
  region: string | null;
  mode: string | null;
  tags: string[] | null;
  created_at: string;
}

interface AlertRow {
  id: string;
  label: string | null;
  email: string;
  listing_type: string | null;
  categories: string[] | null;
  regions: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  min_beds: number | null;
  min_baths: number | null;
  tags: string[] | null;
  active: boolean;
  created_at: string;
}

interface AlertMatch {
  id: string;
  property_title: string | null;
  property_slug: string | null;
  property_id: string;
  seen_at: string | null;
  created_at: string;
}

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  dob: string | null;
  situation: string | null;
  phone_country: string | null;
  phone_number: string | null;
  whatsapp_verified: boolean;
  created_at?: string;
}

interface LoginEntry {
  id: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

const SITUATIONS = ['I am Buyer', 'I am Seller', 'I am Estate Agent', 'I am Investor', 'Other'];
const COUNTRY_CODES = [
  { c: 'cy', flag: '🇨🇾', name: 'Cyprus', code: '+357' },
  { c: 'gr', flag: '🇬🇷', name: 'Greece', code: '+30' },
  { c: 'uk', flag: '🇬🇧', name: 'United Kingdom', code: '+44' },
  { c: 'us', flag: '🇺🇸', name: 'United States', code: '+1' },
  { c: 'de', flag: '🇩🇪', name: 'Germany', code: '+49' },
  { c: 'fr', flag: '🇫🇷', name: 'France', code: '+33' },
  { c: 'ru', flag: '🇷🇺', name: 'Russia', code: '+7' },
];

const empty: ProfileData = {
  display_name: null, avatar_url: null,
  first_name: '', middle_name: '', last_name: '',
  dob: null, situation: '', phone_country: '+357', phone_number: '',
  whatsapp_verified: false,
};

const Account = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [matches, setMatches] = useState<AlertMatch[]>([]);
  const [profile, setProfile] = useState<ProfileData>(empty);
  const [logins, setLogins] = useState<LoginEntry[]>([]);
  const [showSignOut, setShowSignOut] = useState(false);
  const [tab, setTab] = useState<'profile' | 'watchlist' | 'searches' | 'alerts'>(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    return t === 'watchlist' || t === 'searches' || t === 'alerts' ? t : 'profile';
  });
  const [saving, setSaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `avatars/${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('property-images')
      .upload(path, file, { upsert: true, cacheControl: '3600' });
    if (upErr) {
      setUploadingAvatar(false);
      toast.error(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from('property-images').getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: dbErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: url });
    setUploadingAvatar(false);
    if (dbErr) {
      toast.error(dbErr.message);
      return;
    }
    setProfile(p => ({ ...p, avatar_url: url }));
    toast.success('Profile picture updated');
  };

  useEffect(() => {
    if (!loading && !user) navigate('/auth', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [favRes, searchRes, profRes, loginRes, alertRes, matchRes] = await Promise.all([
        supabase.from('favorites').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('saved_searches').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('login_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('property_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('property_alert_matches').select('id, property_title, property_slug, property_id, seen_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      ]);
      setFavorites(favRes.data ?? []);
      setSearches(searchRes.data ?? []);
      setLogins(loginRes.data ?? []);
      setAlerts((alertRes.data ?? []) as AlertRow[]);
      setMatches((matchRes.data ?? []) as AlertMatch[]);
      // Pull name from Google metadata if not yet on profile
      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      const metaFull = meta.full_name || meta.name || meta.display_name || '';
      const metaGiven = meta.given_name || metaFull.split(' ')[0] || '';
      const metaFamily = meta.family_name || metaFull.split(' ').slice(1).join(' ') || '';
      const metaAvatar = meta.avatar_url || meta.picture || null;

      if (profRes.data) {
        setProfile({
          ...empty,
          ...profRes.data,
          first_name: profRes.data.first_name || metaGiven,
          last_name: profRes.data.last_name || metaFamily,
          display_name: profRes.data.display_name || metaFull,
          avatar_url: profRes.data.avatar_url || metaAvatar,
          phone_country: profRes.data.phone_country || '+357',
        });
      } else {
        setProfile({
          ...empty,
          first_name: metaGiven,
          last_name: metaFamily,
          display_name: metaFull,
          avatar_url: metaAvatar,
        });
      }
    })();
  }, [user]);

  const memberSince = useMemo(() => {
    const d = profile.created_at ? new Date(profile.created_at) : user?.created_at ? new Date(user.created_at) : null;
    return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  }, [profile.created_at, user?.created_at]);

  const dobParts = useMemo(() => {
    if (!profile.dob) return { d: '', m: '', y: '' };
    const [y, m, d] = profile.dob.split('-');
    return { d: String(Number(d)), m: String(Number(m)), y };
  }, [profile.dob]);

  const setDob = (d: string, m: string, y: string) => {
    if (d && m && y) {
      const dd = d.padStart(2, '0'), mm = m.padStart(2, '0');
      setProfile(p => ({ ...p, dob: `${y}-${mm}-${dd}` }));
    } else {
      setProfile(p => ({ ...p, dob: null }));
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.display_name,
      first_name: profile.first_name,
      middle_name: profile.middle_name,
      last_name: profile.last_name,
      dob: profile.dob,
      situation: profile.situation,
      phone_country: profile.phone_country,
      phone_number: profile.phone_number,
    });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success('Profile saved');
  };

  const removeFavorite = async (id: string) => {
    await supabase.from('favorites').delete().eq('id', id);
    setFavorites((f) => f.filter((x) => x.id !== id));
    toast.success('Removed');
  };

  const removeSearch = async (id: string) => {
    await supabase.from('saved_searches').delete().eq('id', id);
    setSearches((s) => s.filter((x) => x.id !== id));
    toast.success('Search removed');
  };

  const removeAlert = async (id: string) => {
    await supabase.from('property_alerts').delete().eq('id', id);
    setAlerts((a) => a.filter((x) => x.id !== id));
    toast.success('Alert removed');
  };

  const toggleAlert = async (id: string, active: boolean) => {
    await supabase.from('property_alerts').update({ active }).eq('id', id);
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, active } : x)));
  };

  const markMatchesSeen = async () => {
    if (!user) return;
    const unseen = matches.filter((m) => !m.seen_at).map((m) => m.id);
    if (!unseen.length) return;
    await supabase.from('property_alert_matches').update({ seen_at: new Date().toISOString() }).in('id', unseen);
    setMatches((ms) => ms.map((m) => (m.seen_at ? m : { ...m, seen_at: new Date().toISOString() })));
  };

  const runSearch = (s: SavedSearch) => {
    const params = new URLSearchParams();
    if (s.mode) params.set('mode', s.mode);
    if (s.query) params.set('locs', s.query);
    if (s.region) params.set('region', s.region);
    if (s.tags?.length) params.set('tags', s.tags.join(','));
    navigate(`/properties?${params.toString()}`);
  };

  const browserName = (ua: string | null) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/')) return 'Safari';
    return 'Browser';
  };

  if (loading || !user) return <div className="bg-background min-h-screen" />;

  const initials = (profile.first_name?.[0] || profile.display_name?.[0] || user.email?.[0] || '?').toUpperCase();
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.display_name || 'Welcome';

  return (
    <>
      <SEO title="Account" description="Manage your profile, watchlist and saved searches." noindex />
    <div className="bg-secondary min-h-screen text-foreground">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border bg-background">
        <div
          className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, hsl(var(--accent)) 0, transparent 45%), radial-gradient(circle at 85% 70%, hsl(var(--accent)) 0, transparent 40%)' }}
          aria-hidden
        />
        <div className="container mx-auto px-5 sm:px-6 pt-12 pb-10 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
            <div className="relative">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label="Change profile picture"
                className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-none bg-secondary border border-border overflow-hidden flex items-center justify-center text-2xl sm:text-3xl font-semibold ring-4 ring-accent/10 cursor-pointer"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : initials}
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/45 text-background opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                </span>
                {uploadingAvatar && (
                  <span className="absolute inset-0 flex items-center justify-center bg-foreground/45 text-background">
                    <Loader2 size={20} className="animate-spin" />
                  </span>
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                className="hidden"
              />
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-none bg-accent text-accent-foreground inline-flex items-center justify-center shadow-md pointer-events-none">
                <ShieldCheck size={14} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-montserrat uppercase tracking-[0.06em] font-extrabold text-2xl sm:text-3xl truncate">{fullName}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold text-foreground text-lg text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Mail size={13} /> {user.email}</span>
                {memberSince && <span className="inline-flex items-center gap-1.5"><Sparkles size={13} className="text-accent" /> Member since {memberSince}</span>}
              </div>
            </div>
            <button
              onClick={() => setShowSignOut(true)}
              className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-none bg-[#00101f] hover:bg-[#001d33] text-white transition-colors text-sm font-medium"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-8 inline-flex p-1 rounded-none bg-secondary/70 border border-border w-full sm:w-auto text-xs">
            {[
              { id: 'profile', label: 'Profile', icon: UserIcon, count: null },
              { id: 'watchlist', label: 'Watchlist', icon: Star, count: favorites.length },
              { id: 'searches', label: 'Searches', icon: Search, count: searches.length },
              { id: 'alerts', label: 'Alerts', icon: Bell, count: matches.filter((m) => !m.seen_at).length || alerts.length },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as typeof tab)}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 h-10 px-2 sm:px-5 rounded-none text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-accent transition-colors text-xs'
                  }`}
                >
                  <t.icon size={14} className="shrink-0" />
                  <span className="text-sm">{t.label}</span>
                  {t.count !== null && t.count > 0 && (
                    <span className={`ml-0.5 px-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-none text-[10px] font-semibold ${active ? 'bg-accent/10 text-accent' : 'bg-background/70 text-muted-foreground'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-5 sm:px-6 pt-8 max-w-4xl">
        {showWelcome && (
          <div className="relative overflow-hidden rounded-none bg-card border border-accent/15 shadow-sm px-5 sm:px-6 py-4">
            <div className="absolute top-0 right-0 w-24 h-24 -mr-10 -mt-10 rounded-none bg-accent/5" aria-hidden />
            <div className="relative flex items-center gap-4 pr-10">
              <div className="shrink-0 w-10 h-10 rounded-none bg-accent text-accent-foreground flex items-center justify-center shadow-lg shadow-accent/20">
                <BadgeCheck size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm sm:text-base leading-tight text-foreground">Account verified</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">You can now access all features available to registered users.</p>
              </div>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              aria-label="Dismiss"
              className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-none text-muted-foreground hover:text-accent hover:bg-secondary transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="mt-6">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="label text-accent">Quick actions</p>
              <h2 className="mt-2 font-montserrat uppercase tracking-[0.04em] font-extrabold text-2xl sm:text-3xl text-foreground">
                What can we help you with today?
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Let', sub: 'Manage your rental listings', icon: FileCheck2, to: '/account/lettings-search' },
              { label: 'Sell', sub: 'Stay in control of your sale', icon: Home, to: '/properties?mode=sell' },
              { label: 'Rent', sub: 'Find a place, end to end', icon: Key, to: '/account/lettings-search' },
              { label: 'Buy', sub: 'Stay ahead of other buyers', icon: SearchCheck, to: '/account/buying-search' },
            ].map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="group relative rounded-none border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_18px_40px_-16px_hsl(var(--accent)/0.25)] p-5 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-none bg-secondary text-accent flex items-center justify-center transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <c.icon size={18} />
                </div>
                <div>
                  <h3 className="font-montserrat uppercase tracking-[0.04em] font-extrabold text-base text-foreground">{c.label}</h3>
                  <p className="text-muted-foreground mt-0.5 text-base">{c.sub}</p>
                </div>
                <span className="font-medium text-accent inline-flex items-center gap-1 mt-auto text-base">
                  Get started
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

      </div>

      <div className="container mx-auto px-5 sm:px-6 py-8 sm:py-10 max-w-4xl">
        {tab === 'profile' && (
          <div className="space-y-6">

            <section className="rounded-none border border-border bg-card shadow-sm">
              <header className="px-6 sm:px-8 pt-6 pb-4 border-b border-border text-xs">
                <h2 className="font-montserrat uppercase tracking-[0.04em] font-extrabold text-lg">Personal information</h2>
                <p className="text-sm text-muted-foreground mt-1">Update your details so we can tailor recommendations.</p>
              </header>

              <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="First name">
                  <input value={profile.first_name ?? ''} onChange={(e) => setProfile(p => ({ ...p, first_name: e.target.value }))} className="input-base h-11 text-base" />
                </Field>
                <Field label="Middle name">
                  <input value={profile.middle_name ?? ''} onChange={(e) => setProfile(p => ({ ...p, middle_name: e.target.value }))} className="input-base h-11 text-base" />
                </Field>
                <Field label="Last name" className="sm:col-span-2">
                  <input value={profile.last_name ?? ''} onChange={(e) => setProfile(p => ({ ...p, last_name: e.target.value }))} className="input-base h-11 text-base" />
                </Field>
                <Field label="Date of birth" className="sm:col-span-2">
                  <div className="grid grid-cols-3 gap-2">
                    <select value={dobParts.d} onChange={(e) => setDob(e.target.value, dobParts.m, dobParts.y)} className="input-base h-11 text-base">
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select value={dobParts.m} onChange={(e) => setDob(dobParts.d, e.target.value, dobParts.y)} className="input-base h-11 text-base">
                      <option value="">Month</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select value={dobParts.y} onChange={(e) => setDob(dobParts.d, dobParts.m, e.target.value)} className="input-base h-11 text-base">
                      <option value="">Year</option>
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="My situation" className="sm:col-span-2">
                  <select value={profile.situation ?? ''} onChange={(e) => setProfile(p => ({ ...p, situation: e.target.value }))} className="input-base h-11 text-base">
                    <option value="">Select…</option>
                    {SITUATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Phone (WhatsApp)" className="sm:col-span-2">
                  <div className="flex flex-col gap-2">
                    <select
                      value={profile.phone_country ?? '+357'}
                      onChange={(e) => setProfile(p => ({ ...p, phone_country: e.target.value }))}
                      className="input-base h-11 w-full text-base"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.c} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={profile.phone_number ?? ''}
                      onChange={(e) => setProfile(p => ({ ...p, phone_number: e.target.value }))}
                      placeholder="99 123 456"
                      className="input-base h-11 w-full text-base"
                    />
                  </div>
                </Field>
              </div>

              <div className="px-6 sm:px-8 py-5 border-t border-border bg-secondary/40 rounded-none flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <button className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-none bg-[hsl(142_70%_40%)] text-white font-semibold hover:opacity-90 transition-opacity text-base">
                  <MessageCircle size={16} /> Verify WhatsApp
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-none bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 text-base"
                >
                  <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </section>

            <section className="rounded-none border border-border bg-card shadow-sm">
              <header className="px-6 sm:px-8 pt-6 pb-4 border-b border-border text-xs flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                <h3 className="font-montserrat uppercase tracking-[0.04em] font-extrabold text-base">Login history</h3>
              </header>
              <div className="px-6 sm:px-8 py-5">
                {logins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent logins recorded.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {logins.map(l => (
                      <li key={l.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <span className="mt-0.5 w-8 h-8 rounded-none bg-secondary inline-flex items-center justify-center shrink-0">
                          <LogIn size={14} className="text-muted-foreground" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{new Date(l.created_at).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {browserName(l.user_agent)}{l.ip_address ? ` · ${l.ip_address}` : ''}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}

        {tab === 'watchlist' && (
          <div>
            {favorites.length === 0 ? (
              <EmptyState
                icon={<Star size={28} />}
                title="No saved properties yet"
                description="Tap the ★ on any listing to save it to your watchlist."
                cta="Browse properties"
                href="/properties"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {favorites.map((f) => (
                  <article key={f.id} className="rounded-none overflow-hidden border border-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group bg-card">
                    {f.property_image && (
                      <Link to={`/properties/${f.property_id}`} className="block aspect-[4/3] overflow-hidden bg-muted">
                        <img src={f.property_image} alt={publicTitle(f.property_title)} loading="lazy" decoding="async" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
                      </Link>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-base leading-snug line-clamp-1">{publicTitle(f.property_title)}</h3>
                      {f.property_location && <p className="text-muted-foreground mt-1 text-sm line-clamp-1">{f.property_location}</p>}
                      {f.property_price && <p className="text-lg font-semibold text-accent mt-2">{f.property_price}</p>}
                      <div className="mt-4 flex items-center justify-between">
                        <Link to={`/properties/${f.property_id}`} className="text-sm font-medium text-accent hover:underline">View →</Link>
                        <button
                          onClick={() => removeFavorite(f.id)}
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors text-xs"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'searches' && (
          <div>
            {searches.length === 0 ? (
              <EmptyState
                icon={<Search size={28} />}
                title="No saved searches"
                description="Save a search on the properties page to get back to it instantly."
                cta="Search properties"
                href="/properties"
              />
            ) : (
              <ul className="divide-y divide-border border border-border rounded-none overflow-hidden bg-card shadow-sm">
                {searches.map((s) => (
                  <li key={s.id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-secondary/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base">{s.name}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {[s.mode && `Mode: ${s.mode}`, s.query && `"${s.query}"`, s.region && `Region: ${s.region}`, s.tags?.length && `Tags: ${s.tags.join(', ')}`]
                          .filter(Boolean).join(' · ') || 'All listings'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => runSearch(s)} className="px-4 h-10 rounded-none bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">Run</button>
                      <button onClick={() => removeSearch(s.id)} aria-label="Delete" className="w-10 h-10 inline-flex items-center justify-center rounded-none border border-border hover:border-destructive hover:text-destructive transition-colors text-xs">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'alerts' && (
          <div className="space-y-8">
            {/* New matches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-montserrat uppercase tracking-[0.04em] font-extrabold text-base">
                  New matches
                </h3>
                {matches.some((m) => !m.seen_at) && (
                  <button onClick={markMatchesSeen} className="text-xs text-accent hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              {matches.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-border bg-card p-5">
                  No matches yet. When a new property matches one of your alerts, it'll appear here.
                </p>
              ) : (
                <ul className="divide-y divide-border border border-border rounded-none overflow-hidden bg-card shadow-sm">
                  {matches.map((m) => (
                    <li key={m.id} className={`p-5 flex items-center justify-between gap-4 hover:bg-secondary/40 transition-colors ${!m.seen_at ? 'bg-accent/5' : ''}`}>
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/properties/${m.property_slug || m.property_id}`}
                          className="font-semibold text-base hover:text-accent line-clamp-1"
                        >
                          {publicTitle(m.property_title) || 'New property'}
                        </a>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {new Date(m.created_at).toLocaleDateString()}
                          {!m.seen_at && <span className="ml-2 text-accent font-semibold">New</span>}
                        </p>
                      </div>
                      <a
                        href={`/properties/${m.property_slug || m.property_id}`}
                        className="px-4 h-10 inline-flex items-center rounded-none bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Saved alerts */}
            <div>
              <h3 className="font-montserrat uppercase tracking-[0.04em] font-extrabold text-base mb-3">
                Your alerts
              </h3>
              {alerts.length === 0 ? (
                <EmptyState
                  icon={<Bell size={28} />}
                  title="No alerts yet"
                  description="Set search criteria on the properties page and create an alert to get notified about new matches."
                  cta="Browse properties"
                  href="/properties"
                />
              ) : (
                <ul className="divide-y divide-border border border-border rounded-none overflow-hidden bg-card shadow-sm">
                  {alerts.map((a) => {
                    const summary = [
                      a.listing_type && (a.listing_type === 'rent' ? 'For rent' : 'For sale'),
                      a.categories?.length && a.categories.join(', '),
                      a.regions?.length && `in ${a.regions.join(', ')}`,
                      (a.budget_min || a.budget_max) && `€${a.budget_min || 0}–${a.budget_max || '∞'}`,
                      a.min_beds && `${a.min_beds}+ beds`,
                      a.min_baths && `${a.min_baths}+ baths`,
                    ].filter(Boolean).join(' · ') || 'Any new property';
                    return (
                      <li key={a.id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-secondary/40 transition-colors">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-base">{a.label || 'Property alert'}</h4>
                          <p className="text-muted-foreground mt-1 text-sm">{summary}</p>
                          <p className="text-muted-foreground/70 mt-0.5 text-xs">Notifies {a.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAlert(a.id, !a.active)}
                            className={`px-3 h-10 rounded-none border text-sm font-medium transition-colors ${a.active ? 'border-border hover:border-accent' : 'border-accent text-accent'}`}
                          >
                            {a.active ? 'Pause' : 'Resume'}
                          </button>
                          <button onClick={() => removeAlert(a.id)} aria-label="Delete" className="w-10 h-10 inline-flex items-center justify-center rounded-none border border-border hover:border-destructive hover:text-destructive transition-colors text-xs">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {showSignOut && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm" onClick={() => setShowSignOut(false)}>
          <div
            className="w-full max-w-sm rounded-none bg-background border border-border flex flex-col p-8 shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-none bg-accent/10 inline-flex items-center justify-center ring-8 ring-accent/5">
                <LogOut className="text-accent" size={32} />
              </div>
              <h2 className="mt-6 font-montserrat uppercase tracking-[0.04em] font-extrabold text-xl text-foreground max-w-xs">
                Are you sure you want to sign out?
              </h2>
              <p className="mt-3 text-muted-foreground text-sm max-w-xs">
                You'll need to sign in again to access your saved searches and watchlist.
              </p>
            </div>
            <div className="flex gap-3 pt-6">
              <button
                onClick={() => setShowSignOut(false)}
                className="flex-1 h-12 rounded-none border border-border bg-background hover:text-accent transition-colors text-xs text-sm font-medium text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={async () => { setShowSignOut(false); await signOut(); navigate('/', { replace: true }); }}
                className="flex-1 h-12 rounded-none bg-[#00101f] text-background hover:opacity-90 transition-opacity text-sm font-semibold"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  );
};

const Field = ({ label, children, className = 'text-base' }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`block ${className}`}>
    <span className="block font-medium text-muted-foreground mb-1.5 uppercase tracking-wide text-sm">{label}</span>
    {children}
  </div>
);

const EmptyState = ({ icon, title, description, cta, href }: { icon: React.ReactNode; title: string; description: string; cta: string; href: string }) => (
  <div className="py-16 sm:py-20 text-center border border-dashed border-border rounded-none bg-card">
    <div className="mx-auto w-14 h-14 rounded-none bg-accent/10 text-accent inline-flex items-center justify-center">{icon}</div>
    <h2 className="font-montserrat uppercase tracking-[0.04em] font-extrabold text-xl sm:text-2xl mt-5">{title}</h2>
    <p className="text-muted-foreground mt-2 max-w-sm mx-auto px-4">{description}</p>
    <Link to={href} className="inline-flex items-center justify-center mt-6 h-11 px-5 rounded-none bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
      {cta} →
    </Link>
  </div>
);

export default Account;
