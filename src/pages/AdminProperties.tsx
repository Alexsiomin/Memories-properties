import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Property {
  id: string;
  title: string;
  location: string;
  category: string;
  status: string;
  price: string;
  price_value: number;
  yield: string | null;
  size: string | null;
  beds: number | null;
  baths: number | null;
  tags: string[];
  sort_order: number;
  image_key: string;
  cover_image: string | null;
  created_at: string;
  developer_id: string | null;
}

const empty = {
  title: '', location: '', category: '', status: '', price: '',
  price_value: 0, yield: '', size: '', beds: 0, baths: 0,
  tags: '', sort_order: 0, image_key: '',
};

export default function AdminProperties() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [properties, setProperties] = useState<Property[]>([]);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importXml, setImportXml] = useState<string>('');
  const [excludedIdx, setExcludedIdx] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [developers, setDevelopers] = useState<{ id: string; name: string; xml_url: string | null }[]>([]);
  const [developerId, setDeveloperId] = useState<string>('');
  const [showNewDev, setShowNewDev] = useState(false);
  const [newDev, setNewDev] = useState({ name: '', xml_url: '', notes: '' });
  const [savingDev, setSavingDev] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price-high' | 'price-low' | 'developer'>('newest');

  const loadDevelopers = async () => {
    const { data } = await supabase.from('developers').select('id,name,xml_url').order('name');
    setDevelopers(data || []);
  };

  const createDeveloper = async () => {
    if (!newDev.name.trim()) { toast.error('Developer name is required'); return; }
    setSavingDev(true);
    const { data, error } = await supabase
      .from('developers')
      .insert({ name: newDev.name.trim(), xml_url: newDev.xml_url.trim() || null, notes: newDev.notes.trim() || null })
      .select('id,name,xml_url')
      .single();
    setSavingDev(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Added ${data.name}`);
    setDevelopers((d) => [...d, data].sort((a, b) => a.name.localeCompare(b.name)));
    setDeveloperId(data.id);
    if (data.xml_url) setImportXml(data.xml_url);
    setNewDev({ name: '', xml_url: '', notes: '' });
    setShowNewDev(false);
  };

  const onSelectDeveloper = (id: string) => {
    setDeveloperId(id);
    const dev = developers.find((d) => d.id === id);
    if (dev?.xml_url) setImportXml(dev.xml_url);
  };

  const toggleSel = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () =>
    setSelected((s) => s.size === properties.length ? new Set() : new Set(properties.map(p => p.id)));

  const bulkDelete = async (ids: string[], label: string) => {
    if (!ids.length) { toast.info('Nothing to delete'); return; }
    if (!confirm(`Delete ${ids.length} ${label}? This cannot be undone.`)) return;
    const { error } = await supabase.from('properties').delete().in('id', ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`Deleted ${ids.length} ${label}`);
    setSelected(new Set());
    load();
  };

  const deleteDemo = () => {
    const ids = properties.filter(p => !p.cover_image).map(p => p.id);
    bulkDelete(ids, 'demo properties');
  };
  const deleteSelected = () => bulkDelete(Array.from(selected), 'selected');

  const load = async () => {
    const { data } = await supabase.from('properties').select('*').order('sort_order');
    setProperties((data as Property[]) || []);
  };

  useEffect(() => { if (isAdmin) { load(); loadDevelopers(); } }, [isAdmin]);

  if (authLoading || adminLoading) return <div className="container mx-auto px-6 py-24">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1><p className="mt-4">You need admin access.</p></div>;

  const startEdit = (p: Property) => {
    setEditing(p);
    setForm({ ...p, tags: (p.tags || []).join(', '), yield: p.yield || '', size: p.size || '', beds: p.beds || 0, baths: p.baths || 0 });
  };
  const startNew = () => { setEditing(null); setForm(empty); };

  const save = async () => {
    setSaving(true);
    const payload = {
      title: form.title, location: form.location, category: form.category,
      status: form.status, price: form.price, price_value: Number(form.price_value),
      yield: form.yield || null, size: form.size || null,
      beds: form.beds ? Number(form.beds) : null, baths: form.baths ? Number(form.baths) : null,
      tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      sort_order: Number(form.sort_order), image_key: form.image_key,
    };
    const { error } = editing
      ? await supabase.from('properties').update(payload).eq('id', editing.id)
      : await supabase.from('properties').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? 'Updated' : 'Created');
    startNew();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this property?')) return;
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Deleted');
    if (editing?.id === id) startNew();
    load();
  };

  const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<properties>
  <property>
    <title>Sample Villa</title>
    <location>Marbella · Spain</location>
    <category>Villa</category>
    <status>For sale</status>
    <price>€2,500,000</price>
    <price_value>2500000</price_value>
    <yield></yield>
    <size>320 m²</size>
    <beds>4</beds>
    <baths>3</baths>
    <tags>sea-view,pool,new</tags>
    <sort_order>0</sort_order>
    <image_key>marbella-villa</image_key>
    <description>Beautiful villa with sea views.</description>
  </property>
</properties>`;

  const parseXml = (xmlText: string) => {
    const cleanedXml = xmlText.trim().replace(/^\uFEFF/, '');

    // Strip XML2U feed-style boilerplate from titles like
    // "2 Bedrooms - Apartment - Pafos - For Sale - A103Cirvis"
    // and convert to a cleaner human title using the project name (e.g. "Cirvis Apartment").
    const cleanTitle = (_raw: string, type: string, location: string, _ref: string) => {
      const t = type?.trim();
      const loc = location?.trim();
      if (t && loc) return `${t} in ${loc}`;
      if (t) return t;
      if (loc) return `Property in ${loc}`;
      return 'Property';
    };

    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanedXml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Invalid XML');

    // Case-insensitive tag search (handles <Property> vs <property>)
    const txt = (el: Element | null | undefined, tag: string) => {
      if (!el) return '';
      const found = Array.from(el.getElementsByTagName('*')).find(
        (n) => n.tagName.toLowerCase() === tag.toLowerCase() && n.parentElement === el
      );
      return found?.textContent?.trim() ?? '';
    };
    const deepTxt = (el: Element | null | undefined, tag: string) => {
      if (!el) return '';
      const found = Array.from(el.getElementsByTagName('*')).find(
        (n) => n.tagName.toLowerCase() === tag.toLowerCase()
      );
      return found?.textContent?.trim() ?? '';
    };
    const findChild = (el: Element | null | undefined, tag: string): Element | null => {
      if (!el) return null;
      return (
        Array.from(el.children).find((n) => n.tagName.toLowerCase() === tag.toLowerCase()) ?? null
      );
    };

    // Find all property nodes (works for both <property> and <Property>)
    const nodes = Array.from(doc.getElementsByTagName('*')).filter(
      (n) => n.tagName.toLowerCase() === 'property'
    );
    if (!nodes.length) throw new Error('No <Property> entries found in XML');

    return nodes.map((el) => {
      // Try simple flat format first
      const flatTitle = txt(el, 'title');
      const flatLocation = txt(el, 'location');

      if (flatTitle && flatLocation) {
        const tagsRaw = txt(el, 'tags');
        return {
          title: flatTitle,
          location: flatLocation,
          category: txt(el, 'category'),
          status: txt(el, 'status'),
          price: txt(el, 'price'),
          price_value: Number(txt(el, 'price_value') || 0),
          yield: txt(el, 'yield') || null,
          size: txt(el, 'size') || null,
          beds: txt(el, 'beds') ? Number(txt(el, 'beds')) : null,
          baths: txt(el, 'baths') ? Number(txt(el, 'baths')) : null,
          tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [],
          sort_order: Number(txt(el, 'sort_order') || 0),
          image_key: txt(el, 'image_key'),
          description: txt(el, 'description') || null,
          images: [],
          cover_image: '',
        };
      }

      // XML2U-style nested format
      const addr = findChild(el, 'Address');
      const priceEl = findChild(el, 'Price');
      const desc = findChild(el, 'Description');
      const imagesEl = findChild(el, 'images');

      const locParts = [
        txt(addr, 'location'),
        txt(addr, 'region'),
        txt(addr, 'country'),
      ].filter(Boolean);
      const location = locParts.join(' · ');

      const priceNum = Number(txt(priceEl, 'price') || 0);
      const currency = txt(priceEl, 'currency') || 'EUR';
      const priceDisplay = priceNum
        ? `${currency === 'EUR' ? '€' : currency + ' '}${priceNum.toLocaleString()}`
        : '';

      const beds = txt(desc, 'bedrooms');
      const baths = txt(desc, 'fullBathrooms');
      const floorSize = deepTxt(findChild(desc, 'FloorSize'), 'floorSize');
      const sizeUnit = deepTxt(findChild(desc, 'FloorSize'), 'floorSizeUnits') || 'm²';
      const propertyType = txt(desc, 'propertyType');
      const status = txt(priceEl, 'status') || txt(el, 'category');
      const ref = txt(priceEl, 'reference') || txt(el, 'propertyid');

      // Description (with CDATA inside <en>)
      let descText = '';
      const descNode = findChild(desc, 'description');
      if (descNode) {
        const en = findChild(descNode, 'en');
        descText = (en?.textContent || descNode.textContent || '').trim();
      }
      if (!descText) descText = txt(desc, 'shortDescription');

      // Images
      const imageUrls: string[] = [];
      if (imagesEl) {
        Array.from(imagesEl.children).forEach((imgWrap) => {
          const innerImg = findChild(imgWrap, 'image');
          let url = innerImg?.textContent?.trim() || '';
          if (url && url.startsWith('//')) url = 'https:' + url;
          if (url) imageUrls.push(url);
        });
      }

      return {
        title: cleanTitle(txt(desc, 'title'), propertyType, txt(addr, 'location'), ref),
        location,
        category: propertyType || txt(el, 'category'),
        status: status || 'For sale',
        price: priceDisplay,
        price_value: priceNum,
        yield: null,
        size: floorSize ? `${floorSize} ${sizeUnit}` : null,
        beds: beds ? Number(beds) : null,
        baths: baths ? Number(baths) : null,
        tags: [],
        sort_order: 0,
        image_key: ref || '',
        description: descText || null,
        images: imageUrls,
        cover_image: imageUrls[0] || '',
        latitude: txt(addr, 'latitude') ? Number(txt(addr, 'latitude')) : null,
        longitude: txt(addr, 'longitude') ? Number(txt(addr, 'longitude')) : null,
        city: txt(addr, 'location') || null,
        region: txt(addr, 'region') || null,
        country: txt(addr, 'country') || null,
        reference_code: ref || null,
      };
    });
  };

  const parseImportInput = async (value: string) => {
    const input = value.trim();
    if (!input) throw new Error('Paste XML or an XML feed URL first');

    if (/^https?:\/\//i.test(input)) {
      const { data, error } = await supabase.functions.invoke('fetch-xml', {
        body: { url: input },
      });
      if (error) throw new Error(error.message || 'Failed to load XML URL');
      if (!data?.xml) throw new Error(data?.error || 'Failed to load XML URL');
      setImportXml(data.xml);
      return parseXml(data.xml);
    }

    return parseXml(input);
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      setImportXml(text);
      const rows = parseXml(text);
      setImportPreview(rows);
      toast.success(`Parsed ${rows.length} propert${rows.length === 1 ? 'y' : 'ies'}`);
    } catch (e: any) {
      setImportPreview(null);
      toast.error(e.message || 'Failed to parse XML');
    }
  };

  const confirmImport = async (rows?: any[]) => {
    const toInsert = rows ?? importPreview;
    if (!toInsert?.length) return;
    setImporting(true);
    const stamped = developerId ? toInsert.map((r) => ({ ...r, developer_id: developerId })) : toInsert;
    const { error } = await supabase.from('properties').insert(stamped);
    setImporting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Imported ${toInsert.length} propert${toInsert.length === 1 ? 'y' : 'ies'}`);
    setImportPreview(null);
    setImportXml('');
    setExcludedIdx(new Set());
    load();
  };

  // Re-fetch each developer's XML feed and sync existing listings:
  // - update status / price for listings still in the feed (e.g. now "Sold")
  // - insert new listings that appeared in the feed
  // - mark listings that vanished from the feed as "Sold"
  const refreshFromDevelopers = async () => {
    const devs = developers.filter((d) => d.xml_url && d.xml_url.trim());
    if (!devs.length) {
      toast.info('No developers with an XML feed URL to refresh from');
      return;
    }
    setRefreshing(true);
    let updated = 0, inserted = 0, soldOut = 0, feedErrors = 0;

    for (const dev of devs) {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-xml', {
          body: { url: dev.xml_url },
        });
        if (error || !data?.xml) throw new Error(error?.message || data?.error || 'Feed unavailable');

        const rows = parseXml(data.xml).filter((r: any) => r.reference_code);

        // Existing listings for this developer
        const { data: existing } = await supabase
          .from('properties')
          .select('id, reference_code, status, price, price_value')
          .eq('developer_id', dev.id);
        const existingByRef = new Map(
          (existing || [])
            .filter((p: any) => p.reference_code)
            .map((p: any) => [p.reference_code, p])
        );

        const feedRefs = new Set<string>();
        for (const row of rows) {
          feedRefs.add(row.reference_code);
          const match = existingByRef.get(row.reference_code) as any;
          if (match) {
            const changed =
              (row.status && row.status !== match.status) ||
              (row.price && row.price !== match.price) ||
              (row.price_value && row.price_value !== match.price_value);
            if (changed) {
              const { error: upErr } = await supabase
                .from('properties')
                .update({ status: row.status || match.status, price: row.price || match.price, price_value: row.price_value || match.price_value })
                .eq('id', match.id);
              if (!upErr) updated++;
            }
          } else {
            const { error: insErr } = await supabase
              .from('properties')
              .insert({ ...row, developer_id: dev.id });
            if (!insErr) inserted++;
          }
        }

        // Listings no longer present in the feed -> mark as Sold
        for (const [ref, p] of existingByRef) {
          if (!feedRefs.has(ref as string) && (p as any).status !== 'Sold') {
            const { error: soldErr } = await supabase
              .from('properties')
              .update({ status: 'Sold' })
              .eq('id', (p as any).id);
            if (!soldErr) soldOut++;
          }
        }
      } catch (e: any) {
        feedErrors++;
        toast.error(`${dev.name}: ${e.message || 'refresh failed'}`);
      }
    }

    setRefreshing(false);
    toast.success(`Refresh complete — ${updated} updated, ${inserted} new, ${soldOut} marked sold`);
    load();
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_XML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'properties-sample.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-6 py-16 max-w-7xl">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl">Manage properties</h1>
        <div className="flex gap-3">
          <Link to="/admin"><Button variant="outline">Back to dashboard</Button></Link>
          <Link to="/admin/projects/new"><Button variant="outline">+ Add project (bulk)</Button></Link>
          <Button variant="outline" onClick={refreshFromDevelopers} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : '↻ Refresh from developers'}
          </Button>
          <Link to="/admin/properties/new"><Button>+ Add listing</Button></Link>
        </div>
      </div>


      <div>
        <div className="mb-4 flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, title, location, category, or ID…"
            className="flex-1 h-11 px-4 rounded-md border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[220px] h-11">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest listing</SelectItem>
              <SelectItem value="price-high">Price High to Low</SelectItem>
              <SelectItem value="price-low">Lowest Price</SelectItem>
              <SelectItem value="developer">Developer Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          {(() => {
            const q = search.trim().toLowerCase();
            const filtered = (q
              ? properties.filter((p) =>
                  [(p as any).reference_code, p.title, p.location, (p as any).category, p.id]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q))
                )
              : [...properties]
            ).sort((a, b) => {
              switch (sortBy) {
                case 'newest':
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'price-high':
                  return (b.price_value || 0) - (a.price_value || 0);
                case 'price-low':
                  return (a.price_value || 0) - (b.price_value || 0);
                case 'developer': {
                  const devA = developers.find((d) => d.id === a.developer_id)?.name || '';
                  const devB = developers.find((d) => d.id === b.developer_id)?.name || '';
                  return devA.localeCompare(devB);
                }
                default:
                  return 0;
              }
            });
            return (
              <>
          <div className="border p-3 flex flex-wrap items-center gap-2 bg-muted/30 text-base">
            <label className="flex items-center gap-2 mr-auto text-lg">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleAll}
              />
              Select all ({filtered.length})
            </label>
            <Button size="sm" variant="outline" onClick={deleteDemo}>
              Delete demo (no image) — {properties.filter(p => !p.cover_image).length}
            </Button>
            <Button size="sm" variant="destructive" onClick={deleteSelected} disabled={!selected.size}>
              Delete selected ({selected.size})
            </Button>
          </div>
          {filtered.map((p) => (
            <div key={p.id} className="border p-4 flex justify-between items-start gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(p.id)}
                  onChange={() => toggleSel(p.id)}
                />
                {p.cover_image ? (
                  <img
                    src={p.cover_image}
                    alt={p.title}
                    loading="lazy"
                    className="w-20 h-16 object-cover rounded-md border border-foreground/10 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-16 rounded-md border border-dashed border-foreground/20 bg-muted/30 shrink-0 flex items-center justify-center text-[10px] text-muted-foreground">
                    no image
                  </div>
                )}
                <div className="min-w-0 flex-1 text-lg">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-muted-foreground truncate text-base">
                    {p.location} · {p.price}
                    {!p.cover_image && <span className="text-destructive"> · demo</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-lg">
                    {p.category && <span>{p.category}</span>}
                    {p.status && <span>· {p.status}</span>}
                    {p.beds != null && p.beds > 0 && <span>· {p.beds} bed{p.beds === 1 ? '' : 's'}</span>}
                    {p.baths != null && p.baths > 0 && <span>· {p.baths} bath{p.baths === 1 ? '' : 's'}</span>}
                    {p.size && <span>· {p.size}</span>}
                    {p.yield && <span>· yield {p.yield}</span>}
                    {typeof p.sort_order === 'number' && <span>· #{p.sort_order}</span>}
                  </div>
                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.tags.slice(0, 6).map((t) => (
                        <span key={t} className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-foreground/10">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 font-mono text-muted-foreground/70 truncate text-lg">{(p as any).reference_code || p.id}</div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link to={`/admin/properties/${p.id}/edit`}>
                  <Button size="sm" variant="outline">Edit</Button>
                </Link>
                <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>Delete</Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground">No properties found.</p>}
              </>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
