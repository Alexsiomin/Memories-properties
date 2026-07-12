import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Calendar, MapPin, BedDouble, Wallet, Save, ArrowLeft, Check, Home as HomeIcon, Banknote, Search, Eye, BadgePercent, BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

type Tab = 'overview' | 'properties' | 'offers';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'properties', label: 'My buying search' },
  { id: 'offers', label: 'Offers & viewings' },
];

const TITLES = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Other'];
const BEDROOMS = ['Studio', '1', '2', '3', '4', '5+'];
const PROPERTY_TYPES = ['Villa', 'Apartment', 'Townhouse', 'Plot', 'Commercial', 'New development'];
const TIMELINES = ['ASAP', '1–3 months', '3–6 months', '6–12 months', 'Just exploring'];
const FUNDING = ['Cash buyer', 'Mortgage approved', 'Mortgage needed', 'Selling first'];
const REGIONS = ['Limassol', 'Paphos'];

const fmtEur = (n: number) => `€${n.toLocaleString()}`;

const BuyingSearch = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+357');
  const [phone, setPhone] = useState('');

  const [minPrice, setMinPrice] = useState(200000);
  const [maxPrice, setMaxPrice] = useState(800000);
  const [bedrooms, setBedrooms] = useState('2');
  const [types, setTypes] = useState<string[]>([]);
  const [timeline, setTimeline] = useState('1–3 months');
  const [funding, setFunding] = useState('Cash buyer');
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
        .select('first_name, last_name, display_name, phone_country, phone_number')
        .eq('id', user.id)
        .maybeSingle();
      setFirstName(data?.first_name || metaGiven || (data?.display_name ?? '').split(' ')[0] || '');
      setLastName(data?.last_name || metaFamily || (data?.display_name ?? '').split(' ').slice(1).join(' ') || '');
      if (data?.phone_country) setPhoneCountry(data.phone_country);
      if (data?.phone_number) setPhone(data.phone_number);
    })();
  }, [user]);

  const toggle = (arr: string[], setArr: (a: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const canSave = useMemo(
    () => firstName.trim() && regions.length > 0,
    [firstName, regions],
  );

  const save = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      await supabase.from('saved_searches').insert({
        user_id: user.id,
        name: `Buying ${bedrooms} bed · ${regions.join(', ')}`,
        mode: 'buy',
        region: regions[0],
        tags: [
          ...regions.slice(1),
          `${bedrooms} bed`,
          `${fmtEur(minPrice)}–${fmtEur(maxPrice)}`,
          timeline,
          funding,
          ...types,
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
      <SEO title="Buying Search" description="Register your buying requirements." noindex />
    <div className="bg-background min-h-screen">
      <div className="bg-background border-b border-border">
        <div className="container mx-auto max-w-5xl px-5 sm:px-6 pt-8 pb-4">
          <Link
            to="/account"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to account
          </Link>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            My buying search
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Insights. Information. Control.</p>

          <div className="mt-6 inline-flex p-1 rounded-xl bg-secondary border border-border">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`h-9 px-4 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-5 sm:px-6 py-8 space-y-6">
        {tab === 'overview' && (
          <section className="rounded-2xl border border-border bg-card shadow-sm px-6 sm:px-10 py-10 sm:py-14">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Ready to get ahead of other buyers?
              </h2>
              <p className="text-sm text-muted-foreground mt-3">
                The Cyprus property market moves fast — here's how we give you an advantage.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { Icon: Search, title: 'Personal search team', body: 'Registering your requirements alerts your local office to search on your behalf using our state-of-the-art software.' },
                { Icon: Eye, title: 'Access to Sneak Peeks', body: 'View the latest properties before they get sent to public portals — exclusive to registered members.' },
                { Icon: BadgePercent, title: 'Price reductions', body: 'Price reductions are not available to the general public — as a member you get exclusive access.' },
                { Icon: BellRing, title: 'Email alerts', body: 'Setting up custom email alerts is easy and includes both Sneak Peeks and Price Reductions.' },
              ].map(({ Icon, title, body }) => (
                <div key={title} className="rounded-2xl bg-secondary/50 border border-border/60 p-5 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center mb-3">
                    <Icon size={20} className="text-accent" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setTab('properties')}
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                Let's get started
              </button>
            </div>
          </section>
        )}

        {tab === 'offers' && (
          <section className="rounded-2xl border border-border bg-card shadow-sm p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Offers &amp; viewings coming soon — set up your search first to see updates here.
            </p>
          </section>
        )}

        {tab === 'properties' && (
          <>

            {/* Buying preferences */}
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <header className="px-6 sm:px-8 pt-6 pb-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Register with us to jump the queue</h2>
                <p className="text-sm text-muted-foreground mt-1">Tell us what you're after and we'll alert you the moment a match comes in.</p>
              </header>

              <div className="px-6 sm:px-8 py-6 space-y-7">
                {/* Price */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Wallet size={14} className="text-accent" /> Purchase price range
                    <span className="ml-auto text-sm text-muted-foreground font-normal">
                      {fmtEur(minPrice)} – {fmtEur(maxPrice)}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="range" min={50000} max={5000000} step={25000}
                        value={minPrice}
                        onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 25000))}
                        className="w-full accent-accent"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Min</p>
                    </div>
                    <div>
                      <input
                        type="range" min={50000} max={5000000} step={25000}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 25000))}
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
                            active ? 'bg-accent text-accent-foreground border-accent' : 'bg-card text-foreground border-border hover:border-accent/40'
                          }`}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Property types */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <HomeIcon size={14} className="text-accent" /> Property types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map((t) => {
                      const active = types.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggle(types, setTypes, t)}
                          className={`h-9 px-3.5 rounded-full text-sm font-medium border inline-flex items-center gap-1.5 transition-colors ${
                            active ? 'bg-accent text-accent-foreground border-accent' : 'bg-card text-foreground border-border hover:border-accent/40'
                          }`}
                        >
                          {active && <Check size={12} />} {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline & funding */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Calendar size={14} className="text-accent" /> Buying timeline
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TIMELINES.map((l) => {
                        const active = timeline === l;
                        return (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setTimeline(l)}
                            className={`h-9 px-3.5 rounded-full text-sm font-medium border transition-colors ${
                              active ? 'bg-accent text-accent-foreground border-accent' : 'bg-card text-foreground border-border hover:border-accent/40'
                            }`}
                          >
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Banknote size={14} className="text-accent" /> Funding
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FUNDING.map((f) => {
                        const active = funding === f;
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFunding(f)}
                            className={`h-9 px-3.5 rounded-full text-sm font-medium border transition-colors ${
                              active ? 'bg-accent text-accent-foreground border-accent' : 'bg-card text-foreground border-border hover:border-accent/40'
                            }`}
                          >
                            {f}
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
                          onClick={() => toggle(regions, setRegions, r)}
                          className={`h-9 px-3.5 rounded-full text-sm font-medium border inline-flex items-center gap-1.5 transition-colors ${
                            active ? 'bg-accent text-accent-foreground border-accent' : 'bg-card text-foreground border-border hover:border-accent/40'
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
                <p className="text-xs text-muted-foreground">By saving, you agree to be contacted about matching properties.</p>
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

export default BuyingSearch;
