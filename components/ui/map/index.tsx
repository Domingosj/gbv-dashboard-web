"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const MapContext = createContext<L.Map | null>(null);
export const useMap = () => useContext(MapContext);

interface MapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
  children?: ReactNode;
}

export function Map({ center, zoom = 8, className = "h-[500px] w-full rounded-2xl border border-border", children }: MapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || map) return;
    const instance = L.map(ref.current).setView(center, zoom);
    setMap(instance);
    return () => { instance.remove(); };
  }, []);

  return (
    <div ref={ref} className={className}>
      {map && <MapContext.Provider value={map}>{children}</MapContext.Provider>}
    </div>
  );
}

export function MapTileLayer({ url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution = "&copy; OpenStreetMap" }: {
  url?: string;
  attribution?: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const layer = L.tileLayer(url, { attribution }).addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map, url, attribution]);
  return null;
}

interface MarkerProps {
  position: [number, number];
  popup?: string;
  icon?: L.DivIcon;
}

export function MapMarker({ position, popup, icon }: MarkerProps) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const marker = icon
      ? L.marker(position, { icon })
      : L.marker(position);
    if (popup) marker.bindPopup(popup);
    marker.addTo(map);
    return () => { map.removeLayer(marker); };
  }, [map, position[0], position[1]]);
  return null;
}

interface ClusterGroupProps {
  children?: ReactNode;
  showCoverageOnHover?: boolean;
  icon?: (count: number) => ReactNode;
}

export function MapMarkerClusterGroup({ children }: ClusterGroupProps) {
  return <>{children}</>;
}

export function createCountIcon(count: number): L.DivIcon {
  const color = count > 20 ? "#C65A5A" : count > 10 ? "#D9A441" : "#256B5A";
  return L.divIcon({
    html: `<div style="background:${color};color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15)">${count}</div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}
