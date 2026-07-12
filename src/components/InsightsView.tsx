
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { InsightRow } from '@/hooks/use-insights';

const REGION_COLORS: Record<string, string> = {
  Cyprus: 'hsl(var(--accent))',
  Greece: 'hsl(var(--primary))',
  Mediterranean: 'hsl(var(--foreground) / 0.55)',
};

interface Props {
  selectivity: InsightRow[];
  assetMix: InsightRow[];
  priceTrend: InsightRow[];
  deals: InsightRow[];
  compact?: boolean;
}

export default function InsightsView({
  selectivity,
  assetMix,
  priceTrend,
  deals,
  compact = false,
}: Props) {
  const ASSET_MIX = assetMix.map((r) => ({ type: r.label ?? '', share: Number(r.numeric_value ?? 0) }));
  const PRICE_TREND = priceTrend.map((r) => ({ quarter: r.label ?? '', value: Number(r.numeric_value ?? 0) }));
  const DEALS = deals.map((r) => ({
    size: Number(r.numeric_x ?? 0),
    days: Number(r.numeric_y ?? 0),
    region: r.category ?? 'Mediterranean',
  }));

  const px = compact ? 'px-4' : 'px-6';
  const heroH = compact ? 'h-56' : 'h-72 md:h-96';
  const barH = compact ? 'h-56' : 'h-72 md:h-80';
  const scatterH = compact ? 'h-64' : 'h-80 md:h-[28rem]';
  const valueText = compact ? 'text-2xl' : 'text-4xl md:text-5xl';
  const sectionTitle = compact ? 'text-lg' : 'text-2xl md:text-3xl';

  return (
    <div
      className="min-h-full"
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

      {/* Top 10 highest transactions */}
      {(() => {
        const top10 = [...selectivity]
          .filter((s) => s.numeric_value != null)
          .sort((a, b) => Number(b.numeric_value) - Number(a.numeric_value))
          .slice(0, 10);
        if (!top10.length) return null;
        return (
          <section className="w-full px-2 sm:px-6 mt-16 sm:container sm:mx-auto sm:max-w-7xl">
            <h2 className="label text-accent mb-4 text-lg">SOLD RESALE HOUSES BY HIGH TO LOW</h2>
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
                  {top10.map((s, i) => (
                    <tr key={s.id} className="border-b border-[hsl(212_100%_10%)]/10 last:border-0">
                      <td className="px-1.5 sm:px-4 py-2 sm:py-3 font-semibold text-accent">{i + 1}</td>
                      <td className="px-1.5 sm:px-4 py-2 sm:py-3 break-words"><span className="story-link">{s.value}</span></td>
                      <td className="px-1.5 sm:px-4 py-2 sm:py-3 break-words">{s.sub}</td>
                      <td className="px-1.5 sm:px-4 py-2 sm:py-3 font-semibold whitespace-nowrap">
                        €{Math.round(Number(s.numeric_value) * 1_000_000).toLocaleString('en-US')}
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
      })()}
    </div>
  );
}
