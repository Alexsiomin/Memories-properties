import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface Insight {
  id: string;
  section: string;
  label: string | null;
  value: string | null;
  sub: string | null;
  numeric_value: number | null;
  category: string | null;
  sort_order: number;
  is_active: boolean;
}

type CellValue = string | number | boolean | Date | null | undefined;

const SECTIONS: { key: string; title: string }[] = [
  { key: 'selectivity', title: 'Paphos — Sold Resale Houses By High to Low' },
  { key: 'top_apartments', title: 'Paphos — Most expensive Resale Apartments' },
  { key: 'top_plots', title: 'Paphos — Most expensive plots' },
  { key: 'top_new_developments', title: 'Paphos — Top 33 Contact of Sale Transactions' },
  { key: 'selectivity_limassol', title: 'Limassol — Sold Resale Houses By High to Low' },
  { key: 'top_apartments_limassol', title: 'Limassol — Most expensive Resale Apartments' },
  { key: 'top_plots_limassol', title: 'Limassol — Most expensive plots' },
  { key: 'top_new_developments_limassol', title: 'Limassol — Top Contact of Sale Transactions' },
];

function SectionPanel({ sectionKey, title }: { sectionKey: string; title: string }) {
  const [rows, setRows] = useState<Insight[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Insight>>({});

  const load = async () => {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('section', sectionKey)
      .order('sort_order');
    if (error) {
      toast.error('Failed to load');
      return;
    }
    setRows((data as Insight[]) || []);
  };

  useEffect(() => {
    load();
  }, [sectionKey]);

  const startEdit = (row: Insight) => {
    setEditingId(row.id);
    setEditForm({
      value: row.value,
      sub: row.sub,
      numeric_value: row.numeric_value,
      category: row.category,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase
      .from('insights')
      .update({
        value: editForm.value?.trim() || null,
        sub: editForm.sub?.trim() || null,
        numeric_value: editForm.numeric_value ?? null,
        category: editForm.category?.trim() || null,
      })
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Updated');
    setEditingId(null);
    setEditForm({});
    load();
  };

  const importFile = async (file: File, replace: boolean) => {
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const sheetRows = XLSX.utils.sheet_to_json<CellValue[]>(ws, { header: 1, defval: '', raw: false });
      const nonEmptyRows = sheetRows.filter((row) => row.some((cell) => String(cell).trim() !== ''));
      if (!nonEmptyRows.length) {
        toast.error('File is empty');
        return;
      }
      const norm = (s: CellValue) => String(s ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const headerType = (value: CellValue) => {
        const key = norm(value);
        if (!key) return null;
        if (['city', 'town', 'towncity', 'location', 'area', 'municipality', 'region', 'place'].some((alias) => key === alias || key.includes(alias))) return 'city';
        if (['type', 'propertytype', 'property', 'assettype', 'developmenttype'].some((alias) => key === alias || key.includes(alias))) return 'type';
        if (['price', 'priceeur', 'pricem', 'saleprice', 'salesprice', 'soldprice', 'amount', 'value', 'consideration'].some((alias) => key === alias || key.includes(alias))) return 'price';
        if (['date', 'saledate', 'solddate', 'quarter', 'period', 'year'].some((alias) => key === alias || key.includes(alias))) return 'date';
        return null;
      };
      const parsePrice = (value: CellValue) => {
        const text = String(value ?? '').trim();
        if (!text) return null;
        let clean = text.replace(/\((.*)\)/, '-$1').replace(/[^0-9.,-]/g, '');
        if (!clean || clean === '-') return null;
        const commas = (clean.match(/,/g) || []).length;
        const dots = (clean.match(/\./g) || []).length;
        if (commas && dots) {
          clean = clean.lastIndexOf(',') > clean.lastIndexOf('.')
            ? clean.replace(/\./g, '').replace(',', '.')
            : clean.replace(/,/g, '');
        } else if (commas > 1) {
          clean = clean.replace(/,/g, '');
        } else if (dots > 1) {
          clean = clean.replace(/\./g, '');
        } else if (commas === 1) {
          clean = clean.replace(',', '.');
        }
        const parsed = Number(clean);
        if (!Number.isFinite(parsed)) return null;
        return Math.abs(parsed) > 1000 ? parsed / 1_000_000 : parsed;
      };
      const headerIndex = nonEmptyRows.reduce((best, row, idx) => {
        const score = row.reduce<number>((sum, cell) => sum + (headerType(cell) ? 1 : 0), 0);
        return score > best.score ? { index: idx, score } : best;
      }, { index: 0, score: 0 });
      const headers = headerIndex.score > 0 ? nonEmptyRows[headerIndex.index] : ['city', 'type', 'price', 'date'];
      const columnMap = headers.reduce<Record<string, number>>((acc, header, index) => {
        const type = headerType(header);
        if (type && acc[type] == null) acc[type] = index;
        return acc;
      }, {});
      const pick = (row: CellValue[], key: string) => {
        const index = columnMap[key];
        return index == null ? '' : row[index];
      };
      const dataRows = headerIndex.score > 0 ? nonEmptyRows.slice(headerIndex.index + 1) : nonEmptyRows;
      const rowsToInsert = dataRows.map((r, i) => {
        const priceNum = parsePrice(pick(r, 'price'));
        return {
          section: sectionKey,
          label: null,
          value: String(pick(r, 'city')).trim() || null,
          sub: String(pick(r, 'type')).trim() || null,
          numeric_value: priceNum,
          category: String(pick(r, 'date')).trim() || null,
          sort_order: i + 1,
          is_active: true,
        };
      }).filter((r) => r.value || r.sub || r.numeric_value != null || r.category);
      if (!rowsToInsert.length) {
        toast.error('No valid rows. Expected columns: City, Type, Price, Date');
        return;
      }
      if (replace) {
        const { error: delErr } = await supabase.from('insights').delete().eq('section', sectionKey);
        if (delErr) { toast.error(delErr.message); return; }
      }
      const { error } = await supabase.from('insights').insert(rowsToInsert);
      if (error) { toast.error(error.message); return; }
      toast.success(`Imported ${rowsToInsert.length} row${rowsToInsert.length === 1 ? '' : 's'}`);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to parse file');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this row?')) return;
    const { error } = await supabase.from('insights').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const clearAll = async () => {
    if (!confirm(`Delete ALL rows in "${title}"?`)) return;
    const { error } = await supabase.from('insights').delete().eq('section', sectionKey);
    if (error) { toast.error(error.message); return; }
    toast.success('Cleared');
    load();
  };

  return (
    <section className="mt-10">
      <h2 className="text-2xl mb-3">{title}</h2>
      <div className="border border-[hsl(212_100%_10%)]/15 rounded-lg p-5 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[hsl(212_100%_10%)]/70">
            Expected columns: <strong>City, Type, Price, Date</strong>
          </div>
          <div className="flex items-center gap-2">
            <label className={`inline-flex items-center gap-2 px-3 py-2 text-sm border border-[hsl(212_100%_10%)]/20 rounded-md cursor-pointer hover:bg-[hsl(212_100%_10%)]/5 ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={16} /> {busy ? 'Importing…' : 'Upload Excel/CSV'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const replace = confirm('Replace all existing rows?\n\nOK = replace · Cancel = append');
                  importFile(f, replace);
                  e.target.value = '';
                }}
              />
            </label>
            {rows.length > 0 && (
              <Button variant="outline" onClick={clearAll} className="gap-2">
                <Trash2 size={16} /> Clear all
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xs uppercase tracking-widest text-[hsl(212_100%_10%)]/60 mb-3">
          {title} ({rows.length})
        </h3>
        {rows.length === 0 ? (
          <p className="text-[hsl(212_100%_10%)]/60">No rows yet — upload a file to get started.</p>
        ) : (
          <div className="border border-[hsl(212_100%_10%)]/15 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(212_100%_10%)]/[0.04] border-b border-[hsl(212_100%_10%)]/10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">City</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Price (€M)</th>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isEditing = editingId === r.id;
                  return (
                    <tr key={r.id} className="border-b border-[hsl(212_100%_10%)]/5 last:border-0">
                      {isEditing ? (
                        <>
                          <td className="px-3 py-2">
                            <input
                              className="w-full px-2 py-1 text-sm border border-[hsl(212_100%_10%)]/20 rounded"
                              value={editForm.value ?? ''}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, value: e.target.value }))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-full px-2 py-1 text-sm border border-[hsl(212_100%_10%)]/20 rounded"
                              value={editForm.sub ?? ''}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, sub: e.target.value }))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-2 py-1 text-sm border border-[hsl(212_100%_10%)]/20 rounded text-right"
                              value={editForm.numeric_value ?? ''}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, numeric_value: e.target.value ? Number(e.target.value) : null }))}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-full px-2 py-1 text-sm border border-[hsl(212_100%_10%)]/20 rounded"
                              value={editForm.category ?? ''}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => saveEdit(r.id)}
                                className="px-2 py-1 text-xs rounded bg-[hsl(212_89%_55%)] text-white hover:opacity-90"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-2 py-1 text-xs rounded border border-[hsl(212_100%_10%)]/20 hover:bg-[hsl(212_100%_10%)]/5"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 cursor-pointer hover:bg-[hsl(212_100%_10%)]/[0.03]" onClick={() => startEdit(r)}>{r.value}</td>
                          <td className="px-3 py-2 cursor-pointer hover:bg-[hsl(212_100%_10%)]/[0.03]" onClick={() => startEdit(r)}>{r.sub}</td>
                          <td className="px-3 py-2 text-right cursor-pointer hover:bg-[hsl(212_100%_10%)]/[0.03]" onClick={() => startEdit(r)}>{r.numeric_value != null ? `€${Math.round(Number(r.numeric_value) * 1_000_000).toLocaleString('en-US')}` : '—'}</td>
                          <td className="px-3 py-2 cursor-pointer hover:bg-[hsl(212_100%_10%)]/[0.03]" onClick={() => startEdit(r)}>{r.category}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => remove(r.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-red-600"
                              aria-label="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminInsights() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  if (authLoading || adminLoading) {
    return <div className="container mx-auto px-6 py-24">Loading…</div>;
  }
  if (!user) return <Navigate to="/auth?redirect=/admin/insights" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="light-panel min-h-screen">
      <div className="container mx-auto px-6 py-16 max-w-5xl">
        <Link
          to="/admin"
          className="text-sm text-[hsl(212_100%_10%)]/60 hover:text-[hsl(212_100%_10%)]"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-4xl mt-2">Insights</h1>
        <p className="text-base text-[hsl(212_100%_10%)]/70 mt-1">
          Upload Excel/CSV files to populate the public Insights page.
        </p>

        {SECTIONS.map((s) => (
          <SectionPanel key={s.key} sectionKey={s.key} title={s.title} />
        ))}
      </div>
    </div>
  );
}
