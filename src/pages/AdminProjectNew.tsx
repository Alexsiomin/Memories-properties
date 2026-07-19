import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FileUp, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import MapLocationPicker from '@/components/MapLocationPicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, X, Star, Loader2, Plus, Trash2, Copy, ChevronsUpDown, Check, Tag as TagIcon, Layers,
} from 'lucide-react';
import { PROPERTY_FEATURES } from '@/lib/property-features';
import { projectName, unitLabel } from '@/lib/developments';

const CATEGORIES = [
  'Villa', 'Apartment', 'Land / Plot', 'Studio', 'Semi-detached',
  'Maisonette', 'Commercial', 'Hotel',
  'Commercial and Residential Building',
];

const STATUSES = [
  { value: 'available', label: 'Available', tone: 'text-emerald-600' },
  { value: 'reserved', label: 'Reserved', tone: 'text-amber-600' },
  { value: 'sold', label: 'Sold', tone: 'text-red-600' },
];

const CY_DISTRICTS = ['Limassol', 'Paphos'];

const CY_TOWNS: Record<string, string[]> = {
  Limassol: ['Limassol (city)', 'Germasogeia', 'Agios Tychon', 'Pyrgos', 'Pissouri', 'Parekklisia', 'Mouttagiaka', 'Episkopi'],
  Paphos: [
    'Paphos (city)', 'Mouttalos', 'Agios Pavlos', 'Agios Theodoros', 'Agios Spyridon', 'Agios Kendeas',
    'Kato Paphos', 'Universal', 'Anavargos', 'Mesogi', 'Konia',
    'Geroskipou', 'Koloni', 'Achelia',
    'Peyia', 'Coral Bay', 'Sea Caves', 'Agios Georgios (Pegeia)',
    'Polis Chrysochous', 'Polis', 'Chrysochous', 'Prodromi', 'Latchi',
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

// Optional columns whose visibility on the public front end can be toggled
const TOGGLEABLE_COLUMNS = [
  { key: 'internal_area', label: 'Internal m²' },
  { key: 'covered_verandas', label: 'Covered veranda m²' },
  { key: 'basement', label: 'Basement m²' },
  { key: 'uncovered_verandas', label: 'Uncovered veranda m²' },
  { key: 'storage_room', label: 'Storage room m²' },
  { key: 'roof_garden', label: 'Roof garden m²' },
  { key: 'parking', label: 'Parking' },
  { key: 'covered_parking', label: 'Covered Parking' },
  { key: 'beds', label: 'Bedrooms' },
  { key: 'baths', label: 'Bathrooms' },
  { key: 'lot_size', label: 'Land m²' },
  { key: 'floor', label: 'Floor level' },
] as const;

// Full column layout for the lots grid. `toggleable` columns are hidden when
// their checkbox is unticked; the rest are always shown.
const LOT_COLUMNS: { key: string; label: string; width: string; toggleable: boolean }[] = [
  { key: 'category', label: 'Type', width: '1.4fr', toggleable: false },
  { key: 'reference_code', label: 'Door Number', width: '1fr', toggleable: false },
  { key: 'beds', label: 'Beds', width: '0.7fr', toggleable: true },
  { key: 'baths', label: 'Baths', width: '0.7fr', toggleable: true },
  { key: 'internal_area', label: 'Internal m²', width: '0.9fr', toggleable: true },
  { key: 'covered_verandas', label: 'Covered veranda m²', width: '0.9fr', toggleable: true },
  { key: 'basement', label: 'Basement m²', width: '0.9fr', toggleable: true },
  { key: 'uncovered_verandas', label: 'Uncovered veranda m²', width: '0.9fr', toggleable: true },
  { key: 'storage_room', label: 'Storage room m²', width: '0.9fr', toggleable: true },
  { key: 'roof_garden', label: 'Roof garden m²', width: '0.9fr', toggleable: true },
  { key: 'parking', label: 'Parking', width: '0.7fr', toggleable: true },
  { key: 'covered_parking', label: 'Covered Parking', width: '0.9fr', toggleable: true },
  { key: 'lot_size', label: 'Land m²', width: '0.9fr', toggleable: true },
  { key: 'floor', label: 'Floor level', width: '0.7fr', toggleable: true },
  { key: 'price_value', label: 'Price (€)', width: '1.1fr', toggleable: false },
  { key: 'status', label: 'Status', width: '1fr', toggleable: false },
  { key: 'actions', label: '', width: '72px', toggleable: false },
];

type LotRow = {
  category: string;
  reference_code: string;
  beds: string;
  baths: string;
  internal_area: string;        // m²
  covered_verandas: string;     // m²
  uncovered_verandas: string;   // m²
  basement: string;             // m²
  storage_room: string;         // m²
  roof_garden: string;          // m²
  parking: string;              // spaces
  covered_parking: string;      // spaces
  lot_size: string;             // plot / land m²
  floor: string;                // floor level
  price_value: string;          // EUR
  status: string;
  unit_label?: string;          // part of title after " - " (per-unit label)
  seller_type?: string;         // preserved original seller_type when editing
};

const emptyLot = (category = 'Apartment'): LotRow => ({
  category,
  reference_code: '',
  beds: '',
  baths: '',
  internal_area: '0',
  covered_verandas: '',
  uncovered_verandas: '',
  basement: '',
  storage_room: '',
  roof_garden: '',
  parking: '1',
  covered_parking: '',
  lot_size: '',
  floor: '',
  price_value: '',
  status: 'available',
});

// Seed data transcribed from the "Arbeo Park" sales pricelist.
// "SOLD" prices are left blank and the unit marked sold.
const seedLot = (
  block: string, num: string, beds: string, internal: string,
  covered: string, storage: string, parking: string, price: string,
): LotRow => {
  const sold = /^(sold|reserved)$/i.test(price.trim());
  return {
    ...emptyLot('Apartment'),
    reference_code: `${block}${num}`,
    beds,
    internal_area: internal,
    covered_verandas: covered,
    storage_room: storage,
    parking,
    price_value: sold ? '' : price,
    status: sold ? 'sold' : 'available',
  };
};

const ARBEO_PARK_LOTS: LotRow[] = [
  // Block A
  seedLot('A', '101', '1', '54', '14', '2.5', '11.50', 'SOLD'),
  seedLot('A', '102', '1', '54', '14', '2.5', '11.50', 'SOLD'),
  seedLot('A', '201', '3', '110', '29', '2.5', '11.50', '370000'),
  seedLot('A', '301', '3', '110', '29', '2.5', '11.50', 'SOLD'),
  // Block B
  seedLot('B', '101', '3', '110', '29', '4', '11.50', '350000'),
  seedLot('B', '102', '3', '112', '31', '3.5', '11.50', '350000'),
  seedLot('B', '201', '3', '110', '29', '3.5', '11.50', '360000'),
  seedLot('B', '202', '3', '112', '31', '3.5', '11.50', '360000'),
  seedLot('B', '301', '3', '110', '29', '3.5', '11.50', '380000'),
  seedLot('B', '302', '3', '112', '31', '6', '11.50', '375000'),
  // Block C
  seedLot('C', '101', '2', '76', '14', '3', '11.50', '315000'),
  seedLot('C', '102', '2', '75', '26', '3', '11.50', '320000'),
  seedLot('C', '103', '2', '75', '26', '3', '11.50', '320000'),
  seedLot('C', '104', '2', '77', '13', '3', '11.50', '315000'),
  seedLot('C', '201', '2', '76', '14', '3', '11.50', '325000'),
  seedLot('C', '202', '2', '75', '26', '3', '11.50', '330000'),
  seedLot('C', '203', '2', '75', '26', '3.5', '11.50', '330000'),
  seedLot('C', '204', '2', '77', '13', '3.5', '11.50', '325000'),
  seedLot('C', '301', '2', '76', '14', '3.5', '11.50', '340000'),
  seedLot('C', '302', '2', '75', '26', '3.5', '11.50', '345000'),
  seedLot('C', '303', '2', '75', '25', '3.5', '11.50', '345000'),
  seedLot('C', '304', '2', '77', '25', '3.5', '11.50', '340000'),
  // Block D
  seedLot('D', '101', '2', '78', '15', '1.5', '11.50', '315000'),
  seedLot('D', '102', '2', '83', '31', '1.5', '11.50', '320000'),
  seedLot('D', '201', '2', '78', '15', '1.5', '11.50', '325000'),
  seedLot('D', '202', '2', '83', '31', '1.5', '11.50', '330000'),
  seedLot('D', '301', '2', '78', '15', '1.5', '11.50', '340000'),
  seedLot('D', '302', '2', '83', '31', '1.5', '11.50', '345000'),
];

const formatPrice = (raw: string) => {
  const value = raw.trim();
  if (!value) return '';
  const numeric = Number(value.replace(/[€£$,\s]/g, ''));
  if (Number.isFinite(numeric) && numeric > 0) {
    return `€${Math.round(numeric).toLocaleString('en-US')}`;
  }
  return value;
};

export default function AdminProjectNew() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const soldMode = searchParams.get('sold') === '1';
  const editTitle = searchParams.get('edit');
  const editDev = searchParams.get('dev');
  const editMode = !!editTitle;

  // Shared project info
  const [project, setProject] = useState({
    title: '',
    developer_id: '',
    listing_type: 'sale',
    region: '',
    city: '',
    address_line: '',
    country: 'Cyprus',
    description: '',
    image_key: 'hero',
  });
  const [pin, setPin] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [developerOptions, setDeveloperOptions] = useState<{ id: string; name: string }[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [coverIdx, setCoverIdx] = useState(0);
  const [featuredIdx, setFeaturedIdx] = useState<number[]>([]);
  const [floorPlans, setFloorPlans] = useState<{ url: string; label: string }[]>([]);
  const [floorPlanUploading, setFloorPlanUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  // Lots grid
  const [lots, setLots] = useState<LotRow[]>(
    editTitle
      ? []
      : soldMode
        ? Array.from({ length: 5 }, () => ({ ...emptyLot('Apartment'), status: 'sold' }))
        : [emptyLot()],
  );
  const [saving, setSaving] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLEABLE_COLUMNS.map((c) => [c.key, true])),
  );
  const [colOrder, setColOrder] = useState<string[]>(LOT_COLUMNS.map((c) => c.key));
  const [dragCol, setDragCol] = useState<string | null>(null);

  const moveColumn = (from: string, to: string) => {
    if (from === to) return;
    setColOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(from);
      const toIdx = next.indexOf(to);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, from);
      return next;
    });
  };
  const [features, setFeatures] = useState<string[]>([]);
  const [featureDraft, setFeatureDraft] = useState('');
  const [bulkCount, setBulkCount] = useState(1);

  const [draftLoaded, setDraftLoaded] = useState(false);
  const [editIds, setEditIds] = useState<string[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [townOpen, setTownOpen] = useState(false);

  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusCellBelow = (idx: number, field: string) => {
    const next = cellRefs.current[`${idx + 1}-${field}`];
    if (next) next.focus();
  };

  // Paste a column (or grid) copied from Excel/Sheets starting at the given cell
  const PASTE_FIELDS: (keyof LotRow)[] = [
    'reference_code', 'beds', 'baths', 'internal_area', 'covered_verandas',
    'basement', 'uncovered_verandas', 'storage_room', 'parking', 'covered_parking', 'lot_size', 'roof_garden', 'floor', 'price_value',
  ];

  const NUMERIC_FIELDS = new Set<keyof LotRow>([
    'beds', 'baths', 'internal_area', 'covered_verandas', 'basement',
    'uncovered_verandas', 'storage_room', 'roof_garden', 'parking', 'covered_parking', 'lot_size', 'floor', 'price_value',
  ]);

  const cleanNumeric = (v: string) =>
    v.replace(/[€£$\s]/g, '').replace(/m²/g, '').replace(/,/g, '');

  const isSoldText = (v: string) => /^(sold|reserved)$/i.test(v.trim());

  const handleCellPaste = (
    startIdx: number,
    field: keyof LotRow,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    // Normalise line endings and drop a single trailing newline
    const lines = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');

    // Single value without tabs: clean currency/formatting for numeric fields
    if (lines.length === 1 && !lines[0].includes('\t')) {
      if (NUMERIC_FIELDS.has(field)) {
        e.preventDefault();
        const cleaned = cleanNumeric(lines[0]);
        if (field === 'price_value' && isSoldText(cleaned)) {
          updateLot(startIdx, { price_value: '', status: 'sold' } as Partial<LotRow>);
        } else {
          updateLot(startIdx, { [field]: cleaned } as Partial<LotRow>);
        }
      }
      return;
    }

    e.preventDefault();
    const colStart = PASTE_FIELDS.indexOf(field);

    setLots((rows) => {
      const next = [...rows];
      lines.forEach((line, r) => {
        const targetIdx = startIdx + r;
        while (next.length <= targetIdx) next.push(emptyLot(next[next.length - 1]?.category));
        const cells = line.split('\t');
        const patch: Partial<LotRow> = {};
        cells.forEach((cell, c) => {
          const f = PASTE_FIELDS[colStart + c];
          if (!f) return;
          const cleaned = cleanNumeric(cell.trim());
          if (f === 'price_value' && isSoldText(cleaned)) {
            patch.price_value = '';
            patch.status = 'sold';
          } else {
            patch[f] = NUMERIC_FIELDS.has(f) ? cleaned : cell.trim();
          }
        });
        next[targetIdx] = { ...next[targetIdx], ...patch };
      });
      return next;
    });
  };

  // Import lots from an uploaded Excel/CSV file
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  // Maps spreadsheet header text -> LotRow field
  const HEADER_ALIASES: Record<string, keyof LotRow> = {
    'category': 'category', 'type': 'category',
    'reference': 'reference_code', 'reference code': 'reference_code', 'ref': 'reference_code',
    'code': 'reference_code', 'unit': 'reference_code', 'unit no': 'reference_code', 'unit number': 'reference_code',
    'apartment': 'reference_code', 'apartment number': 'reference_code', 'apartment no': 'reference_code',
    'apt': 'reference_code', 'apt no': 'reference_code', 'no': 'reference_code', 'number': 'reference_code', 'plot no': 'reference_code',
    'beds': 'beds', 'bed': 'beds', 'bedrooms': 'beds', 'bedroom': 'beds',
    'baths': 'baths', 'bath': 'baths', 'bathrooms': 'baths', 'bathroom': 'baths', 'wc': 'baths',
    'internal area': 'internal_area', 'internal': 'internal_area', 'covered area': 'internal_area', 'area': 'internal_area',
    'covered verandas': 'covered_verandas', 'covered veranda': 'covered_verandas', 'covered': 'covered_verandas',
    'uncovered verandas': 'uncovered_verandas', 'uncovered veranda': 'uncovered_verandas', 'uncovered': 'uncovered_verandas',
    'basement': 'basement',
    'storage': 'storage_room', 'storage room': 'storage_room', 'store': 'storage_room',
    'roof garden': 'roof_garden', 'roof': 'roof_garden',
    'parking': 'parking', 'parking spaces': 'parking', 'parking space': 'parking', 'car park': 'parking', 'garage': 'parking',
    'covered parking': 'covered_parking', 'covered parking spaces': 'covered_parking', 'covered garage': 'covered_parking',
    'lot size': 'lot_size', 'plot': 'lot_size', 'plot size': 'lot_size', 'land': 'lot_size', 'plot area': 'lot_size',
    'floor': 'floor', 'floor level': 'floor', 'floor no': 'floor', 'level': 'floor', 'storey': 'floor',
    'price': 'price_value', 'price value': 'price_value', 'cost': 'price_value', 'amount': 'price_value',
    'status': 'status',
  };

  const normHeader = (h: string) =>
    String(h).toLowerCase().replace(/[()€$£]/g, '').replace(/m²|m2|sqm|sq m/g, '').replace(/[._-]/g, ' ').replace(/\s+/g, ' ').trim();

  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items.length) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) setDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      return ['xlsx', 'xls', 'csv', 'pdf'].includes(ext) || f.type === 'application/pdf';
    });
    if (file) handleSmartImport(file);
    else toast.error('Drop an Excel, CSV or PDF file');
  };

  // Extract plain text from any spreadsheet (every sheet) as TSV
  const extractSpreadsheetText = async (file: File) => {
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    return wb.SheetNames
      .map((name) => {
        const sheet = wb.Sheets[name];
        const tsv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t', blankrows: false });
        return wb.SheetNames.length > 1 ? `# Sheet: ${name}\n${tsv}` : tsv;
      })
      .join('\n\n');
  };

  // Extract text from a PDF, page by page
  const extractPdfText = async (file: File) => {
    const pdfjs: any = await import('pdfjs-dist');
    const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const parts: string[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      parts.push(content.items.map((it: any) => it.str).join(' '));
    }
    return parts.join('\n');
  };

  // Smart import: read Excel/CSV/PDF text then let AI structure it into rows
  const handleSmartImport = async (file: File | null | undefined) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error('File exceeds 25MB'); return; }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    setImporting(true);
    const loading = toast.loading('Reading your file…');
    try {
      let text = '';
      if (ext === 'pdf' || file.type === 'application/pdf') {
        text = await extractPdfText(file);
      } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
        text = await extractSpreadsheetText(file);
      } else {
        text = await file.text();
      }
      if (!text || text.trim().length < 3) {
        toast.error('Could not read any text from that file', { id: loading });
        return;
      }

      toast.loading('Understanding the price list…', { id: loading });
      const { data, error } = await supabase.functions.invoke('parse-pricelist', { body: { text } });
      if (error) throw error;
      const parsed: any[] = data?.lots ?? [];
      if (!parsed.length) {
        toast.error('No units could be detected in that file', { id: loading });
        return;
      }

      const imported: LotRow[] = parsed.map((p) => {
        const lot = emptyLot(CATEGORIES.includes(p.category) ? p.category : 'Apartment');
        const set = (field: keyof LotRow, v: unknown) => {
          const raw = String(v ?? '').trim();
          if (raw === '') return;
          lot[field] = NUMERIC_FIELDS.has(field) ? cleanNumeric(raw) : raw;
        };
        set('reference_code', p.reference_code);
        set('beds', p.beds);
        set('baths', p.baths);
        set('internal_area', p.internal_area);
        set('covered_verandas', p.covered_verandas);
        set('uncovered_verandas', p.uncovered_verandas);
        set('basement', p.basement);
        set('storage_room', p.storage_room);
        set('roof_garden', p.roof_garden);
        set('parking', p.parking);
        set('covered_parking', p.covered_parking);
        set('lot_size', p.lot_size);
        set('floor', p.floor);
        set('price_value', p.price_value);
        const status = String(p.status ?? '').toLowerCase();
        lot.status = ['sold', 'reserved', 'available'].includes(status) ? status : 'available';
        if (lot.status !== 'available') lot.price_value = lot.price_value || '';
        return lot;
      });

      setLots(imported);
      toast.success(`Imported ${imported.length} unit${imported.length > 1 ? 's' : ''}`, { id: loading });
    } catch (err) {
      console.error(err);
      toast.error('Could not import that file. Try an .xlsx, .csv or .pdf price list.', { id: loading });
    } finally {
      setImporting(false);
    }
  };

  const handleExcelImport = async (file: File | null | undefined) => {
    if (!file) return;
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
      if (!rows.length) { toast.error('The file appears to be empty'); return; }

      // Detect header row: first row where at least one cell matches a known header
      let headerIdx = 0;
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        if (rows[i].some((c) => HEADER_ALIASES[normHeader(String(c ?? ''))])) { headerIdx = i; break; }
      }
      const headers = rows[headerIdx].map((c) => HEADER_ALIASES[normHeader(String(c ?? ''))]);
      const matched = headers.filter(Boolean).length;
      if (!matched) {
        toast.error('Could not recognise any columns. Use headers like Reference, Beds, Baths, Internal Area, Price…');
        return;
      }

      // Columns that don't map to a field but may carry a group/block label (e.g. "Block A")
      const labelCols = headers.map((f, c) => (!f ? c : -1)).filter((c) => c >= 0);

      const imported: LotRow[] = [];
      let currentGroup = '';
      for (let r = headerIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.every((c) => String(c ?? '').trim() === '')) continue;

        // Skip "Notes:" / footnote lines
        const joined = row.map((c) => String(c ?? '').trim()).filter(Boolean).join(' ').toLowerCase();
        if (joined.startsWith('note') || joined.startsWith('notes')) continue;

        // Skip a repeated header row (2+ cells that are themselves known header names)
        const headerLike = row.filter((c) => HEADER_ALIASES[normHeader(String(c ?? ''))]).length;
        if (headerLike >= 2) continue;

        // Capture a group/block label from unmapped columns
        for (const c of labelCols) {
          const v = String(row[c] ?? '').trim();
          if (v && /[a-z]/i.test(v)) currentGroup = v;
        }

        const lot = emptyLot();
        let hasData = false;
        headers.forEach((field, c) => {
          if (!field) return;
          const raw = String(row[c] ?? '').trim();
          if (raw === '') return;
          if (field === 'price_value' && isSoldText(cleanNumeric(raw))) {
            lot.status = 'sold';
            lot.price_value = '';
          } else {
            lot[field] = NUMERIC_FIELDS.has(field) ? cleanNumeric(raw) : raw;
          }
          hasData = true;
        });
        if (!hasData) continue;

        // Prefix the block/group onto the reference so duplicate numbers stay unique
        if (currentGroup && lot.reference_code) {
          lot.reference_code = `${currentGroup} ${lot.reference_code}`;
        } else if (currentGroup && !lot.reference_code) {
          lot.reference_code = currentGroup;
        }

        imported.push(lot);
      }
      if (!imported.length) { toast.error('No data rows found in the file'); return; }
      setLots(imported);
      toast.success(`Imported ${imported.length} row${imported.length > 1 ? 's' : ''} (${matched} columns matched)`);
    } catch (err) {
      console.error(err);
      toast.error('Could not read that file. Please use an .xlsx, .xls or .csv file.');
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('developers').select('id, name').order('name');
      setDeveloperOptions(data ?? []);
    })();
  }, []);

  // Load an existing project's units when in edit mode
  useEffect(() => {
    if (!editMode) return;
    (async () => {
      const escaped = (editTitle as string).replace(/[%,]/g, ' ');
      let query = supabase
        .from('properties')
        .select('*')
        .or(`title.eq.${escaped},title.ilike.${escaped} - %,title.ilike.${escaped} – %`)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      query = editDev ? query.eq('developer_id', editDev) : query.not('developer_id', 'is', null);
      const { data, error } = await query;
      if (error) { toast.error(error.message); setDraftLoaded(true); return; }
      const props = data ?? [];
      if (!props.length) { toast.error('Project not found'); setDraftLoaded(true); return; }

      const first = props[0] as Record<string, unknown>;
      setProject({
        title: projectName(first.title as string) || (first.title as string) || '',
        developer_id: (first.developer_id as string) ?? '',
        listing_type: (first.listing_type as string) ?? 'sale',
        region: (first.region as string) ?? '',
        city: (first.city as string) ?? '',
        address_line: (first.address_line as string) ?? '',
        country: (first.country as string) ?? 'Cyprus',
        description: (first.description as string) ?? '',
        image_key: (first.image_key as string) ?? 'hero',
      });
      setPin({
        lat: first.latitude != null ? Number(first.latitude) : null,
        lng: first.longitude != null ? Number(first.longitude) : null,
      });
      if (Array.isArray(first.images)) setImages(first.images as string[]);
      const cover = first.cover_image as string | null;
      if (cover && Array.isArray(first.images)) {
        const ci = (first.images as string[]).indexOf(cover);
        if (ci >= 0) setCoverIdx(ci);
      }
      const fps = Array.isArray((first as any).floor_plans) ? (first as any).floor_plans : [];
      setFloorPlans(fps.filter((f: any) => f && typeof f.url === 'string'));

      const stripM2 = (v: unknown) => (typeof v === 'string' ? v.replace(/\s*m²/, '').trim() : '');
      const tagVal = (tags: string[], prefix: string) => {
        const t = tags.find((x) => x.startsWith(prefix));
        return t ? t.slice(prefix.length).replace(/\s*m²/, '').trim() : '';
      };
      const allTags: string[] = (first.tags as string[]) ?? [];
      const hidden = new Set(allTags.filter((t) => t.startsWith('hidden:')).map((t) => t.slice(7)));
      setVisibleCols(Object.fromEntries(TOGGLEABLE_COLUMNS.map((c) => [c.key, !hidden.has(c.key)])));
      const internalPrefixes = ['hidden:', 'uncovered verandas ', 'basement ', 'storage room ', 'roof garden ', 'covered parking '];
      setFeatures(allTags.filter((t) => !internalPrefixes.some((p) => t.startsWith(p))));

      setLots(props.map((p) => {
        const tags: string[] = ((p as Record<string, unknown>).tags as string[]) ?? [];
        const pv = (p as Record<string, unknown>).price_value;
        return {
          category: ((p as Record<string, unknown>).category as string) ?? 'Apartment',
          reference_code: ((p as Record<string, unknown>).reference_code as string) ?? '',
          beds: (p as Record<string, unknown>).beds != null ? String((p as Record<string, unknown>).beds) : '',
          baths: (p as Record<string, unknown>).baths != null ? String((p as Record<string, unknown>).baths) : '',
          internal_area: stripM2((p as Record<string, unknown>).internal_area),
          covered_verandas: stripM2((p as Record<string, unknown>).covered_verandas),
          uncovered_verandas: tagVal(tags, 'uncovered verandas '),
          basement: tagVal(tags, 'basement '),
          storage_room: tagVal(tags, 'storage room '),
          roof_garden: tagVal(tags, 'roof garden '),
          parking: (p as Record<string, unknown>).parking_spaces != null ? String((p as Record<string, unknown>).parking_spaces) : '',
          covered_parking: tagVal(tags, 'covered parking '),
          lot_size: stripM2((p as Record<string, unknown>).lot_size),
          floor: tagVal(tags, 'floor level '),
          price_value: pv != null && Number(pv) ? String(pv) : '',
          status: ((p as Record<string, unknown>).status as string) ?? 'available',
          unit_label: unitLabel((p as Record<string, unknown>).title as string),
          seller_type: ((p as Record<string, unknown>).seller_type as string) ?? 'developer',
        } as LotRow;
      }));
      setEditIds(props.map((p) => (p as Record<string, unknown>).id as string));
      setDraftLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  // Restore any unsaved draft on mount so a refresh never wipes the form
  useEffect(() => {
    if (editMode) return;
    try {
      const raw = localStorage.getItem('admin-project-draft');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.project) setProject(d.project);
        if (Array.isArray(d.lots) && d.lots.length) setLots(d.lots);
        if (Array.isArray(d.images)) setImages(d.images);
        if (typeof d.coverIdx === 'number') setCoverIdx(d.coverIdx);
        if (Array.isArray(d.featuredIdx)) setFeaturedIdx(d.featuredIdx);
        if (Array.isArray(d.floorPlans)) setFloorPlans(d.floorPlans);
        if (d.visibleCols) setVisibleCols(d.visibleCols);
        if (d.pin) setPin(d.pin);
        if (Array.isArray(d.features)) setFeatures(d.features);
        toast.info('Restored your unsaved draft');
      }
    } catch { /* ignore corrupt draft */ }
    setDraftLoaded(true);
  }, []);


  // Auto-save the draft whenever anything changes
  useEffect(() => {
    if (!draftLoaded || editMode) return;
    try {
      localStorage.setItem(
        'admin-project-draft',
        JSON.stringify({ project, lots, images, coverIdx, featuredIdx, floorPlans, visibleCols, pin, features }),
      );
    } catch { /* ignore quota errors */ }
  }, [draftLoaded, project, lots, images, coverIdx, featuredIdx, floorPlans, visibleCols, pin, features]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1></div>;

  const setP = (k: keyof typeof project, v: string) => setProject((p) => ({ ...p, [k]: v }));

  const addFeature = (raw: string) => {
    const t = raw.trim().replace(/,$/, '');
    if (!t) return;
    if (features.includes(t)) return;
    setFeatures((prev) => [...prev, t]);
    setFeatureDraft('');
  };
  const removeFeature = (t: string) => setFeatures((prev) => prev.filter((x) => x !== t));

  const updateLot = (idx: number, patch: Partial<LotRow>) =>
    setLots((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const addLot = () => {
    if (editMode) setEditIds((ids) => [...ids, '']);
    setLots((rows) => [...rows, { ...emptyLot(rows[rows.length - 1]?.category), ...(soldMode ? { status: 'sold' } : {}) }]);
  };
  const addMultipleLots = (count: number) => {
    const n = Math.max(1, Math.min(100, Math.floor(count)));
    const lastCategory = lots[lots.length - 1]?.category;
    const newRows: LotRow[] = Array.from({ length: n }, () => ({
      ...emptyLot(lastCategory),
      ...(soldMode ? { status: 'sold' } : {}),
    }));
    if (editMode) {
      setEditIds((ids) => [...ids, ...Array(n).fill('')]);
    }
    setLots((rows) => [...rows, ...newRows]);
  };
  const duplicateLot = (idx: number) => {
    if (editMode) setEditIds((ids) => [...ids.slice(0, idx + 1), '', ...ids.slice(idx + 1)]);
    setLots((rows) => {
      const copy = { ...rows[idx], reference_code: '' };
      return [...rows.slice(0, idx + 1), copy, ...rows.slice(idx + 1)];
    });
  };
  const removeLot = (idx: number) =>
    setLots((rows) => {
      if (rows.length === 1) return rows;
      if (editMode && editIds[idx]) {
        const rid = editIds[idx];
        setRemovedIds((r) => [...r, rid]);
        setEditIds((ids) => ids.filter((_, i) => i !== idx));
      }
      return rows.filter((_, i) => i !== idx);
    });

  const removeAllLots = () => {
    if (editMode) {
      const toRemove = editIds.filter((id) => !!id);
      if (toRemove.length) {
        setRemovedIds((r) => [...r, ...toRemove]);
      }
      setEditIds([]);
    }
    setLots([]);
  };

  // Columns actually rendered = non-toggleable + ticked toggleable ones.
  const orderedColumns = colOrder
    .map((k) => LOT_COLUMNS.find((c) => c.key === k))
    .filter((c): c is (typeof LOT_COLUMNS)[number] => !!c);
  const shownColumns = orderedColumns.filter((c) => !c.toggleable || visibleCols[c.key]);
  const gridTemplate = shownColumns.map((c) => c.width).join(' ');

  const renderLotCell = (colKey: string, lot: LotRow, idx: number) => {
    const numInput = (field: keyof LotRow, placeholder?: string) => (
      <Input
        className="h-9"
        type="number"
        min={0}
        placeholder={placeholder}
        value={lot[field] as string}
        ref={(el) => { cellRefs.current[`${idx}-${field}`] = el; }}
        onChange={(e) => updateLot(idx, { [field]: e.target.value })}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); focusCellBelow(idx, field as string); } }}
        onPaste={(e) => handleCellPaste(idx, field, e)}
      />
    );
    switch (colKey) {
      case 'category':
        return (
          <Select value={lot.category} onValueChange={(v) => updateLot(idx, { category: v })}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case 'reference_code':
        return (
          <Input
            className="h-9"
            placeholder="A-101"
            value={lot.reference_code}
            ref={(el) => { cellRefs.current[`${idx}-reference_code`] = el; }}
            onChange={(e) => updateLot(idx, { reference_code: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); focusCellBelow(idx, 'reference_code'); } }}
            onPaste={(e) => handleCellPaste(idx, 'reference_code', e)}
          />
        );
      case 'beds': return numInput('beds');
      case 'baths': return numInput('baths');
      case 'internal_area': return numInput('internal_area', '75');
      case 'covered_verandas': return numInput('covered_verandas', '23');
      case 'basement': return numInput('basement', '20');
      case 'uncovered_verandas': return numInput('uncovered_verandas', '10');
      case 'storage_room': return numInput('storage_room', '6');
      case 'roof_garden': return numInput('roof_garden', '15');
      case 'parking': return numInput('parking', '1');
      case 'covered_parking': return numInput('covered_parking', '0');
      case 'lot_size':
        return lot.category === 'Apartment' ? (
          <div className="h-9 flex items-center text-muted-foreground text-sm">—</div>
        ) : (
          <Input
            className="h-9"
            type="number"
            min={0}
            placeholder={lot.category === 'Villa' || lot.category === 'Land / Plot' || lot.category === 'Semi-detached' ? '350' : '—'}
            value={lot.lot_size}
            ref={(el) => { cellRefs.current[`${idx}-lot_size`] = el; }}
            onChange={(e) => updateLot(idx, { lot_size: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); focusCellBelow(idx, 'lot_size'); } }}
            onPaste={(e) => handleCellPaste(idx, 'lot_size', e)}
          />
        );
      case 'floor': return numInput('floor', '1');
      case 'price_value': return numInput('price_value', '356500');
      case 'status':
        return (
          <Select value={lot.status} onValueChange={(v) => updateLot(idx, { status: v })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className={s.tone}>{s.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'actions':
        return (
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => duplicateLot(idx)}
              className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Duplicate row"
            >
              <Copy size={18} />
            </button>
            <button
              type="button"
              onClick={() => removeLot(idx)}
              disabled={lots.length === 1}
              className="p-2 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
              title="Remove row"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      default: return null;
    }
  };



  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const valid = list.filter((f) => f.size <= 25 * 1024 * 1024);
    if (list.length !== valid.length) toast.error('Some files exceeded 25MB and were skipped');
    if (valid.length === 0) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: valid.length });

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
      newUrls.push(...results.filter((u): u is string => !!u));
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
    setFeaturedIdx((prev) =>
      prev.filter((idx) => idx !== i).map((idx) => (idx > i ? idx - 1 : idx))
    );
  };

  const toggleFeatured = (i: number) => {
    setFeaturedIdx((prev) => {
      if (prev.includes(i)) return prev.filter((idx) => idx !== i);
      if (prev.length >= 5) {
        toast.error('Only 5 featured images allowed — remove one first.');
        return prev;
      }
      return [...prev, i];
    });
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

  const validate = (): string | null => {
    if (!project.title.trim()) return 'Project name is required';
    if (lots.length === 0) return 'Add at least one unit';
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);

    const cover = images[coverIdx] ?? null;
    // If featured images are picked, cycle each unit through them so listing
    // cards show visual variety instead of every unit displaying the same
    // photo. Falls back to the single cover image when none are picked.
    const coverFor = (idx: number) =>
      featuredIdx.length > 0 ? images[featuredIdx[idx % featuredIdx.length]] ?? cover : cover;
    const locationLabel = [project.city, project.region, project.country].filter(Boolean).join(' · ') || project.region;

    const payloads = lots.map((l, idx) => ({
      title: l.unit_label ? `${project.title.trim()} - ${l.unit_label}` : project.title.trim(),
      location: locationLabel,
      category: l.category,
      status: l.status || 'available',
      listing_type: project.listing_type,
      seller_type: l.seller_type || 'developer',
      developer_id: project.developer_id || null,
      price: formatPrice(l.price_value),
      price_value: Number(l.price_value),
      description: project.description || null,
      reference_code: l.reference_code.trim() || null,
      beds: l.beds ? Number(l.beds) : null,
      baths: l.baths ? Number(l.baths) : null,
      internal_area: l.internal_area ? `${l.internal_area} m²` : null,
      covered_verandas: l.covered_verandas ? `${l.covered_verandas} m²` : null,
      parking_spaces: l.parking ? Number(l.parking) : null,
      lot_size: l.lot_size ? `${l.lot_size} m²` : null,
      tags: [
        ...(l.uncovered_verandas ? [`uncovered verandas ${l.uncovered_verandas} m²`] : []),
        ...(l.basement ? [`basement ${l.basement} m²`] : []),
        ...(l.storage_room ? [`storage room ${l.storage_room} m²`] : []),
        ...(l.roof_garden ? [`roof garden ${l.roof_garden} m²`] : []),
        ...(l.covered_parking ? [`covered parking ${l.covered_parking}`] : []),
        ...(l.floor ? [`floor level ${l.floor}`] : []),
        ...TOGGLEABLE_COLUMNS.filter((c) => !visibleCols[c.key]).map((c) => `hidden:${c.key}`),
        ...features,
      ] as string[],
      address_line: project.address_line || null,
      latitude: pin.lat,
      longitude: pin.lng,
      city: project.city || null,
      region: project.region || null,
      country: project.country || null,
      images,
      cover_image: coverFor(idx),
      floor_plans: floorPlans,
      image_key: project.image_key || 'hero',
      sort_order: idx,
    }));

    if (editMode) {
      // Update existing rows, insert new ones, delete removed ones
      const updates = payloads.map((p, idx) => ({ p, id: editIds[idx] }));
      for (const { p, id } of updates) {
        if (id) {
          const { error } = await supabase.from('properties').update(p).eq('id', id);
          if (error) { setSaving(false); toast.error(error.message); return; }
        } else {
          const { error } = await supabase.from('properties').insert([p]);
          if (error) { setSaving(false); toast.error(error.message); return; }
        }
      }
      if (removedIds.length) {
        const { error } = await supabase.from('properties').delete().in('id', removedIds);
        if (error) { setSaving(false); toast.error(error.message); return; }
      }
      setSaving(false);
      toast.success(`Project updated (${payloads.length} unit${payloads.length === 1 ? '' : 's'})`);
      navigate('/admin/properties');
      return;
    }

    const { error } = await supabase.from('properties').insert(payloads);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    try { localStorage.removeItem('admin-project-draft'); } catch { /* noop */ }
    toast.success(`${payloads.length} unit${payloads.length === 1 ? '' : 's'} created`);
    navigate('/admin/properties');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin/properties" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{editMode ? 'Edit developer project' : soldMode ? 'New sold project' : 'New developer project'}</p>
              <p className="font-semibold truncate">{project.title || 'Untitled project'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {lots.length} unit{lots.length === 1 ? '' : 's'}
            </span>
            <Button onClick={save} disabled={saving || uploading}>
              {saving ? <Loader2 className="animate-spin" size={16} /> : editMode ? `Save ${lots.length} unit${lots.length === 1 ? '' : 's'}` : `Create ${lots.length} listing${lots.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 max-w-7xl space-y-6">
        {/* Shared project info */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-1">Project info</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Shared by every unit. Photos and description are reused across all lots.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>District</Label>
              <Select value={project.region} onValueChange={(v) => setP('region', v)}>
                <SelectTrigger><SelectValue placeholder="Choose district" /></SelectTrigger>
                <SelectContent>
                  {CY_DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Town / area <span className="text-red-500">*</span></Label>
              {project.region && CY_TOWNS[project.region] ? (
                <Popover open={townOpen} onOpenChange={setTownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={townOpen}
                      className="w-full justify-between font-normal"
                    >
                      {project.city && project.city !== '__other__'
                        ? project.city
                        : 'Choose town / area'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Type to search…" />
                      <CommandList>
                        <CommandEmpty>No town found.</CommandEmpty>
                        <CommandGroup>
                          {CY_TOWNS[project.region].map((t) => (
                            <CommandItem
                              key={t}
                              value={t}
                              onSelect={(val) => {
                                setP('city', val);
                                setTownOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  project.city === t ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {t}
                            </CommandItem>
                          ))}
                          <CommandItem
                            value="__other__"
                            onSelect={() => {
                              setP('city', '__other__');
                              setTownOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                project.city === '__other__' ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            Other / type below
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <Input value={project.city} onChange={(e) => setP('city', e.target.value)} placeholder="e.g. Kato Paphos" />
              )}
              {project.city === '__other__' && (
                <Input
                  className="mt-2"
                  value={project.city === '__other__' ? '' : project.city}
                  onChange={(e) => setP('city', e.target.value)}
                  placeholder="Type town / area"
                />
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="title">Project name <span className="text-destructive">*</span></Label>
              <Input id="title" value={project.title} onChange={(e) => setP('title', e.target.value)} placeholder="e.g. Celestia Residences" />
            </div>

            <div>
              <Label>Developer</Label>
              <Select value={project.developer_id} onValueChange={(v) => setP('developer_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select developer" /></SelectTrigger>
                <SelectContent>
                  {developerOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Listing type</Label>
              <Select value={project.listing_type} onValueChange={(v) => setP('listing_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">For sale</SelectItem>
                  <SelectItem value="rent">For rent</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="md:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <Label>Location pin (click map to set) <span className="text-destructive">*</span></Label>
                {pin.lat != null && pin.lng != null && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={() => setPin({ lat: null, lng: null })}
                  >
                    Clear pin
                  </button>
                )}
              </div>
              <MapLocationPicker
                latitude={pin.lat}
                longitude={pin.lng}
                onChange={(lat, lng) => setPin({ lat, lng })}
                centerQuery={
                  project.city && project.city !== '__other__'
                    ? [project.city, project.region].filter(Boolean).join(', ')
                    : project.region || undefined
                }
                className="w-full h-72 border border-border"
              />

              <p className="text-xs text-muted-foreground mt-1.5">
                {pin.lat != null && pin.lng != null
                  ? `Pin set at ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)} — click again or drag to adjust.`
                  : 'Click on the map to drop a pin for this project’s location.'}
              </p>
            </div>


            <div className="md:col-span-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" rows={4} value={project.description} onChange={(e) => setP('description', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Shared media */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-1">Project photos</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Same gallery applied to every unit. Pick up to 5 as <strong>Featured</strong> — units cycle through
            them as their cover photo, so listing cards don't all look identical.
          </p>

          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload size={20} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploading
                ? `Uploading ${uploadProgress.done}/${uploadProgress.total}…`
                : 'Click to upload images (max 25MB each)'}
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
          </label>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((url, i) => (
                <div key={url} className="relative group rounded-xl overflow-hidden border border-border bg-muted">
                  <img src={url} alt={`Project ${i + 1}`} className="w-full h-32 object-cover" />
                  {featuredIdx.includes(i) && (
                    <span className="absolute top-2 left-2 rounded-md bg-accent text-accent-foreground text-[10px] font-semibold px-1.5 py-0.5">
                      Featured {featuredIdx.indexOf(i) + 1}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-start justify-between p-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCoverIdx(i)}
                        className={`rounded-md p-1.5 transition-opacity ${
                          coverIdx === i ? 'bg-accent text-accent-foreground opacity-100' : 'bg-background/90 text-foreground opacity-0 group-hover:opacity-100'
                        }`}
                        title={coverIdx === i ? 'Cover image' : 'Set as cover'}
                      >
                        <Star size={14} fill={coverIdx === i ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFeatured(i)}
                        className={`rounded-md p-1.5 transition-opacity ${
                          featuredIdx.includes(i) ? 'bg-accent text-accent-foreground opacity-100' : 'bg-background/90 text-foreground opacity-0 group-hover:opacity-100'
                        }`}
                        title={featuredIdx.includes(i) ? 'Remove from featured' : 'Mark as featured (max 5)'}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="rounded-md p-1.5 bg-background/90 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Floor plans */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-1">Floor plans</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Applied to every unit. Upload one image per floor and label it (e.g. Ground Floor, First Floor).
          </p>

          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:bg-muted/50 transition-colors">
            {floorPlanUploading ? (
              <>
                <Loader2 size={20} className="text-muted-foreground animate-spin" />
                <span className="text-sm text-muted-foreground">Uploading…</span>
              </>
            ) : (
              <>
                <Upload size={20} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tap to upload floor plans</span>
              </>
            )}
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFloorPlanUpload(e.target.files)}
              disabled={floorPlanUploading}
            />
          </label>

          {floorPlans.length > 0 && (
            <div className="mt-4 space-y-3">
              {floorPlans.map((fp, i) => (
                <div key={fp.url} className="flex items-center gap-3 border border-border rounded-lg p-2.5 bg-background">
                  <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted">
                    <img src={fp.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </div>
                  <Input
                    value={fp.label}
                    onChange={(e) => setFloorPlanLabel(i, e.target.value)}
                    placeholder="e.g. Ground Floor"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeFloorPlan(i)}
                    aria-label="Remove floor plan"
                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-destructive/10 hover:text-destructive shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Features */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-1">Features</h2>
          <p className="text-sm text-muted-foreground mb-5">Applied to every unit. Search and pick from the list, or type a custom tag.</p>

          <div className="space-y-3">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full h-10 px-3 flex items-center justify-between rounded-md border border-input bg-background text-sm text-foreground hover:border-accent/60 transition-colors"
                >
                  <span className="text-muted-foreground">
                    {features.length ? `${features.length} feature${features.length === 1 ? '' : 's'} selected` : 'Search features…'}
                  </span>
                  <ChevronsUpDown size={16} className="text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[320px]" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search or type custom…"
                    value={featureDraft}
                    onValueChange={setFeatureDraft}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && featureDraft.trim() && !PROPERTY_FEATURES.some((t) => t.toLowerCase() === featureDraft.trim().toLowerCase())) {
                        e.preventDefault();
                        addFeature(featureDraft);
                      }
                    }}
                  />
                  <CommandList className="max-h-72">
                    <CommandEmpty>
                      {featureDraft.trim() ? (
                        <button
                          type="button"
                          onClick={() => { addFeature(featureDraft); }}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded"
                        >
                          + Add "{featureDraft.trim()}"
                        </button>
                      ) : 'No features found.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {PROPERTY_FEATURES.filter((t) => t.toLowerCase().includes(featureDraft.toLowerCase())).map((t) => {
                        const active = features.includes(t);
                        return (
                          <CommandItem
                            key={t}
                            value={t}
                            onSelect={() => (active ? removeFeature(t) : addFeature(t))}
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

            {features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {[...features].sort((a, b) => a.localeCompare(b)).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-3 h-8 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                    {t}
                    <button type="button" onClick={() => removeFeature(t)} aria-label={`Remove ${t}`} className="hover:text-foreground">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Lots grid */}
        <section
          className={cn('rounded-2xl border border-border bg-card p-6 relative', dragOver && 'ring-2 ring-primary')}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {dragOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-primary/5 backdrop-blur-sm">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload size={32} className="text-primary" />
              </div>
              <p className="text-lg font-medium text-primary">Drop Excel, CSV or PDF here</p>
              <p className="text-sm text-muted-foreground">AI will read and fill the grid automatically</p>
            </div>
          )}
          <div className="flex items-end justify-between mb-1 gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Available lots</h2>
              <p className="text-sm text-muted-foreground">
                One row per unit. Each row becomes its own listing sharing the project info above.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/pdf"
                className="hidden"
                onChange={(e) => {
                  handleSmartImport(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <Button type="button" variant="outline" size="sm" disabled={importing} onClick={() => excelInputRef.current?.click()}>
                {importing
                  ? <><Loader2 size={14} className="mr-1 animate-spin" /> Importing…</>
                  : <><Upload size={14} className="mr-1" /> Import Excel / PDF</>}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addLot}>
                <Plus size={14} className="mr-1" /> Add row
              </Button>
            </div>
          </div>

          {/* Front-end column visibility */}
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium mb-3">Columns shown on the public listing</p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {TOGGLEABLE_COLUMNS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <Checkbox
                    checked={visibleCols[c.key]}
                    onCheckedChange={(v) =>
                      setVisibleCols((prev) => ({ ...prev, [c.key]: v === true }))
                    }
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>



          <div className="flex items-center gap-3 mb-2">
            <Input
              type="number"
              min={1}
              max={100}
              value={bulkCount}
              onChange={(e) => setBulkCount(Number(e.target.value))}
              className="w-20 h-9"
            />
            <Button type="button" size="sm" onClick={() => addMultipleLots(bulkCount)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus size={14} className="mr-1" /> Create rows
            </Button>
          </div>

          <div className="mt-5 -mx-6 overflow-x-auto">
            <div className="min-w-[1600px] px-6">
              {/* Header */}
              <div
                className="grid gap-2 px-2 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-border"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {shownColumns.map((c) => (
                  <div
                    key={c.key}
                    draggable
                    onDragStart={() => setDragCol(c.key)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragCol) moveColumn(dragCol, c.key);
                      setDragCol(null);
                    }}
                    onDragEnd={() => setDragCol(null)}
                    title="Drag to reorder"
                    className={`flex items-center gap-1 cursor-grab active:cursor-grabbing select-none ${
                      dragCol === c.key ? 'opacity-50' : ''
                    }`}
                  >
                    <GripVertical className="h-3 w-3 opacity-40" />
                    {c.label}
                  </div>
                ))}
              </div>

              <div className="divide-y divide-border">
                {lots.map((lot, idx) => (
                  <div
                    key={idx}
                    className="grid gap-2 px-2 py-2 items-center hover:bg-primary/10 transition-colors"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    {shownColumns.map((c) => (
                      <div key={c.key}>{renderLotCell(c.key, lot, idx)}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={addLot} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus size={14} className="mr-1" /> Add row
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={removeAllLots} disabled={lots.length === 0}>
                <Trash2 size={14} className="mr-1" /> Delete all rows
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{lots.length}</span> unit{lots.length === 1 ? '' : 's'}
            </p>
          </div>
        </section>

        <div className="flex justify-end gap-3 pb-12">
          <Link to="/admin/properties"><Button variant="outline">Cancel</Button></Link>
          <Button onClick={save} disabled={saving || uploading}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : editMode ? `Save ${lots.length} unit${lots.length === 1 ? '' : 's'}` : `Create ${lots.length} listing${lots.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      </main>
    </div>
  );
}
