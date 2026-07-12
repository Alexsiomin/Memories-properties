import { useState, useEffect, useCallback } from 'react';

export type Platform = 'ios' | 'android' | 'web';

interface PlatformInfo {
  platform: Platform;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isCapacitor: boolean;
}

function getPlatformFromUA(): Platform {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';

  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'web';
}

function detectCapacitor(): boolean {
  return typeof (window as any)?.Capacitor !== 'undefined';
}

/**
 * Detects the user's platform (iOS, Android, or Web) using User-Agent sniffing.
 * Also detects if running inside a Capacitor native wrapper.
 *
 * Usage:
 *   const { isIOS, isAndroid, isMobile, platform } = usePlatform();
 *
 *   if (isIOS)     → show App Store badge / iOS-specific UI
 *   if (isAndroid) → show Play Store badge / Android-specific UI
 *   if (isMobile)  → either iOS or Android
 *   if (isDesktop) → neither
 */
export function usePlatform(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>(() => {
    const platform = getPlatformFromUA();
    const isCapacitor = detectCapacitor();
    return {
      platform,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isMobile: platform === 'ios' || platform === 'android',
      isDesktop: platform === 'web',
      isCapacitor,
    };
  });

  const refresh = useCallback(() => {
    const platform = getPlatformFromUA();
    const isCapacitor = detectCapacitor();
    setInfo({
      platform,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isMobile: platform === 'ios' || platform === 'android',
      isDesktop: platform === 'web',
      isCapacitor,
    });
  }, []);

  useEffect(() => {
    // Re-check on visibilitychange in case the web view changes underneath
    const onVis = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refresh]);

  return info;
}
