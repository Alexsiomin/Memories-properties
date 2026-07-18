import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  ArrowLeft, Building2, Image as ImageIcon, MapPin, Ruler, Tag as TagIcon,
  Upload, X, Star, Loader2, CheckCircle2, Plus, Minus,
  Home as HomeIcon, Building, Layers, Grape, Waves, Trees,
  Circle, Clock, CheckCircle, EyeOff, Check, ChevronDown,
  Share2, Facebook, Instagram, Linkedin,
} from 'lucide-react';

const AD_CHANNELS = [
  { id: 'facebook', label: 'Facebook Page', icon: Facebook, color: '#1877F2' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
] as const;
type AdChannelId = typeof AD_CHANNELS[number]['id'];

// ---------- Schema ----------
const propertySchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(140),
  location: z.string().trim().max(140).optional().or(z.literal('')),
  category: z.string().trim().min(1, 'Category is required'),
  status: z.string().trim().min(1, 'Status is required'),
  currency: z.string().trim().min(1),
  price_value: z.coerce.number().positive('Enter a price'),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  share_title: z.string().trim().max(200).optional().or(z.literal('')),
  share_description: z.string().trim().max(300).optional().or(z.literal('')),
  share_image: z.string().trim().max(500).optional().or(z.literal('')),
  yield: z.string().trim().max(40).optional().or(z.literal('')),
  size_value: z.string().optional().or(z.literal('')),
  size_unit: z.string().optional().or(z.literal('')),
  beds: z.coerce.number().int().min(0).max(99),
  baths: z.coerce.number().int().min(0).max(99),
  sort_order: z.coerce.number().int().default(0),
  image_key: z.string().trim().max(80).optional().or(z.literal('')),
  address_line: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  region: z.string().max(100).optional().or(z.literal('')),
  postal_code: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  year_built: z.string().optional().or(z.literal('')),
  lot_size_value: z.string().optional().or(z.literal('')),
  lot_size_unit: z.string().optional().or(z.literal('')),
  covered_verandas_value: z.string().optional().or(z.literal('')),
  uncovered_verandas_value: z.string().optional().or(z.literal('')),
  basement_value: z.string().optional().or(z.literal('')),
  parking_spaces: z.coerce.number().int().min(0).max(99),
  hoa_fees: z.string().max(40).optional().or(z.literal('')),
  furnished: z.string().optional().or(z.literal('')),
  energy_rating: z.string().optional().or(z.literal('')),
  available_from: z.string().optional().or(z.literal('')),
  deposit_value: z.string().optional().or(z.literal('')),
  floor: z.string().optional().or(z.literal('')),
  total_floors: z.string().optional().or(z.literal('')),
  orientation: z.string().optional().or(z.literal('')),
  pet_friendly: z.boolean().optional(),
  vat_included: z.boolean().optional(),
  heating: z.string().optional().or(z.literal('')),
  cooling: z.string().optional().or(z.literal('')),
  condition: z.string().optional().or(z.literal('')),
});

const empty = {
  listing_type: 'sale',
  seller_type: 'individual',
  title: '', location: '', category: '', status: 'available',
  currency: 'EUR', price_value: '',
  description: '', yield: '',
  share_title: '', share_description: '', share_image: '',
  size_value: '0', size_unit: 'm²',
  beds: 0, baths: 0,
  sort_order: 0, image_key: 'hero',
  address_line: '', city: '', region: '', postal_code: '', country: 'Cyprus',
  
  year_built: '',
  lot_size_value: '', lot_size_unit: 'm²',
  covered_verandas_value: '0', uncovered_verandas_value: '0', basement_value: '',
  parking_spaces: 0,
  hoa_fees: '',
  furnished: '',
  energy_rating: '',
  available_from: '',
  deposit_value: '',
  floor: '',
  total_floors: '',
  orientation: '',
  pet_friendly: false,
  vat_included: false,
  heating: '',
  cooling: '',
  condition: '',
  client_id: '',
};

const CATEGORIES = [
  { value: 'Apartment', icon: Building },
  { value: 'Villa', icon: HomeIcon },
  { value: 'Townhouse', icon: HomeIcon },
  { value: 'Penthouse', icon: Building },
  { value: 'Bungalow', icon: HomeIcon },
  { value: 'Commercial', icon: Building },
  { value: 'Mixed-use', icon: Layers },
  { value: 'Land / Plot', icon: Trees },
  { value: 'Coastal', icon: Waves },
  { value: 'Vineyard', icon: Grape },
];

const STATUSES = [
  { value: 'available', label: 'Available', icon: Circle, tone: 'text-emerald-600' },
  { value: 'reserved', label: 'Reserved', icon: Clock, tone: 'text-amber-600' },
  { value: 'sold', label: 'Sold', icon: CheckCircle, tone: 'text-muted-foreground' },
  { value: 'off-market', label: 'Off-market', icon: EyeOff, tone: 'text-muted-foreground' },
];

const CURRENCIES = [
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'USD', symbol: '$' },
];

// Cyprus districts and major towns / resorts within each
const CY_DISTRICTS: Record<string, string[]> = {
  Limassol: ['Limassol (city)', 'Germasogeia', 'Agios Tychon', 'Pyrgos', 'Pissouri', 'Parekklisia', 'Mouttagiaka', 'Episkopi'],
  Paphos: [
    // Municipality of Paphos — official parishes (Dept. of Lands & Surveys 01.01.2021)
    'Paphos (city)', 'Mouttalos', 'Agios Pavlos', 'Agios Theodoros', 'Agios Spyridon', 'Agios Kendeas',
    'Kato Paphos', 'Universal', 'Anavargos', 'Mesogi', 'Konia',
    // Municipality of Geroskipou
    'Geroskipou', 'Koloni', 'Achelia',
    // Municipality of Pegeia
    'Peyia', 'Coral Bay', 'Sea Caves', 'Agios Georgios (Pegeia)',
    // Municipality of Polis Chrysochous
    'Polis Chrysochous', 'Polis', 'Chrysochous', 'Prodromi', 'Latchi',
    // Communities — Paphos District (coastal & inland villages)
    'Chloraka', 'Kissonerga', 'Lemba', 'Tala', 'Tremithousa', 'Emba', 'Kallepia', 'Letymbou', 'Polemi',
    'Stroumpi', 'Kathikas', 'Pano Akourdaleia', 'Kato Akourdaleia', 'Theletra', 'Giolou', 'Drouseia',
    'Inia', 'Pano Arodes', 'Kato Arodes', 'Kritou Terra', 'Neo Chorio', 'Argaka', 'Pomos',
    'Pachyammos', 'Kato Pyrgos', 'Pano Pyrgos', 'Steni', 'Goudi', 'Skoulli', 'Lysos',
    'Peristerona (Paphos)', 'Nea Dimmata', 'Makounta', 'Karamoullides', 'Agia Marina (Chrysochous)',
    'Episkopi (Paphos)', 'Salamiou', 'Statos-Agios Fotios', 'Pano Panagia', 'Kannaviou', 'Asprogia',
    'Kelokedara', 'Choulou', 'Lemona', 'Psathi', 'Pentalia', 'Galataria', 'Koilineia', 'Mesana',
    'Mamonia', 'Nata', 'Axylou', 'Eledio', 'Maronas', 'Trachypedoula', 'Pitargou', 'Amargeti',
    'Agios Nikolaos (Paphos)', 'Kedares', 'Praitori', 'Mousere', 'Vretsia', 'Phasoula (Paphos)',
    'Kissousa', 'Timi', 'Mandria', 'Nikoklia', 'Kouklia', 'Aphrodite Hills', 'Secret Valley',
    'Petra tou Romiou', 'Anarita', 'Foinikas', 'Choletria', 'Kidasi', 'Souskiou',
    'Tsada', 'Koili', 'Marathounta', 'Armou', 'Episkopi (lower Paphos)', 'Pegeia', 'Akoursos',
    'Fyti', 'Milia', 'Simou', 'Lasa', 'Drymou', 'Kourdaka', 'Anadiou',
  ],
};
const CY_DISTRICT_NAMES = Object.keys(CY_DISTRICTS);

const COUNTRIES = ['Cyprus', 'Greece', 'United Kingdom', 'Other'];

const IMAGE_KEYS = ['hero', 'skyline', 'residential', 'vineyard', 'coastal', 'mixed', 'desert', 'library', 'markets', 'tech'];

import { PROPERTY_FEATURES } from '@/lib/property-features';
const COMMON_TAGS = PROPERTY_FEATURES;

// ---------- Helpers ----------
const formatPrice = (n: number, currency: string) => {
  if (!n) return '';
  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol ?? '';
  return `${sym}${n.toLocaleString()}`;
};

export default function AdminPropertyNew() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = !!editId;
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status');
  const [form, setForm] = useState<any>(() => initialStatus && !isEdit ? { ...empty, status: initialStatus } : empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [images, setImages] = useState<string[]>([]);
  const [coverIdx, setCoverIdx] = useState(0);
  const [floorPlans, setFloorPlans] = useState<{ url: string; label: string }[]>([]);
  const [floorPlanUploading, setFloorPlanUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [clientOptions, setClientOptions] = useState<{ id: string; full_name: string }[]>([]);
  const [adChannels, setAdChannels] = useState<AdChannelId[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin:ad_channels') || '["facebook"]'); } catch { return ['facebook']; }
  });
  const [adWebhookUrl, setAdWebhookUrl] = useState<string>(() => localStorage.getItem('admin:ad_webhook_url') || '');
  useEffect(() => { localStorage.setItem('admin:ad_channels', JSON.stringify(adChannels)); }, [adChannels]);
  useEffect(() => { localStorage.setItem('admin:ad_webhook_url', adWebhookUrl); }, [adWebhookUrl]);
  const toggleChannel = (id: AdChannelId) =>
    setAdChannels((cs) => cs.includes(id) ? cs.filter((c) => c !== id) : [...cs, id]);
  
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('clients').select('id, full_name').order('full_name');
      setClientOptions(data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!isEdit || !editId) return;
    (async () => {
      const { data, error } = await supabase.from('properties').select('*').eq('id', editId).maybeSingle();
      if (error || !data) { toast.error('Could not load property'); navigate('/admin/properties'); return; }
      const parseNum = (s: string | null) => s ? String(s).replace(/[^\d.]/g, '') : '';
      setForm({
        ...empty,
        listing_type: data.listing_type ?? 'sale',
        seller_type: (data as { seller_type?: string }).seller_type ?? 'individual',
        title: data.title ?? '',
        location: data.location ?? '',
        category: data.category ?? '',
        status: data.status ?? 'available',
        currency: 'EUR',
        price_value: data.price_value ?? '',
        description: data.description ?? '',
        share_title: (data as any).share_title ?? '',
        share_description: (data as any).share_description ?? '',
        share_image: (data as any).share_image ?? '',
        yield: data.yield ?? '',
        size_value: parseNum(data.size),
        size_unit: 'm²',
        beds: data.beds ?? 0,
        baths: data.baths ?? 0,
        sort_order: data.sort_order ?? 0,
        image_key: data.image_key ?? 'hero',
        address_line: data.address_line ?? '',
        city: data.city ?? '',
        region: data.region ?? '',
        postal_code: data.postal_code ?? '',
        country: data.country ?? 'Cyprus',
        year_built: data.year_built ? String(data.year_built) : '',
        lot_size_value: parseNum(data.lot_size),
        lot_size_unit: 'm²',
        covered_verandas_value: parseNum(data.covered_verandas),
        parking_spaces: data.parking_spaces ?? 0,
        hoa_fees: data.hoa_fees ?? '',
        furnished: data.furnished ?? '',
        energy_rating: data.energy_rating ?? '',
        available_from: data.available_from ?? '',
        deposit_value: data.deposit_value != null ? String(data.deposit_value) : '',
        floor: data.floor != null ? String(data.floor) : '',
        total_floors: data.total_floors != null ? String(data.total_floors) : '',
        orientation: data.orientation ?? '',
        pet_friendly: !!data.pet_friendly,
        vat_included: !!data.vat_included,
        heating: data.heating ?? '',
        cooling: data.cooling ?? '',
        condition: data.condition ?? '',
        client_id: (data as any).client_id ?? '',
      });
      const imgs: string[] = Array.isArray(data.images) ? data.images : [];
      setImages(imgs);
      if (data.cover_image && imgs.includes(data.cover_image)) {
        setCoverIdx(imgs.indexOf(data.cover_image));
      }
      const fps = Array.isArray((data as any).floor_plans) ? (data as any).floor_plans : [];
      setFloorPlans(fps.filter((f: any) => f && typeof f.url === 'string'));
      setTags(Array.isArray(data.tags) ? data.tags : []);
      setLoadingRecord(false);
    })();
  }, [editId, isEdit, navigate]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const displayPrice = useMemo(() => {
    const base = formatPrice(Number(form.price_value) || 0, form.currency);
    if (!base) return '';
    return form.listing_type === 'rent' ? `${base}/mo` : base;
  }, [form.price_value, form.currency, form.listing_type]);

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    const out: number[] = [];
    for (let y = now; y >= 1850; y--) out.push(y);
    return out;
  }, []);

  const sortedTags = useMemo(() => {
    const merged = Array.from(new Set([...COMMON_TAGS, ...tags]));
    return merged.sort((a, b) => a.localeCompare(b));
  }, [tags]);

  if (authLoading || adminLoading || loadingRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1></div>;

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/,$/, '');
    if (!t) return;
    if (tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagDraft('');
  };

  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const oversized = list.filter((f) => f.size > 10 * 1024 * 1024);
    oversized.forEach((f) => toast.error(`${f.name} exceeds 10MB`));
    const valid = list.filter((f) => f.size <= 10 * 1024 * 1024);
    if (valid.length === 0) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: valid.length });

    // Upload in parallel batches of 4 — fast on mobile, kind to flaky networks
    const BATCH = 4;
    const newUrls: string[] = [];
    for (let i = 0; i < valid.length; i += BATCH) {
      const slice = valid.slice(i, i + BATCH);
      const results = await Promise.all(
        slice.map(async (file) => {
          const ext = file.name.split('.').pop() || 'jpg';
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error } = await supabase.storage
            .from('property-images')
            .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
          if (error) { toast.error(`Upload failed: ${error.message}`); return null; }
          return supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl;
        }),
      );
      const ok = results.filter((u): u is string => !!u);
      newUrls.push(...ok);
      setUploadProgress((p) => ({ ...p, done: p.done + slice.length }));
    }

    setImages((prev) => [...prev, ...newUrls]);
    setUploading(false);
    setUploadProgress({ done: 0, total: 0 });
    if (newUrls.length) toast.success(`${newUrls.length} image(s) uploaded`);
  };

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    if (coverIdx >= images.length - 1) setCoverIdx(0);
  };

  const handleFloorPlanUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const oversized = list.filter((f) => f.size > 10 * 1024 * 1024);
    oversized.forEach((f) => toast.error(`${f.name} exceeds 10MB`));
    const valid = list.filter((f) => f.size <= 10 * 1024 * 1024);
    if (valid.length === 0) return;

    setFloorPlanUploading(true);
    const newEntries: { url: string; label: string }[] = [];
    for (const file of valid) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/floor-plans/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('property-images')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (error) { toast.error(`Upload failed: ${error.message}`); continue; }
      const url = supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl;
      // Guess a sensible default label from the filename (e.g. "ground-floor.jpg" -> "Ground floor")
      const guess = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
      newEntries.push({ url, label: guess ? guess.replace(/\b\w/g, (c) => c.toUpperCase()) : '' });
    }
    setFloorPlans((prev) => [...prev, ...newEntries]);
    setFloorPlanUploading(false);
    if (newEntries.length) toast.success(`${newEntries.length} floor plan(s) uploaded`);
  };

  const removeFloorPlan = (i: number) => setFloorPlans((prev) => prev.filter((_, idx) => idx !== i));
  const setFloorPlanLabel = (i: number, label: string) =>
    setFloorPlans((prev) => prev.map((f, idx) => (idx === i ? { ...f, label } : f)));
  const moveFloorPlan = (i: number, dir: -1 | 1) => {
    setFloorPlans((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const save = async () => {
    const parsed = propertySchema.safeParse(form);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { e[i.path[0] as string] = i.message; });
      setErrors(e);
      toast.error('Please fix the highlighted fields');
      return;
    }
    if (!form.location?.trim() && !form.city?.trim()) {
      setErrors({ city: 'Add a city / area' });
      toast.error('Please add a location (city / area)');
      return;
    }
    setErrors({});
    setSaving(true);
    const v = parsed.data;
    const cover = images[coverIdx] ?? null;
    const size = v.size_value ? `${v.size_value} m²` : null;
    const lot = v.lot_size_value ? `${v.lot_size_value} m²` : null;
    const coveredVer = v.covered_verandas_value ? `${v.covered_verandas_value} m²` : null;
    const extraTags: string[] = [];
    if (v.uncovered_verandas_value) extraTags.push(`uncovered verandas ${v.uncovered_verandas_value} m²`);
    if (v.basement_value) extraTags.push(`basement ${v.basement_value} m²`);
    const allTags = Array.from(new Set([...tags, ...extraTags]));
    const locationLabel =
      form.location?.trim() ||
      [form.city, form.country].filter(Boolean).join(' · ') ||
      '—';

    const payload = {
      listing_type: form.listing_type,
      seller_type: form.seller_type,
      title: v.title,
      location: locationLabel,
      category: v.category,
      status: v.status,
      price: displayPrice,
      price_value: Number(v.price_value),
      description: v.description || null,
      share_title: v.share_title || null,
      share_description: v.share_description || null,
      share_image: v.share_image || null,
      yield: v.yield || null,
      size,
      beds: v.beds,
      baths: v.baths,
      tags: allTags,
      covered_verandas: coveredVer,
      sort_order: Number(v.sort_order ?? 0),
      image_key: v.image_key || 'hero',
      images,
      floor_plans: floorPlans,
      cover_image: cover,
      address_line: v.address_line || null,
      city: v.city || null,
      region: v.region || null,
      postal_code: v.postal_code || null,
      country: v.country || null,
      year_built: v.year_built ? Number(v.year_built) : null,
      lot_size: lot,
      parking_spaces: v.parking_spaces,
      hoa_fees: v.hoa_fees || null,
      furnished: v.furnished || null,
      energy_rating: v.energy_rating || null,
      available_from: v.available_from || null,
      deposit_value: v.deposit_value ? Number(v.deposit_value) : null,
      floor: v.floor ? Number(v.floor) : null,
      total_floors: v.total_floors ? Number(v.total_floors) : null,
      orientation: v.orientation || null,
      pet_friendly: !!form.pet_friendly,
      vat_included: !!form.vat_included,
      heating: v.heating || null,
      cooling: v.cooling || null,
      condition: v.condition || null,
      client_id: form.client_id || null,
    };
    const query = isEdit && editId
      ? supabase.from('properties').update(payload).eq('id', editId).select('reference_code').single()
      : supabase.from('properties').insert(payload).select('reference_code').single();
    const { data: saved, error } = await query;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    const ref = saved?.reference_code;

    // Push to selected ad channels via configured webhook (e.g. Zapier → Facebook Page)
    if (adChannels.length && adWebhookUrl) {
      try {
        await fetch(adWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: isEdit ? 'listing.updated' : 'listing.created',
            channels: adChannels,
            reference_code: ref,
            title: payload.title,
            price: payload.price,
            location: payload.location,
            category: payload.category,
            description: payload.description,
            cover_image: payload.cover_image,
            images: payload.images,
            url: `${window.location.origin}/properties`,
            triggered_at: new Date().toISOString(),
          }),
        });
        toast.success(`Sent to ${adChannels.length} channel${adChannels.length === 1 ? '' : 's'}`);
      } catch (e) {
        toast.error('Could not reach ad-channels webhook');
      }
    }
    if (isEdit) {
      toast.success(ref ? `Listing updated · Ref ${ref}` : 'Listing updated');
    } else {
      toast.success(ref ? `Listing created · Ref ${ref}` : 'Listing created', {
        description: ref ? 'Reference code copied to clipboard' : undefined,
        duration: 6000,
      });
      if (ref && navigator.clipboard) {
        navigator.clipboard.writeText(ref).catch(() => {});
      }
    }
    navigate('/admin/properties');
  };

  const sectionsComplete = {
    basics: !!(form.title && form.category && form.price_value),
    media: images.length > 0,
    address: !!(form.city || form.country),
    specs: !!(form.beds || form.baths || form.size_value),
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin/properties" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{isEdit ? 'Edit listing' : 'New listing'}</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {form.title || 'Untitled property'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/properties"><Button variant="outline" size="sm">Cancel</Button></Link>
            <Button onClick={save} disabled={saving} size="sm">
              {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : (isEdit ? 'Save changes' : 'Create listing')}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-8 py-8 grid lg:grid-cols-[1fr_280px] gap-8 max-w-6xl text-base [&_label]:text-base [&_input]:text-base [&_textarea]:text-base [&_button]:text-base [&_p]:text-base [&_button]:transition-all [&_button]:duration-200 [&_button:not(:disabled):hover]:brightness-95 [&_button:not(:disabled):hover]:-translate-y-px [&_button:not(:disabled):hover]:shadow-sm">
        {/* MAIN COLUMN */}
        <div className="space-y-6">
          {/* Basics */}
          <Section icon={<Building2 size={18} />} title="Basics" subtitle="Headline information shown across the site.">
            <Grid>
              <Field label="Listing type" required full>
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                  {[
                    { value: 'sale', label: 'For sale' },
                    { value: 'rent', label: 'For rent' },
                  ].map((opt) => {
                    const active = form.listing_type === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('listing_type', opt.value)}
                        aria-pressed={active}
                        className={`h-10 rounded-md text-sm font-semibold transition-all ${
                          active
                            ? 'bg-accent text-accent-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Seller type" required full>
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                  {[
                    { value: 'individual', label: 'Individual' },
                    { value: 'developer', label: 'Developer' },
                  ].map((opt) => {
                    const active = form.seller_type === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('seller_type', opt.value)}
                        aria-pressed={active}
                        className={`h-10 rounded-md text-sm font-semibold transition-all ${
                          active
                            ? 'bg-accent text-accent-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {form.seller_type === 'developer' && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Tip: for a single development (e.g. a block of flats), create one listing per unit — same photos, different size/price.
                  </p>
                )}
              </Field>

              <Field label="Title" error={errors.title} required full>
                <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Riverside Vineyard Estate" />
              </Field>

              <Field label="Category" error={errors.category} required>
                <Select value={form.category} onValueChange={(v) => set('category', v)}>
                  <SelectTrigger><SelectValue placeholder="Choose a type…" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(({ value, icon: Icon }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <Icon size={14} className="text-muted-foreground" /> {value}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Status" error={errors.status} required>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(({ value, label, icon: Icon, tone }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <Icon size={12} className={tone} fill="currentColor" /> {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Client" full>
                <Select
                  value={form.client_id || 'none'}
                  onValueChange={(v) => set('client_id', v === 'none' ? '' : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Link a client (optional)…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No client —</SelectItem>
                    {clientOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Link to="/admin/clients" className="underline hover:text-accent">Manage clients →</Link>
                </p>
              </Field>

              {/* Currency + Price as a single composite control */}
              <Field label="Price" error={errors.price_value} required full>
                <div className="flex gap-2">
                  <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="font-medium mr-1">{c.symbol}</span>
                          <span className="text-muted-foreground">{c.code}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.price_value}
                    onChange={(e) => set('price_value', e.target.value)}
                    placeholder="2400000"
                    className="flex-1"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Will display as <span className="font-medium text-foreground">{displayPrice || '—'}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => set('vat_included', !form.vat_included)}
                    className={`px-3 h-9 rounded-full text-xs font-medium border transition-colors ${
                      form.vat_included ? 'bg-accent text-accent-foreground border-accent' : 'bg-background text-foreground border-border hover:border-accent/60'
                    }`}
                  >
                    {form.vat_included ? '✓ ' : '+ '}VAT included in price
                  </button>
                  {(() => {
                    const VAT_REDUCED = 'Reduced VAT (5%)';
                    const active = tags.includes(VAT_REDUCED);
                    return (
                      <button
                        type="button"
                        onClick={() => active ? removeTag(VAT_REDUCED) : addTag(VAT_REDUCED)}
                        className={`px-3 h-9 rounded-full text-xs font-medium border transition-colors ${
                          active ? 'bg-accent text-accent-foreground border-accent' : 'bg-background text-foreground border-border hover:border-accent/60'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}Reduced VAT (5%)
                      </button>
                    );
                  })()}
                  {(() => {
                    const RESALE = 'Resale';
                    const active = tags.includes(RESALE);
                    return (
                      <button
                        type="button"
                        onClick={() => active ? removeTag(RESALE) : addTag(RESALE)}
                        className={`px-3 h-9 rounded-full text-xs font-medium border transition-colors ${
                          active ? 'bg-accent text-accent-foreground border-accent' : 'bg-background text-foreground border-border hover:border-accent/60'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}Resale
                      </button>
                    );
                  })()}
                  {(() => {
                    const VAT = 'VAT';
                    const active = tags.includes(VAT);
                    return (
                      <button
                        type="button"
                        onClick={() => active ? removeTag(VAT) : addTag(VAT)}
                        className={`px-3 h-9 rounded-full text-xs font-medium border transition-colors ${
                          active ? 'bg-accent text-accent-foreground border-accent' : 'bg-background text-foreground border-border hover:border-accent/60'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}VAT
                      </button>
                    );
                  })()}
                </div>
              </Field>

              <Field label="Description" full>
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="About this home — tenure, planning, renovations, comparables…"
                />
                <p className="mt-1 text-xs text-muted-foreground">{form.description.length}/4000</p>
              </Field>

              <Field label="Custom share title (link preview)" full>
                <Input
                  value={form.share_title}
                  onChange={(e) => set('share_title', e.target.value)}
                  placeholder="Leave empty to auto-generate (e.g. 3 Bed 3 Bath Villa For Sale in Limassol (ID:…) - €190,000)"
                />
                <p className="mt-1 text-xs text-muted-foreground">Overrides the auto title shown when this property is shared on Facebook/WhatsApp/etc.</p>
              </Field>

              <Field label="Custom share description (link preview)" full>
                <Textarea
                  rows={2}
                  value={form.share_description}
                  onChange={(e) => set('share_description', e.target.value)}
                  placeholder="Leave empty to auto-generate."
                />
              </Field>

              <Field label="Custom share image URL (link preview)" full>
                <Input
                  value={form.share_image}
                  onChange={(e) => set('share_image', e.target.value)}
                  placeholder="Leave empty to use the cover image. Paste a full https:// image URL."
                />
              </Field>
            </Grid>
          </Section>

          {/* Media */}
          <Section icon={<ImageIcon size={18} />} title="Media" subtitle="Upload photos. The starred image becomes the cover.">
            <label className="block">
              <input
                type="file" accept="image/*" multiple
                onChange={(e) => handleUpload(e.target.files)}
                className="sr-only"
              />
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent/60 hover:bg-accent/5 transition-colors cursor-pointer">
                {uploading ? (
                  <>
                    <Loader2 className="mx-auto animate-spin text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Uploading {uploadProgress.done} / {uploadProgress.total}
                    </p>
                    <p className="text-xs text-muted-foreground">Keep this tab open</p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto text-muted-foreground" size={22} />
                    <p className="mt-2 text-sm font-medium text-foreground">Tap to upload photos</p>
                    <p className="text-xs text-muted-foreground">
                      Pick up to 20+ photos from your library or take new ones · JPG/PNG/WEBP · 10MB each
                    </p>
                  </>
                )}
              </div>
            </label>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((src, i) => (
                  <div key={src} className="relative group rounded-lg overflow-hidden aspect-[4/3] bg-muted">
                    <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    <button
                      type="button" onClick={() => setCoverIdx(i)} aria-label="Set as cover"
                      className={`absolute top-2 left-2 h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                        coverIdx === i ? 'bg-accent text-accent-foreground' : 'bg-background/90 text-foreground opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Star size={13} fill={coverIdx === i ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button" onClick={() => removeImage(i)} aria-label="Remove image"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/90 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={13} />
                    </button>
                    {coverIdx === i && (
                      <span className="absolute bottom-2 left-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-accent text-accent-foreground">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-border">
              <Field label="Fallback image" hint="Used when no upload is provided">
                <Select value={form.image_key} onValueChange={(v) => set('image_key', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {IMAGE_KEYS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          {/* Floor Plans */}
          <Section icon={<Layers size={18} />} title="Floor plans" subtitle="Upload one image per floor. Label each so buyers can tell them apart (e.g. Ground Floor, First Floor, Basement).">
            <label className="block">
              <input
                type="file" accept="image/*" multiple
                onChange={(e) => handleFloorPlanUpload(e.target.files)}
                className="sr-only"
              />
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent/60 hover:bg-accent/5 transition-colors cursor-pointer">
                {floorPlanUploading ? (
                  <>
                    <Loader2 className="mx-auto animate-spin text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">Uploading…</p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto text-muted-foreground" size={22} />
                    <p className="mt-2 text-sm font-medium text-foreground">Tap to upload floor plans</p>
                    <p className="text-xs text-muted-foreground">One image per floor · JPG/PNG/WEBP · 10MB each</p>
                  </>
                )}
              </div>
            </label>

            {floorPlans.length > 0 && (
              <div className="mt-4 space-y-3">
                {floorPlans.map((fp, i) => (
                  <div key={fp.url} className="flex items-center gap-3 border border-border rounded-lg p-2.5 bg-card">
                    <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted">
                      <img src={fp.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    </div>
                    <Input
                      value={fp.label}
                      onChange={(e) => setFloorPlanLabel(i, e.target.value)}
                      placeholder="e.g. Ground Floor"
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button" onClick={() => moveFloorPlan(i, -1)} disabled={i === 0}
                        aria-label="Move up"
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      >↑</button>
                      <button
                        type="button" onClick={() => moveFloorPlan(i, 1)} disabled={i === floorPlans.length - 1}
                        aria-label="Move down"
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      >↓</button>
                      <button
                        type="button" onClick={() => removeFloorPlan(i)} aria-label="Remove floor plan"
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
          <Section icon={<MapPin size={18} />} title="Address" subtitle="Used for map pins and location filtering.">
            <Grid>
              <Field label="District">
                <Select
                  value={form.region}
                  onValueChange={(v) =>
                    setForm((f: any) => ({
                      ...f,
                      region: v,
                      // Clear city, then autofill with the district's main area
                      city: CY_DISTRICTS[v]?.[0] ?? '',
                    }))
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select district…" /></SelectTrigger>
                  <SelectContent>
                    {CY_DISTRICT_NAMES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="City / Area" error={errors.city} hint={!form.region ? 'Pick a district first' : undefined}>
                {form.region && CY_DISTRICTS[form.region] ? (
                  <Select value={form.city} onValueChange={(v) => set('city', v)}>
                    <SelectTrigger><SelectValue placeholder="Select area…" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {CY_DISTRICTS[form.region].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      <SelectItem value="__other__">Other / type below</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Limassol" />
                )}
                {form.city === '__other__' && (
                  <Input
                    className="mt-2"
                    autoFocus
                    placeholder="Type area name…"
                    onChange={(e) => set('city', e.target.value)}
                  />
                )}
              </Field>

            </Grid>
          </Section>

          {/* Specs */}
          <Section icon={<Ruler size={18} />} title="Specs & financials" subtitle="Quick-glance facts surfaced on the property page.">
            <Grid>
              <Field label={form.category === 'Land / Plot' ? 'Building density' : 'Beds'}>
                {form.category === 'Land / Plot' ? (
                  <Input
                    type="number" min={0}
                    value={form.beds}
                    onChange={(e) => set('beds', e.target.value)}
                    placeholder="0"
                  />
                ) : (
                  <Stepper value={Number(form.beds) || 0} onChange={(n) => set('beds', n)} max={50} />
                )}
              </Field>
              <Field label={form.category === 'Land / Plot' ? 'Cover factor' : 'Baths'}>
                {form.category === 'Land / Plot' ? (
                  <Input type="number" min={0} value={form.baths} onChange={(e) => set('baths', e.target.value)} placeholder="0" />
                ) : (
                  <Stepper value={Number(form.baths) || 0} onChange={(n) => set('baths', n)} max={50} />
                )}
              </Field>
              <Field label="Parking spaces">
                <Input
                  type="number" min={0}
                  value={form.parking_spaces}
                  onChange={(e) => set('parking_spaces', e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Year built">
                <Select value={form.year_built} onValueChange={(v) => set('year_built', v)}>
                  <SelectTrigger><SelectValue placeholder="Select year…" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Interior size" hint="m²">
                <Input
                  type="number" min={0}
                  value={form.size_value}
                  onChange={(e) => set('size_value', e.target.value)}
                  placeholder="320"
                />
              </Field>
              <Field label="Plot size" hint="m²">
                <Input
                  type="number" min={0}
                  value={form.lot_size_value}
                  onChange={(e) => set('lot_size_value', e.target.value)}
                  placeholder="1200"
                />
              </Field>

              {form.category !== 'Land / Plot' && (
                <Field label="Covered veranda" hint="m²">
                  <Input
                    type="number" min={0}
                    value={form.covered_verandas_value}
                    onChange={(e) => set('covered_verandas_value', e.target.value)}
                    placeholder="e.g. 18"
                  />
                </Field>
              )}
              {form.category !== 'Land / Plot' && (
                <Field label="Uncovered veranda" hint="m²">
                  <Input
                    type="number" min={0}
                    value={form.uncovered_verandas_value}
                    onChange={(e) => set('uncovered_verandas_value', e.target.value)}
                    placeholder="e.g. 25"
                  />
                </Field>
              )}
              <Field label="Basement" hint="m²">
                <Input
                  type="number" min={0}
                  value={form.basement_value}
                  onChange={(e) => set('basement_value', e.target.value)}
                  placeholder="e.g. 40"
                />
              </Field>

              <Field label="HOA fees" hint='e.g. "€280/mo"'>
                <Input value={form.hoa_fees} onChange={(e) => set('hoa_fees', e.target.value)} />
              </Field>
              <Field label="Yield" hint='e.g. "5.4%"'>
                <Input value={form.yield} onChange={(e) => set('yield', e.target.value)} />
              </Field>
            </Grid>
          </Section>

          {/* Property details */}
          <Section icon={<HomeIcon size={18} />} title="Property details" subtitle="Extra information buyers and tenants typically ask for.">
            <Grid>
              <Field label="Condition">
                <Select value={form.condition} onValueChange={(v) => set('condition', v)}>
                  <SelectTrigger><SelectValue placeholder="Select condition…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New build">New build</SelectItem>
                    <SelectItem value="Off-plan">Off-plan</SelectItem>
                    <SelectItem value="Resale">Resale</SelectItem>
                    <SelectItem value="Renovated">Renovated</SelectItem>
                    <SelectItem value="Needs renovation">Needs renovation</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Furnished">
                <Select value={form.furnished} onValueChange={(v) => set('furnished', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Furnished">Furnished</SelectItem>
                    <SelectItem value="Partly furnished">Partly furnished</SelectItem>
                    <SelectItem value="Unfurnished">Unfurnished</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Energy rating" hint="EPC class A–C">
                <Select value={form.energy_rating} onValueChange={(v) => set('energy_rating', v)}>
                  <SelectTrigger><SelectValue placeholder="Select rating…" /></SelectTrigger>
                  <SelectContent>
                    {['A','B','C'].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Orientation">
                <Select value={form.orientation} onValueChange={(v) => set('orientation', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {['North','South','East','West','North-East','North-West','South-East','South-West'].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Floor">
                <Input
                  type="number" min={0} max={200}
                  value={form.floor}
                  onChange={(e) => set('floor', e.target.value)}
                  placeholder="e.g. 3"
                />
              </Field>
              <Field label="Total floors in building">
                <Input
                  type="number" min={0} max={200}
                  value={form.total_floors}
                  onChange={(e) => set('total_floors', e.target.value)}
                  placeholder="e.g. 8"
                />
              </Field>

              <Field label="Heating">
                <Select value={form.heating} onValueChange={(v) => set('heating', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {['Central','Underfloor','Diesel','Gas','Electric','Heat pump','Fireplace','None'].map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cooling">
                <Select value={form.cooling} onValueChange={(v) => set('cooling', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {['A/C throughout','A/C in some rooms','Provision for A/C','Ceiling fans','VRV - Central','None'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Available from">
                <Input
                  type="date"
                  value={form.available_from}
                  onChange={(e) => set('available_from', e.target.value)}
                />
              </Field>
              {form.listing_type === 'rent' && (
                <Field label="Deposit" hint="Refundable, in same currency">
                  <Input
                    type="number" min={0}
                    value={form.deposit_value}
                    onChange={(e) => set('deposit_value', e.target.value)}
                    placeholder="e.g. 2000"
                  />
                </Field>
              )}
            </Grid>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => set('pet_friendly', !form.pet_friendly)}
                className={`px-3 h-9 rounded-full text-xs font-medium border transition-colors ${
                  form.pet_friendly ? 'bg-accent text-accent-foreground border-accent' : 'bg-background text-foreground border-border hover:border-accent/60'
                }`}
              >
                {form.pet_friendly ? '✓ ' : '+ '}Pet friendly
              </button>
            </div>
          </Section>

          {/* Features */}
          <Section icon={<TagIcon size={18} />} title="Features" subtitle="Search and pick from the list, or type a custom tag.">
            <Field label="Add features">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-10 px-3 flex items-center justify-between rounded-md border border-input bg-background text-sm text-foreground hover:border-accent/60 transition-colors"
                  >
                    <span className="text-muted-foreground">
                      {tags.length ? `${tags.length} feature${tags.length === 1 ? '' : 's'} selected` : 'Search features…'}
                    </span>
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[320px]" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or type custom…"
                      value={tagDraft}
                      onValueChange={setTagDraft}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagDraft.trim() && !sortedTags.some((t) => t.toLowerCase() === tagDraft.trim().toLowerCase())) {
                          e.preventDefault();
                          addTag(tagDraft);
                          setTagDraft('');
                        }
                      }}
                    />
                    <CommandList className="max-h-72">
                      <CommandEmpty>
                        {tagDraft.trim() ? (
                          <button
                            type="button"
                            onClick={() => { addTag(tagDraft); setTagDraft(''); }}
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded"
                          >
                            + Add "{tagDraft.trim()}"
                          </button>
                        ) : 'No features found.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {sortedTags.map((t) => {
                          const active = tags.includes(t);
                          return (
                            <CommandItem
                              key={t}
                              value={t}
                              onSelect={() => (active ? removeTag(t) : addTag(t))}
                            >
                              <Check size={14} className={`mr-2 ${active ? 'opacity-100' : 'opacity-0'}`} />
                              {t}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </Field>

            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[...tags].sort((a, b) => a.localeCompare(b)).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} aria-label={`Remove ${t}`} className="hover:text-foreground">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-border">
              <Field label="Sort order" hint="Lower numbers appear first">
                <Stepper value={Number(form.sort_order) || 0} onChange={(n) => set('sort_order', n)} max={9999} />
              </Field>
            </div>
          </Section>

          {/* Ad Channels */}
          <Section
            icon={<Share2 size={18} />}
            title="Ad channels"
            subtitle="Pick where this listing should be auto-posted when you save."
          >
            <div className="grid sm:grid-cols-3 gap-3">
              {AD_CHANNELS.map((c) => {
                const active = adChannels.includes(c.id);
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChannel(c.id)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                      active
                        ? 'border-accent bg-accent/10 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-accent/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={18} style={{ color: active ? c.color : undefined }} />
                      <span className="text-sm font-medium">{c.label}</span>
                    </span>
                    {active && <Check size={16} className="text-accent" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <Field
                label="Posting webhook URL"
                hint="Paste a Zapier (or Make.com) webhook that posts to your Facebook Page. Saved locally."
              >
                <Input
                  type="url"
                  value={adWebhookUrl}
                  onChange={(e) => setAdWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
              </Field>
              {!adWebhookUrl && adChannels.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Add a webhook URL to enable auto-posting. Without it, your channel selection is saved but nothing is published.
                </p>
              )}
            </div>
          </Section>
        </div>


        {/* SIDEBAR — Progress */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Completion</p>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ['Basics', sectionsComplete.basics],
                ['Media', sectionsComplete.media],
                ['Address', sectionsComplete.address],
                ['Specs', sectionsComplete.specs],
              ].map(([label, done]) => (
                <li key={label as string} className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    className={done ? 'text-accent' : 'text-muted-foreground/40'}
                    fill={done ? 'currentColor' : 'none'}
                  />
                  <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 pt-5 border-t border-border text-xs text-muted-foreground">
              Drafts are not auto-saved. Click <span className="text-foreground font-medium">Create listing</span> when ready.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------- Tiny presentational helpers ----------
const Section = ({
  icon, title, subtitle, children,
}: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-border bg-card p-6">
    <div className="flex items-start gap-3 pb-5 border-b border-border">
      <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-muted-foreground mt-0.5 text-base">{subtitle}</p>}
      </div>
    </div>
    <div className="pt-5">{children}</div>
  </section>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
);

const Field = ({
  label, hint, error, required, full, children,
}: { label: string; hint?: string; error?: string; required?: boolean; full?: boolean; children: React.ReactNode }) => (
  <div className={full ? 'sm:col-span-2' : ''}>
    <Label className="text-base font-medium text-foreground">
      {label} {required && <span className="text-accent">*</span>}
    </Label>
    <div className="mt-1.5">{children}</div>
    {error ? (
      <p className="mt-1 text-sm text-destructive">{error}</p>
    ) : hint ? (
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    ) : null}
  </div>
);

const Stepper = ({
  value, onChange, max = 99,
}: { value: number; onChange: (n: number) => void; max?: number }) => (
  <div className="flex items-center gap-2">
    <Button
      type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0"
      onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} aria-label="Decrease"
    >
      <Minus size={14} />
    </Button>
    <Input
      type="number" min="0" max={max}
      value={value}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isNaN(n)) return;
        onChange(Math.max(0, Math.min(max, n)));
      }}
      className="text-center"
    />
    <Button
      type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0"
      onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase"
    >
      <Plus size={14} />
    </Button>
  </div>
);

const UnitInput = ({
  value, onChange, unit, onUnitChange, units, placeholder,
}: {
  value: string; onChange: (v: string) => void;
  unit: string; onUnitChange: (u: string) => void;
  units: string[]; placeholder?: string;
}) => (
  <div className="flex gap-2">
    <Input
      type="number" inputMode="decimal" min="0"
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} className="flex-1"
    />
    <Select value={unit} onValueChange={onUnitChange}>
      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
      <SelectContent>
        {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);
