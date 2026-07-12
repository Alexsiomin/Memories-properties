import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AdminRow {
  id: string;
  user_id: string;
  display_name: string | null;
}

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('id, user_id')
      .eq('role', 'admin');
    if (!roles) return;
    const ids = roles.map(r => r.user_id);
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('id, display_name').in('id', ids)
      : { data: [] as any[] };
    setAdmins(roles.map(r => ({
      id: r.id,
      user_id: r.user_id,
      display_name: profiles?.find(p => p.id === r.user_id)?.display_name ?? null,
    })));
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (authLoading || adminLoading) return <div className="container mx-auto px-6 py-24">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <div className="container mx-auto px-6 py-24"><h1 className="text-4xl">Forbidden</h1></div>;

  const grant = async () => {
    if (!userId.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId.trim(), role: 'admin' });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Admin granted');
    setUserId('');
    load();
  };

  const revoke = async (id: string, target_user: string) => {
    if (target_user === user.id && !confirm('Revoke your own admin?')) return;
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Revoked');
    load();
  };

  return (
    <div className="container mx-auto px-6 py-16 max-w-3xl">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl">Admin · Users</h1>
        <Link to="/admin/properties"><Button variant="outline">Properties</Button></Link>
      </div>

      <div className="border p-6 mb-10 space-y-4">
        <h2 className="text-2xl">Grant admin</h2>
        <p className="text-sm text-muted-foreground">
          The new admin must already have an account. Ask them to sign up, then paste their User ID below
          (find it in Backend → Users).
        </p>
        <div>
          <Label>User ID</Label>
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid…" />
        </div>
        <Button onClick={grant} disabled={busy}>Grant admin</Button>
      </div>

      <h2 className="text-2xl mb-4">Current admins</h2>
      <div className="space-y-2">
        {admins.map(a => (
          <div key={a.id} className="border p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{a.display_name || '(no name)'}</div>
              <div className="text-xs text-muted-foreground font-mono">{a.user_id}</div>
            </div>
            <Button size="sm" variant="destructive" onClick={() => revoke(a.id, a.user_id)}>Revoke</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
