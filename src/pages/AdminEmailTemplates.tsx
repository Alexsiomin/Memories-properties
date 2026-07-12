import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Send } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

type Template = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  subject: string;
  body: string;
  is_active: boolean;
  updated_at: string;
};

const schema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  body: z.string().trim().min(1, 'Body is required').max(10_000),
});

const SAMPLE_DATA: Record<string, string> = {
  full_name: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '+357 99 123 456',
  property_id: 'sample-villa-paphos',
  preferred_date: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
  preferred_time: '10:30',
  tour_type: 'in_person',
  message: "We'd love to view the villa with our family this weekend.",
};

const renderTemplate = (text: string, data: Record<string, string>): string =>
  text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);

const emailSchema = z.string().trim().email('Enter a valid email');

export default function AdminEmailTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});
  const [testRecipient, setTestRecipient] = useState('');
  const [sendingKey, setSendingKey] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email && !testRecipient) setTestRecipient(user.email);
  }, [user, testRecipient]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });
    if (error) toast({ title: 'Failed to load', description: error.message });
    const rows = (data ?? []) as Template[];
    setTemplates(rows);
    setDrafts(
      Object.fromEntries(rows.map((t) => [t.key, { subject: t.subject, body: t.body }])),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (t: Template) => {
    const draft = drafts[t.key];
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      return toast({ title: 'Invalid', description: parsed.error.issues[0].message });
    }
    setSavingKey(t.key);
    const { error } = await supabase
      .from('email_templates')
      .update({ subject: parsed.data.subject, body: parsed.data.body })
      .eq('id', t.id);
    setSavingKey(null);
    if (error) return toast({ title: 'Save failed', description: error.message });
    toast({ title: 'Template saved' });
    load();
  };

  const sendTest = async (t: Template) => {
    const emailParsed = emailSchema.safeParse(testRecipient);
    if (!emailParsed.success) {
      return toast({ title: 'Invalid email', description: emailParsed.error.issues[0].message });
    }
    const draft = drafts[t.key];
    setSendingKey(t.key);
    const { data, error } = await supabase.functions.invoke('send-test-email', {
      body: {
        templateKey: t.key,
        recipient: emailParsed.data,
        subject: draft.subject,
        body: draft.body,
        sampleData: SAMPLE_DATA,
      },
    });
    setSendingKey(null);
    if (error) {
      return toast({ title: 'Send failed', description: error.message ?? 'Unknown error' });
    }
    if (data?.error) {
      return toast({ title: 'Send failed', description: data.error });
    }
    toast({ title: 'Test email sent', description: `Delivered to ${emailParsed.data}` });
  };

  return (
    <div className="container mx-auto px-6 py-16 max-w-4xl">
      <Link to="/admin/emails" className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to emails
      </Link>
      <h1 className="text-4xl mb-2">Email templates</h1>
      <p className="text-base text-foreground/70 mb-6">
        Edit the subject and body of automated emails. Use double-curly variables like{' '}
        <code className="px-1 bg-foreground/10 rounded">{`{{full_name}}`}</code> — they're replaced when the
        email is sent.
      </p>

      <div className="border border-foreground/15 p-4 mb-10 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="test-recipient">Test recipient email</Label>
          <Input
            id="test-recipient"
            type="email"
            value={testRecipient}
            maxLength={255}
            placeholder="you@example.com"
            onChange={(e) => setTestRecipient(e.target.value)}
          />
        </div>
        <p className="text-xs text-foreground/60 sm:max-w-xs">
          Used by the "Send test email" button on each template below. Sample variables (Jane Doe, etc.) are
          substituted automatically.
        </p>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="space-y-10">
          {templates.map((t) => {
            const draft = drafts[t.key] ?? { subject: t.subject, body: t.body };
            const dirty = draft.subject !== t.subject || draft.body !== t.body;
            const isPreviewing = !!previewOpen[t.key];
            const renderedSubject = renderTemplate(draft.subject, SAMPLE_DATA);
            const renderedBody = renderTemplate(draft.body, SAMPLE_DATA);
            return (
              <div key={t.id} className="border border-foreground/15 p-6">
                <div className="mb-4">
                  <h2 className="text-xl">{t.name}</h2>
                  {t.description && (
                    <p className="text-sm text-foreground/60 mt-1">{t.description}</p>
                  )}
                  <p className="text-xs text-foreground/40 mt-2">
                    Key: <code>{t.key}</code> · Updated {new Date(t.updated_at).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`subj-${t.key}`}>Subject</Label>
                    <Input
                      id={`subj-${t.key}`}
                      value={draft.subject}
                      maxLength={200}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [t.key]: { ...draft, subject: e.target.value } }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor={`body-${t.key}`}>Body</Label>
                    <Textarea
                      id={`body-${t.key}`}
                      value={draft.body}
                      rows={10}
                      maxLength={10_000}
                      className="font-mono text-sm"
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [t.key]: { ...draft, body: e.target.value } }))
                      }
                    />
                  </div>

                  {isPreviewing && (
                    <div className="border border-foreground/15 bg-foreground/5 p-4">
                      <p className="text-xs uppercase tracking-widest text-foreground/60 mb-2">
                        Preview with sample data
                      </p>
                      <p className="font-semibold mb-2">Subject: {renderedSubject}</p>
                      <pre className="whitespace-pre-wrap text-sm font-sans text-foreground/90">
                        {renderedBody}
                      </pre>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {dirty && <span className="text-xs text-foreground/60 mr-auto">Unsaved changes</span>}
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setPreviewOpen((p) => ({ ...p, [t.key]: !p[t.key] }))
                      }
                    >
                      <Eye className="h-4 w-4" /> {isPreviewing ? 'Hide preview' : 'Preview'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => sendTest(t)}
                      disabled={sendingKey === t.key || !testRecipient}
                    >
                      <Send className="h-4 w-4" />
                      {sendingKey === t.key ? 'Sending…' : 'Send test email'}
                    </Button>
                    <Button
                      onClick={() => save(t)}
                      disabled={!dirty || savingKey === t.key}
                    >
                      {savingKey === t.key ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
