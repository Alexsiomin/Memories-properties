import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import heroAsset from '@/assets/project-expertise-hero.jpg';
import currentProjectsImg from '@/assets/new-development.jpg';
import soldProjectsImg from '@/assets/proj-coastal.jpg';
import buyerFaqsImg from '@/assets/project-buyer-faqs-hero.jpg';

const BODY_PARAGRAPHS = [
  'At Memories Properties, we believe successful developments are built on more than exceptional design and construction — they are built on strategic planning, market understanding, and trusted partnerships.',
  'From the beginning, our approach has been based on one clear principle: to become an extension of our clients’ team, working alongside developers to maximise value, reduce risk, and deliver projects that meet genuine market demand.',
  'We understand that every developer has three key priorities: bringing projects to market efficiently, achieving the strongest possible returns, and navigating the development process with confidence and peace of mind. Our role is to provide the market knowledge, strategic guidance, and professional network required to achieve these objectives.',
  'Our involvement often begins at the earliest stages of a project, including site evaluation and acquisition. By analysing location, planning potential, market trends, and buyer expectations, we help identify opportunities with long-term value while avoiding locations or concepts that may not align with market demand.',
  'With extensive experience in the Cyprus property market, our team understands what buyers are looking for today — and what factors influence purchasing decisions. This insight allows us to guide developers in creating properties that are not only well designed but also positioned correctly for successful sales.',
  'At Memories Properties, we carefully select the professionals and partners we collaborate with. Our network includes experienced architects, contractors, quantity surveyors, engineers, project managers, and other industry specialists with established track records and many years of proven expertise. Every partner we work with shares our commitment to quality, reliability, and professional integrity.',
  'We understand that every development carries the reputation of everyone involved — from the developer to the architect and construction team. For this reason, we work only with professionals who stand behind their work and deliver to the highest standards.',
  'Together, through experience, collaboration, and a shared commitment to excellence, Memories Properties helps transform development opportunities into successful projects that create lasting value for investors, owners, and communities.',
];

const LINKS = [
  {
    title: 'Current Projects',
    to: '/developments',
    image: currentProjectsImg,
    alt: 'Current development projects in Cyprus',
  },
  {
    title: 'Sold Projects',
    to: '/sold-projects',
    image: soldProjectsImg,
    alt: 'Sold development projects in Cyprus',
  },
  {
    title: 'Project Buyer FAQs',
    to: '/project-buyer-faqs',
    image: buyerFaqsImg,
    alt: 'Project buyer frequently asked questions',
  },
];

const ProjectExpertise = () => {
  return (
    <div>
      <SEO
        title="Project Expertise | Memories"
        description="How Memories Properties works with developers to bring new projects to market across Cyprus."
      />

      {/* ─── Hero ─── */}
      <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
        <img
          src={heroAsset}
          alt="New residential development in Cyprus"
          className="absolute inset-0 w-full h-full object-cover"
          width={1440}
          height={800}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] mb-4">Projects</p>
          <h1 className="font-montserrat font-extrabold uppercase text-3xl sm:text-4xl lg:text-5xl">
            Our Project Expertise
          </h1>
        </div>
      </section>

      {/* ─── Body copy ─── */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-16 pb-10">
        <div className="space-y-6">
          {BODY_PARAGRAPHS.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <div className="flex justify-center pb-16">
        <Link
          to="/contact?intent=project"
          className="inline-block bg-[hsl(212_100%_10%)] text-white text-sm font-semibold uppercase tracking-wide px-8 py-4 hover:bg-[hsl(212_100%_16%)] transition-colors"
        >
          Tell Us About Your Project
        </Link>
      </div>

      {/* ─── Link cards ─── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="group block">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="px-4 py-5 bg-white text-foreground group-hover:bg-[hsl(212_100%_10%)] group-hover:text-white transition-colors">
                <h3 className="font-montserrat font-extrabold uppercase text-base">
                  {item.title}
                </h3>
                <span className="mt-2 inline-block text-sm underline underline-offset-4">
                  View More
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProjectExpertise;
