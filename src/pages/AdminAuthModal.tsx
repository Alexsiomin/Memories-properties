import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, TrendingUp, LayoutGrid, Search, MapPin, Bell, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Settings {
  heading: string;
  subheading: string;
  benefits: string[];
  button_text: string;
  divider_text: string;
  terms_text: string;
}

const empty: Settings = {
  heading: '',
  subheading: '',
  benefits: [],
  button_text: '',
  divider_text: '',
  terms_text: '',
};

export default function AdminAuthModal() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [form, setForm] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data, error } = await supabase
        .from('auth_modal_settings')
        .select('*')
        .eq('singleton', true)
        .maybeSingle();
      if (error) {
        toast.error('Failed to load settings');
      } else if (data) {
        setForm({
          heading: data.heading ?? '',
          subheading: data.subheading ?? '',
          benefits: Array.isArray(data.benefits) ? (data.benefits as string[]) : [],
          button_text: data.button_text ?? '',
          divider_text: data.divider_text ?? '',
          terms_text: data.terms_text ?? '',
        });
      }
      setLoading(false);
    })();
  }, [isAdmin]);

  if (authLoading || adminLoading) {
    return <div className="container mx-auto px-6 py-24">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-6 py-24">
        <h1 className="text-4xl">Forbidden</h1>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('auth_modal_settings')
      .update({
        heading: form.heading,
        subheading: form.subheading,
        benefits: form.benefits.filter((b) => b.trim() !== ''),
        button_text: form.button_text,
        divider_text: form.divider_text,
        terms_text: form.terms_text,
      })
      .eq('singleton', true);
    setSaving(false);
    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Sign-in popup updated');
    }
  };

  const setBenefit = (i: number, v: string) =>
    setForm((f) => ({ ...f, benefits: f.benefits.map((b, idx) => (idx === i ? v : b)) }));
  const addBenefit = () => setForm((f) => ({ ...f, benefits: [...f.benefits, ''] }));
  const removeBenefit = (i: number) =>
    setForm((f) => ({ ...f, benefits: f.benefits.filter((_, idx) => idx !== i) }));

  return (
    <div className="container mx-auto px-6 py-10 max-w-2xl">
      <h1 className="text-3xl font-semibold mb-2">Sign-in popup</h1>
      <p className="text-muted-foreground mb-8">Edit the text shown in the login modal.</p>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="heading">Heading</Label>
            <Input id="heading" value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="subheading">Subheading</Label>
            <Textarea id="subheading" value={form.subheading} onChange={(e) => setForm({ ...form, subheading: e.target.value })} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Benefits</Label>
            {form.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={b} onChange={(e) => setBenefit(i, e.target.value)} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeBenefit(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={addBenefit}>
              <Plus className="h-4 w-4 mr-1" /> Add benefit
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="button_text">Button text</Label>
            <Input id="button_text" value={form.button_text} onChange={(e) => setForm({ ...form, button_text: e.target.value })} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="divider_text">Divider text</Label>
            <Input id="divider_text" value={form.divider_text} onChange={(e) => setForm({ ...form, divider_text: e.target.value })} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="terms_text">Terms text</Label>
            <Textarea id="terms_text" value={form.terms_text} onChange={(e) => setForm({ ...form, terms_text: e.target.value })} />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
          </div>
        </div>
      )}

      {/* Preview popup */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-xl bg-[#00101f] text-white border-0 p-0 gap-0 max-h-[92vh] overflow-y-auto [&>button]:text-white/70 [&>button:hover]:text-white">
          <DialogTitle className="sr-only">Preview sign-in popup</DialogTitle>

          <span className="font-light uppercase tracking-[0.32em] text-white text-3xl sm:text-4xl text-center block pt-8 pb-6">
            MEMORIES
          </span>

          <div className="relative w-full max-w-[480px] mx-auto flex flex-col gap-4 px-6 pb-8">
            <div className="bg-[#00101f] border border-white/10 p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Lock className="w-6 h-6 text-white mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-white leading-snug tracking-tight">{form.heading || 'Heading'}</h2>
                  <p className="text-sm text-white/70 mt-1.5 leading-relaxed">{form.subheading || 'Subheading'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {(form.benefits.length ? form.benefits : ['Benefit 1', 'Benefit 2']).filter(b => b.trim()).map((text, i) => {
                  const icons = [TrendingUp, LayoutGrid, Search, MapPin, Bell];
                  const Icon = icons[i % icons.length];
                  return (
                    <div key={text + i} className="flex items-start gap-3 text-sm text-white/90 leading-relaxed">
                      <Icon className="w-5 h-5 text-white/80 shrink-0" />
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative w-full rounded-xl">
              <div className="absolute -inset-1 rounded-xl bg-[#FF6817]/40 blur-lg animate-pulse" />
              <div className="relative w-full rounded-xl p-[3px] bg-[radial-gradient(circle_at_30%_50%,rgba(255,104,23,1)_0%,transparent_60%),radial-gradient(circle_at_70%_50%,rgba(255,104,23,0.85)_0%,transparent_60%)] bg-[length:250%_250%] animate-radial-orange">
                <button
                  type="button"
                  disabled
                  className="relative z-10 w-full h-[52px] bg-white disabled:bg-white rounded-[10px] flex items-center justify-center gap-3 text-base font-medium text-[hsl(212_100%_10%)] disabled:opacity-100"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {form.button_text || 'Continue with Google'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full text-white/60">
              <div className="h-px flex-1 bg-white/20" />
              <span className="text-[10px] uppercase tracking-[0.28em]">{form.divider_text || 'Divider'}</span>
              <div className="h-px flex-1 bg-white/20" />
            </div>

            <p className="text-[11px] text-white/70 text-center leading-relaxed">
              {form.terms_text || 'Terms text'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
