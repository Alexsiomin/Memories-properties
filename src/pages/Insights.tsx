import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import InsightsView from '@/components/InsightsView';

import { useInsights, type InsightRow } from '@/hooks/use-insights';

const FALLBACK_SELECTIVITY: InsightRow[] = [
  { id: '1', section: 'selectivity', label: 'Germasogeia', value: 'Limassol', sub: 'Seafront villa', numeric_value: 12.4, numeric_x: null, numeric_y: null, category: 'Q1 2026', sort_order: 1, is_active: true },
  { id: '2', section: 'selectivity', label: 'Pernera', value: 'Paralimni', sub: 'Beachfront apartment', numeric_value: 3.8, numeric_x: null, numeric_y: null, category: 'Q1 2026', sort_order: 2, is_active: true },
  { id: '3', section: 'selectivity', label: 'Mykonos Town', value: 'Mykonos', sub: 'Cycladic estate', numeric_value: 18.5, numeric_x: null, numeric_y: null, category: 'Q4 2025', sort_order: 3, is_active: true },
];

const SalesTable = ({ title, rows }: { title: string; rows: InsightRow[] }) => {
  if (!rows.length) return null;
  return (
    <section className="w-full px-2 sm:px-6 mt-16 sm:container sm:mx-auto sm:max-w-7xl">
      <h2 className="label text-accent mb-4 text-lg">{title}</h2>
      <div className="border border-[hsl(212_100%_10%)]/15 bg-white">
        <table className="w-full table-fixed text-center text-xs sm:text-base">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[22%]" />
            <col className="w-[28%]" />
            <col className="w-[20%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="bg-[hsl(212_100%_10%)]/[0.04] border-b border-[hsl(212_100%_10%)]/15">
              <th className="px-1.5 sm:px-4 py-2 label text-[hsl(212_100%_10%)]/70 font-medium">#</th>
              <th className="px-1.5 sm:px-4 py-2 label text-[hsl(212_100%_10%)]/70 font-medium">City</th>
              <th className="px-1.5 sm:px-4 py-2 label text-[hsl(212_100%_10%)]/70 font-medium">Type</th>
              <th className="px-1.5 sm:px-4 py-2 label text-[hsl(212_100%_10%)]/70 font-medium">Price</th>
              <th className="px-1.5 sm:px-4 py-2 label text-[hsl(212_100%_10%)]/70 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.id} className="border-b border-[hsl(212_100%_10%)]/10 last:border-0">
                <td className="px-1.5 sm:px-4 py-2 sm:py-3 font-semibold text-accent">{i + 1}</td>
                <td className="px-1.5 sm:px-4 py-2 sm:py-3 break-words">{s.value}</td>
                <td className="px-1.5 sm:px-4 py-2 sm:py-3 break-words">{s.sub}</td>
                <td className="px-1.5 sm:px-4 py-2 sm:py-3 font-semibold whitespace-nowrap">
                  {s.numeric_value != null ? `€${Math.round(Number(s.numeric_value) * 1_000_000).toLocaleString('en-US')}` : '—'}
                </td>
                <td className="px-1.5 sm:px-4 py-2 sm:py-3 break-words">
                  {(() => {
                    const [month, year] = (s.category ?? '').split(/[\s/-]+/);
                    return month && year ? (
                      <span className="flex flex-col leading-tight">
                        <span>{month}</span>
                        <span>{year}</span>
                      </span>
                    ) : (
                      s.category
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const Insights = () => {
  const { data: selectivity } = useInsights('selectivity', FALLBACK_SELECTIVITY);
  const { data: assetMix } = useInsights('asset_mix');
  const { data: priceTrend } = useInsights('price_trend');
  const { data: deals } = useInsights('deals');
  const { data: topApartments } = useInsights('top_apartments');
  const { data: topPlots } = useInsights('top_plots');
  const { data: topNewDevelopments } = useInsights('top_new_developments');

  return (
    <>
      <SEO
        title="Paphos Property Market Insights & Sold Prices | Memories"
        description="Track Paphos real estate trends, recent sales, asset mix and price benchmarks with Memories' market insights."
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Paphos Property Market Insights & Sold Prices',
          description:
            'Track Paphos real estate trends, recent sales, asset mix and price benchmarks with Memories market insights.',
          author: { '@type': 'Organization', name: 'Memories Properties' },
          publisher: {
            '@type': 'Organization',
            name: 'Memories Properties',
            logo: {
              '@type': 'ImageObject',
              url: 'https://memoriesproperties.com/favicon.png',
            },
          },
        }}
      />
      <div
        className="min-h-screen [&_*]:!font-['Outfit',ui-sans-serif,system-ui,sans-serif]"
        style={{
          ['--background' as any]: '0 0% 100%',
          ['--foreground' as any]: '212 100% 10%',
          ['--card' as any]: '0 0% 100%',
          ['--card-foreground' as any]: '212 100% 10%',
          ['--muted' as any]: '212 30% 96%',
          ['--muted-foreground' as any]: '212 100% 25%',
          ['--border' as any]: '212 100% 10% / 0.18',
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
        }}
      >
        <PageHeader
          eyebrow="PAPHOS PROPERTY MARKET INSIGHTS"
          title="“What was recently sold?”"
          
        />
        <div className="container mx-auto px-6 max-w-6xl pt-4 flex justify-center">
          <Link
            to="/insights/limassol"
            className="btn-cta btn-cta-solid group px-4 sm:px-8"
          >
            <span className="story-link whitespace-nowrap">Limassol Market Insights</span> <span aria-hidden>→</span>
          </Link>
        </div>
        <InsightsView
          selectivity={selectivity}
          assetMix={assetMix}
          priceTrend={priceTrend}
          deals={deals}
        />

        <SalesTable title="Most Expensive Resale Apartments" rows={topApartments} />
        <SalesTable title="MOST EXPENSIVE PLOTS SOLD IN PAPHOS" rows={topPlots} />
        <SalesTable title="Top 33 Contact of Sale Transactions In Paphos" rows={topNewDevelopments} />
        <p className="text-center text-sm text-[hsl(212_100%_10%)]/60 mt-2 px-6">
          Source : Department of Lands and Surveys of Cyprus
        </p>

        <div className="container mx-auto px-6 max-w-6xl py-16 flex flex-col items-center gap-4">
          <Link
            to="/insights/limassol"
            className="btn-cta btn-cta-solid group px-4 sm:px-8"
          >
            <span className="story-link whitespace-nowrap">Limassol Market insights</span> <span aria-hidden>→</span>
          </Link>
          <Link
            to="/contact"
            className="btn-cta btn-cta-solid group px-4 sm:px-8"
          >
            <span className="story-link whitespace-nowrap">WORK WITH US</span> <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Insights;
