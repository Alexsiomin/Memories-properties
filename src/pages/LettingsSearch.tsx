import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Calendar, MapPin, BedDouble, PoundSterling, Save, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

type Tab = 'overview' | 'properties' | 'offers';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'properties', label: 'My properties search' },
  { id: 'offers', label: 'Offers & viewings' },
];

const TITLES = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Other'];
const BEDROOMS = ['Studio', '1', '2', '3', '4', '5+'];
const LENGTHS = ['Short let', 'Long let', 'No preference'];
const REGIONS = ['Limassol', 'Paphos'];

const fmtEur = (n: number) => `€${n.toLocaleString()}`;

const LettingsSearch = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('properties');

  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+357');
  const [phone, setPhone] = useState('');

  const [minRent, setMinRent] = useState(500);
  const [maxRent, setMaxRent] = useState(2400);
  const [bedrooms, setBedrooms] = useState('2');
  const [moveIn, setMoveIn] = useState('');
  const [length, setLength] = useState('No preference');
  const [regions, setRegions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? '');
    const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    const metaFull = meta.full_name || meta.name || meta.display_name || '';
    const metaGiven = meta.given_name || metaFull.split(' ')[0] || '';
    const metaFamily = meta.family_name || metaFull.split(' ').slice(1).join(' ') || '';

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name, phone_country, phone_number, situation')
        .eq('id', user.id)
        .maybeSingle();

      const fn = data?.first_name || metaGiven || (data?.display_name ?? '').split(' ')[0] || '';
      const ln = data?.last_name || metaFamily || (data?.display_name ?? '').split(' ').slice(1).join(' ') || '';

      setFirstName(fn);
      setLastName(ln);
      if (data?.phone_country) setPhoneCountry(data.phone_country);
      if (data?.phone_number) setPhone(data.phone_number);
      // Guess title from situation if available
      if (data?.situation?.toLowerCase().includes('seller')) setTitle('Mr');
    })();
  }, [user]);


  const toggleRegion = (r: string) =>
    setRegions((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const canSave = useMemo(
    () => firstName.trim() && regions.length > 0 && moveIn,
    [firstName, regions, moveIn],
  );

  const save = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      await supabase.from('saved_searches').insert({
        user_id: user.id,
        name: `Lettings ${bedrooms} bed · ${regions.join(', ')}`,
        mode: 'rent',
        region: regions[0],
        tags: [
          ...regions.slice(1),
          `${bedrooms} bed`,
          `${fmtEur(minRent)}–${fmtEur(maxRent)} pm`,
          length,
          `Move in ${moveIn}`,
        ],
        query: null,
      });
      toast.success('Search saved — we\'ll notify you of matching properties');
      navigate('/account');
    } catch (e: any) {
      toast.error(e.message ?? 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return <div className="bg-background min-h-screen" />;

  return (
    <>
      <SEO title="Lettings Search" description="Register your rental requirements." noindex />
    <div className="bg-secondary/40 min-h-screen">
      {/* Page header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto max-w-5xl px-5 sm:px-6 pt-8 pb-4">
          <Link
            to="/account"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to account
          </Link>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            My lettings search
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Insights. Information. Control.</p>

          {/* Tabs */}
          <div className="mt-6 inline-flex p-1 rounded-xl bg-secondary border border-border">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`h-9 px-4 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-5xl px-5 sm:px-6 py-8 space-y-6">
        {tab !== 'properties' && (
          <section className="rounded-2xl border border-border bg-card shadow-sm p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {tab === 'overview' ? 'Overview' : 'Offers & viewings'} coming soon — set up your search first to see updates here.
            </p>
          </section>
        )}

        {tab === 'properties' && (
          <>
            {/* About you */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <header className="px-6 sm:px-8 pt-6 pb-4 border-b border-border flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">About you</h2>
                  <p className="text-sm text-muted-foreground mt-1">Prefilled from your profile — edit anything that needs updating.</p>
                </div>
                <Link to="/account" className="text-xs font-medium text-accent hover:underline whitespace-nowrap mt-1">
                  Edit profile
                </Link>
              </header>
              <div className="px-6 sm:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2 grid grid-cols-[110px_1fr_1fr] gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
                    <select
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input-base h-11 text-base w-full"
                      aria-label="Title"
                    >
                      {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">First name *</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="input-base h-11 text-base w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Last name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="input-base h-11 text-base w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="input-base h-11 text-base w-full bg-secondary/60 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
                  <div className="grid grid-cols-[110px_1fr] gap-2">
                    <select
                      value={phoneCountry}
                      onChange={(e) => setPhoneCountry(e.target.value)}
                      className="input-base h-11 text-base"
                      aria-label="Country code"
                    >
                      <option value="+357">🇨🇾 +357</option>
                      <option value="+30">🇬🇷 +30</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+7">🇷🇺 +7</option>
                    </select>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="99 123 456"
                      className="input-base h-11 text-base w-full"
                    />
                  </div>
                </div>
              </div>
            </section>


            {/* Register */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <header className="px-6 sm:px-8 pt-6 pb-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Register with us to jump the queue</h2>
                <p className="text-sm text-muted-foreground mt-1">Tell us your requirements and we'll call you first when matching properties get listed.</p>
              </header>

              <div className="px-6 sm:px-8 py-6 space-y-7">
                {/* Price */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <PoundSterling size={14} className="text-accent" /> Monthly rent range
                    <span className="ml-auto text-sm text-muted-foreground font-normal">
                      {fmtEur(minRent)} – {fmtEur(maxRent)} pm
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="range" min={300} max={10000} step={100}
                        value={minRent}
                        onChange={(e) => setMinRent(Math.min(Number(e.target.value), maxRent - 100))}
                        className="w-full accent-accent"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Min</p>
                    </div>
                    <div>
                      <input
                        type="range" min={300} max={10000} step={100}
                        value={maxRent}
                        onChange={(e) => setMaxRent(Math.max(Number(e.target.value), minRent + 100))}
                        className="w-full accent-accent"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Max</p>
                    </div>
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <BedDouble size={14} className="text-accent" /> Number of bedrooms
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BEDROOMS.map((b) => {
                      const active = bedrooms === b;
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBedrooms(b)}
                          className={`h-9 min-w-[3rem] px-3.5 rounded-full text-sm font-medium border transition-colors ${
                            active
                              ? 'bg-accent text-accent-foreground border-accent'
                              : 'bg-card text-foreground border-border hover:border-accent/40'
                          }`}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Move-in & length */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Calendar size={14} className="text-accent" /> Move-in date *
                    </label>
                    <input
                      type="date"
                      value={moveIn}
                      onChange={(e) => setMoveIn(e.target.value)}
                      className="input-base h-11 text-base w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">And for how long?</label>
                    <div className="flex flex-wrap gap-2">
                      {LENGTHS.map((l) => {
                        const active = length === l;
                        return (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setLength(l)}
                            className={`h-9 px-3.5 rounded-full text-sm font-medium border transition-colors ${
                              active
                                ? 'bg-accent text-accent-foreground border-accent'
                                : 'bg-card text-foreground border-border hover:border-accent/40'
                            }`}
                          >
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Areas */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <MapPin size={14} className="text-accent" /> Which area(s) are you looking in? *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map((r) => {
                      const active = regions.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRegion(r)}
                          className={`h-9 px-3.5 rounded-full text-sm font-medium border inline-flex items-center gap-1.5 transition-colors ${
                            active
                              ? 'bg-accent text-accent-foreground border-accent'
                              : 'bg-card text-foreground border-border hover:border-accent/40'
                          }`}
                        >
                          {active && <Check size={12} />} {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-5 border-t border-border bg-secondary/40 rounded-b-2xl flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  By saving, you agree to be contacted about matching properties.
                </p>
                <button
                  type="button"
                  onClick={save}
                  disabled={!canSave || saving}
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? 'Saving…' : 'Save my search'}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default LettingsSearch;
