import { useEffect, useRef } from "react";
import { GOOGLE_MAPS_BROWSER_KEY as BROWSER_KEY, GOOGLE_MAPS_TRACKING_ID as TRACKING_ID } from "@/lib/maps-key";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    google?: any;
    __gmapsInitMap?: () => void;
  }
}

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

interface MapLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  /** Center to use when no pin is set yet. Defaults to Cyprus. */
  defaultCenter?: { lat: number; lng: number };
  /** When set, geocode this text and recenter the map on it (does not set a pin). */
  centerQuery?: string;
  className?: string;
}

const CYPRUS = { lat: 34.9, lng: 33.0 };

export default function MapLocationPicker({
  latitude,
  longitude,
  onChange,
  defaultCenter = CYPRUS,
  centerQuery,
  className,
}: MapLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const areaRef = useRef<any>(null);
  const placeMarkerRef = useRef<(lat: number, lng: number) => void>(() => {});
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Init map once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !containerRef.current || !window.google?.maps) return;
      const hasPin = latitude != null && longitude != null;
      const center = hasPin ? { lat: latitude!, lng: longitude! } : defaultCenter;
      const map = new window.google.maps.Map(containerRef.current, {
        center,
        zoom: hasPin ? 15 : 9,
        disableDefaultUI: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      });
      mapRef.current = map;

      const placeMarker = (lat: number, lng: number) => {
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        } else {
          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map,
            draggable: true,
          });
          markerRef.current.addListener("dragend", (e: any) => {
            onChangeRef.current(e.latLng.lat(), e.latLng.lng());
          });
        }
      };
      placeMarkerRef.current = placeMarker;

      if (hasPin) placeMarker(latitude!, longitude!);

      map.addListener("click", (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        placeMarker(lat, lng);
        onChangeRef.current(lat, lng);
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker in sync if lat/lng change externally (e.g. loaded in edit mode)
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    if (latitude == null || longitude == null) return;
    const pos = { lat: latitude, lng: longitude };
    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: pos,
        map: mapRef.current,
        draggable: true,
      });
      markerRef.current.addListener("dragend", (e: any) => {
        onChangeRef.current(e.latLng.lat(), e.latLng.lng());
      });
    }
    mapRef.current.panTo(pos);
  }, [latitude, longitude]);

  // Recenter map when a town/area is selected. The browser Maps key is not
  // authorized for the JS Geocoder, so geocode through the server gateway.
  useEffect(() => {
    if (!centerQuery) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("geocode", {
          body: { address: `${centerQuery}, Cyprus` },
        });
        if (cancelled || error || !data?.location) return;
        await loadGoogleMaps();
        if (cancelled || !mapRef.current || !window.google?.maps) return;
        const { lat, lng } = data.location;
        // Clear any previous area overlay.
        if (areaRef.current) {
          areaRef.current.setMap(null);
          areaRef.current = null;
        }
        if (data.viewport?.northeast && data.viewport?.southwest) {
          const bounds = new window.google.maps.LatLngBounds(
            data.viewport.southwest,
            data.viewport.northeast,
          );
          mapRef.current.fitBounds(bounds);
          // Draw the selected area's boundary as a highlighted rectangle.
          areaRef.current = new window.google.maps.Rectangle({
            bounds,
            map: mapRef.current,
            clickable: true,
            strokeColor: "#2563eb",
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: "#2563eb",
            fillOpacity: 0.08,
          });
          // Clicking inside the overlay should still drop/move the pin.
          areaRef.current.addListener("click", (e: any) => {
            const clat = e.latLng.lat();
            const clng = e.latLng.lng();
            placeMarkerRef.current(clat, clng);
            onChangeRef.current(clat, clng);
          });

        } else {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(14);
        }

      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [centerQuery]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 280, borderRadius: "var(--radius)", overflow: "hidden" }}
    />
  );
}
