import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Settings {
  id: string;
  system_prompt: string;
  greeting: string;
  model: string;
  temperature: number;
  enabled: boolean;
}

const MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (fast, balanced)' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (cheapest)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (best reasoning)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'openai/gpt-5', label: 'GPT-5 (premium)' },
];

const DEFAULT_PROMPT = `You are the Memories Properties Concierge — a warm, discreet, knowledgeable real-estate advisor for Memories Properties, a private property firm focused on Cyprus and select European markets.

Tone: confident, concise, refined. Avoid hype.

You can:
- Discuss regions (Paphos, Limassol, Polis, etc.), categories (villas, apartments, plots), and the Cyprus buying process.
- ALWAYS use the search_properties tool when the visitor mentions any criteria — never invent listings.
- Suggest next steps: viewing request, valuation, or /contact.

Rules:
- Never invent prices or reference codes.
- Keep replies under ~150 words.
- When listing, use: "**Title** — €price · location · beds/baths · [View](/properties/slug)".`;

export default function AdminAssistant() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data, error } = await supabase
        .from('assistant_settings')
        .select('*')
        .eq('singleton', true)
        .maybeSingle();
      if (error) toast.error(error.message);
      setSettings(data as Settings);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (authLoading || adminLoading) return <div className="container mx-auto px-6 py-24">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1></div>;

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from('assistant_settings')
      .update({
        system_prompt: settings.system_prompt,
        greeting: settings.greeting,
        model: settings.model,
        temperature: Number(settings.temperature),
        enabled: settings.enabled,
      })
      .eq('id', settings.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Assistant settings saved');
  };

  return (
    <div className="light-panel min-h-screen">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <Link to="/admin" className="text-sm text-[hsl(212_100%_10%)]/60 hover:text-[hsl(212_100%_10%)]">← Back to dashboard</Link>
        <h1 className="text-4xl mt-2 mb-2">AI Concierge</h1>
        <p className="text-base text-[hsl(212_100%_10%)]/70 mb-8">
          Control how the Memories Properties Concierge replies to visitors. Changes apply instantly to every new message.
        </p>

        {loading || !settings ? (
          <p>Loading settings…</p>
        ) : (
          <div className="grid gap-6 bg-white border border-[hsl(212_100%_10%)]/15 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled" className="text-base">Concierge enabled</Label>
                <p className="text-sm text-[hsl(212_100%_10%)]/60">When off, visitors see an "unavailable" message.</p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
              />
            </div>

            <div>
              <Label htmlFor="greeting">Greeting message</Label>
              <p className="text-xs text-[hsl(212_100%_10%)]/60 mb-2">First message visitors see when they open the chat.</p>
              <Input
                id="greeting"
                value={settings.greeting}
                onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="prompt" className="text-lg">System instructions (persona, rules, knowledge)</Label>
              <p className="text-xs text-[hsl(212_100%_10%)]/60 mb-2">
                Tell the AI exactly how to behave, what to say, what to avoid, and what tone to use.
              </p>
              <Textarea
                id="prompt"
                rows={18}
                value={settings.system_prompt}
                onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                className="font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setSettings({ ...settings, system_prompt: DEFAULT_PROMPT })}
                className="text-xs text-accent hover:underline mt-2"
              >
                Reset to default prompt
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="model">Model</Label>
                <Select value={settings.model} onValueChange={(v) => setSettings({ ...settings, model: v })}>
                  <SelectTrigger id="model"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="temp">Temperature ({settings.temperature})</Label>
                <p className="text-xs text-[hsl(212_100%_10%)]/60 mb-2">Lower = focused. Higher = creative.</p>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={settings.temperature}
                  onChange={(e) => setSettings({ ...settings, temperature: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
