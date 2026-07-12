import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CPI_MONTHS,
  CPI_YEARS,
  CYPRUS_CPI,
  getCpi,
  getLatestCpiDate,
} from '@/data/cyprusCpi';


const fmt = (n: number) => `€${Math.round(n).toLocaleString('en-US')}`;

/**
 * Cyprus property selling expenses + Capital Gains Tax (indicative estimate).
 *
 * Capital Gains Tax follows the Cyprus model:
 *   Capital gain = sale price
 *                  − (purchase price × indexation factor)
 *                  − (additions & renovations × additions indexation factor)
 *   Taxable gain = capital gain
 *                  − legal fees − transfer fees (at purchase)
 *                  − estate agent fees − total loan interest
 *                  − lifetime exemption (€30,000 for a non-residence disposal)
 *   Tax payable  = 20% × max(taxable gain, 0)
 *
 * Indexation factors are entered manually (they depend on the purchase and sale
 * months); leave them at 1 to ignore indexation.
 */
const CGT_RATE = 0.2;
const CGT_EXEMPTION = 30000;
const CGT_RESIDENCE_EXEMPTION = 150000;
const RESIDENCE_MIN_YEARS = 5;
const VAT_RATE = 0.19;
const CALCULATOR_LABEL_CLASS = "block text-sm sm:text-base font-semibold uppercase tracking-[0.04em] leading-snug text-foreground";

const latest = getLatestCpiDate();

const SellingExpensesCalculator = () => {
  // Sale + selling costs
  const [salePrice, setSalePrice] = useState<string>('530000');
  const [commissionPct, setCommissionPct] = useState<string>('4');
  const [commissionVat, setCommissionVat] = useState<boolean>(true);

  // Capital Gains Tax
  const [applyCgt, setApplyCgt] = useState<boolean>(true);
  const [purchasePrice, setPurchasePrice] = useState<string>('380000');

  // Purchase date (drives the indexation factor from the CPI table)
  const [purchaseYear, setPurchaseYear] = useState<number | undefined>(undefined);
  const [purchaseMonth, setPurchaseMonth] = useState<number | undefined>(undefined);

  // Sale / disposal date (defaults to the latest published CPI month)
  const [saleYear, setSaleYear] = useState<number | undefined>(undefined);
  const [saleMonth, setSaleMonth] = useState<number | undefined>(undefined);

  // Additions date (renovations may have been done years after purchase)
  const [additionsYear, setAdditionsYear] = useState<number | undefined>(undefined);
  const [additionsMonth, setAdditionsMonth] = useState<number | undefined>(undefined);

  const [additions, setAdditions] = useState<string>('35000');
  const [legalPct, setLegalPct] = useState<string>('1');
  const [transferFees, setTransferFees] = useState<string>('12000');
  const [loanInterest, setLoanInterest] = useState<string>('35000');
  const [applyExemption, setApplyExemption] = useState<boolean>(true);
  const [yearsLived, setYearsLived] = useState<string>('0');

  const result = useMemo(() => {
    const sale = Math.max(parseFloat(salePrice) || 0, 0);

    const commissionBase = sale * ((parseFloat(commissionPct) || 0) / 100);
    const commission = commissionVat ? commissionBase * (1 + VAT_RATE) : commissionBase;

    const legal = sale * ((parseFloat(legalPct) || 0) / 100);

    // Indexation factor = CPI(sale month) / CPI(purchase month)
    const saleCpi =
      saleYear !== undefined && saleMonth !== undefined
        ? getCpi(saleYear, saleMonth)
        : undefined;
    const purchaseCpi =
      purchaseYear !== undefined && purchaseMonth !== undefined
        ? getCpi(purchaseYear, purchaseMonth)
        : undefined;
    const indexFactor =
      saleCpi && purchaseCpi ? saleCpi / purchaseCpi : 1;

    const additionsCpi =
      additionsYear !== undefined && additionsMonth !== undefined
        ? getCpi(additionsYear, additionsMonth)
        : undefined;
    const additionsIndexFactor =
      saleCpi && additionsCpi ? saleCpi / additionsCpi : 1;

    let cgt = 0;
    let gain = 0;
    let taxableGain = 0;
    let indexedPurchase = 0;
    let indexedAdditions = 0;
    if (applyCgt) {
      const purchase = Math.max(parseFloat(purchasePrice) || 0, 0);
      const add = Math.max(parseFloat(additions) || 0, 0);

      indexedPurchase = purchase * indexFactor;
      indexedAdditions = add * additionsIndexFactor;
      gain = sale - indexedPurchase - indexedAdditions;

      const years = Math.max(parseFloat(yearsLived) || 0, 0);
      const exemptionAmount =
        years >= RESIDENCE_MIN_YEARS ? CGT_RESIDENCE_EXEMPTION : CGT_EXEMPTION;

      const allowances =
        legal +
        Math.max(parseFloat(transferFees) || 0, 0) +
        commission +
        Math.max(parseFloat(loanInterest) || 0, 0) +
        (applyExemption ? exemptionAmount : 0);

      taxableGain = Math.max(gain - allowances, 0);
      cgt = taxableGain * CGT_RATE;
    }

    const total = commission + legal + cgt + (parseFloat(transferFees) || 0);
    return {
      sale,
      commission,
      legal,
      cgt,
      gain,
      taxableGain,
      indexedPurchase,
      indexedAdditions,
      indexFactor,
      additionsIndexFactor,
      total,
      net: sale - commission - legal - cgt,
    };
  }, [
    salePrice,
    commissionPct,
    commissionVat,
    legalPct,
    transferFees,
    loanInterest,
    applyCgt,
    purchasePrice,
    purchaseYear,
    purchaseMonth,
    saleYear,
    saleMonth,
    additions,
    additionsYear,
    additionsMonth,
    applyExemption,
    yearsLived,
  ]);

  return (

    <>
      <SEO
        title="Cyprus Property Selling Expenses Calculator"
        description="Estimate the costs of selling a property in Cyprus: agency commission, Capital Gains Tax (with indexation), legal fees and other charges — and see your net proceeds."
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to calculate the cost of selling a property in Cyprus',
          description:
            'Estimate the costs of selling a property in Cyprus: agency commission, Capital Gains Tax with indexation, legal fees and other charges — and see your net proceeds.',
          totalTime: 'PT3M',
          tool: [{ '@type': 'HowToTool', name: 'Cyprus Property Selling Expenses Calculator' }],
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Enter the sale price and agency commission',
              text: 'Type the expected sale price, then enter your estate agency commission percentage and whether VAT applies to it.',
            },
            {
              '@type': 'HowToStep',
              position: 2,
              name: 'Add your Capital Gains Tax details',
              text: 'Enter the original purchase price, purchase and sale dates for indexation, any additions or renovations, legal fees, transfer fees paid at purchase and total loan interest.',
            },
            {
              '@type': 'HowToStep',
              position: 3,
              name: 'Apply available exemptions',
              text: 'Choose the lifetime exemption that applies — €30,000 for a non-residence disposal, or the larger residence exemption if you lived in the property for the qualifying period.',
            },
            {
              '@type': 'HowToStep',
              position: 4,
              name: 'Review your selling costs and net proceeds',
              text: 'The calculator shows your total selling expenses, estimated Capital Gains Tax at 20% and your net proceeds from the sale.',
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
          eyebrow="SELLER COSTS"
          title="Property Selling Expenses Calculator"
          intro="Estimate the costs of selling your property in Cyprus — including Capital Gains Tax with indexation — and see your net proceeds."
        />

        <div className="container mx-auto px-6 max-w-3xl py-12 grid gap-10 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="sale" className={CALCULATOR_LABEL_CLASS}>Selling Price</Label>
              <Input
                id="sale"
                type="number"
                inputMode="numeric"
                min={0}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="text-lg rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase" className={CALCULATOR_LABEL_CLASS}>Original purchase price (€)</Label>
              <Input
                id="purchase"
                type="number"
                inputMode="numeric"
                min={0}
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label className={CALCULATOR_LABEL_CLASS}>Date property was purchased</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={purchaseMonth !== undefined ? String(purchaseMonth) : ""}
                  onValueChange={(v) => setPurchaseMonth(Number(v))}
                >
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {CPI_MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={purchaseYear !== undefined ? String(purchaseYear) : ""}
                  onValueChange={(v) => setPurchaseYear(Number(v))}
                >
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {CPI_YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className={CALCULATOR_LABEL_CLASS}>Estimated Month of Sale</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={saleMonth !== undefined ? String(saleMonth) : ""}
                  onValueChange={(v) => setSaleMonth(Number(v))}
                >
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {(saleYear !== undefined ? CYPRUS_CPI[saleYear] ?? CPI_MONTHS : CPI_MONTHS).map((_, i) => (
                      <SelectItem key={i} value={String(i)}>{CPI_MONTHS[i]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={saleYear !== undefined ? String(saleYear) : ""}
                  onValueChange={(v) => {
                    const y = Number(v);
                    setSaleYear(y);
                    const max = (CYPRUS_CPI[y]?.length ?? 12) - 1;
                    setSaleMonth((m) => (m !== undefined ? Math.min(m, max) : max));
                  }}
                >
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {CPI_YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-foreground/60">
                Purchase indexation = CPI at sale ÷ CPI at purchase
                = <span className="font-semibold">{result.indexFactor.toFixed(4)}</span>.{' '}
                Additions indexation = CPI at sale ÷ CPI at additions
                = <span className="font-semibold">{result.additionsIndexFactor.toFixed(4)}</span>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additions" className={CALCULATOR_LABEL_CLASS}>Additions &amp; renovations (€)</Label>
              <Input
                id="additions"
                type="number"
                inputMode="numeric"
                min={0}
                value={additions}
                onChange={(e) => setAdditions(e.target.value)}
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label className={CALCULATOR_LABEL_CLASS}>Date additions were completed</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={additionsMonth !== undefined ? String(additionsMonth) : ""}
                  onValueChange={(v) => setAdditionsMonth(Number(v))}
                >
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Month" /></SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {CPI_MONTHS.map((m, i) => (
                      <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={additionsYear !== undefined ? String(additionsYear) : ""}
                  onValueChange={(v) => {
                    const y = Number(v);
                    setAdditionsYear(y);
                    const max = (CYPRUS_CPI[y]?.length ?? 12) - 1;
                    setAdditionsMonth((m) => (m !== undefined ? Math.min(m, max) : max));
                  }}
                >
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {CPI_YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal" className={CALCULATOR_LABEL_CLASS}>Legal fees (%)</Label>
              <Input
                id="legal"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.25"
                value={legalPct}
                onChange={(e) => setLegalPct(e.target.value)}
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission" className={CALCULATOR_LABEL_CLASS}>Estate agent fees (%)</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const val = Math.max(3, (parseFloat(commissionPct) || 0) - 0.5);
                    setCommissionPct(String(val));
                  }}
                  className="absolute left-0 top-0 h-10 w-10 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
                  aria-label="Decrease estate agent fees"
                >
                  −
                </button>
                <Input
                  id="commission"
                  type="number"
                  inputMode="decimal"
                  min={3}
                  step="0.5"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                  className="rounded-none pl-10 pr-10 text-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = Math.min(8, (parseFloat(commissionPct) || 0) + 0.5);
                    setCommissionPct(String(val));
                  }}
                  className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
                  aria-label="Increase estate agent fees"
                >
                  +
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1">
                <Label htmlFor="commission-vat" className="text-sm font-medium">Add 19% VAT on agent fees</Label>
                <Switch id="commission-vat" checked={commissionVat} onCheckedChange={setCommissionVat} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer" className={CALCULATOR_LABEL_CLASS}>Transfer fees at purchase (€)</Label>
              <Input
                id="transfer"
                type="number"
                inputMode="numeric"
                min={0}
                value={transferFees}
                onChange={(e) => setTransferFees(e.target.value)}
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan" className={CALCULATOR_LABEL_CLASS}>Total loan interest (€)</Label>
              <Input
                id="loan"
                type="number"
                inputMode="numeric"
                min={0}
                value={loanInterest}
                onChange={(e) => setLoanInterest(e.target.value)}
                className="rounded-none"
              />
            </div>

            <div className="flex items-center justify-between gap-4 border border-foreground/15 px-4 py-3">
              <div>
                <Label htmlFor="cgt" className="block text-sm font-semibold">Include Capital Gains Tax</Label>
                <p className="text-xs text-foreground/60">20% on the indexed gain, after allowances.</p>
              </div>
              <Switch id="cgt" checked={applyCgt} onCheckedChange={setApplyCgt} />
            </div>

            {applyCgt && (
              <div className="space-y-6 border-l-2 border-accent/40 pl-4">
                <div className="space-y-2">
                  <Label htmlFor="years-lived" className={CALCULATOR_LABEL_CLASS}>Years lived in the property</Label>
                  <Input
                    id="years-lived"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={yearsLived}
                    onChange={(e) => setYearsLived(e.target.value)}
                    className="rounded-none"
                  />
                  <p className="text-xs text-foreground/60">
                    Living {RESIDENCE_MIN_YEARS} or more years as your main residence applies a €150,000 exemption; otherwise the general €30,000 lifetime exemption applies.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="exemption" className="text-sm font-medium">
                    Apply {(parseFloat(yearsLived) || 0) >= RESIDENCE_MIN_YEARS ? '€150,000 residence' : '€30,000 lifetime'} exemption
                  </Label>
                  <Switch id="exemption" checked={applyExemption} onCheckedChange={setApplyExemption} />
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="border border-menu-foreground/15 bg-menu p-6 flex flex-col self-start sticky top-24 h-fit text-menu-foreground">
            <p className="font-mono uppercase tracking-[0.08em] font-semibold text-sm text-menu-foreground">Estimated selling costs</p>
            <p className="font-montserrat font-extrabold tracking-tighter text-4xl mt-2">
              {fmt(result.total)}
            </p>
            <div className="mt-6 space-y-2 text-sm text-menu-foreground/70">
              {applyCgt && (
                <>
                  <div className="flex justify-between">
                    <span>Indexed purchase price</span>
                    <span>{fmt(result.indexedPurchase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indexed additions</span>
                    <span>{fmt(result.indexedAdditions)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-menu-foreground">
                    <span>Capital gain</span>
                    <span>{fmt(result.gain)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable gain</span>
                    <span>{fmt(result.taxableGain)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-menu-foreground">
                    <span>Capital Gains Tax (20%)</span>
                    <span>{fmt(result.cgt)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-menu-foreground/15 pt-2">
                <span>Estate agent fees</span>
                <span>{fmt(result.commission)}</span>
              </div>
              <div className="flex justify-between">
                <span>Legal fees</span>
                <span>{fmt(result.legal)}</span>
              </div>
              <div className="flex justify-between border-t border-menu-foreground/15 pt-2 font-semibold text-menu-foreground text-lg">
                <span>Net proceeds</span>
                <span>{fmt(result.net)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 max-w-3xl pb-12">
          <h2 className="label text-foreground mb-3">How Capital Gains Tax is calculated</h2>
          <div className="border border-foreground/15">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-foreground/[0.04] border-b border-foreground/15 text-left">
                  <th className="px-4 py-2 font-medium text-foreground/70">Step</th>
                  <th className="px-4 py-2 font-medium text-foreground/70 text-right">Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-foreground/10">
                  <td className="px-4 py-2">Indexed purchase price</td>
                  <td className="px-4 py-2 text-right font-semibold">Purchase × indexation factor</td>
                </tr>
                <tr className="border-b border-foreground/10">
                  <td className="px-4 py-2">Indexed additions</td>
                  <td className="px-4 py-2 text-right font-semibold">Additions × indexation factor</td>
                </tr>
                <tr className="border-b border-foreground/10">
                  <td className="px-4 py-2">Capital gain</td>
                  <td className="px-4 py-2 text-right font-semibold">Sale − indexed purchase − indexed additions</td>
                </tr>
                <tr className="border-b border-foreground/10">
                  <td className="px-4 py-2">Taxable gain</td>
                  <td className="px-4 py-2 text-right font-semibold">Gain − allowances − €30,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Tax payable</td>
                  <td className="px-4 py-2 text-right font-semibold">20% × taxable gain</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-foreground/60 mt-3">
            Allowances deducted from the gain include legal fees, transfer fees paid at purchase, estate
            agent fees and total loan interest. Estimates only and not tax or legal advice. Indexation
            factors, allowances and allowable costs vary by case — please consult a licensed professional
            for an exact figure.
          </p>
        </div>

        <div className="container mx-auto px-6 max-w-6xl pb-16 flex justify-center">
          <Link
            to="/contact"
            className="group inline-flex items-center gap-3 bg-foreground text-background px-8 h-[45px] label"
          >
            <span className="story-link">Work with us</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default SellingExpensesCalculator;
