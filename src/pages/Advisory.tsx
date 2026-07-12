import { useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

import advisorsAsset from '@/assets/advisory-paphos-castle.jpg.asset.json';

const advisorsImg = advisorsAsset.url;


const PAGE_TITLE = 'Property Advocacy in Cyprus';
const PAGE_DESCRIPTION =
  'Expert property advocacy in Cyprus — we represent buyers, source off-market homes, negotiate the best terms, and guide you through every step of the purchase.';

const reasons: { heading: string; body: string }[] = [
  {
    heading: 'Make an informed choice and save your time',
    body: 'Your time is precious — you should not have to spend weeks viewing every listing. To make a fully informed decision on what is available at what price, we inspect, compare, and shortlist so you only see properties worth your attention.',
  },
  {
    heading: 'A team with a solid reputation and track record',
    body: 'We have built a respected reputation among vendors, developers, and selling agents across Cyprus. That standing is invaluable in negotiation — our experience gives you a real advantage when in competition with other buyers.',
  },
  {
    heading: 'We understand every detail, from region to budget',
    body: 'We study the market every day. We know the streets, the developments, and the trends you need to understand before you buy — so you benefit from years of research, knowledge, and a clear read of value.',
  },
  {
    heading: 'Exclusive access to off-market listings',
    body: 'Many of the best properties are sold before they are ever advertised. Our relationships allow us to approach owners who are not formally on the market and negotiate with them directly on your behalf.',
  },
  {
    heading: 'We keep it confidential',
    body: 'When discretion matters, we guarantee that confidence is respected throughout the entire research, inspection, and negotiation process — from first enquiry to completion.',
  },
  {
    heading: 'We work for you, even when you are abroad',
    body: 'For overseas and remote buyers, detailed research, physical inspections, honest feedback, and skilled negotiation by a trusted professional remove the distance — and the stress — from buying in Cyprus.',
  },
];


const ENQUIRY_REASONS = [
  'Buying a home',
  'Buying an investment property',
  'Off-market opportunities',
  'Negotiation & bidding support',
  'Relocating / overseas buyer',
  'General advice',
];

const enquirySchema = z.object({
  reason: z.string().min(1, 'Please choose a reason'),
  name: z.string().trim().min(1, 'Please enter your name').max(80),
  email: z.string().trim().email('Please enter a valid email').max(255),
  details: z.string().trim().max(2000).optional(),
});

const Advisory = () => {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://memoriesproperties.com';

  const [form, setForm] = useState({ reason: '', name: '', email: '', details: '' });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = enquirySchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Please review the form.');
      return;
    }
    const { error } = await supabase.from('contact_submissions').insert({
      type: 'advisory',
      name: result.data.name,
      email: result.data.email,
      subject: result.data.reason,
      message: result.data.details || null,
    });
    if (error) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    toast.success('Request received. Memories will be in touch within two business days.');
    setForm({ reason: '', name: '', email: '', details: '' });
  };

  return (

    <>
      <SEO
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          provider: {
            '@type': 'Organization',
            name: 'Memories Properties',
            logo: { '@type': 'ImageObject', url: `${origin}/favicon.png` },
          },
        }}
      />

      {/* Hero */}
      <section className="relative h-screen min-h-[480px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-[rgb(0,16,31)]" />
        <div className="relative container mx-auto flex h-full flex-col justify-end px-4 sm:px-6 pb-48 sm:pb-56">
          <p className="font-mono uppercase tracking-[0.08em] font-semibold text-4xl sm:text-5xl text-white/80">Advocacy</p>
          <h1 className="mt-3 max-w-3xl font-montserrat font-extrabold tracking-tighter leading-[0.95] text-2xl sm:text-3xl text-white">
            &nbsp;
          </h1>
          <p className="mt-5 max-w-2xl text-lg sm:text-xl text-white/85 leading-snug">
            If you're thinking about buying, a buyer's agent can be your greatest advantage — leveraging market expertise, finding the right property, strategic negotiation, and exclusive insights to help you secure the right property with confidence and the best possible outcome.
          </p>
          <a
            href="#contact"
            className="group mt-8 inline-flex w-full items-center gap-3 border border-white/40 bg-transparent px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-white/10 sm:w-1/2"
          >
            <span>Get in touch</span>
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </a>
        </div>
      </section>

      {/* 01 What is a buyer's advisor */}
      <section className="container mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-montserrat font-extrabold tracking-tight text-2xl sm:text-3xl text-foreground">
              What is a Buyers Agent?
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              A buyer&rsquo;s advisor provides a range of services — property search, appraisal,
              dealing with vendor agents, negotiating the price, arranging inspection reports, and
              general property advice. You decide the level of service you need.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              With one representative looking after your interests, you eliminate much of the stress
              of searching, finding, negotiating on, and securing a property — rather than dealing
              with several different selling agents.
            </p>
          </div>
          <img
            src={advisorsImg}
            alt="Two property advisors reviewing documents"
            width={1200}
            height={1400}
            loading="lazy"
            className="w-full object-cover aspect-[4/5]"
          />
        </div>
      </section>

      {/* 02 Why use a buyer's advisor */}
      <section className="bg-muted/40 py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-montserrat font-extrabold tracking-tight text-2xl sm:text-3xl text-foreground">
            Why should I use a Buyer's Agent?
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {reasons.map((r, i) => (
              <div
                key={r.heading}
                className="border border-border bg-card p-6 sm:p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                  {r.heading}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + enquiry form */}
      <section id="contact" className="bg-[#00101f] text-white">
        <div className="container mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center">
            <h2 className="font-montserrat font-extrabold tracking-tight text-2xl sm:text-3xl">
              Start your property journey.
            </h2>
          </div>

          <form onSubmit={onSubmit} className="mt-10 space-y-5 text-left">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-white/80">
                Reason for enquiry
              </label>
              <select
                id="reason"
                required
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                className="mt-2 w-full rounded-none border border-white/20 bg-white/5 px-4 py-3 text-white outline-none transition-colors focus:border-white/60"
              >
                <option value="" disabled className="text-[hsl(212_100%_10%)]">
                  Select a reason…
                </option>
                {ENQUIRY_REASONS.map((r) => (
                  <option key={r} value={r} className="text-[hsl(212_100%_10%)]">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/80">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-2 w-full rounded-none border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/70 outline-none transition-colors focus:border-white/60"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-2 w-full rounded-none border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/70 outline-none transition-colors focus:border-white/60"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="details" className="block text-sm font-medium text-white/80">
                Details
              </label>
              <textarea
                id="details"
                rows={4}
                value={form.details}
                onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                className="mt-2 w-full rounded-none border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/70 outline-none transition-colors focus:border-white/60"
                placeholder="Tell us what you are looking for…"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="group inline-flex w-full items-center justify-between gap-8 rounded-none border border-white/30 bg-transparent px-6 py-4 font-medium text-white transition-colors hover:bg-white/5"
              >
                <span className="story-link-group">Enquire Now</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </div>
      </section>

    </>
  );
};

export default Advisory;
