import { useEffect, useRef } from 'react';

interface Props {
  text: string;
  /** rendered font size in px on canvas (controls visual size) */
  fontSize?: number;
  /** spacing between sampled dots (smaller = denser) */
  density?: number;
  /** dot radius in px */
  dotSize?: number;
  /** cursor influence radius */
  mouseRadius?: number;
  /** how strongly dots are pushed away */
  force?: number;
  className?: string;
  color?: string;
  accentColor?: string;
  /** index ranges (start, end) to render in accent color */
  accentRanges?: Array<[number, number]>;
  /** play a one-time intro: dots start scattered (bubble) then coalesce into the text */
  intro?: boolean;
  style?: React.CSSProperties;
}

interface Particle {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  color: string;
}

/**
 * Particle/dot text with magnetic-repel cursor interaction (Yalantis-style).
 * Samples the rendered text on an offscreen canvas, then animates dots that
 * scatter away from the pointer and elastically return to their letter origin.
 */
const ParticleText = ({
  text,
  fontSize = 110,
  density = 5,
  dotSize = 1.8,
  mouseRadius = 90,
  force = 40,
  className = '',
  color = '#ffffff',
  accentColor,
  accentRanges = [],
  intro = false,
  style,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const rafRef = useRef<number | null>(null);
  const dprRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;

    const font = `800 ${fontSize}px Montserrat, ui-sans-serif, system-ui, sans-serif`;

    // Keep the perceived dot density constant across screen sizes. The `density`
    // prop is authored against a reference font size; when the text renders
    // smaller (e.g. on phones) we scale the sample step down by the same ratio
    // so each glyph keeps roughly the same number of dots regardless of size.
    const REFERENCE_FONT_SIZE = 110;
    const sizeRatio = fontSize / REFERENCE_FONT_SIZE;
    const effectiveDensity = Math.max(2, Math.round(density * sizeRatio));

    // Measure text using an offscreen canvas
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d')!;
    offCtx.font = font;
    // Uniform margin around the text so dots pushed by the cursor — plus the
    // dot radius itself — never get clipped at any edge of the canvas. The
    // cursor-driven terms scale with the same ratio so the padding stays
    // proportional to the rendered text instead of dwarfing small versions.
    const margin = Math.ceil(
      (force * 0.5 + mouseRadius * 0.35) * sizeRatio + dotSize + fontSize * 0.08,
    );

    // Per-letter widths so we can color-match accent ranges
    const charWidths = text.split('').map((c) => offCtx.measureText(c).width);
    const totalWidth = charWidths.reduce((a, b) => a + b, 0);
    const width = Math.ceil(totalWidth + margin * 2);
    const height = Math.ceil(fontSize * 1.4 + margin * 2);

    off.width = width;
    off.height = height;
    offCtx.font = font;
    offCtx.textBaseline = 'middle';
    offCtx.fillStyle = '#fff';

    // Draw each char and remember its pixel x-range
    const charRanges: Array<{ start: number; end: number }> = [];
    let cursorX = margin;
    for (let i = 0; i < text.length; i++) {
      const w = charWidths[i];
      offCtx.fillText(text[i], cursorX, height / 2);
      charRanges.push({ start: cursorX, end: cursorX + w });
      cursorX += w;
    }

    const isAccent = (charIdx: number) =>
      accentRanges.some(([a, b]) => charIdx >= a && charIdx < b);

    // Sample pixels
    const img = offCtx.getImageData(0, 0, width, height);
    const particles: Particle[] = [];
    for (let y = 0; y < height; y += effectiveDensity) {
      for (let x = 0; x < width; x += effectiveDensity) {
        const idx = (y * width + x) * 4 + 3; // alpha
        if (img.data[idx] > 128) {
          // find which char this pixel belongs to
          let charIdx = 0;
          for (let i = 0; i < charRanges.length; i++) {
            if (x >= charRanges[i].start && x < charRanges[i].end) {
              charIdx = i;
              break;
            }
          }
          particles.push({
            x,
            y,
            ox: x,
            oy: y,
            vx: 0,
            vy: 0,
            color: isAccent(charIdx) && accentColor ? accentColor : color,
          });
        }
      }
    }
    particlesRef.current = particles;

    // One-time intro: scatter dots as floating "bubbles" that then coalesce into
    // the letter. Uses sessionStorage so it only plays on the first visit.
    const introKey = `particletext-intro-${text}`;
    let introPending =
      intro &&
      typeof window !== 'undefined' &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches &&
      !sessionStorage.getItem(introKey);
    if (introPending) {
      for (const p of particles) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(width, height) * (0.4 + Math.random() * 0.6);
        p.x = width / 2 + Math.cos(angle) * radius;
        p.y = height / 2 + Math.sin(angle) * radius;
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = (Math.random() - 0.5) * 2;
      }
    }

    // Setup display canvas (full-res buffer, but allow CSS to shrink to fit)
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = style?.width ? String(style.width) : `${width}px`;
    canvas.style.height = style?.height ? String(style.height) : 'auto';
    canvas.style.maxWidth = style?.maxWidth ? String(style.maxWidth) : '100%';
    canvas.style.aspectRatio = style?.aspectRatio
      ? String(style.aspectRatio)
      : `${width} / ${height}`;
    ctx.scale(dpr, dpr);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Draw the dots once in their resting position (used for reduced-motion
    // and as the static frame whenever the loop is asleep).
    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.ox, p.oy, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let isVisible = false;
    let running = false;

    const setFromClient = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width ? width / rect.width : 1;
      const scaleY = rect.height ? height / rect.height : 1;
      mouseRef.current = { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      const mouse = mouseRef.current;
      const r2 = mouseRadius * mouseRadius;
      let maxEnergy = 0;

      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < r2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = ((mouseRadius - d) / mouseRadius) * force;
          p.vx += (dx / d) * f * 0.2;
          p.vy += (dy / d) * f * 0.2;
        }
        // spring back to origin
        p.vx += (p.ox - p.x) * 0.06;
        p.vy += (p.oy - p.y) * 0.06;
        // damping
        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;

        const energy = Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.ox - p.x) + Math.abs(p.oy - p.y);
        if (energy > maxEnergy) maxEnergy = energy;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sleep when everything has settled and the pointer is away — avoids
      // burning a rAF/redraw every frame while nothing is moving.
      const pointerAway = mouse.x < -9000;
      if (maxEnergy < 0.05 && pointerAway) {
        running = false;
        rafRef.current = null;
        drawStatic();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (running || !isVisible || prefersReducedMotion) return;
      running = true;
      rafRef.current = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const onMove = (e: PointerEvent) => {
      if (!isVisible || prefersReducedMotion) return;
      setFromClient(e.clientX, e.clientY);
      startLoop();
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    // Touch: track finger over the canvas and prevent the page from scrolling
    const onTouch = (e: TouchEvent) => {
      if (prefersReducedMotion) return;
      const t = e.touches[0];
      if (!t) return;
      const rect = canvas.getBoundingClientRect();
      if (
        t.clientX >= rect.left &&
        t.clientX <= rect.right &&
        t.clientY >= rect.top &&
        t.clientY <= rect.bottom
      ) {
        e.preventDefault();
      }
      setFromClient(t.clientX, t.clientY);
      startLoop();
    };

    // Only run the animation while the canvas is actually on screen.
    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
        if (isVisible && introPending) {
          introPending = false;
          try {
            sessionStorage.setItem(introKey, '1');
          } catch {
            /* ignore */
          }
          startLoop();
        }
        if (!isVisible) stopLoop();
      },
      { rootMargin: '100px' },
    );
    io.observe(canvas);

    // Initial paint. When the intro is pending, paint the scattered ("bubble")
    // positions so the first frame isn't the finished letter; otherwise paint
    // the resting text.
    if (introPending) {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      drawStatic();
    }

    if (!prefersReducedMotion) {
      window.addEventListener('pointermove', onMove, { passive: true });
      canvas.addEventListener('pointerleave', onLeave);
      canvas.addEventListener('touchstart', onTouch, { passive: false });
      canvas.addEventListener('touchmove', onTouch, { passive: false });
      canvas.addEventListener('touchend', onLeave);
      canvas.addEventListener('touchcancel', onLeave);
    }

    return () => {
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('touchstart', onTouch);
      canvas.removeEventListener('touchmove', onTouch);
      canvas.removeEventListener('touchend', onLeave);
      canvas.removeEventListener('touchcancel', onLeave);
      stopLoop();
    };
  }, [text, fontSize, density, dotSize, mouseRadius, force, color, accentColor, accentRanges, intro, style]);

  return <canvas ref={canvasRef} className={className} style={{ touchAction: 'none', ...style }} />;
};

export default ParticleText;
