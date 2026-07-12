import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface AlertCriteria {
  listing_type?: string | null;
  categories?: string[];
  regions?: string[];
  budget_min?: number | null;
  budget_max?: number | null;
  min_beds?: number | null;
  min_baths?: number | null;
  tags?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criteria: AlertCriteria;
  /** Human-readable summary of the criteria shown to the user */
  summary?: string;
}

const emailSchema = z.string().trim().email('Enter a valid email address').max(255);

export default function PropertyAlertDialog({ open, onOpenChange, criteria, summary }: Props) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && user?.email) setEmail(user.email);
  }, [open, user?.email]);

  const submit = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const clean = <T,>(arr?: T[]) => (arr && arr.length ? arr : null);
    const { error } = await supabase.from('property_alerts').insert({
      user_id: user?.id ?? null,
      email: parsed.data,
      label: label.trim() || null,
      listing_type: criteria.listing_type || null,
      categories: clean(criteria.categories),
      regions: clean(criteria.regions),
      budget_min: criteria.budget_min ?? null,
      budget_max: criteria.budget_max ?? null,
      min_beds: criteria.min_beds ?? null,
      min_baths: criteria.min_baths ?? null,
      tags: clean(criteria.tags),
      filters: criteria as any,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Alert created — we'll notify you when a matching property is listed.");
    setLabel('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-none border-foreground/15">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(212_100%_10%)] text-white">
            <Bell size={18} />
          </div>
          <DialogTitle className="font-montserrat uppercase tracking-[0.04em] font-extrabold text-xl">
            Create a property alert
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground/60">
            Can't find what you're looking for? We'll email you the moment a property
            matching your search goes live.
          </DialogDescription>
        </DialogHeader>

        {summary && (
          <div className="border border-foreground/15 bg-foreground/[0.03] px-4 py-3 text-xs text-foreground/70">
            <span className="font-semibold uppercase tracking-wider text-foreground/50">
              Your criteria
            </span>
            <p className="mt-1 leading-relaxed">{summary}</p>
          </div>
        )}

        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border-0 border-b border-foreground/30 bg-transparent px-0 py-2 text-sm focus:border-[hsl(212_100%_10%)] focus:outline-none focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1">
              Name this alert <span className="font-normal normal-case text-foreground/40">(optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 2-bed apartments in Paphos"
              className="w-full border-0 border-b border-foreground/30 bg-transparent px-0 py-2 text-sm focus:border-[hsl(212_100%_10%)] focus:outline-none focus:ring-0"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="btn-cta btn-cta-solid btn-cta-block mt-2"
          >
            {submitting ? 'Creating…' : 'Notify me'}
          </button>
          {!user && (
            <p className="text-center text-xs text-foreground/45">
              Have an account?{' '}
              <a href="/auth" className="text-accent hover:underline">
                Sign in
              </a>{' '}
              to manage your alerts.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
