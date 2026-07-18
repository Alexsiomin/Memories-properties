import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const STAGES: { key: string; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: 'bg-muted text-muted-foreground' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  { key: 'viewing', label: 'Viewing', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300' },
  { key: 'negotiating', label: 'Negotiating', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-300' },
  { key: 'won', label: 'Won', color: 'bg-green-500/10 text-green-700 dark:text-green-300' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500/10 text-red-700 dark:text-red-300' },
];

interface KanbanClient {
  id: string;
  full_name: string;
  email: string | null;
  pipeline_stage: string;
  source?: string;
  looking_for?: string;
  score?: 'hot' | 'warm' | 'cold';
}

export default function ClientsKanban({
  clients, onSelect, onChange,
}: {
  clients: KanbanClient[];
  onSelect: (id: string) => void;
  onChange: () => void;
}) {
  const { toast } = useToast();
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverStage, setHoverStage] = useState<string | null>(null);

  // Filter out website (saved-search) virtual rows from drag (read-only)
  const editable = (c: KanbanClient) => !c.id.startsWith('ss:') && !c.id.startsWith('sg:') && !c.id.startsWith('fv:') && !c.id.startsWith('tr:');

  const move = async (clientId: string, newStage: string) => {
    if (!editable({ id: clientId } as any)) {
      toast({ title: 'Read-only', description: 'Convert this lead to a manual client first.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('clients').update({ pipeline_stage: newStage }).eq('id', clientId);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    onChange();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {STAGES.map((s) => {
        const items = clients.filter((c) => (c.pipeline_stage || 'lead') === s.key);
        return (
          <div
            key={s.key}
            onDragOver={(e) => { e.preventDefault(); setHoverStage(s.key); }}
            onDragLeave={() => setHoverStage((h) => (h === s.key ? null : h))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) move(dragId, s.key);
              setDragId(null);
              setHoverStage(null);
            }}
            className={`rounded-xl border bg-card p-3 min-h-[200px] transition-colors ${
              hoverStage === s.key ? 'border-accent bg-accent/5' : 'border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <ul className="space-y-2">
              {items.map((c) => (
                <li
                  key={c.id}
                  draggable={editable(c)}
                  onDragStart={() => setDragId(c.id)}
                  onClick={() => onSelect(c.id)}
                  className={`p-2.5 rounded-lg border border-border bg-background cursor-pointer hover:border-accent transition-colors ${
                    !editable(c) ? 'opacity-80' : ''
                  }`}
                >
                  <div className="text-sm font-medium truncate flex items-center gap-1.5">
                    <span
                      title={c.score === 'hot' ? 'Hot lead' : c.score === 'warm' ? 'Warm lead' : 'Cold lead'}
                      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                        c.score === 'hot' ? 'bg-red-500' : c.score === 'warm' ? 'bg-amber-500' : 'bg-muted-foreground/30'
                      }`}
                    />
                    <span className="truncate">{c.full_name}</span>
                  </div>
                  {c.email && <div className="text-xs text-muted-foreground truncate">{c.email}</div>}
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    {c.source === 'website' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">Saved search</span>}
                    {c.source === 'signup' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700">Signup</span>}
                    {c.source === 'favorites' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-700">Favorites</span>}
                    {c.source === 'tour' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700">Tour</span>}
                  </div>
                </li>
              ))}
              {items.length === 0 && (
                <li className="text-xs text-muted-foreground text-center py-4">Drop here</li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export { STAGES };
