import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, UserPlus, Search, Calendar, User as UserIcon, Target, ChevronDown, LayoutGrid, List, AlertCircle } from 'lucide-react';
import { PROPERTY_FEATURES } from '@/lib/property-features';
import MatchAlertsBell from '@/components/admin/MatchAlertsBell';
import ClientActivityPanel from '@/components/admin/ClientActivityPanel';
import ClientsKanban, { STAGES } from '@/components/admin/ClientsKanban';

type LeadSource = 'manual' | 'website' | 'signup' | 'favorites' | 'tour' | 'enquiry';

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  pipeline_stage: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  looking_for: string;
  preferred_category: string | null;
  preferred_categories: string[];
  preferred_regions: string[];
  budget_min: number | null;
  budget_max: number | null;
  min_beds: number | null;
  min_baths: number | null;
  min_size: number | null;
  min_plot_size: number | null;
  must_have_features: string[];
  source?: LeadSource;
  sources?: LeadSource[];
  last_activity_at?: string | null;
  open_tasks?: number;
  due_today?: number;
  score?: 'hot' | 'warm' | 'cold';
}

interface Property {
  id: string;
  title: string;
  location: string;
  price: string;
  price_value: number;
  category: string;
  listing_type: string;
  region: string | null;
  city: string | null;
  beds: number | null;
  baths: number | null;
  cover_image: string | null;
  slug: string | null;
  size: string | null;
  lot_size: string | null;
  tags: string[];
}

const CATEGORIES = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Bungalow', 'Commercial', 'Mixed-use', 'Land / Plot', 'Coastal', 'Vineyard'];
const REGIONS = ['Limassol', 'Paphos'];

/**
 * Derives a lead-priority score purely from data already loaded — no extra
 * queries. High-intent signals (tour requests, multiple touchpoints, open
 * tasks due today) outrank passive ones (a single saved search).
 */
function computeScore(c: Client): 'hot' | 'warm' | 'cold' {
  const daysSince = (Date.now() - new Date(c.last_activity_at || c.created_at).getTime()) / 86_400_000;
  const sources = c.sources || (c.source ? [c.source] : []);
  const highIntent = sources.includes('tour') || sources.includes('enquiry');

  if ((c.due_today ?? 0) > 0) return 'hot';
  if (sources.length >= 3) return 'hot';
  if (highIntent && daysSince <= 7) return 'hot';
  if (highIntent) return 'warm';
  if ((c.open_tasks ?? 0) > 0) return 'warm';
  if (daysSince <= 14) return 'warm';
  return 'cold';
}

const clientSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Invalid email').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  status: z.enum(['lead', 'active', 'archived']),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

const emptyForm = {
  full_name: '', email: '', phone: '', company: '',
  status: 'lead' as 'lead' | 'active' | 'archived',
  notes: '',
  looking_for: 'sale',
  preferred_categories: [] as string[],
  preferred_regions: [] as string[],
  budget_min: '', budget_max: '',
  min_beds: '', min_baths: '',
  min_size: '', min_plot_size: '',
  must_have_features: [] as string[],
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

export default function AdminClients() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [creators, setCreators] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [reqOpen, setReqOpen] = useState(false);
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [stageFilter, setStageFilter] = useState<string | 'all'>('all');
  const [staleFilter, setStaleFilter] = useState(false);
  const [dueFilter, setDueFilter] = useState(false);
  const [hotFilter, setHotFilter] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: cl, error }, { data: pr }, { data: ss }, { data: profs }, { data: favs }, { data: tours }, { data: enq }, { data: tasks }, { data: acts }] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('id,title,location,price,price_value,category,listing_type,region,city,beds,baths,cover_image,slug,size,lot_size,tags'),
      supabase.from('saved_searches').select('id,user_id,name,mode,query,region,tags,filters,created_at').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, display_name, first_name, last_name, phone_number, created_at').order('created_at', { ascending: false }),
      supabase.from('favorites').select('id, user_id, property_id, property_title, created_at'),
      supabase.from('tour_requests').select('id, user_id, full_name, email, phone, property_id, preferred_date, message, created_at').order('created_at', { ascending: false }),
      supabase.from('enquiries').select('id, user_id, first_name, phone, property_type, region, created_at').order('created_at', { ascending: false }),
      supabase.from('client_tasks').select('client_id, due_at, completed_at'),
      supabase.from('client_activities').select('client_id, created_at').order('created_at', { ascending: false }),
    ]);
    if (error) toast({ title: 'Failed to load', description: error.message, variant: 'destructive' });
    const manualList = ((cl ?? []) as any[]).map((c) => ({ ...c, source: 'manual' as const, pipeline_stage: c.pipeline_stage || 'lead' })) as Client[];
    setProperties((pr ?? []) as Property[]);

    const profileMap: Record<string, any> = {};
    (profs ?? []).forEach((p: any) => { profileMap[p.id] = p; });
    const creatorMap: Record<string, string> = {};
    Object.entries(profileMap).forEach(([k, v]: any) => { creatorMap[k] = v.display_name || `${v.first_name || ''} ${v.last_name || ''}`.trim() || '—'; });
    setCreators(creatorMap);

    const virtual: Client[] = [];

    (ss ?? []).forEach((s: any) => {
      virtual.push({
        id: `ss:${s.id}`,
        full_name: profileMap[s.user_id]?.display_name || `${profileMap[s.user_id]?.first_name || ''} ${profileMap[s.user_id]?.last_name || ''}`.trim() || 'Website visitor',
        email: null, phone: profileMap[s.user_id]?.phone_number || null, company: null,
        status: 'lead', pipeline_stage: 'lead',
        notes: s.name ? `Saved search: ${s.name}` : null,
        created_at: s.created_at, created_by: s.user_id,
        looking_for: s.mode === 'rent' ? 'rent' : s.mode === 'sale' ? 'sale' : 'either',
        preferred_category: null, preferred_categories: [],
        preferred_regions: s.region ? [s.region] : [],
        budget_min: s.filters?.min_price ?? null, budget_max: s.filters?.max_price ?? null,
        min_beds: s.filters?.min_beds ?? null, min_baths: s.filters?.min_baths ?? null,
        min_size: null, min_plot_size: null,
        must_have_features: Array.isArray(s.tags) ? s.tags : [],
        source: 'website',
      });
    });

    (profs ?? []).forEach((p: any) => {
      virtual.push({
        id: `sg:${p.id}`,
        full_name: p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'New signup',
        email: null, phone: p.phone_number || null, company: null,
        status: 'lead', pipeline_stage: 'lead',
        notes: 'Registered website user',
        created_at: p.created_at, created_by: p.id,
        looking_for: 'either',
        preferred_category: null, preferred_categories: [],
        preferred_regions: [], budget_min: null, budget_max: null,
        min_beds: null, min_baths: null, min_size: null, min_plot_size: null,
        must_have_features: [],
        source: 'signup',
      });
    });

    const favByUser: Record<string, any[]> = {};
    (favs ?? []).forEach((f: any) => {
      if (!f.user_id) return;
      (favByUser[f.user_id] ||= []).push(f);
    });
    Object.entries(favByUser).forEach(([uid, list]) => {
      if (list.length < 3) return;
      const p = profileMap[uid];
      virtual.push({
        id: `fv:${uid}`,
        full_name: p?.display_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Favorites user',
        email: null, phone: p?.phone_number || null, company: null,
        status: 'lead', pipeline_stage: 'contacted',
        notes: `Favorited ${list.length} properties`,
        created_at: list[0].created_at, created_by: uid,
        looking_for: 'either',
        preferred_category: null, preferred_categories: [],
        preferred_regions: [], budget_min: null, budget_max: null,
        min_beds: null, min_baths: null, min_size: null, min_plot_size: null,
        must_have_features: [],
        source: 'favorites',
      });
    });

    (tours ?? []).forEach((t: any) => {
      virtual.push({
        id: `tr:${t.id}`,
        full_name: t.full_name || 'Tour requester',
        email: t.email || null, phone: t.phone || null, company: null,
        status: 'lead', pipeline_stage: 'viewing',
        notes: t.message ? `Tour request: ${t.message}` : 'Requested a tour',
        created_at: t.created_at, created_by: t.user_id,
        looking_for: 'either',
        preferred_category: null, preferred_categories: [],
        preferred_regions: [], budget_min: null, budget_max: null,
        min_beds: null, min_baths: null, min_size: null, min_plot_size: null,
        must_have_features: [],
        source: 'tour',
      });
    });

    (enq ?? []).forEach((e: any) => {
      virtual.push({
        id: `eq:${e.id}`,
        full_name: e.first_name || 'Enquiry',
        email: null, phone: e.phone || null, company: null,
        status: 'lead', pipeline_stage: 'lead',
        notes: `Property enquiry${e.property_type ? ` · ${e.property_type}` : ''}${e.region ? ` in ${e.region}` : ''}`,
        created_at: e.created_at, created_by: e.user_id,
        looking_for: 'either',
        preferred_category: null, preferred_categories: [],
        preferred_regions: e.region ? [e.region] : [], budget_min: null, budget_max: null,
        min_beds: null, min_baths: null, min_size: null, min_plot_size: null,
        must_have_features: [],
        source: 'enquiry',
      });
    });

    const manualKeys = new Set<string>();
    manualList.forEach((m) => {
      if (m.created_by) manualKeys.add(`u:${m.created_by}`);
      if (m.email) manualKeys.add(`e:${m.email.toLowerCase()}`);
    });
    const seen = new Map<string, Client>();
    const keyOf = (c: Client) => (c.created_by ? `u:${c.created_by}` : c.email ? `e:${c.email.toLowerCase()}` : `id:${c.id}`);
    const STAGE_ORDER = ['lead', 'contacted', 'viewing', 'negotiating', 'won', 'lost'];
    virtual.forEach((v) => {
      const k = keyOf(v);
      if (manualKeys.has(k)) return;
      const existing = seen.get(k);
      if (!existing) { seen.set(k, { ...v, sources: [v.source!] }); return; }
      const merged: Client = {
        ...existing,
        full_name: existing.full_name && !['New signup', 'Website visitor'].includes(existing.full_name) ? existing.full_name : v.full_name,
        email: existing.email || v.email,
        phone: existing.phone || v.phone,
        notes: [existing.notes, v.notes].filter(Boolean).join(' · '),
        pipeline_stage: STAGE_ORDER.indexOf(v.pipeline_stage) > STAGE_ORDER.indexOf(existing.pipeline_stage) ? v.pipeline_stage : existing.pipeline_stage,
        sources: Array.from(new Set([...(existing.sources || []), v.source!])),
        created_at: existing.created_at < v.created_at ? existing.created_at : v.created_at,
      };
      seen.set(k, merged);
    });

    const lastActMap: Record<string, string> = {};
    (acts ?? []).forEach((a: any) => {
      if (!lastActMap[a.client_id]) lastActMap[a.client_id] = a.created_at;
    });
    const taskAgg: Record<string, { open: number; due: number }> = {};
    const eod = new Date(); eod.setHours(23, 59, 59, 999);
    (tasks ?? []).forEach((t: any) => {
      if (t.completed_at) return;
      const agg = (taskAgg[t.client_id] ||= { open: 0, due: 0 });
      agg.open++;
      if (t.due_at && new Date(t.due_at) <= eod) agg.due++;
    });
    manualList.forEach((m) => {
      m.last_activity_at = lastActMap[m.id] || null;
      m.open_tasks = taskAgg[m.id]?.open || 0;
      m.due_today = taskAgg[m.id]?.due || 0;
    });

    const merged = [...manualList, ...Array.from(seen.values())].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    merged.forEach((c) => { c.score = computeScore(c); });
    setClients(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = clientSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: 'Check the form', description: parsed.error.issues[0].message, variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      looking_for: form.looking_for,
      preferred_category: form.preferred_categories[0] || null,
      preferred_categories: form.preferred_categories,
      preferred_regions: form.preferred_regions,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      min_beds: form.min_beds ? Number(form.min_beds) : null,
      min_baths: form.min_baths ? Number(form.min_baths) : null,
      min_size: form.min_size ? Number(form.min_size) : null,
      min_plot_size: form.min_plot_size ? Number(form.min_plot_size) : null,
      must_have_features: form.must_have_features,
    };
    const { data, error } = await supabase.from('clients').insert(payload).select('id').single();
    setSaving(false);
    if (error) {
      toast({ title: 'Could not create client', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Client created' });
    setForm(emptyForm);
    setShowForm(false);
    if (data?.id) setSelectedId(data.id);
    load();
  };

  const updateRequirements = async (patch: Partial<Client>) => {
    if (!selectedId) return;
    if (selectedId.startsWith('ss:')) return; // saved-search rows are read-only
    const { source, ...dbPatch } = patch;
    const { error } = await supabase.from('clients').update(dbPatch as any).eq('id', selectedId);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    setClients((prev) => prev.map((c) => (c.id === selectedId ? { ...c, ...patch } : c)));
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this client?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted' }); if (selectedId === id) setSelectedId(null); load(); }
  };

  const STALE_DAYS = 14;
  const counters = useMemo(() => {
    const now = Date.now();
    let dueToday = 0, stale = 0, hot = 0;
    clients.forEach((c) => {
      if (c.score === 'hot') hot++;
      if (c.source !== 'manual') return;
      dueToday += c.due_today || 0;
      const last = c.last_activity_at ? new Date(c.last_activity_at).getTime() : new Date(c.created_at).getTime();
      if (!['won', 'lost'].includes(c.pipeline_stage) && (now - last) / 86400000 >= STALE_DAYS) stale++;
    });
    return { dueToday, stale, hot };
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    return clients.filter((c) => {
      if (q && ![c.full_name, c.email, c.phone, c.company].filter(Boolean).join(' ').toLowerCase().includes(q)) return false;
      if (stageFilter !== 'all' && (c.pipeline_stage || 'lead') !== stageFilter) return false;
      if (dueFilter && !(c.due_today && c.due_today > 0)) return false;
      if (hotFilter && c.score !== 'hot') return false;
      if (staleFilter) {
        if (c.source !== 'manual' || ['won', 'lost'].includes(c.pipeline_stage)) return false;
        const last = c.last_activity_at ? new Date(c.last_activity_at).getTime() : new Date(c.created_at).getTime();
        if ((now - last) / 86400000 < STALE_DAYS) return false;
      }
      return true;
    });
  }, [clients, search, stageFilter, dueFilter, staleFilter, hotFilter]);

  const selected = clients.find((c) => c.id === selectedId) || null;

  const scoreMatches = (req: {
    looking_for?: string;
    preferred_categories?: string[];
    preferred_regions?: string[];
    budget_min?: number | null;
    budget_max?: number | null;
    min_beds?: number | null;
    min_baths?: number | null;
    min_size?: number | null;
    min_plot_size?: number | null;
    must_have_features?: string[];
  }) => {
    const parseM2 = (s: string | null) => {
      if (!s) return 0;
      const n = parseFloat(String(s).replace(/[^\d.]/g, ''));
      return isFinite(n) ? n : 0;
    };
    const scored = properties.map((p) => {
      let score = 0;
      let total = 0;
      if (req.looking_for && req.looking_for !== 'either') { total++; if (p.listing_type === req.looking_for) score++; }
      if (req.preferred_categories?.length) {
        total++;
        if (req.preferred_categories.includes(p.category)) score++;
      }
      if (req.preferred_regions?.length) {
        total++;
        const hay = `${p.region ?? ''} ${p.city ?? ''} ${p.location ?? ''}`.toLowerCase();
        if (req.preferred_regions.some((r) => hay.includes(r.toLowerCase()))) score++;
      }
      if (req.budget_min != null) { total++; if (p.price_value >= Number(req.budget_min)) score++; }
      if (req.budget_max != null) { total++; if (p.price_value <= Number(req.budget_max)) score++; }
      if (req.min_beds != null) { total++; if ((p.beds ?? 0) >= Number(req.min_beds)) score++; }
      if (req.min_baths != null) { total++; if ((p.baths ?? 0) >= Number(req.min_baths)) score++; }
      if (req.min_size != null) { total++; if (parseM2(p.size) >= Number(req.min_size)) score++; }
      if (req.min_plot_size != null) { total++; if (parseM2(p.lot_size) >= Number(req.min_plot_size)) score++; }
      if (req.must_have_features?.length) {
        const tagSet = new Set((p.tags || []).map((t) => t.toLowerCase()));
        for (const f of req.must_have_features) {
          total++;
          if (tagSet.has(f.toLowerCase())) score++;
        }
      }
      const pct = total ? Math.round((score / total) * 100) : 0;
      return { property: p, pct, score, total };
    });
    const sorted = scored.sort((a, b) => b.pct - a.pct);
    const good = sorted.filter((m) => m.pct >= 50);
    return (good.length >= 3 ? good : sorted).slice(0, 12);
  };

  const matches = useMemo(() => {
    if (!selected) return [];
    return scoreMatches(selected);
  }, [selected, properties]);

  const formMatches = useMemo(() => {
    if (!showForm) return [];
    return scoreMatches({
      looking_for: form.looking_for,
      preferred_categories: form.preferred_categories,
      preferred_regions: form.preferred_regions,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      min_beds: form.min_beds ? Number(form.min_beds) : null,
      min_baths: form.min_baths ? Number(form.min_baths) : null,
      min_size: form.min_size ? Number(form.min_size) : null,
      min_plot_size: form.min_plot_size ? Number(form.min_plot_size) : null,
      must_have_features: form.must_have_features,
    }).slice(0, 3);
  }, [showForm, form, properties]);

  const toggleRegion = (r: string) => {
    if (!selected) return;
    const current = selected.preferred_regions || [];
    const next = current.includes(r) ? current.filter((x) => x !== r) : [...current, r];
    updateRequirements({ preferred_regions: next });
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
      <header className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">CRM: pipeline, activity, tasks, and auto-matched listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-64" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex rounded-md border border-border overflow-hidden">
            <button onClick={() => setView('table')} className={`px-2.5 h-9 text-xs flex items-center gap-1 ${view === 'table' ? 'bg-accent text-accent-foreground' : 'bg-background hover:bg-muted'}`}><List className="h-3.5 w-3.5" />Table</button>
            <button onClick={() => setView('kanban')} className={`px-2.5 h-9 text-xs flex items-center gap-1 ${view === 'kanban' ? 'bg-accent text-accent-foreground' : 'bg-background hover:bg-muted'}`}><LayoutGrid className="h-3.5 w-3.5" />Board</button>
          </div>
          <MatchAlertsBell />
          <Button onClick={() => setShowForm((s) => !s)} className="gap-2">
            {showForm ? 'Close' : <><Plus className="h-4 w-4" /> New client</>}
          </Button>
        </div>
      </header>

      {/* Counters & filters */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button
          onClick={() => { setStageFilter('all'); setDueFilter(false); setStaleFilter(false); setHotFilter(false); }}
          className={`px-3 h-8 rounded-full text-xs font-medium border ${stageFilter === 'all' && !dueFilter && !staleFilter && !hotFilter ? 'bg-accent text-accent-foreground border-accent' : 'bg-background border-border hover:border-accent/60'}`}
        >All ({clients.length})</button>
        {STAGES.map((s) => {
          const count = clients.filter((c) => (c.pipeline_stage || 'lead') === s.key).length;
          return (
            <button key={s.key} onClick={() => { setStageFilter(s.key); setDueFilter(false); setStaleFilter(false); setHotFilter(false); }}
              className={`px-3 h-8 rounded-full text-xs font-medium border ${stageFilter === s.key ? 'bg-accent text-accent-foreground border-accent' : 'bg-background border-border hover:border-accent/60'}`}
            >{s.label} ({count})</button>
          );
        })}
        <div className="w-px h-5 bg-border mx-1" />
        <button onClick={() => setHotFilter((h) => !h)}
          className={`px-3 h-8 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${hotFilter ? 'bg-red-500 text-white border-red-500' : 'bg-background border-border hover:border-accent/60'}`}
        ><span className="inline-block w-2 h-2 rounded-full bg-current" />Hot leads ({counters.hot})</button>
        <button onClick={() => setDueFilter((d) => !d)}
          className={`px-3 h-8 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${dueFilter ? 'bg-accent text-accent-foreground border-accent' : 'bg-background border-border hover:border-accent/60'}`}
        ><Calendar className="h-3 w-3" />Due today ({counters.dueToday})</button>
        <button onClick={() => setStaleFilter((s) => !s)}
          className={`px-3 h-8 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${staleFilter ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-background border-border hover:border-accent/60'}`}
        ><AlertCircle className="h-3 w-3" />Stale leads ({counters.stale})</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 mb-8 space-y-4 text-base [&_label]:text-base [&_input]:text-base [&_input]:h-11 [&_button[role=combobox]]:text-base [&_button[role=combobox]]:h-11 [&_textarea]:text-base">
          <div className="flex items-center gap-2 text-lg font-semibold"><UserPlus className="h-5 w-5" /> Create a client</div>
          <div className="grid md:grid-cols-2 gap-4 [&_input]:transition-all [&_input:hover]:border-accent [&_input:hover]:shadow-sm [&_button[role=combobox]]:transition-all [&_button[role=combobox]:hover]:border-accent [&_button[role=combobox]:hover]:shadow-sm">
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+357 …" />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Looking for</Label>
              <Select value={form.looking_for} onValueChange={(v) => setForm({ ...form, looking_for: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">To buy</SelectItem>
                  <SelectItem value="rent">To rent</SelectItem>
                  <SelectItem value="either">Either (buy or rent)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-2">
            <button
              type="button"
              onClick={() => setReqOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-4 h-11 rounded-[var(--radius)] border border-border bg-background text-sm font-semibold transition-all hover:border-accent hover:bg-accent/5 hover:shadow-sm"
              aria-expanded={reqOpen}
            >
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4" /> Requirements
                <span className="text-xs font-normal text-muted-foreground">
                  ({[(form.preferred_categories||[]).length, form.budget_min || form.budget_max, form.min_beds || form.min_baths, form.min_size || form.min_plot_size, (form.preferred_regions||[]).length, (form.must_have_features||[]).length].filter(Boolean).length} set)
                </span>
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${reqOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-out ${reqOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Property type <span className="text-xs font-normal text-muted-foreground">(pick one or more)</span></Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const cats = form.preferred_categories || [];
                    const active = cats.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({
                          ...form,
                          preferred_categories: active ? cats.filter((x) => x !== c) : [...cats, c],
                        })}
                        className={`px-4 h-10 rounded-full text-base font-medium border transition-colors ${
                          active ? 'bg-accent text-accent-foreground border-accent' : 'bg-background text-foreground border-border hover:border-accent/60'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Budget (min – max)</Label>
                <div className="flex gap-2">
                  <Input type="number" min="0" placeholder="Min" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
                  <Input type="number" min="0" placeholder="Max" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Min beds / baths</Label>
                <div className="flex gap-2">
                  <Input type="number" min="0" placeholder="Beds" value={form.min_beds} onChange={(e) => setForm({ ...form, min_beds: e.target.value })} />
                  <Input type="number" min="0" placeholder="Baths" value={form.min_baths} onChange={(e) => setForm({ ...form, min_baths: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Min interior / plot (m²)</Label>
                <div className="flex gap-2">
                  <Input type="number" min="0" placeholder="Interior" value={form.min_size} onChange={(e) => setForm({ ...form, min_size: e.target.value })} />
                  <Input type="number" min="0" placeholder="Plot" value={form.min_plot_size} onChange={(e) => setForm({ ...form, min_plot_size: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label>Preferred districts</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-2 px-4 h-11 rounded-[var(--radius)] border border-border bg-background text-sm font-medium transition-all hover:border-accent hover:shadow-sm"
                  >
                    <span className="truncate text-left">
                      {(form.preferred_regions || []).length
                        ? form.preferred_regions.join(', ')
                        : <span className="text-muted-foreground">Select districts…</span>}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-72 overflow-y-auto" align="start">
                  <DropdownMenuLabel>Districts ({(form.preferred_regions||[]).length} selected)</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {REGIONS.map((r) => {
                    const regions = form.preferred_regions || [];
                    const active = regions.includes(r);
                    return (
                      <DropdownMenuCheckboxItem
                        key={r}
                        checked={active}
                        onCheckedChange={() => setForm({
                          ...form,
                          preferred_regions: active ? regions.filter((x) => x !== r) : [...regions, r],
                        })}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {r}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setFeaturesOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 px-4 h-11 rounded-[var(--radius)] border border-border bg-background text-sm font-semibold transition-all hover:border-accent hover:bg-accent/5 hover:shadow-sm"
                aria-expanded={featuresOpen}
              >
                <span className="flex items-center gap-2">
                  Must-have features
                  <span className="text-xs font-normal text-muted-foreground">({(form.must_have_features || []).length} selected)</span>
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`grid transition-all duration-300 ease-out ${featuresOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-3 rounded-md border border-border bg-background">
                    {PROPERTY_FEATURES.map((f) => {
                      const feats = form.must_have_features || [];
                      const active = feats.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setForm({
                            ...form,
                            must_have_features: active ? feats.filter((x) => x !== f) : [...feats, f],
                          })}
                          className={`px-3.5 h-9 rounded-full text-sm font-medium border transition-colors ${
                            active ? 'bg-accent text-accent-foreground border-accent' : 'bg-background text-foreground border-border hover:border-accent/60'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}{f}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" /> Matching listings preview
              </div>
              <span className="text-xs text-muted-foreground">{formMatches.length} shown</span>
            </div>
            {formMatches.length === 0 ? (
              <div className="text-xs text-muted-foreground p-4 rounded-md border border-dashed border-border text-center">
                Add some requirements above to preview matching listings.
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-3">
                {formMatches.map(({ property: p, pct }) => (
                  <Link
                    key={p.id}
                    to={`/properties/${p.slug || p.id}`}
                    target="_blank"
                    className="group rounded-lg border border-border bg-background overflow-hidden hover:border-accent hover:shadow-md transition-all"
                  >
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                      {p.cover_image ? (
                        <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent">{pct}% match</span>
                        <span className="text-xs text-muted-foreground truncate">{p.category}</span>
                      </div>
                      <div className="font-medium text-sm line-clamp-1">{p.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{p.location}</div>
                      <div className="text-sm font-semibold">{p.price}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setForm(emptyForm); setShowForm(false); }}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create client'}</Button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        {/* LEFT — list + detail */}
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No clients yet. Click "New client" to add one.</div>
          ) : view === 'kanban' ? (
            <ClientsKanban
              clients={filtered as any}
              onSelect={(id) => setSelectedId(id)}
              onChange={() => load()}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Source</th>
                    <th className="p-3 font-medium">Stage</th>
                    <th className="p-3 font-medium">Wants</th>
                    <th className="p-3 font-medium">Activity</th>
                    <th className="p-3 font-medium">Created</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const stage = STAGES.find((s) => s.key === (c.pipeline_stage || 'lead'));
                    const isVirtual = c.id.startsWith('ss:') || c.id.startsWith('sg:') || c.id.startsWith('fv:') || c.id.startsWith('tr:');
                    const last = c.last_activity_at ? new Date(c.last_activity_at) : null;
                    const stale = c.source === 'manual' && !['won', 'lost'].includes(c.pipeline_stage) &&
                      (Date.now() - (last?.getTime() || new Date(c.created_at).getTime())) / 86400000 >= 14;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`border-t border-border cursor-pointer hover:bg-muted/30 ${selectedId === c.id ? 'bg-accent/5' : ''}`}
                      >
                        <td className="p-3">
                          <div className="font-medium flex items-center gap-1.5">
                            <span
                              title={c.score === 'hot' ? 'Hot lead' : c.score === 'warm' ? 'Warm lead' : 'Cold lead'}
                              className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                                c.score === 'hot' ? 'bg-red-500' : c.score === 'warm' ? 'bg-amber-500' : 'bg-muted-foreground/30'
                              }`}
                            />
                            {c.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{c.email || c.phone || (c.notes && isVirtual ? c.notes : '—')}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(c.sources && c.sources.length ? c.sources : [c.source || 'manual']).map((src) => (
                              <span key={src} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                src === 'manual' ? 'bg-muted text-muted-foreground border-border'
                                : src === 'website' ? 'bg-accent/10 text-accent border-accent/30'
                                : src === 'signup' ? 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                                : src === 'favorites' ? 'bg-pink-500/10 text-pink-700 border-pink-500/30'
                                : src === 'enquiry' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                                : 'bg-purple-500/10 text-purple-700 border-purple-500/30'
                              }`}>{src === 'manual' ? 'Manual' : src === 'website' ? 'Saved search' : src === 'signup' ? 'Signup' : src === 'favorites' ? 'Favorites' : src === 'enquiry' ? 'Enquiry' : 'Tour'}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${stage?.color || ''}`}>{stage?.label || c.pipeline_stage}</span>
                        </td>
                        <td className="p-3 capitalize text-xs">
                          {c.looking_for === 'rent' ? 'To rent' : c.looking_for === 'either' ? 'Buy or rent' : 'To buy'}
                          {(c.preferred_categories?.length ? ` · ${c.preferred_categories.join(', ')}` : (c.preferred_category ? ` · ${c.preferred_category}` : ''))}
                        </td>
                        <td className="p-3 text-xs">
                          {c.due_today ? <span className="text-destructive font-medium">{c.due_today} due today</span>
                            : c.open_tasks ? <span className="text-muted-foreground">{c.open_tasks} task{c.open_tasks > 1 ? 's' : ''}</span>
                            : stale ? <span className="text-destructive">Stale</span>
                            : last ? <span className="text-muted-foreground">{fmtDate(last.toISOString())}</span>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{fmtDate(c.created_at)}</td>
                        <td className="p-3 text-right">
                          {!isVirtual && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); remove(c.id); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Requirements editor */}
          {selected && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Target className="h-5 w-5" /> {selected.full_name}
                </div>
                {selected.source === 'manual' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Pipeline stage</Label>
                    <Select value={selected.pipeline_stage || 'lead'} onValueChange={(v) => updateRequirements({ pipeline_stage: v })}>
                      <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {selected.source !== 'manual' && (
                <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-foreground">
                  This lead came from website activity — read-only. Create a manual client to edit requirements and track activity.
                </div>
              )}

              {selected.source === 'manual' && (
                <ClientActivityPanel clientId={selected.id} />
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Looking for</Label>
                  <Select value={selected.looking_for} onValueChange={(v) => updateRequirements({ looking_for: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">To buy</SelectItem>
                      <SelectItem value="rent">To rent</SelectItem>
                      <SelectItem value="either">Either (buy or rent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Property type <span className="text-xs font-normal text-muted-foreground">(pick one or more)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => {
                      const cats = selected.preferred_categories || [];
                      const active = cats.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            const next = active ? cats.filter((x) => x !== c) : [...cats, c];
                            updateRequirements({ preferred_categories: next, preferred_category: next[0] ?? null });
                          }}
                          className={`px-3 h-9 rounded-full text-sm font-medium border transition-colors ${
                            active ? 'bg-accent text-accent-foreground border-accent' : 'bg-background text-foreground border-border hover:border-accent/60'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}{c}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Budget min</Label>
                  <Input type="number" value={selected.budget_min ?? ''} onChange={(e) => updateRequirements({ budget_min: e.target.value ? Number(e.target.value) : null })} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Budget max</Label>
                  <Input type="number" value={selected.budget_max ?? ''} onChange={(e) => updateRequirements({ budget_max: e.target.value ? Number(e.target.value) : null })} placeholder="2,000,000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Min beds</Label>
                  <Input type="number" min="0" value={selected.min_beds ?? ''} onChange={(e) => updateRequirements({ min_beds: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Min baths</Label>
                  <Input type="number" min="0" value={selected.min_baths ?? ''} onChange={(e) => updateRequirements({ min_baths: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Min interior size (m²)</Label>
                  <Input type="number" min="0" value={selected.min_size ?? ''} onChange={(e) => updateRequirements({ min_size: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 120" />
                </div>
                <div className="space-y-1.5">
                  <Label>Min plot size (m²)</Label>
                  <Input type="number" min="0" value={selected.min_plot_size ?? ''} onChange={(e) => updateRequirements({ min_plot_size: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred regions</Label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((r) => {
                    const active = selected.preferred_regions?.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRegion(r)}
                        className={`px-3 h-9 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'bg-background text-foreground border-border hover:border-accent/60'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{r}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Must-have features</Label>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 rounded-md border border-border bg-background">
                  {PROPERTY_FEATURES.map((f) => {
                    const active = selected.must_have_features?.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          const cur = selected.must_have_features || [];
                          const next = cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f];
                          updateRequirements({ must_have_features: next });
                        }}
                        className={`px-2.5 h-7 rounded-full text-[11px] font-medium border transition-colors ${
                          active
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'bg-background text-foreground border-border hover:border-accent/60'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{f}
                      </button>
                    );
                  })}
                </div>
                {selected.must_have_features?.length > 0 && (
                  <p className="text-xs text-muted-foreground">{selected.must_have_features.length} feature(s) required</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — matched listings */}
        <aside className="rounded-xl border border-border bg-card p-5 h-fit lg:sticky lg:top-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Matching listings</h2>
            {selected && <span className="text-xs text-muted-foreground">{matches.length} match{matches.length === 1 ? '' : 'es'}</span>}
          </div>
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a client to see properties that match their requirements.</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No listings match yet. Tweak the requirements on the left.</p>
          ) : (
            <ul className="space-y-3">
              {matches.map(({ property: p, pct }) => (
                <li key={p.id} className="rounded-lg border border-border overflow-hidden hover:border-accent/60 transition-colors">
                  <Link to={`/properties/${p.slug || p.id}`} target="_blank" rel="noreferrer" className="block">
                    {p.cover_image && (
                      <div className="aspect-[16/9] bg-muted overflow-hidden">
                        <img src={p.cover_image} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{p.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.location}</div>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">{pct}%</span>
                      </div>
                      <div className="mt-1 text-sm font-semibold">{p.price}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
