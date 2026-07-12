import { CSSProperties, ImgHTMLAttributes } from 'react';

/**
 * Responsive <picture> wrapper that serves AVIF -> WebP -> JPG fallback.
 *
 * Pass the imported JPG as `src`. The component derives matching `.webp` /
 * `.avif` URLs from the same Vite-hashed asset path so the build keeps them
 * in sync. Optional `srcSetWidths` enables responsive `srcset` (requires
 * matching `<base>-<w>.webp` / `.avif` files in src/assets).
 */

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  src: string;
  /** Explicit imported WebP/AVIF fallbacks. Required for hashed build assets. */
  webpSrc?: string;
  avifSrc?: string;
  /** Map of width -> explicitly imported image assets. */
  responsive?: { width: number; src: string; webpSrc?: string; avifSrc?: string }[];
  /** sizes attribute for responsive images. */
  sizes?: string;
  /** Optional className applied to the inner <img>. */
  className?: string;
  /** Optional style applied to the inner <img>. */
  style?: CSSProperties;
};

const buildSrcSet = (sources: { width: number; src: string; webpSrc?: string; avifSrc?: string }[], format?: 'webp' | 'avif') =>
  sources
    .map(({ width, src, webpSrc, avifSrc }) => {
      const source = format === 'avif' ? avifSrc : format === 'webp' ? webpSrc : src;
      return source ? `${source} ${width}w` : null;
    })
    .filter(Boolean)
    .join(', ');

const Picture = ({ src, webpSrc, avifSrc, responsive, sizes, className, style, alt = '', ...imgProps }: Props) => {
  if (responsive && responsive.length > 0) {
    const avifSrcSet = buildSrcSet(responsive, 'avif');
    const webpSrcSet = buildSrcSet(responsive, 'webp');

    return (
      <picture>
        {avifSrcSet && <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />}
        {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />}
        <img
          src={src}
          srcSet={buildSrcSet(responsive)}
          sizes={sizes}
          alt={alt}
          className={className}
          style={style}
          {...imgProps}
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
        />
      </picture>
    );
  }

  return (
    <picture>
      {avifSrc && <source type="image/avif" srcSet={avifSrc} />}
      {webpSrc && <source type="image/webp" srcSet={webpSrc} />}
      <img src={src} alt={alt} className={className} style={style} {...imgProps} />
    </picture>
  );
};

export default Picture;
