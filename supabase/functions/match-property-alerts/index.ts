import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type PropertyAlert = {
  id: string;
  user_id: string | null;
  email: string;
  label: string | null;
  listing_type: string | null;
  categories: string[] | null;
  regions: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  min_beds: number | null;
  min_baths: number | null;
  tags: string[] | null;
  filters: Record<string, unknown> | null;
  active: boolean;
  unsubscribe_token: string;
};

type Property = {
  id: string;
  slug: string | null;
  title: string;
  price_value: number;
  listing_type: string;
  category: string;
  region: string | null;
  beds: number | null;
  baths: number | null;
  tags: string[];
  status: string;
  created_at: string;
};

/** Does this listing satisfy every criterion set on the alert? Unset criteria always pass. */
function propertyMatchesAlert(p: Property, a: PropertyAlert): boolean {
  if (p.status && p.status.toLowerCase() !== 'available') return false;
  if (a.listing_type && p.listing_type !== a.listing_type) return false;
  if (a.categories?.length && !a.categories.includes(p.category)) return false;
  if (a.regions?.length && p.region && !a.regions.includes(p.region)) return false;
  if (a.budget_min != null && p.price_value < a.budget_min) return false;
  if (a.budget_max != null && p.price_value > a.budget_max) return false;
  if (a.min_beds != null && (p.beds ?? 0) < a.min_beds) return false;
  if (a.min_baths != null && (p.baths ?? 0) < a.min_baths) return false;
  if (a.tags?.length && !a.tags.some((t) => p.tags?.includes(t))) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Allow either: (a) an authenticated admin calling manually, or
    // (b) a scheduled/cron invocation using the service role key directly.
    const authHeader = req.headers.get('Authorization') ?? '';
    const isServiceRoleCall = serviceKey ? authHeader.includes(serviceKey) : false;

    const supabase = createClient(supabaseUrl, serviceKey ?? anonKey, {
      global: isServiceRoleCall || !serviceKey ? undefined : { headers: { Authorization: authHeader } },
    });

    if (!isServiceRoleCall) {
      const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: userData, error: userErr } = await authClient.auth.getUser();
      if (userErr || !userData.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: roleRow } = await authClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!roleRow) {
        return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const [alertsRes, propsRes] = await Promise.all([
      supabase.from('property_alerts').select('*').eq('active', true).limit(2000),
      supabase
        .from('properties')
        .select('id, slug, title, price_value, listing_type, category, region, beds, baths, tags, status, created_at')
        .limit(5000),
    ]);

    if (alertsRes.error) throw alertsRes.error;
    if (propsRes.error) throw propsRes.error;

    const alerts = (alertsRes.data as PropertyAlert[]) ?? [];
    const properties = (propsRes.data as Property[]) ?? [];

    let matchesCreated = 0;
    let emailsSent = 0;
    const resendKey = Deno.env.get('RESEND_API_KEY');

    for (const alert of alerts) {
      const candidates = properties.filter((p) => propertyMatchesAlert(p, alert));
      if (candidates.length === 0) continue;

      // Skip properties already matched to this alert.
      const { data: existing } = await supabase
        .from('property_alert_matches')
        .select('property_id')
        .eq('alert_id', alert.id);
      const alreadyMatched = new Set((existing ?? []).map((r: { property_id: string }) => r.property_id));

      const newMatches = candidates.filter((p) => !alreadyMatched.has(p.id));
      if (newMatches.length === 0) continue;

      const rows = newMatches.map((p) => ({
        alert_id: alert.id,
        property_id: p.id,
        user_id: alert.user_id,
        email: alert.email,
        property_title: p.title,
        property_slug: p.slug,
      }));

      const { error: insertErr } = await supabase.from('property_alert_matches').insert(rows);
      if (insertErr) continue;
      matchesCreated += rows.length;

      if (resendKey) {
        const listHtml = newMatches
          .slice(0, 10)
          .map((p) => `<li>${p.title} — €${p.price_value.toLocaleString()}</li>`)
          .join('');
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: 'Memories Properties <onboarding@resend.dev>',
            to: [alert.email],
            subject: `New matches for "${alert.label ?? 'your saved search'}"`,
            html: `<p>We found ${newMatches.length} new propert${newMatches.length === 1 ? 'y' : 'ies'} matching your alert:</p><ul>${listHtml}</ul><p><a href="https://www.memoriesproperties.com/unsubscribe-alert?token=${alert.unsubscribe_token}">Unsubscribe from this alert</a></p>`,
          }),
        });
        if (res.ok) {
          emailsSent += newMatches.length;
          const ids = newMatches.map((p) => p.id);
          await supabase
            .from('property_alert_matches')
            .update({ emailed_at: new Date().toISOString() })
            .eq('alert_id', alert.id)
            .in('property_id', ids);
          await supabase.from('property_alerts').update({ last_notified_at: new Date().toISOString() }).eq('id', alert.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        alertsChecked: alerts.length,
        matchesCreated,
        emailsSent,
        emailProviderConfigured: Boolean(resendKey),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
