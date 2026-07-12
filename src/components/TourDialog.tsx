import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Lightbulb, ArrowLeft, MapPin, Bed, Bath, Ruler } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { publicTitle, publicPrice } from '@/lib/propertyDisplay';

export type TourProperty = {
  id: string;
  title: string;
  location: string;
  image: string;
  price: string;
  category?: string | null;
  beds?: number | null;
  baths?: number | null;
  size?: string | null;
  totalCoveredArea?: string | null;
};

const TIME_SLOTS = [
  '9:00 am', '9:30 am', '10:00 am', '10:30 am', '11:00 am', '11:30 am',
  '12:00 pm', '12:30 pm', '1:00 pm', '1:30 pm', '2:00 pm', '2:30 pm',
  '3:00 pm', '3:30 pm', '4:00 pm', '4:30 pm', '5:00 pm', '5:30 pm', '6:00 pm',
];

type Slot = { date: string; time: string };

function buildDays(count = 30) {
  const out: { iso: string; weekday: string; month: string; day: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let i = 0;
  while (out.length < count) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    i++;
    if (d.getDay() === 0) continue; // skip Sunday
    out.push({
      iso: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase(),
      month: d.toLocaleDateString(undefined, { month: 'short' }),
      day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    });
  }
  return out;
}

interface TourDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: TourProperty;
}

const TourDialog = ({ open, onOpenChange, property }: TourDialogProps) => {
  const days = useMemo(() => buildDays(30), []);
  const [selectedDate, setSelectedDate] = useState<string>(days[0].iso);
  const [slots, setSlots] = useState<Slot[]>([{ date: days[0].iso, time: '9:00 am' }]);
  const [step, setStep] = useState<'schedule' | 'details'>('schedule');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      setStep('schedule');
      setSubmitting(false);
      setSlots([{ date: days[0].iso, time: '9:00 am' }]);
      setSelectedDate(days[0].iso);
      setErrors({});
      return;
    }
    // Prefill details from logged-in user's profile
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const meta = (user.user_metadata ?? {}) as Record<string, any>;
      if (user.email) setEmail((prev) => prev || user.email!);
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, first_name, last_name, phone_country, phone_number')
        .eq('id', user.id)
        .maybeSingle();
      const composedName = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || profile.display_name || ''
        : '';
      const fallbackName = meta.full_name || meta.name || meta.display_name || '';
      const finalName = composedName || fallbackName;
      if (finalName) setFullName((prev) => prev || finalName);
      const composedPhone = profile
        ? [profile.phone_country, profile.phone_number].filter(Boolean).join(' ').trim()
        : '';
      const finalPhone = composedPhone || meta.phone || '';
      if (finalPhone) setPhone((prev) => prev || finalPhone);
    })();
  }, [open, days]);

  const scrollDays = (dir: 1 | -1) => {
    dayScrollRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  const updateSlot = (i: number, patch: Partial<Slot>) => {
    setSlots((s) => s.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)));
  };

  const addSlot = () => {
    if (slots.length >= 3) return;
    setSlots((s) => [...s, { date: selectedDate, time: '10:00 am' }]);
  };

  const removeSlot = (i: number) => {
    if (slots.length <= 1) return;
    setSlots((s) => s.filter((_, idx) => idx !== i));
  };

  const [errors, setErrors] = useState<{ fullName?: string; email?: string; phone?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!fullName.trim()) next.fullName = 'Please enter your full name.';
    if (!email.trim()) next.email = 'Please enter your email address.';
    if (!phone.trim()) next.phone = 'Please enter your phone number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please complete all required fields.');
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const primary = slots[0];
    const extra = slots.slice(1).map((s) => `${s.date} ${s.time}`).join(', ');
    const composedMessage = [
      message.trim(),
      extra ? `Alternative times: ${extra}` : '',
    ].filter(Boolean).join('\n\n') || null;

    const { error } = await supabase.from('tour_requests').insert({
      property_id: property.id,
      user_id: user?.id ?? null,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      preferred_date: primary.date,
      preferred_time: primary.time,
      tour_type: 'in_person',
      message: composedMessage,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Could not submit your tour request. Please try again.');
      return;
    }
    toast.success('Tour requested — an advisor will confirm shortly.');
    setFullName('');
    setEmail('');
    setPhone('');
    setMessage('');
    onOpenChange(false);
  };

  const areaLabel = property.totalCoveredArea || property.size;
  const isLand = property.category === 'Land / Plot';
  const stats = [
    property.beds != null ? { icon: Bed, label: isLand ? `${property.beds}% Building density` : `${property.beds} Bedrooms` } : null,
    property.baths != null ? { icon: Bath, label: isLand ? `${property.baths}% Cover factor` : `${property.baths} Bathrooms` } : null,
    areaLabel ? { icon: Ruler, label: areaLabel } : null,
  ].filter(Boolean) as { icon: typeof Bed; label: string }[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full sm:max-w-xl p-0 overflow-hidden gap-0 h-[100dvh] sm:h-[90vh] rounded-none sm:rounded-none flex flex-col bg-[#00101f] border border-border [&>button]:hidden"
      >
        {/* Header */}
        <div className="relative px-4 pt-6 pb-[15px] border-b border-menu-foreground/10 bg-[#00101f] text-menu-foreground">
          {step === 'details' ? (
            <button
              type="button"
              onClick={() => setStep('schedule')}
              className="absolute left-4 top-1/2 -translate-y-1/2 size-8 rounded-none hover:bg-menu-foreground/10 flex items-center justify-center text-menu-foreground/70"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
          ) : null}
          <h2 className="text-center text-lg font-montserrat font-extrabold uppercase text-menu-foreground">
            {step === 'schedule' ? 'Request a tour' : 'Your details'}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-8 rounded-none hover:bg-menu-foreground/10 flex items-center justify-center text-menu-foreground/70"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {step === 'schedule' && (
            <div className="px-4 py-4 space-y-4 bg-[#00101f] text-menu-foreground">
              {/* Property summary card */}
              <div className="rounded-none border border-menu-foreground/10 bg-menu-foreground/10 overflow-hidden">
                <div className="w-full aspect-[16/9] overflow-hidden bg-menu-foreground/10">
                  <img src={property.image} alt={publicTitle(property.title)} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-3">
                  {property.price && (
                    <p className="text-lg font-bold text-menu-foreground leading-none">{publicPrice(property.price)}</p>
                  )}
                  
                  {stats.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-menu-foreground/10 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-menu-foreground/80">
                  {stats.map(({ label }, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <span className="font-medium">{label}</span>
                    </span>
                  ))}
                    </div>
                  )}
                </div>
              </div>



              {/* Time slots */}
              <div>
                <p className="text-base font-montserrat font-extrabold uppercase text-menu-foreground mb-2">Select up to 3 times</p>

                {slots.map((slot, idx) => (
                  <div key={idx} className="mb-6 last:mb-0">
                    {/* Day picker — only for first slot */}
                    {idx === 0 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => scrollDays(-1)}
                          className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 size-8 flex items-center justify-center text-accent hover:text-accent/80"
                          aria-label="Previous days"
                        >
                          <ChevronLeft size={22} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollDays(1)}
                          className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 size-8 flex items-center justify-center text-accent hover:text-accent/80"
                          aria-label="Next days"
                        >
                          <ChevronRight size={22} strokeWidth={2.5} />
                        </button>
                        <div
                          ref={dayScrollRef}
                          className="flex gap-3 overflow-x-auto scrollbar-hide px-7"
                          style={{ touchAction: 'pan-x', scrollSnapType: 'x mandatory' }}
                        >
                          {days.map((d) => {
                            const active = d.iso === slot.date;
                            const [mon, dayNum] = d.day.split(' ');
                            return (
                              <button
                                key={d.iso}
                                type="button"
                                onClick={() => {
                                  updateSlot(idx, { date: d.iso });
                                  setSelectedDate(d.iso);
                                }}
                                  className={cn(
                                    'shrink-0 w-[100px] py-3.5 rounded-none border-2 text-center transition-colors',
                                    active
                                      ? 'border-menu-foreground/20 bg-menu text-menu-foreground'
                                      : 'border-menu-foreground/20 bg-white/10 text-menu-foreground hover:border-menu-foreground/40'
                                  )}
                                style={{ scrollSnapAlign: 'start' }}
                              >
                                <p className="text-xs font-bold tracking-wider">{d.weekday}</p>
                                <p className="text-base font-bold mt-1">{mon} {dayNum}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Time select */}
                    <div className={cn("flex items-center gap-2", idx === 0 ? "mt-4" : "mt-0")}>
                      <Select value={slot.time} onValueChange={(v) => updateSlot(idx, { time: v })}>
                        <SelectTrigger className="h-10 rounded-none bg-white/10 border-menu-foreground/20 font-semibold text-menu-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 rounded-none">
                          {TIME_SLOTS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {slots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlot(idx)}
                          className="size-10 rounded-none hover:bg-muted flex items-center justify-center text-muted-foreground"
                          aria-label="Remove time"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add a time */}
                {slots.length < 3 && (
                  <button
                    type="button"
                    onClick={addSlot}
                    className="mt-2 flex items-center gap-3 text-menu-foreground font-semibold"
                  >
                    <span className="size-7 rounded-none bg-menu-foreground text-menu flex items-center justify-center">
                      <Plus size={16} strokeWidth={3} />
                    </span>
                    Time
                  </button>
                )}
                {slots.length === 3 && (
                  <p className="mt-2 flex items-center gap-3 text-muted-foreground font-semibold">
                    <span className="size-7 rounded-none bg-muted-foreground/30 text-background flex items-center justify-center">
                      <Plus size={16} strokeWidth={3} />
                    </span>
                    Add a time
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 'details' && (
            <form id="tour-details-form" onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
              <div className="rounded-none bg-muted/50 border border-border p-3 space-y-1">
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Selected times</p>
                {slots.map((s, i) => {
                  const d = days.find((dd) => dd.iso === s.date);
                  return (
                    <p key={i} className="text-base font-semibold text-foreground">
                      {d?.weekday} {d?.day} · {s.time}
                    </p>
                  );
                })}
              </div>

              <div>
                <Label htmlFor="tour-name" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Full Name *</Label>
                <Input id="tour-name" value={fullName} onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: undefined })); }} required className={cn("mt-1 h-10 rounded-none", errors.fullName && "border-red-500")} placeholder="Jane Doe" />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <Label htmlFor="tour-email" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Email</Label>
                <Input id="tour-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }} required className={cn("mt-1 h-10 rounded-none", errors.email && "border-red-500")} placeholder="you@example.com" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="tour-phone" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Phone *</Label>
                <Input id="tour-phone" type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })); }} required className={cn("mt-1 h-10 rounded-none", errors.phone && "border-red-500")} placeholder="+1 (555) 000-0000" />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="tour-msg" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Message <span className="normal-case text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="tour-msg"
                  ref={msgRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    const el = msgRef.current;
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = `${el.scrollHeight}px`;
                    }
                  }}
                  className="mt-1 resize-none overflow-hidden rounded-none"
                  placeholder="Any specific questions or requests?"
                />
              </div>
            </form>
          )}
        </div>

        {/* Sticky CTA */}
        <div className="px-4 py-3 border-t border-menu-foreground/10 bg-[#00101f] text-menu-foreground">
          {step === 'schedule' ? (
            <Button
              type="button"
              onClick={() => setStep('details')}
              className="w-full h-[45px] rounded-none bg-transparent border border-menu-foreground/40 text-menu-foreground hover:bg-menu-foreground/10 font-bold text-base"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              form="tour-details-form"
              disabled={submitting}
              className="w-full h-14 rounded-none bg-menu-foreground text-menu hover:bg-menu-foreground/90 font-bold text-base disabled:opacity-40"
            >
              {submitting ? 'Submitting…' : 'Request this tour'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TourDialog;
