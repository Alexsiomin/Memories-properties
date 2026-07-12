import { Link, useNavigate } from 'react-router-dom';

const columns: {
  title: string;
  body: string;
  cta: string;
  to: string;
}[] = [
  {
    title: 'Market in Review',
    body: 'Stay a head of the Market with our Quarter Wrap-Up , Paphos and Limassol Sales Results, Giving you Valuable Insights into buyers activity.',
    cta: 'Be alerted',
    to: '/insights',
  },
  {
    title: 'PROPERTY UPDATES',
    body: 'Every month, explore the latest prestige property opportunities, see standout current and sold listings, and gain valuable market insights.',
    cta: 'Register',
    to: '/properties',
  },
  {
    title: 'Projects & Developments',
    body: 'Be the first to discover premium new developments with updates from Memories Projects, including off-the-plan opportunities.',
    cta: 'Keep informed',
    to: '/developments',
  },
  {
    title: 'Property Alerts',
    body: 'Get instant notifications the moment a property matching your criteria hits the market — including exclusive pre-release opportunities.',
    cta: 'Get updates',
    to: '/contact',
  },
];

const StayUpdated = () => {
  const navigate = useNavigate();

  return (
    <section className="stay-updated py-20 sm:py-28">
      <h2 className="font-montserrat uppercase text-3xl sm:text-[2.4rem] leading-none text-foreground text-center">
        Stay Updated
      </h2>

      <div className="mt-14 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-12 px-4 sm:px-6">
        {columns.map((col) => {
          const content = (
            <>
              <h3 className="font-montserrat uppercase text-xl leading-snug text-foreground">
                {col.title}
              </h3>
              <p className="mt-6 flex-1 text-[15px] text-muted-foreground leading-relaxed">
                {col.body}
              </p>
              <span className="story-link mt-8 inline-block text-[15px] text-foreground">
                {col.cta}
              </span>
            </>
          );

          const colClass = 'reveal group flex h-full flex-col text-left';

          if (col.title === 'Property Alerts') {
            return (
              <Link key={col.title} to="/contact" className={colClass}>
                {content}
              </Link>
            );
          }

          return (
            <Link key={col.title} to={col.to} className={colClass}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default StayUpdated;
