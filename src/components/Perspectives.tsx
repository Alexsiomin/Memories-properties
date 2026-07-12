import { Link } from 'react-router-dom';
import Thumbnail from '@/components/Thumbnail';
import residential from '@/assets/proj-residential.jpg';
import vineyard from '@/assets/proj-vineyard.jpg';
import coastal from '@/assets/proj-coastal.jpg';
import mixed from '@/assets/proj-mixed.jpg';

const ITEMS = [
  {
    img: residential,
    cat: 'Residential Development',
    title: 'Two-Tower Build-to-Rent Scheme, Northern District',
    meta: '186 Units · Closed 2025',
  },
  {
    img: vineyard,
    cat: 'Agricultural Estate',
    title: 'Working Vineyard with Conversion Potential',
    meta: '94 Hectares · Under Offer',
  },
  {
    img: coastal,
    cat: 'Coastal Land',
    title: 'Cliff-Top Plot with Tourism Permit',
    meta: '12 Hectares · Available',
  },
  {
    img: mixed,
    cat: 'Mixed-Use',
    title: 'Civic-Adjacent Office and Retail Asset',
    meta: '8,400 m² · Closed 2024',
  },
];

const Perspectives = () => {
  return (
    <section className="mt-20 border-t-2 border-foreground pt-12" id="land">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-12 reveal">
        <div>
          <span className="label text-accent">Selected Work</span>
          <h2 className="text-4xl font-semibold mt-2">Recent Projects</h2>
        </div>
        <Link to="/properties" className="story-link label text-foreground inline-flex items-center px-6 py-3 rounded-full border border-foreground/20 hover:bg-foreground hover:text-background transition-colors">
          View Full Portfolio →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {ITEMS.map((item, i) => (
          <article
            key={item.title}
            className="group cursor-pointer reveal"
            data-reveal-delay={String(i * 120)}
          >
            <div className="img-hover bg-muted mb-4">
              <Thumbnail
                src={item.img}
                alt={item.title}
                width={800}
                height={1000}
                wrapperClassName="aspect-[4/3]"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <span className="label text-accent">{item.cat}</span>
            <h4 className="text-lg font-semibold leading-tight mt-2 group-hover:text-accent transition-colors">
              {item.title}
            </h4>
            <p className="label text-foreground/40 mt-2">{item.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Perspectives;
