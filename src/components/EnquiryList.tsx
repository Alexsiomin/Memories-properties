import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { ChevronDown, ArrowRight } from 'lucide-react';
import portrait from '@/assets/concierge-agent.jpg';
import { getVisitorJourneySnapshot } from '@/lib/visitor-journey';

type DropdownProps = {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
};

const Dropdown = ({ value, placeholder, options, onChange }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-[40px] max-h-[40px] w-full items-center justify-between border border-white/50 bg-menu py-0 pr-3 pl-4 text-left text-base focus:border-white focus:outline-none ${
          value ? 'text-white' : 'text-white/60'
        }`}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute left-0 right-0 top-full z-20 max-h-72 overflow-auto border border-foreground/10 bg-white py-1 shadow-2xl">
          <li>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={`block w-full px-4 py-2.5 text-left text-base hover:bg-primary/10 ${
                value === '' ? 'bg-foreground text-white' : 'text-foreground/70'
              }`}
            >
              {placeholder}
            </button>
          </li>
          {options.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`block w-full px-4 py-2.5 text-left text-base hover:bg-primary/10 ${
                  value === opt ? 'bg-foreground text-white' : 'text-foreground'
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PROPERTY_TYPES = [
  'Apartment',
  'Villa',
  'Penthouse',
  'Land / Plot',
  'Commercial',
  'Investment project',
];

const COUNTRY_CODES = [
  { code: '+357', label: '🇨🇾 +357' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+7', label: '🇷🇺 +7' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+972', label: '🇮🇱 +972' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+86', label: '🇨🇳 +86' },
  { code: '+380', label: '🇺🇦 +380' },
];

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  email: z.string().trim().email('Please enter a valid email').max(120).optional().or(z.literal('')),
  phone: z.string().trim().min(5, 'Phone is required').max(40),
  propertyType: z.string().min(1, 'Please select a property type'),
  region: z.string().min(1, 'Please select a preferred region'),
});

const REGIONS = ['Limassol', 'Paphos'];

const EnquiryList = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    email: '',
    phone: '',
    propertyType: '',
    region: '',
    message: '',
  });
  const [countryCode, setCountryCode] = useState('+357');
  const [website, setWebsite] = useState(''); // honeypot
  const [formStart] = useState(() => Date.now());

  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    const fullName = meta.full_name || meta.name || meta.display_name || '';
    const firstName = meta.given_name || meta.first_name || fullName.split(' ')[0] || '';
    const phone = user.phone || meta.phone || meta.phone_number || '';
    setForm((f) => ({ ...f, firstName: f.firstName || firstName, phone: f.phone || phone }));
  }, [user]);

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website) return;
    if (Date.now() - formStart < 1500) return;
    const fullPhone = `${countryCode} ${form.phone}`.trim();
    const result = schema.safeParse({ ...form, phone: fullPhone });
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Please review the form.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('enquiries').insert({
      user_id: user?.id ?? null,
      first_name: result.data.firstName,
      email: form.email.trim() || null,
      phone: result.data.phone,
      property_type: result.data.propertyType,
      region: result.data.region,
      message: form.message.trim() || null,
      metadata: { journey: getVisitorJourneySnapshot() },
    });
    setSubmitting(false);
    if (error) {
      toast.error('Could not submit your request. Please try again.');
      return;
    }
    toast.success('Request received. Memories will be in touch shortly.');
    setForm({ firstName: '', email: '', phone: '', propertyType: '', region: '', message: '' });
    setCountryCode('+357');
  };

  return (
    <section
      id="enquiry-list"
      style={{ backgroundColor: "#00101f" }}
      className="mt-12 sm:-mx-14 overflow-hidden text-background"
    >
      <div className="grid grid-cols-1 gap-8 px-6 py-10 sm:px-16 sm:py-8 md:py-12 md:grid-cols-2 md:gap-14">
        {/* Left: heading + portrait */}
        <div className="reveal">
          <h2 className="font-montserrat text-3xl font-extrabold leading-[1.05] md:text-4xl">
            Didn't find a suitable property?
          </h2>
          <p className="mt-4 max-w-[40ch] text-lg text-background/70">
            Fill out the form, we will contact you and help you find a property for you.
          </p>
          <img
            src={portrait}
            alt="Memories private real estate advisor"
            loading="lazy"
            decoding="async"
            className="mt-8 w-full max-w-[220px] sm:max-w-[320px] md:max-w-none md:w-4/5 lg:w-3/4 aspect-[3/4] rounded-md object-cover object-top mx-auto sm:mx-0"
          />
        </div>

        {/* Right: form */}
        <form className="reveal flex flex-col gap-7" data-reveal-delay="120" onSubmit={onSubmit}>
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />

          <div>
            <input
              id="ef-name"
              type="text"
              placeholder="First Name*"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              className="w-full border-0 border-b border-background/30 bg-transparent py-2 text-base placeholder:text-background/60 focus:border-background focus:outline-none"
            />
          </div>

          <div>
            <input
              id="ef-email"
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full border-0 border-b border-background/30 bg-transparent py-2 text-base placeholder:text-background/60 focus:border-background focus:outline-none"
            />
          </div>

          <div className="flex items-end gap-3">
            <div className="relative shrink-0 w-[92px]">
              <Dropdown
                value={countryCode}
                placeholder="+357"
                options={COUNTRY_CODES.map((c) => c.code)}
                onChange={(v) => setCountryCode(v)}
              />
            </div>
            <input
              id="ef-phone"
              type="tel"
              placeholder="Phone*"
              maxLength={15}
              value={form.phone}
              onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 15))}
              className="w-full border-0 border-b border-background/30 bg-transparent py-2 text-base placeholder:text-background/60 focus:border-background focus:outline-none"
            />
          </div>

          <Dropdown
            value={form.propertyType}
            placeholder="Property type"
            options={PROPERTY_TYPES}
            onChange={(v) => update('propertyType', v)}
          />

          <Dropdown
            value={form.region}
            placeholder="Preferred region"
            options={REGIONS}
            onChange={(v) => update('region', v)}
          />

          <textarea
            id="ef-message"
            placeholder="Message (optional)"
            rows={3}
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            className="w-full resize-none border-0 border-b border-background/30 bg-transparent py-2 text-base placeholder:text-background/60 focus:border-background focus:outline-none"
          />

          <button
            type="submit"
            disabled={submitting}
            className="group inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 border border-white bg-menu px-6 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-white transition-opacity order-1 sm:order-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="story-link">{submitting ? 'Submitting…' : 'Submit'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="order-2 text-sm leading-relaxed text-background/60 sm:order-1">
            By submitting the form you give us permission to contact you. You accept Memories{' '}
            <Link to="/terms" className="underline hover:text-background">Terms</Link>,{' '}
            <Link to="/privacy" className="underline hover:text-background">Privacy Policy</Link> and{' '}
            <Link to="/cookies" className="underline hover:text-background">cookies</Link>.
          </p>
        </form>
      </div>
    </section>
  );
};

export default EnquiryList;
