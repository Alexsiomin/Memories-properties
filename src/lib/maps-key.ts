// Google Maps browser (publishable) key.
//
// A Maps "browser key" is referrer-restricted, so it is safe to embed in
// client code. We pick the right key based on the host the app is running on:
//
//  - On the custom production domain (memoriesproperties.com), use the
//    project's own key, whose referrer allowlist includes that domain.
//  - On *.lovable.app (the editor preview + the published lovable.app URL),
//    use the Lovable-managed connector key, which is allowlisted for
//    *.lovable.app. The custom key is NOT allowlisted for the preview
//    subdomain, so without this maps render blank in the editor preview.

const CUSTOM_DOMAIN_KEY = "AIzaSyCAaT4RMoV15qQb7hYEBgtFp2PUCnMKAys";

const MANAGED_CONNECTOR_KEY =
  (import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string) || "";

function pickBrowserKey(): string {
  if (typeof window === "undefined") return CUSTOM_DOMAIN_KEY;
  const host = window.location.hostname;
  // Editor preview and published lovable.app URLs.
  if (host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com")) {
    return MANAGED_CONNECTOR_KEY || CUSTOM_DOMAIN_KEY;
  }
  // Custom domain (and anything else, e.g. localhost falls back to custom).
  return CUSTOM_DOMAIN_KEY;
}

export const GOOGLE_MAPS_BROWSER_KEY = pickBrowserKey();

export const GOOGLE_MAPS_TRACKING_ID =
  (import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string) || "";
