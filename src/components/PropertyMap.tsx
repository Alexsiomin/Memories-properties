import { useEffect, useRef, useState } from "react";
import mapPin from "@/assets/memories-map-pin.png.asset.json";
import { GOOGLE_MAPS_BROWSER_KEY as BROWSER_KEY, GOOGLE_MAPS_TRACKING_ID as TRACKING_ID } from "@/lib/maps-key";

declare global {
  interface Window {
    google?: any;
    __gmapsInitMap?: () => void;
  }
}

// Crops the logo into a circular pin and returns a data URL.
function buildCircleMarker(size = 56): Promise<string> {
  return new Promise((resolve, reject) => {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const px = size * dpr;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no ctx"));
      const r = px / 2;
      // white ring background
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      // clip logo into inner circle (cover-fit), leaving a thin white ring
      const border = px * 0.06;
      ctx.save();
      ctx.beginPath();
      ctx.arc(r, r, r - border, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const scale = Math.max((px - border * 2) / img.width, (px - border * 2) / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, r - w / 2, r - h / 2, w, h);
      ctx.restore();
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = mapPin.url;
  });
}





// Muted, desaturated greyscale theme (matches reference)
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];



let mapsLoading: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.maps?.Map) return Promise.resolve();
  if (mapsLoading) return mapsLoading;

  mapsLoading = new Promise<void>((resolve, reject) => {
    window.__gmapsInitMap = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__gmapsInitMap&channel=${TRACKING_ID}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsLoading;
}

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  zoom?: number;
  className?: string;
  /** When true, map interaction (zoom/pan) is disabled and triggers onLockedInteract. */
  locked?: boolean;
  onLockedInteract?: () => void;
}

export default function PropertyMap({
  latitude,
  longitude,
  title,
  zoom = 13,
  className,
  locked = false,
  onLockedInteract,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.maps) return;
        const position = { lat: latitude, lng: longitude };
        const map = new window.google.maps.Map(containerRef.current, {
          center: position,
          zoom,
          disableDefaultUI: true,
          zoomControl: !locked,
          gestureHandling: locked ? "none" : "cooperative",
          styles: MAP_STYLE,
        });
        const marker = new window.google.maps.Marker({ position, map, title });
        const SIZE = 52;
        buildCircleMarker(SIZE)
          .then((iconUrl) => {
            if (cancelled || !iconUrl) return;
            marker.setIcon({
              url: iconUrl,
              scaledSize: new window.google.maps.Size(SIZE, SIZE),
              anchor: new window.google.maps.Point(SIZE / 2, SIZE / 2),
            });
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, zoom, title, locked]);

  if (failed) return null;

  if (locked) {
    return (
      <div className={className} style={{ position: "relative" }}>
        <div
          ref={containerRef}
          role="img"
          aria-label={title ? `Map showing ${title}` : "Property location map"}
          className="w-full h-full"
        />
        {/* Custom zoom controls that prompt sign-in */}
        <div className="absolute bottom-4 right-4 flex flex-col overflow-hidden rounded-sm shadow-md">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => onLockedInteract?.()}
            className="flex h-10 w-10 items-center justify-center bg-white text-xl font-semibold text-foreground hover:bg-muted border-b border-border"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => onLockedInteract?.()}
            className="flex h-10 w-10 items-center justify-center bg-white text-xl font-semibold text-foreground hover:bg-muted"
          >
            −
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={title ? `Map showing ${title}` : "Property location map"}
      className={className}
    />
  );
}
