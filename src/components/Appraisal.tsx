import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import ValuationDialog from '@/components/ValuationDialog';

const Appraisal = () => {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-[#833219] text-[#F58C35]">
      <div className="container mx-auto px-6 py-28 sm:px-6 sm:py-40 lg:py-52 text-center">
        <h2 className="font-montserrat text-4xl font-extrabold tracking-[0.02em] uppercase sm:text-5xl lg:text-6xl">
          Get a free valuation
        </h2>
        <p className="mt-4 text-xl text-[#F58C35]/80 sm:text-2xl font-light">
          An easy way to find out what your property is worth
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-cta btn-cta-solid mt-10"
        >
          <span>Get Started</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
      <ValuationDialog open={open} onOpenChange={setOpen} />
    </section>
  );
};

export default Appraisal;
