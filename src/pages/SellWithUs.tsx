import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowRight, Plus } from 'lucide-react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import {
  Accordion,
  AccordionItem,
  AccordionContent,
} from '@/components/ui/accordion';
import SEO from '@/components/SEO';
import sellHero from '@/assets/sell-hero.jpg';
import sellVilla from '@/assets/cyclopes-map.png.asset.json';
import sellKitchen from '@/assets/sell-kitchen.jpg';
import ParticleText from '@/components/ParticleText';



const valuationSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  email: z.string().trim().email('Invalid email').max(255),
  phone: z.string().trim().min(5, 'Phone is required').max(40),
  message: z.string().trim().max(2000).optional(),
});

const SellWithUs = () => {
  const [form, setForm] = useState({
    firstName: '',
    email: '',
    phone: '',
    message: '',
  });

  const [website, setWebsite] = useState(''); // honeypot

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (website) return;

    const result = valuationSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Please review the form.');
      return;
    }
    toast.success('Request received. Memories will be in touch within two business days.');
    setForm({
      firstName: '',
      email: '',
      phone: '',
      message: '',
    });
  };

  return (
    <>
      <SEO
        title="Sell Your Property With Memories"
        description="Experience the difference with Memories. Expert agents, world-class marketing campaigns, and a commitment to exceptional results across Cyprus."
      />

      {/* ─── Hero ─── */}
      <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
        <img
          src={sellHero}
          alt="Cyprus coastline with turquoise sea"
          className="absolute inset-0 w-full h-full object-cover"
          width={1440}
          height={800}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6 text-center">
          <div className="mb-6">
            <ParticleText text="M" fontSize={161} color="#ffffff" intro />
          </div>
          <h1 className="font-montserrat font-black uppercase tracking-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.1] max-w-5xl">
            Sell your property with Memories
          </h1>
        </div>
      </section>

      {/* ─── Experience the difference ─── */}
      <section className="container mx-auto px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto reveal">
          <h4 className="font-montserrat font-bold text-xl md:text-2xl tracking-tight mb-6 uppercase text-left">
            Experience the difference with Memories
          </h4>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed text-left">
            At Memories, we define prestige property with unrivalled experience, comprehensive local market knowledge, and strategic approaches that consistently deliver exceptional results. Our uniquely tailored services ensure detailed attention and meticulous care in every real estate journey, turning your property aspirations into reality.
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-16 max-w-3xl mx-auto reveal">
          {[
            {
              title: 'Our specialist agents',
              body: 'Our sales specialists are dedicated to exceptional client service and surpassing property expectations. Leveraging innovative marketing and a vast network, we draw maximum interest from genuine buyers globally. Our adept team expertly navigates your property journey, ensuring the optimal outcome for your asset.',
            },
            {
              title: 'World-class property campaigns',
              body: 'Our comprehensive marketing campaigns amplify your property\'s impact with bespoke, high-impact marketing across traditional and digital platforms. Memories specialises in attracting targeted audiences, maximising offers, and ultimately securing the ideal buyer for your property.',
            },
            {
              title: 'A wider reach',
              body: 'Memories\' strategically located offices and expansive network across Cyprus optimise your property\'s exposure. Our reach extends to local, national, and international markets, attracting a diverse range of potential buyers. Informed marketing and strong real estate connections ensure maximum visibility.',
            },
            {
              title: 'Service and communication',
              body: 'Our team prioritises clear communication and regular updates throughout your property\'s sale process, ensuring transparency and responsiveness for a seamless and informed experience, reflecting our commitment to exceptional client service.',
            },
            {
              title: 'Digital strategy',
              body: 'At Memories, our refined digital strategy targets engaged buyers, enhancing your property\'s sale potential. We combine innovative technology with market expertise to ensure your listing reaches the right audience for the best possible results.',
            },
          ].map((item) => (
            <AccordionItem
              key={item.title}
              value={item.title}
              className="border-b border-border/60"
            >
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger className="group flex flex-1 items-center justify-between py-5 text-left">
                  <span className="font-montserrat font-black text-sm md:text-base uppercase tracking-[0.06em] text-foreground">
                    {item.title}
                  </span>
                  <Plus
                    size={20}
                    className="shrink-0 text-foreground transition-transform duration-300 group-data-[state=open]:rotate-45"
                  />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed text-base pb-5">
                  {item.body}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

      </section>

      {/* ─── What is my home worth? ─── */}
      <section className="bg-[#00101f] py-28 md:py-40">
        <div className="container mx-auto px-6 max-w-4xl text-center reveal">
          <h4 className="font-montserrat font-bold uppercase text-xl md:text-2xl mb-6 text-background">
            What is my home worth?
          </h4>
          <p className="text-background/80 text-base md:text-lg leading-relaxed mb-8 text-left">
            If you&apos;re thinking about selling your home in Cyprus, one of the first questions is usually simple: what is my house worth? A confidential property appraisal gives you a clear understanding of your home&apos;s value in today&apos;s Cyprus property market, so you can make informed decisions about whether to sell now or plan for the future.
          </p>
          <p className="text-background/80 leading-relaxed mb-10 text-left">
            At Memories, every appraisal is based on recent local sales, current buyer interest and a real understanding of how homes are performing across Cyprus. This helps you understand not just a price range, but how your property fits into the market right now.
          </p>
          <a
            href="#request-valuation"
            className="btn-cta-solid btn-cta group"
          >
            <span className="story-link-group">
              Request a Valuation
            </span>
            <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>

        </div>
      </section>

      {/* ─── Local Expertise ─── */}
      <section className="container mx-auto px-6 py-20 md:py-28">
        <div className="mb-10 flex justify-center reveal">
          <h5 className="font-montserrat font-extrabold uppercase text-2xl md:text-3xl tracking-tight text-center leading-tight">
            Local Expertise, Market Insight
          </h5>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-20 items-center reveal">
          <div className="img-hover rounded-lg overflow-hidden">
            <img
              src={sellVilla.url}
              alt="Map of property locations across Paphos"
              loading="lazy"
              width={1440}
              height={800}
              className="w-full h-[400px] lg:h-[560px] object-cover"
            />
          </div>
          <div>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Knowing the value of your home means understanding both your local area and the wider Cyprus property market. Memories works across Paphos and Limassol, allowing us to provide accurate and relevant advice wherever your house is located.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              We regularly help homeowners in prime locations across the island. This local knowledge, combined with nationwide buyer data, helps ensure your home is priced and positioned correctly when it comes time to sell.
            </p>
            <Link
              to="/properties"
              className="btn-cta btn-cta-sm group"
            >
              <span className="story-link-group">Explore properties</span>
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="bg-secondary/30 py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 reveal">
            <div>
              <blockquote className="text-lg md:text-xl leading-relaxed mb-6">
                &ldquo;We felt informed and confident throughout the sale of our home. The advice around value and timing made the process feel simple and well considered.&rdquo;
              </blockquote>
              <p className="font-montserrat font-extrabold uppercase tracking-[0.1em] text-xs text-muted-foreground">
                Vendor, Paphos
              </p>
            </div>
            <div>
              <blockquote className="text-lg md:text-xl leading-relaxed mb-6">
                &ldquo;The team at Memories made the sale of our home a smooth process. They understood us and our property. They listened to us and provided fantastic service, taking all the stress away from us.&rdquo;
              </blockquote>
              <p className="font-montserrat font-extrabold uppercase tracking-[0.1em] text-xs text-muted-foreground">
                Vendor, Limassol
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Selling Your Home (process) ─── */}
      <section className="container mx-auto px-6 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center mb-16 reveal">
          <h2 className="font-montserrat font-bold uppercase text-2xl md:text-3xl lg:text-4xl tracking-tight mb-4">
            Selling Your Home
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Selling a home doesn&apos;t need to feel overwhelming. Having a clear process helps protect your property&apos;s value and makes the experience more straightforward.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start reveal">
          <div className="overflow-hidden">
            <img
              src={sellKitchen}
              alt="Luxury kitchen interior"
              loading="lazy"
              width={960}
              height={600}
              className="w-full h-[300px] lg:h-[500px] object-cover"
            />
          </div>
          <div className="space-y-10">
            {[
              {
                title: 'Valuation and Strategy',
                body: 'The process begins with understanding your home\'s value and discussing price expectations, timing and how you\'d like to sell, based on recent Cyprus property sales.',
              },
              {
                title: 'Preparing Your Home',
                body: 'You\'ll receive guidance on preparing your house for sale, focusing on simple improvements and presentations that can make a real difference.',
              },
              {
                title: 'Marketing Your Home',
                body: 'Each property is marketed in a way that suits the home, the location and the buyers most likely to be interested, using a mix of digital and traditional channels.',
              },
              {
                title: 'Buyer Engagement',
                body: 'Inspections, enquiries and feedback are managed carefully, with regular updates so you always know how buyers are responding.',
              },
              {
                title: 'Negotiation and Sale',
                body: 'Negotiations are handled with a focus on achieving the best possible outcome for your home, supported by current market insight.',
              },
              {
                title: 'Settlement Support',
                body: 'Support continues through contracts and settlement, ensuring the sale of your property is completed smoothly.',
              },
            ].map((step, i) => (
              <div key={step.title} className="reveal" data-reveal-delay={i * 80}>
                <h3 className="font-montserrat font-extrabold text-sm uppercase tracking-[0.12em] mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cost of Selling FAQ ─── */}
      <section className="bg-secondary/50 py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-4xl reveal">
          <h2 className="font-montserrat font-black text-2xl md:text-3xl lg:text-4xl tracking-normal mb-12 text-center uppercase text-foreground">
            Cost of Selling My House
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: 'How much is my house worth?',
                a: 'A confidential property appraisal gives you a clear understanding of your home\'s value in today\'s Cyprus property market, so you can make informed decisions about whether to sell now or plan for the future.',
              },
              {
                q: 'When is the best time to sell my property?',
                a: 'At Memories, we believe there is no \'right\' time to sell. Instead, our agents use the best insights to ensure that your real estate goals are met.',
              },
              {
                q: 'What costs should I expect when selling my home?',
                a: 'Selling a house usually involves marketing costs, optional services such as photography or styling, and legal or conveyancing fees. These costs are explained clearly so you understand what\'s involved before you decide to sell.',
              },
              {
                q: 'How are selling costs determined?',
                a: 'Costs depend on your home, your location and how the property is marketed. You\'ll receive clear guidance as part of your appraisal.',
              },
              {
                q: 'What does marketing usually include?',
                a: 'Marketing your property may include professional photography, online listings, digital advertising and buyer communication to help your home reach the right audience in Cyprus.',
              },
              {
                q: 'When are costs payable?',
                a: 'Marketing costs are generally paid before the campaign begins. Other costs are finalised once your home is sold.',
              },
              {
                q: 'Are there any hidden costs?',
                a: 'No. The responsibility of paying stamp duty lies solely with the purchaser.',
              },
              {
                q: 'How do I pick the right agent to sell my property?',
                a: 'The right agent is your most important asset when selling. Our agents are experts at understanding your needs in order to exceed your expectations.',
              },
            ].map((faq) => (
              <AccordionItem key={faq.q} value={faq.q} className="border-b border-border/60">
                <AccordionPrimitive.Header className="flex">
                  <AccordionPrimitive.Trigger className="group flex flex-1 items-center justify-between gap-4 py-5 font-montserrat font-black text-sm uppercase tracking-[0.08em] text-left transition-all">
                    {faq.q}
                    <Plus className="h-5 w-5 shrink-0 text-foreground/70 transition-transform duration-300 group-data-[state=open]:rotate-45" />
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── Request A Valuation Form ─── */}
      <section id="request-valuation" className="container mx-auto px-6 py-20 md:py-28">
        <div className="max-w-3xl mx-auto reveal">
          <h4 className="font-montserrat font-bold uppercase text-xl md:text-2xl tracking-tight mb-12 text-center">
            Request a valuation
          </h4>

          <form onSubmit={onSubmit} className="space-y-5">
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


            {/* Name / Email / Phone */}
            <FloatingField label="First Name" required value={form.firstName} onChange={(v) => update('firstName', v)} />

            <FloatingField label="Email" type="email" required value={form.email} onChange={(v) => update('email', v)} />
            <FloatingField label="Phone" type="tel" required value={form.phone} onChange={(v) => update('phone', v)} />

            <FloatingField label="Message (Optional)" textarea value={form.message} onChange={(v) => update('message', v)} />


            <button
              type="submit"
              className="btn-cta-solid btn-cta group w-full md:w-1/3"
            >
              <span className="story-link-group">Send Enquiry</span>
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </form>
        </div>
      </section>

      {/* ─── Property Insights ─── */}
      <section className="bg-secondary/30 py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-7xl reveal">
          <h2 className="font-montserrat font-black uppercase text-2xl md:text-3xl tracking-tight text-foreground border-b border-foreground/20 pb-4 mb-8">
            Property Insights
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-4xl">
            Stay informed with the latest market trends, investment opportunities, and expert advice from the Memories team.
          </p>
          <div className="flex justify-center">
            <Link to="/insights" className="btn-cta group">
              <span className="story-link">View More&nbsp;Insights</span>
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

/* ─── Floating label field (reused from Contact) ─── */
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
  const fieldCls =
    'w-full appearance-none bg-transparent border-0 border-b border-foreground/30 px-0 py-2 text-base text-foreground focus:outline-none focus:border-foreground transition-colors';
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-foreground/80">
        {label}
        {required && <span className="text-accent">*</span>}
      </span>
      {textarea ? (
        <textarea
          rows={3}
          required={required}
          maxLength={2000}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldCls} resize-none`}
        />
      ) : (
        <input
          type={type}
          required={required}
          maxLength={255}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldCls}
        />
      )}
    </label>
  );
};

export default SellWithUs;
