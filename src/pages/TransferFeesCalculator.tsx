import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const fmt = (n: number) =>
  `€${Math.round(n).toLocaleString('en-US')}`;

/**
 * Cyprus property transfer fees (Department of Lands and Surveys).
 * Banded rates applied per owner:
 *   up to €85,000        → 3%
 *   €85,001 – €170,000   → 5%
 *   above €170,000       → 8%
 * A 50% reduction applies to resale (non-VAT) transfers.
 * No transfer fees are payable when VAT was charged on the purchase.
 */
const bandedFee = (value: number) => {
  let fee = 0;
  const b1 = Math.min(value, 85000);
  const b2 = Math.min(Math.max(value - 85000, 0), 85000);
  const b3 = Math.max(value - 170000, 0);
  fee += b1 * 0.03;
  fee += b2 * 0.05;
  fee += b3 * 0.08;
  return fee;
};

const TransferFeesCalculator = () => {
  const [price, setPrice] = useState<string>('300000');
  const [owners, setOwners] = useState<number>(1);
  const [vatPaid, setVatPaid] = useState<boolean>(false);

  const result = useMemo(() => {
    const total = Math.max(parseFloat(price) || 0, 0);
    if (vatPaid) return { gross: 0, fee: 0, perOwner: 0, total };
    const perOwnerValue = total / owners;
    const grossPerOwner = bandedFee(perOwnerValue);
    const gross = grossPerOwner * owners;
    // 50% statutory reduction on resale transfers
    const fee = gross * 0.5;
    return { gross, fee, perOwner: fee / owners, total };
  }, [price, owners, vatPaid]);

  return (
    <>
      <SEO
        title="Cyprus Property Transfer Fees Calculator"
        description="Estimate the property transfer fees payable to the Department of Lands and Surveys of Cyprus, including the 50% resale reduction and VAT exemption."
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to calculate Cyprus property transfer fees',
          description:
            'Estimate the property transfer fees payable to the Department of Lands and Surveys of Cyprus, including the 50% resale reduction and VAT exemption.',
          totalTime: 'PT1M',
          tool: [{ '@type': 'HowToTool', name: 'Cyprus Property Transfer Fees Calculator' }],
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Enter the property price',
              text: 'Type the agreed purchase price of the property in euros into the property price field.',
            },
            {
              '@type': 'HowToStep',
              position: 2,
              name: 'Select the number of owners',
              text: 'Choose how many owners are registered on the title. The price is split per owner so each owner benefits from the lower banded rates.',
            },
            {
              '@type': 'HowToStep',
              position: 3,
              name: 'Indicate whether VAT was paid',
              text: 'Toggle the VAT option. When VAT was charged on the purchase, no transfer fees are payable. Otherwise the banded rates of 3%, 5% and 8% apply.',
            },
            {
              '@type': 'HowToStep',
              position: 4,
              name: 'Read your estimated transfer fees',
              text: 'The calculator applies the statutory 50% resale reduction and shows the total transfer fees and the amount payable per owner.',
            },
          ],
        }}
      />
      <div
        className="min-h-screen [&_*]:!font-['Outfit',ui-sans-serif,system-ui,sans-serif]"
        style={{
          ['--background' as any]: '0 0% 100%',
          ['--foreground' as any]: '212 100% 10%',
          ['--border' as any]: '212 100% 10% / 0.18',
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
        }}
      >
        <PageHeader
          eyebrow="BUYER COSTS"
          title="Transfer Fees Calculator"
          intro="Estimate the property transfer fees payable to the Department of Lands and Surveys of Cyprus."
        />

        <div className="container mx-auto px-6 max-w-3xl py-12 grid gap-10 md:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="price" className="label text-accent">Property price (€)</Label>
              <Input
                id="price"
                type="number"
                inputMode="numeric"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="label text-accent">Number of owners</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setOwners(n)}
                    className={`flex-1 py-3 border text-sm font-semibold transition-colors ${
                      owners === n
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-foreground/20 hover:border-foreground/50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-foreground/60">
                Fees are calculated per owner, which can lower the total.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 border border-foreground/15 px-4 py-3">
              <div>
                <Label htmlFor="vat" className="block text-sm font-semibold">VAT was paid on purchase</Label>
                <p className="text-xs text-foreground/60">New builds with VAT pay no transfer fees.</p>
              </div>
              <Switch id="vat" checked={vatPaid} onCheckedChange={setVatPaid} />
            </div>
          </div>

          {/* Result */}
          <div className="border border-foreground/15 bg-foreground/[0.03] p-6 flex flex-col justify-center">
            <p className="label text-accent">Estimated transfer fees</p>
            <p className="font-montserrat font-extrabold tracking-tighter text-4xl mt-2">
              {fmt(result.fee)}
            </p>
            {!vatPaid && (
              <div className="mt-6 space-y-2 text-sm text-foreground/70">
                <div className="flex justify-between">
                  <span>Fees before reduction</span>
                  <span>{fmt(result.gross)}</span>
                </div>
                <div className="flex justify-between">
                  <span>50% resale reduction</span>
                  <span>− {fmt(result.gross - result.fee)}</span>
                </div>
                <div className="flex justify-between border-t border-foreground/15 pt-2 font-semibold text-foreground">
                  <span>Per owner</span>
                  <span>{fmt(result.perOwner)}</span>
                </div>
                <p className="text-xs text-foreground/50 pt-1">
                  The 50% reduction applies to resale properties only.
                </p>
              </div>
            )}
            {vatPaid && (
              <p className="mt-4 text-sm text-foreground/70">
                No transfer fees are payable when VAT was charged on the purchase.
              </p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-6 max-w-3xl pb-12">
          <h2 className="label text-accent mb-3">How fees are calculated</h2>
          <div className="border border-foreground/15">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-foreground/[0.04] border-b border-foreground/15 text-left">
                  <th className="px-4 py-2 font-medium text-foreground/70">Property value band (per owner)</th>
                  <th className="px-4 py-2 font-medium text-foreground/70 text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-foreground/10">
                  <td className="px-4 py-2">Up to €85,000</td>
                  <td className="px-4 py-2 text-right font-semibold">3%</td>
                </tr>
                <tr className="border-b border-foreground/10">
                  <td className="px-4 py-2">€85,001 – €170,000</td>
                  <td className="px-4 py-2 text-right font-semibold">5%</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Above €170,000</td>
                  <td className="px-4 py-2 text-right font-semibold">8%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-foreground/60 mt-3">
            Estimates only. A 50% reduction applies to resale (non-VAT) transfers and no transfer fees
            are payable on properties subject to VAT. Source: Department of Lands and Surveys of Cyprus.
          </p>
        </div>

        <div className="container mx-auto px-6 max-w-6xl pb-16 flex justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 label hover:bg-accent transition-colors"
          >
            WORK WITH US <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default TransferFeesCalculator;
