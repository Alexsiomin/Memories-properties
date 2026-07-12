import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Home, Key, FileCheck2, SearchCheck, Check, ArrowRight, MapPin, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const INTENTS = [
  { id: 'buy', label: 'Buy', sub: 'Find a place to call home', icon: SearchCheck },
  { id: 'rent', label: 'Rent', sub: 'Discover places to rent', icon: Key },
  { id: 'sell', label: 'Sell', sub: 'List your property with us', icon: Home },
  { id: 'let', label: 'Let', sub: 'Manage your rental listings', icon: FileCheck2 },
];

const REGIONS = ['Paphos', 'Limassol'];

const BUDGETS = [
  '< €300k',
  '€300k – €500k',
  '€500k – €1M',
  '€1M – €2M',
  '€2M+',
];

const PROPERTY_TYPES = ['Villa', 'Apartment', 'Townhouse', 'Plot', 'Commercial', 'New development'];

const Welcome = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [intent, setIntent] = useState<string>('');
  const [regions, setRegions] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>('');
  const [types, setTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth', { replace: true });
  }, [user, loading, navigate]);

  // If the user has already onboarded (has any saved search), send them straight to account
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { count } = await supabase
        .from('saved_searches')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if ((count ?? 0) > 0) navigate('/account', { replace: true });
    })();
  }, [user, navigate]);

  const toggle = (arr: string[], setArr: (a: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const finish = async (skip = false) => {
    if (!user) return;
    setSaving(true);
    try {
      if (!skip && intent) {
        // Save a starter saved search reflecting their preferences
        await supabase.from('saved_searches').insert({
          user_id: user.id,
          name: `My ${intent} search`,
          mode: intent,
          region: regions[0] ?? null,
          tags: [...regions.slice(1), budget, ...types].filter(Boolean),
          query: null,
        });
        await supabase.from('profiles').upsert({
          id: user.id,
          situation: intent === 'sell' ? 'I am Seller' : intent === 'buy' ? 'I am Buyer' : 'Other',
        });
      }
      toast.success(skip ? 'You can update preferences anytime' : 'Preferences saved');
      const params = new URLSearchParams();
      if (intent) params.set('mode', intent);
      if (regions[0]) params.set('region', regions[0]);
      navigate(intent ? `/properties?${params.toString()}` : '/account');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return <div className="bg-background min-h-screen" />;

  const canContinue = !!intent;

  return (
    <>
      <SEO title="Welcome" description="Set your property preferences." noindex />
    <div className="bg-background min-h-screen relative">
      <button
        type="button"
        onClick={() => finish(true)}
        disabled={saving}
        className="absolute top-4 right-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip for now
      </button>
      <div className="container mx-auto px-5 sm:px-6 max-w-3xl py-8 sm:py-10">
        <header className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 1 of 1</p>
          <h1 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Let's tailor Memory Properties to your needs.
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-xl mx-auto">
            A few quick choices so we can surface the right properties, insights and updates for you.
          </p>
        </header>

        {/* Intent */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">I'm here to…</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {INTENTS.map((it) => {
              const active = intent === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setIntent(it.id)}
                  className={`relative text-left border p-4 transition-all ${
                    active
                      ? 'border-accent bg-accent/[0.04]'
                      : 'border-border/60 bg-card hover:border-accent/40'
                  }`}
                >
                  <div className={`w-9 h-9 flex items-center justify-center mb-3 ${active ? 'bg-accent text-accent-foreground' : 'bg-accent/10 text-accent'}`}>
                    <it.icon size={16} />
                  </div>
                  <div className="font-semibold text-foreground">{it.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{it.sub}</div>
                  {active && (
                    <span className="absolute top-3 right-3 w-5 h-5 bg-accent text-accent-foreground inline-flex items-center justify-center">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Regions */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3 inline-flex items-center gap-2">
            <MapPin size={14} className="text-accent" /> Regions of interest
            <span className="text-muted-foreground font-normal">(optional)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => {
              const active = regions.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggle(regions, setRegions, r)}
                  className={`h-9 px-3.5 text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-foreground border-border/60 hover:border-accent/40'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </section>

        {/* Budget */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3 inline-flex items-center gap-2">
            <Wallet size={14} className="text-accent" /> Budget
            <span className="text-muted-foreground font-normal">(optional)</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => {
              const active = budget === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(active ? '' : b)}
                  className={`h-9 px-10 text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-foreground border-border/60 hover:border-accent/40'
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </section>

        {/* Property types */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-foreground mb-3">Property types <span className="text-muted-foreground font-normal">(optional)</span></h2>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((t) => {
              const active = types.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(types, setTypes, t)}
                  className={`h-9 px-3.5 text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-foreground border-border/60 hover:border-accent/40'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </section>

        {/* Footer actions */}
        <div className="flex items-center justify-center pt-6 border-t border-border">
          <button
            type="button"
            onClick={() => finish(false)}
            disabled={!canContinue || saving}
            className="inline-flex items-center justify-center gap-2 h-11 px-10 w-full max-w-sm rounded-none bg-menu text-menu-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Continue'} <ArrowRight size={16} />
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          You can change all of this later from your <Link to="/account" className="text-accent hover:underline">account</Link>.
        </p>
      </div>
    </div>
    </>
  );
};

export default Welcome;
