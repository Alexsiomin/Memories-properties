import Counter from '@/components/Counter';

interface Item {
  ref: string;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  format?: 'comma' | 'plain';
}

const ITEMS: Item[] = [
  { ref: 'A·24', label: 'Hectares under active mandate', value: 1840, format: 'comma' },
  { ref: 'B·11', label: 'Closed transactions, 2020–2026', value: 47 },
  { ref: 'C·07', label: 'Average IRR, completed projects', value: 21.3, decimals: 1, suffix: '%' },
  { ref: 'D·02', label: 'Active investor relationships', value: 38 },
];

const Briefing = () => {
  return (
    <section className="reveal">
      <h4 className="label-lg border-b-2 border-foreground pb-2 mb-6">
        The Practice — At a Glance
      </h4>
      <div className="space-y-7">
        {ITEMS.map((item, i) => (
          <article
            key={item.ref}
            className="flex gap-4 group reveal"
            data-reveal-delay={String(i * 100)}
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/40 shrink-0 mt-1.5">
              {item.ref}
            </span>
            <div className="flex-1">
              <div className="font-semibold text-3xl leading-none group-hover:text-accent transition-colors">
                <Counter
                  value={item.value}
                  decimals={item.decimals}
                  suffix={item.suffix}
                  prefix={item.prefix}
                  format={item.format ?? 'plain'}
                />
              </div>
              <p className="text-sm text-foreground/70 mt-2 leading-snug">
                {item.label}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Briefing;
