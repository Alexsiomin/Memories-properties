import { ImgHTMLAttributes, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { optimizeImage } from '@/lib/img';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> & {
  src: string;
  alt: string;
  /** Wrapper className (controls aspect ratio, rounding, etc.) */
  wrapperClassName?: string;
  /** className applied to the <img> */
  className?: string;
  /** Fallback image src if loading fails */
  fallbackSrc?: string;
  /** Target render width (px) used to optimize remote images via the proxy. */
  optimizeWidth?: number;
};

/**
 * Thumbnail with graceful loading state, error fallback, and decode-based
 * preloading. Always renders a placeholder so the card can be opened/clicked
 * even before the image resolves.
 */
const Thumbnail = ({
  src,
  alt,
  wrapperClassName,
  className,
  fallbackSrc = '/placeholder.svg',
  loading = 'lazy',
  decoding = 'async',
  optimizeWidth = 800,
  ...rest
}: Props) => {
  const optimizedSrc = optimizeImage(src, optimizeWidth);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(optimizedSrc);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setStatus('loading');
    setCurrentSrc(optimizedSrc || fallbackSrc);
    if (!optimizedSrc) {
      setStatus('error');
      return;
    }
    // For lazy images, do NOT eagerly preload via new Image() — that forces an
    // immediate network request and defeats native lazy loading. Let the
    // browser load the <img> when it scrolls into view; status is driven by
    // the native onLoad/onError handlers below.
    if (loading === 'lazy') return;

    // Eager images: preload + decode for a smoother first paint.
    const img = new Image();
    img.src = optimizedSrc;
    let cancelled = false;
    const done = () => {
      if (cancelled || !mounted.current) return;
      setStatus('loaded');
    };
    const fail = () => {
      if (cancelled || !mounted.current) return;
      setCurrentSrc(fallbackSrc);
      setStatus('error');
    };
    img.onload = done;
    img.onerror = fail;
    if (typeof img.decode === 'function') {
      img.decode().then(done).catch(() => {
        if (img.complete && img.naturalWidth > 0) done();
      });
    }
    return () => {
      cancelled = true;
    };
  }, [optimizedSrc, fallbackSrc, loading]);

  return (
    <div className={cn('relative overflow-hidden bg-muted', wrapperClassName)}>
      {status === 'loading' && (
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted/60"
        />
      )}
      <img
        {...rest}
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={() => setStatus((s) => (s === 'error' ? s : 'loaded'))}
        onError={() => {
          if (currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
          }
          setStatus('error');
        }}
        className={cn(
          'transition-opacity duration-500',
          status === 'loaded' ? 'opacity-100' : 'opacity-0',
          className,
        )}
        draggable="false"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default Thumbnail;
