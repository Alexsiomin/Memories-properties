import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { getVisitorJourneySnapshot } from '@/lib/visitor-journey';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { publicTitle, publicPrice } from '@/lib/propertyDisplay';

const lineInput =
  'rounded-none border-0 border-b border-foreground/25 bg-transparent px-0 h-8 py-0 shadow-none focus-visible:ring-0 focus-visible:border-foreground';
const lineLabel = 'text-sm font-normal text-foreground/70';

export interface EnquiryProperty {
  title: string;
  cat: string;
  location: string;
  price: string;
  status: string;
  img?: string;
  referenceCode?: string;
}

interface Props {
  property: EnquiryProperty | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const EnquiryDialog = ({ property, open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const empty = { fullName: '', email: '', phone: '', message: '' };
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open && property) {
      setForm((f) => ({
        ...f,
        message: f.message || `Hi, I would like to view the property with ID number ${property.referenceCode || publicTitle(property.title)}.`,
      }));
    }
    if (!open) {
      setTimeout(() => setForm(empty), 200);
    }
  }, [open, property]);

  useEffect(() => {
    if (!open || !user) return;

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_country, phone_number')
        .eq('id', user.id)
        .maybeSingle();

      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      const metaFull = meta.full_name || meta.name || meta.display_name || '';
      const metaGiven = meta.given_name || metaFull.split(' ')[0] || '';
      const metaFamily = meta.family_name || metaFull.split(' ').slice(1).join(' ') || '';

      const firstName = profile?.first_name || metaGiven;
      const lastName = profile?.last_name || metaFamily;
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || metaFull;
      const email = user.email || '';
      const phone = profile?.phone_number
        ? `${profile.phone_country || ''}${profile.phone_number}`.replace(/^\+\+/, '+')
        : '';

      setForm((f) => ({
        ...f,
        fullName: f.fullName || fullName,
        email: f.email || email,
        phone: f.phone || phone,
      }));
    };

    loadProfile();
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('contact_submissions').insert({
      type: 'property_enquiry',
      name: form.fullName.trim(),
      email: form.email,
      phone: form.phone || null,
      message: form.message || null,
      property_title: property?.title ? publicTitle(property.title) : null,
      metadata: {
        source: 'Property enquiry',
        source_path: typeof window !== 'undefined' ? window.location.pathname : null,
        journey: getVisitorJourneySnapshot(),
      },
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: 'Something went wrong',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
      return;
    }
    onOpenChange(false);
    toast({
      title: 'Enquiry received',
      description: 'A partner will reach out within 24 hours.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg min-h-[600px] bg-background border border-foreground/15">
        <DialogHeader className="pt-4">
          <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight text-center tracking-tight whitespace-pre-line">
            ENQUIRE ABOUT THIS{'\n'}PROPERTY
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="border border-foreground/20 px-4 py-3 text-sm text-foreground/80">
            Interest in {[property?.referenceCode, publicTitle(property?.title)].filter(Boolean).join(' · ')}{property?.price ? ` — ${publicPrice(property.price, undefined, property.status)}` : ''}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <div className="space-y-1">
              <Label htmlFor="fullName" className={lineLabel}>Full Name*</Label>
              <Input
                id="fullName"
                required
                className={lineInput}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className={lineLabel}>Email*</Label>
              <Input
                id="email"
                type="email"
                required
                className={lineInput}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className={lineLabel}>Phone*</Label>
              <Input
                id="phone"
                type="tel"
                required
                className={lineInput}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
              />
            </div>
          </div>


          <div className="space-y-1">
            <Label htmlFor="message" className={lineLabel}>Message (Optional)</Label>
            <Textarea
              id="message"
              rows={5}
              className={lineInput}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-none bg-foreground text-background hover:bg-foreground/90 px-5 py-2 text-sm gap-2 group"
            >
              <span className="story-link-group">
                {submitting ? 'Sending…' : 'Send Enquiry'}
              </span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnquiryDialog;
