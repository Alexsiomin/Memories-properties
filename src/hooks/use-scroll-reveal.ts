import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Adds `is-visible` class to elements with `.reveal` once they enter the viewport.
 * Re-scans on route change AND on DOM mutations so lazy/Suspense-mounted sections
 * also reveal correctly.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const observed = new WeakSet<Element>();
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    let safety: number | null = null;

    const scan = () => {
      const targets = Array.from(root.querySelectorAll<HTMLElement>('.reveal')).filter(
        (el) => !observed.has(el) && !el.classList.contains('is-visible')
      );
      if (!targets.length) return;

      targets.forEach((el) => {
        const delay = el.dataset.revealDelay;
        if (delay) el.style.transitionDelay = `${delay}ms`;

        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
        if (inView) {
          el.classList.add('is-visible');
        } else if (io) {
          io.observe(el);
          observed.add(el);
        }
      });
    };

    const start = window.setTimeout(() => {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io?.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
      );

      scan();

      // Re-scan whenever new nodes (e.g. lazy/Suspense sections) are added
      mo = new MutationObserver(() => scan());
      mo.observe(root, { childList: true, subtree: true });

      // Safety net: after 2s reveal anything still hidden
      safety = window.setTimeout(() => {
        root
          .querySelectorAll<HTMLElement>('.reveal:not(.is-visible)')
          .forEach((el) => el.classList.add('is-visible'));
      }, 2000);
    }, 50);

    return () => {
      window.clearTimeout(start);
      if (safety) window.clearTimeout(safety);
      io?.disconnect();
      mo?.disconnect();
    };
  }, [pathname]);

  return ref;
}
