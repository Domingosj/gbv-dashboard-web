"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export function renderMapMarkers(map: L.Map, markers: { position: [number, number]; label: string; count: number }[]) {
  markers.forEach(({ position: [lat, lng], label, count }) => {
    const color = count > 20 ? "#C65A5A" : count > 10 ? "#D9A441" : "#256B5A";
    const icon = L.divIcon({
      html: `<div style="background:${color};color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15)">${count}</div>`,
      className: "",
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
    L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b>${label}</b><br/>${count} casos`);
  });
}

export function MapWithData({ markers, center = [-17.5, 36.5] as [number, number], zoom = 6 }: {
  markers: { position: [number, number]; label: string; count: number }[];
  center?: [number, number];
  zoom?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    renderMapMarkers(map, markers);
    return () => { map.remove(); };
  }, []);

  return <div ref={ref} className="h-[500px] w-full rounded-2xl border border-border" />;
}

export default MapWithData;
