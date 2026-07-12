/**
 * Optimize remote images on the fly via wsrv.nl (images.weserv.nl) — a free,
 * globally cached image proxy. External property photos (e.g. from
 * islandbluecyprus.com) are huge uncompressed JPEGs (2MB+ at 2000px); routing
 * them through the proxy resizes + re-encodes them to WebP, cutting transfer
 * size by ~10x.
 *
 * Local/relative assets and already-optimized URLs are returned untouched.
 */
const PROXY = 'https://wsrv.nl/';

export const optimizeImage = (
  src: string | undefined,
  width = 800,
  quality = 72,
): string => {
  if (!src) return src ?? '';
  // Only proxy absolute external http(s) URLs.
  if (!/^https?:\/\//i.test(src)) return src;
  // Don't proxy our own hosted/optimized assets or data URIs.
  if (src.startsWith('data:')) return src;
  try {
    const url = new URL(src);
    const host = window.location.hostname;
    if (url.hostname === host || url.hostname.endsWith('.lovable.app')) {
      return src;
    }
    // wsrv.nl expects the source URL without the scheme on the `url` param.
    const source = `${url.hostname}${url.pathname}${url.search}`;
    const params = new URLSearchParams({
      url: source,
      w: String(width),
      output: 'webp',
      q: String(quality),
      we: '', // "without enlargement" — never upscale small images
    });
    return `${PROXY}?${params.toString()}`;
  } catch {
    return src;
  }
};
