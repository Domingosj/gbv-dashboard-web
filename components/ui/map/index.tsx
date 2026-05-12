"use client";

import { useEffect, useRef, useState, createContext, useContext, ReactNode } from "react";
import type { LatLngExpression } from "leaflet";

const MapCtx = createContext<any>(null);
export const useMap = () => useContext(MapCtx);

let leafletPromise: Promise<any> | null = null;

function getL() {
  if (!leafletPromise) {
    leafletPromise = (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      return L;
    })();
  }
  return leafletPromise;
}

export function Map({ center, zoom = 8, className = "h-[500px] w-full rounded-2xl border border-border", children }: {
  center: LatLngExpression; zoom?: number; className?: string; children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    getL().then(L => {
      if (!ref.current || !active) return;
      const m = L.map(ref.current).setView(center, zoom);
      mapRef.current = m;
      setMap(m);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    return () => { if (mapRef.current) mapRef.current.remove(); };
  }, []);

  return <div ref={ref} className={className}>{map && <MapCtx.Provider value={map}>{children}</MapCtx.Provider>}</div>;
}

export function MapTileLayer({ url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution = "&copy; OpenStreetMap" }: {
  url?: string; attribution?: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    getL().then(L => {
      L.tileLayer(url, { attribution }).addTo(map);
    });
  }, [map]);
  return null;
}

export function MapMarker({ position, popup }: {
  position: LatLngExpression; popup?: string;
}) {
  const map = useMap();
  const added = useRef(false);
  useEffect(() => {
    if (!map || added.current) return;
    added.current = true;
    getL().then(L => {
      const marker = L.marker(position);
      if (popup) marker.bindPopup(popup);
      marker.addTo(map);
    });
  }, [map]);
  return null;
}

export function MapMarkerClusterGroup({ children }: {
  children?: ReactNode;
}) {
  return <>{children}</>;
}
