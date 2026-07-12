import { Link } from 'react-router-dom';
import investmentsBgAsset from '@/assets/investments-bg.jpg.asset.json';

const About = () => {
  return (
    <section
      id="investments"
      className="mt-20 relative overflow-hidden"
      style={{
        backgroundImage: `url(${investmentsBgAsset.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 px-8 py-28 md:px-16 md:py-40">
        <div className="reveal max-w-3xl mx-auto text-center">
          <h2 className="font-montserrat uppercase tracking-[0.04em] md:tracking-[0.08em] font-bold text-2xl md:text-5xl leading-[1.05] text-white">
            One agent. Long View
          </h2>
          <p className="mt-8 text-sm md:text-base leading-relaxed text-white/85 max-w-[52ch] mx-auto">
            Our unrivalled experience and specialist local knowledge achieve consistently exceptional results. Our commitment to excellence in prestige property is evident in every tailored strategy and successful outcome.
          </p>

          <Link
            to="/about"
            className="story-link inline-block mt-10 label text-lg text-white/90"
          >
            Learn More →
          </Link>

        </div>
      </div>
    </section>
  );
};

export default About;
