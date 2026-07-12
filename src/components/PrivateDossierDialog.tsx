import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { X, ChevronDown, ArrowRight } from 'lucide-react';
import agentPortrait from '@/assets/agent-portrait.jpg';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const COUNTRY_CODES = [
  { code: '+357', label: '+357' },
  { code: '+44', label: '+44' },
  { code: '+49', label: '+49' },
  { code: '+33', label: '+33' },
  { code: '+39', label: '+39' },
  { code: '+34', label: '+34' },
  { code: '+41', label: '+41' },
  { code: '+43', label: '+43' },
  { code: '+45', label: '+45' },
  { code: '+30', label: '+30' },
];

const PROPERTY_TYPES = [
  'Residential',
  'Commercial',
  'Land',
  'Investment',
  'Development',
];

const REGIONS = [
  'Limassol',
  'Paphos',
];

const PrivateDossierDialog = ({ open, onOpenChange }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    countryCode: '+357',
    phone: '',
    propertyType: '',
    region: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onOpenChange(false);
      setForm({ firstName: '', countryCode: '+357', phone: '', propertyType: '', region: '' });
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1100px] bg-[hsl(212_100%_10%)] text-white border-0 p-0 overflow-hidden rounded-none"
        style={{ borderRadius: 0 }}
      >
        {/* Close button — shadcn renders its own, but we want full control */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left side */}
          <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
                Didn&apos;t find a suitable property?
              </h2>
              <p className="mt-5 text-white/70 text-base sm:text-lg leading-relaxed max-w-sm">
                Fill out the form, we will contact you and help you find a property for you.
              </p>
            </div>
            <div className="mt-8 lg:mt-0">
              <img
                src={agentPortrait}
                alt="Our agent"
                loading="lazy"
                decoding="async"
                width={280}
                height={350}
                className="w-48 sm:w-56 object-cover"
              />
            </div>
          </div>

          {/* Right side — form */}
          <div className="p-8 sm:p-12 lg:p-14">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">First Name*</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full h-12 px-4 bg-transparent border border-white/20 text-white text-base focus:outline-none focus:border-white/50 transition-colors placeholder:text-white/60"
                  placeholder=""
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1.5">Phone*</label>
                <div className="flex gap-3">
                  <div className="relative">
                    <select
                      value={form.countryCode}
                      onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                      className="appearance-none h-12 pl-4 pr-10 bg-[hsl(212_100%_14%)] border border-white/20 text-white text-base focus:outline-none focus:border-white/50 cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[hsl(212_100%_14%)] text-white">
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                    className="flex-1 h-12 px-4 bg-transparent border border-white/20 text-white text-base focus:outline-none focus:border-white/50 transition-colors placeholder:text-white/60"
                    placeholder=""
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1.5">Property type</label>
                <div className="relative">
                  <select
                    value={form.propertyType}
                    onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                    className="appearance-none w-full h-12 pl-4 pr-10 bg-[hsl(212_100%_14%)] border border-white/20 text-white text-base focus:outline-none focus:border-white/50 cursor-pointer"
                  >
                    <option value="" className="bg-[hsl(212_100%_14%)] text-white/50">Property type</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[hsl(212_100%_14%)] text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1.5">Preferred region</label>
                <div className="relative">
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="appearance-none w-full h-12 pl-4 pr-10 bg-[hsl(212_100%_14%)] border border-white/20 text-white text-base focus:outline-none focus:border-white/50 cursor-pointer"
                  >
                    <option value="" className="bg-[hsl(212_100%_14%)] text-white/50">Preferred region</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r} className="bg-[hsl(212_100%_14%)] text-white">
                        {r}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
                </div>
              </div>

              <p className="text-xs text-white/50 leading-relaxed pt-1">
                By submitting the form you give us permission to contact you. You accept Memories{' '}
                <a href="/terms" className="underline hover:text-white/80 transition-colors" target="_blank" rel="noopener noreferrer">Terms</a>,{' '}
                <a href="/privacy" className="underline hover:text-white/80 transition-colors" target="_blank" rel="noopener noreferrer">Privacy Policy</a>{' '}
                and <a href="/cookies" className="underline hover:text-white/80 transition-colors" target="_blank" rel="noopener noreferrer">cookies</a>.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="btn-cta btn-cta-solid btn-cta-block"
              >
                {submitting ? 'Sending…' : (
                  <>
                    Submit <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivateDossierDialog;
