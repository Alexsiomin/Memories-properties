import { Link } from 'react-router-dom';

const SecondaryFeatures = () => {
  return (
    <section
      id="approach"
      className="relative mt-12 -mx-8 sm:-mx-14 bg-[#00101f] text-white overflow-hidden"
    >
      {/* Dashed cross guidelines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        {/* Horizontal dashed line (centered) */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-white/20" />
        {/* Vertical dashed line (centered) */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l border-dashed border-white/20" />
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 px-12 sm:px-16 py-24 md:py-32">
        {/* Left: Headline */}
        <div className="reveal">
          <h2 className="font-montserrat font-extrabold tracking-tight leading-[1.05] text-2xl sm:text-3xl md:text-4xl">
            Great investments
            <br />
            start with
            <br />
            great insight.
          </h2>
        </div>

        {/* Right: Body + CTA */}
        <div className="reveal flex flex-col justify-center max-w-md" data-reveal-delay="150">
          <p className="text-white/70 text-base sm:text-lg md:text-xl leading-relaxed font-montserrat font-bold break-words text-center sm:text-left">
            Refine your buyer profile to receive tailored alerts for properties that match your preferences, including pre-release and off-market opportunities.
          </p>
          <Link
            to="/insights"
            className="group mt-8 inline-flex items-center justify-center gap-2 px-10 h-[40px] bg-white text-[hsl(222_24%_11%)] font-montserrat font-extrabold text-base hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 self-center"
          >
            <span className="font-montserrat font-extrabold uppercase story-link-group">VIEW</span>
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SecondaryFeatures;
