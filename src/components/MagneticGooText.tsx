import { useEffect, useRef } from 'react';

interface Props {
  text: string;
  className?: string;
  /** how strongly each letter is pulled toward the cursor (px at radius edge) */
  strength?: number;
  /** radius (px) within which the letter reacts to the cursor */
  radius?: number;
}

/**
 * Magnetic + gooey hover effect.
 * Each letter is pulled toward the pointer with elastic easing (lerp),
 * and the SVG goo filter makes nearby letters "stick" and stretch like liquid.
 */
const MagneticGooText = ({ text, className = '', strength = 40, radius = 160 }: Props) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);
  const targetsRef = useRef<{ x: number; y: number }[]>([]);
  const currentRef = useRef<{ x: number; y: number }[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const count = text.length;
    targetsRef.current = Array.from({ length: count }, () => ({ x: 0, y: 0 }));
    currentRef.current = Array.from({ length: count }, () => ({ x: 0, y: 0 }));

    const container = containerRef.current;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let isVisible = false;
    let running = false;

    const onMove = (e: PointerEvent) => {
      if (!isVisible) return;
      lettersRef.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < radius) {
          const f = (1 - dist / radius) * strength;
          targetsRef.current[i] = {
            x: (dx / (dist || 1)) * f,
            y: (dy / (dist || 1)) * f,
          };
        } else {
          targetsRef.current[i] = { x: 0, y: 0 };
        }
      });
      startLoop();
    };

    const onLeave = () => {
      targetsRef.current = targetsRef.current.map(() => ({ x: 0, y: 0 }));
      startLoop();
    };

    const tick = () => {
      let maxDelta = 0;
      lettersRef.current.forEach((el, i) => {
        if (!el) return;
        const t = targetsRef.current[i];
        const c = currentRef.current[i];
        c.x += (t.x - c.x) * 0.18;
        c.y += (t.y - c.y) * 0.18;
        const delta = Math.abs(t.x - c.x) + Math.abs(t.y - c.y);
        if (delta > maxDelta) maxDelta = delta;
        el.style.transform = `translate(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px)`;
      });
      // Stop animating once every letter has settled at its target.
      if (maxDelta < 0.1) {
        running = false;
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    function startLoop() {
      if (running || !isVisible || prefersReducedMotion) return;
      running = true;
      rafRef.current = requestAnimationFrame(tick);
    }
    const stopLoop = () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
        if (!isVisible) stopLoop();
      },
      { rootMargin: '100px' },
    );
    if (container) io.observe(container);

    if (!prefersReducedMotion) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerleave', onLeave);
    }

    return () => {
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      stopLoop();
    };
  }, [text, strength, radius]);

  return (
    <>
      {/* SVG goo filter (rendered once; reusable) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <filter id="memories-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <span
        ref={containerRef}
        className={`inline-block ${className}`}
        style={{ filter: 'url(#memories-goo)' }}
      >
        {text.split('').map((ch, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) lettersRef.current[i] = el;
            }}
            className="inline-block will-change-transform"
            style={{ transition: 'transform 0s' }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </span>
    </>
  );
};

export default MagneticGooText;
