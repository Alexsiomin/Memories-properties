import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface ValuationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initial = {
  firstName: '',
  email: '',
  phone: '',
  propertyType: '',
};

const PROPERTY_TYPES = [
  'Apartment',
  'Villa',
  'Penthouse',
  'Land / Plot',
  'Commercial',
  'Investment project',
];

const ValuationDialog = ({ open, onOpenChange }: ValuationDialogProps) => {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.phone) return;
    setSubmitting(true);
    const { error } = await supabase.from('contact_submissions').insert({
      type: 'valuation',
      name: form.firstName,
      email: form.email,
      phone: form.phone || null,
      subject: 'Appraisal request',
      message: form.propertyType ? `Property type: ${form.propertyType}` : null,
      metadata: { firstName: form.firstName },
    });
    setSubmitting(false);
    if (error) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    toast.success('Appraisal request received. Memories Properties will reply within two business days.');
    setForm(initial);
    onOpenChange(false);
  };

  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-0 sm:max-w-2xl p-0 overflow-hidden rounded-none">
        <form onSubmit={onSubmit} className="px-6 py-10 sm:px-12 sm:py-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase text-foreground mb-10 text-center">
            REQUEST A VALUATION
          </h2>

          <div className="mt-8">
            <Field label="Full Name" required>
              <input type="text" required value={form.firstName} onChange={set('firstName')} className={inputCls} />
            </Field>
          </div>

          <div className="mt-8">
            <Field label="Email" required>
              <input type="email" required value={form.email} onChange={set('email')} className={inputCls} />
            </Field>
          </div>

          <div className="mt-8">
            <Field label="Phone" required>
              <input type="tel" required value={form.phone} onChange={set('phone')} className={inputCls} />
            </Field>
          </div>

          <div className="mt-8">
            <Field label="Property Type">
              <select
                value={form.propertyType}
                onChange={set('propertyType')}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">Select property type</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-10">
            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex items-center gap-3 bg-foreground text-background px-[calc(1.75rem+2.5px)] py-[calc(0.875rem-2.5px)] text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <span className="relative">
                {submitting ? 'Sending…' : 'Send Enquiry'}
                <span className="absolute bottom-0 left-0 h-[1px] w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100" />
              </span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const inputCls =
  'w-full bg-transparent border-b border-foreground/30 py-2 text-base text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground transition-colors';

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-sm text-foreground/70 mb-2 block">
      {label}
      {required && <span className="text-primary">*</span>}
    </span>
    {children}
  </label>
);

export default ValuationDialog;
