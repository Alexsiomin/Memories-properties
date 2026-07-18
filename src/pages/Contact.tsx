import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getVisitorJourneySnapshot } from '@/lib/visitor-journey';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { z } from 'zod';
import { ChevronDown, ArrowRight, CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';

const ENQUIRY_TYPES = [
  'General enquiry',
  'Buying',
  'Selling',
  'Investment opportunity',
  'Property valuation',
  'Press / Media',
  'Other',
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const contactSchema = z.object({
  enquiryType: z.string().min(1, 'Please select an enquiry type'),
  firstName: z.string().trim().min(1, 'Name is required').max(160),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().min(5, 'Phone is required').max(40),
  message: z.string().trim().max(2000).optional(),
  appointmentDate: z.date().optional(),
  appointmentTime: z.string().optional(),
});

const Contact = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    enquiryType: '',
    firstName: '',
    email: '',
    phone: '',
    message: '',
    appointmentDate: undefined as Date | undefined,
    appointmentTime: '',
  });

  const [website, setWebsite] = useState(''); // honeypot
  const [formStart] = useState(() => Date.now());

  // Autofill from authenticated user (only fills empty fields, doesn't override user edits)
  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    const fullName = meta.full_name || meta.name || meta.display_name || '';
    const firstName = meta.given_name || meta.first_name || fullName || '';
    const email = user.email || meta.email || '';
    const phone = user.phone || meta.phone || meta.phone_number || '';

    setForm((f) => ({
      ...f,
      firstName: f.firstName || firstName,
      email: f.email || email,
      phone: f.phone || phone,
    }));
  }, [user]);

  useEffect(() => {
    const intent = searchParams.get('intent');
    if (intent === 'sell') {
      setForm((f) => ({ ...f, enquiryType: 'Selling' }));
    }
  }, [searchParams]);

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website) return;
    if (Date.now() - formStart < 1500) return;

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Please review the form.');
      return;
    }
    const d = result.data;
    const { error } = await supabase.from('contact_submissions').insert({
      type: 'contact',
      user_id: user?.id ?? null,
      name: d.firstName,
      email: d.email,
      phone: d.phone,
      subject: d.enquiryType,
      message: d.message || null,
      preferred_date: d.appointmentDate ? format(d.appointmentDate, 'yyyy-MM-dd') : null,
      preferred_time: d.appointmentTime || null,
      metadata: {
        source: 'Contact page',
        source_path: typeof window !== 'undefined' ? window.location.pathname : '/contact',
        journey: getVisitorJourneySnapshot(),
      },
    });
    if (error) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    toast.success('Request received. Memories will be in touch within two business days.');
    setForm({
      enquiryType: '',
      firstName: '',
      email: '',
      phone: '',
      message: '',
      appointmentDate: undefined,
      appointmentTime: '',
    });
  };

  const needsAppointment = form.enquiryType === 'Selling' || form.enquiryType === 'Property valuation';

  return (
    <>
      <SEO
        title="Contact Memories Properties For Properties in Cyprus"
        description="Contact Memories Properties for private real estate, investment projects, and land opportunities across Cyprus. Buying, selling, or valuations — start the conversation."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: 'Memories Properties',
          image: 'https://memoriesproperties.com/favicon.png',
          url: 'https://memoriesproperties.com/contact',
          telephone: '+357 97947862',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Paphos',
            addressCountry: 'CY',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: '34.7754',
            longitude: '32.4245',
          },
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '09:00',
              closes: '18:00',
            },
          ],
          priceRange: '$$$$',
          areaServed: {
            '@type': 'Country',
            name: 'Cyprus',
          },
        }}
      />
      <PageHeader title="Begin a conversation." />

      <section className="container mx-auto px-6 mt-8 pb-44 md:pb-20">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto space-y-6 md:space-y-8 reveal text-base">
          {/* Honeypot */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            aria-hidden="true"
            style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }}
          />

          {/* Enquiry Type — boxed select */}
          <div>
            <label className="block md:hidden text-xs text-foreground/60 mb-1">
              Enquiry Type<span className="text-accent">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={form.enquiryType}
                onChange={(e) => update('enquiryType', e.target.value)}
                className={`w-full h-10 appearance-none bg-transparent border border-foreground/40 rounded-none px-4 py-2 text-base leading-none focus:outline-none focus:border-accent transition-colors ${
                  form.enquiryType ? 'text-foreground' : 'text-foreground/50'
                }`}
              >
                <option value="" disabled hidden></option>
                {ENQUIRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute left-4 top-2 text-xs text-foreground/60 hidden md:inline">
                Enquiry Type<span className="text-accent">*</span>
              </span>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50"
                size={18}
              />
            </div>
          </div>

          {/* Appointment Date & Time — for Selling and Property valuation */}
          {needsAppointment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
              {/* Date picker */}
              <div>
                <label className="block md:hidden text-xs text-foreground/60 mb-1">
                  Preferred Date<span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'w-full h-10 appearance-none bg-transparent border border-foreground/40 rounded-none px-4 py-2 text-base leading-none focus:outline-none focus:border-accent transition-colors text-left flex items-center justify-between',
                          !form.appointmentDate && 'text-foreground/50'
                        )}
                      >
                        <span>
                          {form.appointmentDate
                            ? format(form.appointmentDate, 'PPP')
                            : 'Select date'}
                        </span>
                        <CalendarIcon size={16} className="text-foreground/50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.appointmentDate}
                        onSelect={(date) => update('appointmentDate', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="pointer-events-none absolute left-4 top-2 text-xs text-foreground/60 hidden md:inline">
                    Preferred Date<span className="text-accent">*</span>
                  </span>
                </div>
              </div>

              {/* Time select */}
              <div>
                <label className="block md:hidden text-xs text-foreground/60 mb-1">
                  Preferred Time<span className="text-accent">*</span>
                </label>
                <div className="relative">
                  <select
                    required={needsAppointment}
                    value={form.appointmentTime}
                    onChange={(e) => update('appointmentTime', e.target.value)}
                    className={`w-full h-10 appearance-none bg-transparent border border-foreground/40 rounded-none px-4 py-2 text-base leading-none focus:outline-none focus:border-accent transition-colors ${
                      form.appointmentTime ? 'text-foreground' : 'text-foreground/50'
                    }`}
                  >
                    <option value="" disabled hidden></option>
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute left-4 top-2 text-xs text-foreground/60 hidden md:inline">
                    Preferred Time<span className="text-accent">*</span>
                  </span>
                  <Clock
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50"
                    size={18}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Name / Email / Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 md:gap-x-8 md:gap-y-6">
            <FloatingField
              label="Name"
              required
              value={form.firstName}
              onChange={(v) => update('firstName', v)}
            />
            <FloatingField
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(v) => update('email', v)}
            />
            <FloatingField
              label="Phone"
              type="tel"
              required
              value={form.phone}
              onChange={(v) => update('phone', v)}
            />
          </div>

          <FloatingField
            label="Message (Optional)"
            textarea
            value={form.message}
            onChange={(v) => update('message', v)}
          />

          <div className="flex flex-col gap-3 md:gap-4">
            <button
              type="submit"
              className="btn-cta-solid btn-cta btn-cta-block group"
            >
              <span>Send Enquiry</span>
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <a
              href="https://wa.me/35797947862"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta btn-cta-block group"
            >
              <span>Whats App</span>
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>

          <p className="label text-foreground/50 font-montserrat font-extrabold text-center pt-1">
            All correspondence treated in confidence.
          </p>
        </form>
      </section>
    </>
  );
};

interface FloatingFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}

const FloatingField = ({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  textarea = false,
}: FloatingFieldProps) => {
  const filled = value.length > 0;
  const floatingLabel = (
    <span
      className={`pointer-events-none absolute left-4 transition-all duration-200 hidden md:inline ${
        filled ? 'top-1.5 text-xs text-foreground/60' : 'top-1/2 -translate-y-1/2 text-base text-foreground/60'
      }`}
    >
      {label}
      {required && <span className="text-accent">*</span>}
    </span>
  );

  const staticLabel = (
    <span className="block md:hidden text-xs text-foreground/60 mb-1">
      {label}
      {required && <span className="text-accent">*</span>}
    </span>
  );

  return (
    <label className="block text-sm">
      {staticLabel}
      <div className="relative">
        {floatingLabel}
        {textarea ? (
          <textarea
            rows={4}
            required={required}
            maxLength={2000}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none bg-transparent border border-foreground/40 rounded-none px-4 pt-6 pb-3 text-base leading-normal focus:outline-none focus:border-accent transition-colors resize-none"
          />
        ) : (
          <input
            type={type}
            required={required}
            maxLength={type === 'tel' ? 15 : 255}
            value={value}
            onChange={(e) => {
              const v = type === 'tel' ? e.target.value.replace(/\D/g, '').slice(0, 15) : e.target.value;
              onChange(v);
            }}
            className="w-full h-10 appearance-none bg-transparent border border-foreground/40 rounded-none px-4 text-base leading-none focus:outline-none focus:border-accent transition-colors max-sm:py-0 sm:pt-4 sm:pb-2"
          />
        )}
      </div>
    </label>
  );
};

export default Contact;
