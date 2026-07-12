import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.string().trim().email('Please enter a valid email').max(255);

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [formStart] = useState(() => Date.now());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website) return; // bot
    if (Date.now() - formStart < 1500) return; // too fast = bot
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Invalid email.');
      return;
    }
    const { error } = await supabase.from('contact_submissions').insert({
      type: 'newsletter',
      email: result.data,
    });
    if (error) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    toast.success('Request received. Memories Properties will be in touch within two business days.');
    setEmail('');
  };

  return (
    <section className="p-8 rounded-md reveal border border-foreground/15" id="contact">
      
      <p className="text-2xl leading-snug mb-6">
        For introductions, off-market opportunities, and quarterly investment briefings — by request only.
      </p>
      <form
        onSubmit={onSubmit}
        className="border-b border-foreground/30 pb-2 flex justify-between items-center gap-3"
      >
        {/* Honeypot — must remain empty */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          aria-hidden="true"
          style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@private.com"
          className="bg-transparent flex-1 text-sm italic text-foreground placeholder:text-foreground/40 focus:outline-none"
        />
        <button
          type="submit"
          className="label text-accent hover:translate-x-1 transition-transform"
        >
          Submit →
        </button>
      </form>
      <p className="italic text-foreground/70 text-sm mt-6">
        All correspondence treated in confidence.
      </p>
    </section>
  );
};

export default Newsletter;
