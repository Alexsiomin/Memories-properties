import { useCountUp } from '@/hooks/use-count-up';

interface Props {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  format?: 'plain' | 'comma';
}

const Counter = ({ value, decimals = 0, prefix = '', suffix = '', format = 'plain' }: Props) => {
  const { ref, display } = useCountUp(value);
  const formatted =
    format === 'comma'
      ? Math.round(display).toLocaleString('en-US')
      : display.toFixed(decimals);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export default Counter;
