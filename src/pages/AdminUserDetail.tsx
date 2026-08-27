import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';

interface Profile {
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
}

interface LoginRow { id: string; created_at: string }
interface FavoriteRow { id: string; property_id: string; property_title: string | null; created_at: string }
interface SavedSearchRow { id: string; name: string | null; mode: string | null; region: string | null; created_at: string }
interface EnquiryRow { id: string; property_type: string | null; region: string | null; created_at: string }
interface TourRow { id: string; property_id: string | null; property_title?: string | null; preferred_date: string | null; created_at: string }

const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—');
const formatDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logins, setLogins] = useState<LoginRow[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [searches, setSearches] = useState<SavedSearchRow[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [tours, setTours] = useState<TourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isAdmin || !id) return;
    (async () => {
      const [
        { data: p },
        { data: l },
        { data: f },
        { data: s },
        { data: e },
        { data: t },
      ] = await Promise.all([
        supabase.from('profiles').select('id, display_name, avatar_url, created_at, updated_at, first_name, middle_name, last_name, phone_country, phone_number, whatsapp_verified, dob, situation').eq('id', id).maybeSingle(),
        supabase.from('login_history').select('id, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(100),
        supabase.from('favorites').select('id, property_id, property_title, created_at').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('saved_searches').select('id, name, mode, region, created_at').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('enquiries').select('id, property_type, region, created_at').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('tour_requests').select('id, property_id, preferred_date, created_at').eq('user_id', id).order('created_at', { ascending: false }),
      ]);
      if (!p) { setNotFound(true); setLoading(false); return; }
      setProfile(p as Profile);
      setLogins((l ?? []) as LoginRow[]);
      setFavorites((f ?? []) as FavoriteRow[]);
      setSearches((s ?? []) as SavedSearchRow[]);
      setEnquiries((e ?? []) as EnquiryRow[]);

      const tourRows = (t ?? []) as TourRow[];
      const propIds = [...new Set(tourRows.map((r) => r.property_id).filter(Boolean))] as string[];
      if (propIds.length) {
        const { data: props } = await supabase.from('properties').select('id, title').in('id', propIds);
        const titleById = new Map((props ?? []).map((r: { id: string; title: string }) => [r.id, r.title]));
        tourRows.forEach((r) => { r.property_title = r.property_id ? titleById.get(r.property_id) ?? null : null; });
      }
      setTours(tourRows);
      setLoading(false);
    })();
  }, [isAdmin, id]);

  if (authLoading || adminLoading) return <div className="container mx-auto px-6 py-24">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1></div>;
  if (notFound) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">User not found</h1></div>;
  if (loading || !profile) return <div className="container mx-auto px-6 py-24">Loading…</div>;

  const fullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || profile.display_name || '(no name)';
  const phone = [profile.phone_country, profile.phone_number].filter(Boolean).join(' ');

  return (
    <div className="container mx-auto px-6 py-16 max-w-4xl">
      <Link to="/admin/users-list" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Back to Users
      </Link>

      <div className="flex items-start gap-4 mb-10">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-medium shrink-0">
            {fullName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-semibold">{fullName}</h1>
          <p className="text-muted-foreground mt-1">
            {phone && <>{phone} · </>}
            {profile.situation && <>{profile.situation} · </>}
            Joined {formatDate(profile.created_at)}
          </p>
          <p className="text-xs text-muted-foreground/70 font-mono mt-1">{profile.id}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-lg font-semibold mb-3">Login history ({logins.length})</h2>
          {logins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No logins recorded.</p>
          ) : (
            <ul className="space-y-1.5 text-sm max-h-80 overflow-y-auto">
              {logins.map((l) => (
                <li key={l.id} className="text-muted-foreground">{formatDateTime(l.created_at)}</li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Favorited properties ({favorites.length})</h2>
          {favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No favorites yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {favorites.map((f) => (
                <li key={f.id}>
                  <Link to={`/properties/${f.property_id}`} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                    {f.property_title || 'Untitled property'}
                  </Link>
                  <span className="text-muted-foreground"> · {formatDate(f.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Saved searches ({searches.length})</h2>
          {searches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved searches.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {searches.map((s) => (
                <li key={s.id} className="text-muted-foreground">
                  {s.name || (s.mode === 'rent' ? 'Rent search' : 'Buy search')}{s.region ? ` in ${s.region}` : ''} · {formatDate(s.created_at)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Enquiries & tours ({enquiries.length + tours.length})</h2>
          {enquiries.length === 0 && tours.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enquiries or tour requests.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {enquiries.map((e) => (
                <li key={`e-${e.id}`} className="text-muted-foreground">
                  Enquiry{e.property_type ? ` · ${e.property_type}` : ''}{e.region ? ` in ${e.region}` : ''} · {formatDate(e.created_at)}
                </li>
              ))}
              {tours.map((t) => (
                <li key={`t-${t.id}`} className="text-muted-foreground">
                  Tour request{t.property_title ? ` · ${t.property_title}` : ''}{t.preferred_date ? ` for ${formatDate(t.preferred_date)}` : ''} · {formatDate(t.created_at)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
