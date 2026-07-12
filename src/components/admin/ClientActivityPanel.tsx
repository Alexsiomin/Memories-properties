import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Phone, Mail, Calendar, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  body: string | null;
  created_at: string;
  metadata: any;
}
interface Task {
  id: string;
  title: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, any> = {
  note: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Calendar,
  stage_change: CheckCircle2,
  system: Circle,
};

const fmt = (d: string) => new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtDay = (d: string) => new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

export default function ClientActivityPanel({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [body, setBody] = useState('');
  const [type, setType] = useState<'note' | 'call' | 'email' | 'meeting'>('note');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: acts }, { data: tks }] = await Promise.all([
      supabase.from('client_activities').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(100),
      supabase.from('client_tasks').select('*').eq('client_id', clientId).order('due_at', { ascending: true, nullsFirst: false }),
    ]);
    setActivities((acts ?? []) as Activity[]);
    setTasks((tks ?? []) as Task[]);
  };

  useEffect(() => { load(); }, [clientId]);

  const addActivity = async () => {
    if (!body.trim()) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('client_activities').insert({
      client_id: clientId,
      actor_id: u.user?.id ?? null,
      type,
      body: body.trim(),
    });
    setBusy(false);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    setBody('');
    load();
  };

  const addTask = async () => {
    if (!taskTitle.trim()) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('client_tasks').insert({
      client_id: clientId,
      title: taskTitle.trim(),
      due_at: taskDue ? new Date(taskDue).toISOString() : null,
      created_by: u.user?.id ?? null,
    });
    setBusy(false);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    setTaskTitle(''); setTaskDue('');
    load();
  };

  const toggleTask = async (t: Task) => {
    await supabase.from('client_tasks').update({
      completed_at: t.completed_at ? null : new Date().toISOString(),
    }).eq('id', t.id);
    load();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('client_tasks').delete().eq('id', id);
    load();
  };

  return (
    <Tabs defaultValue="activity">
      <TabsList>
        <TabsTrigger value="activity">Activity ({activities.length})</TabsTrigger>
        <TabsTrigger value="tasks">Tasks ({tasks.filter((t) => !t.completed_at).length})</TabsTrigger>
      </TabsList>

      <TabsContent value="activity" className="space-y-4">
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex gap-2">
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What happened? e.g. Called, left voicemail."
              className="flex-1"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={addActivity} disabled={busy || !body.trim()}>Log</Button>
          </div>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {activities.map((a) => {
              const Icon = TYPE_ICONS[a.type] || Circle;
              return (
                <li key={a.id} className="flex gap-3 p-3 rounded-lg border border-border bg-background">
                  <div className="shrink-0 mt-0.5"><Icon className="h-4 w-4 text-accent" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">{a.type.replace('_', ' ')}</span>
                      <span className="text-xs text-muted-foreground">{fmt(a.created_at)}</span>
                    </div>
                    {a.body && <p className="text-sm mt-1 whitespace-pre-wrap">{a.body}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="tasks" className="space-y-4">
        <div className="rounded-lg border border-border p-3 space-y-2">
          <Input placeholder="New task title…" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
          <div className="flex gap-2">
            <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={addTask} disabled={busy || !taskTitle.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => {
              const overdue = t.due_at && !t.completed_at && new Date(t.due_at) < new Date();
              return (
                <li key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border border-border bg-background ${overdue ? 'border-destructive/40' : ''}`}>
                  <button onClick={() => toggleTask(t)} aria-label="Toggle">
                    {t.completed_at
                      ? <CheckCircle2 className="h-5 w-5 text-accent" />
                      : <Circle className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${t.completed_at ? 'line-through text-muted-foreground' : ''}`}>{t.title}</div>
                    {t.due_at && (
                      <div className={`text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                        Due {fmtDay(t.due_at)} {overdue && '· overdue'}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteTask(t.id)} className="p-1 rounded hover:bg-muted">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}
