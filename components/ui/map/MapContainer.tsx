"use client";

import { useEffect, useRef } from "react";
import { getCoord, fuzzyCoord, findUnmapped } from "@/lib/map-data";

interface Props { markers: { label: string; count: number }[] }

export default function MapContainer({ markers }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current || !ref.current) return;
    if (!markers || markers.length === 0) return;

    let map: any = null;

    const load = async () => {
      try {
        // 1. Load Leaflet CSS via link tag (most reliable)
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
        document.head.appendChild(link);

        // 2. Import Leaflet JS
        const L = (await import("leaflet")).default;

        // Fix default icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        map = L.map(ref.current!, { zoomControl: true }).setView([-17.5, 36.5], 6);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        const points: { position: [number, number]; label: string; count: number }[] = [];
        const unmapped: string[] = [];
        for (const m of markers) {
          const coord = getCoord(m.label) || fuzzyCoord(m.label);
          if (coord) points.push({ position: coord, label: m.label, count: m.count });
          else unmapped.push(m.label);
        }
        if (unmapped.length > 0) console.warn("Unmapped districts:", unmapped.join(", "));

        if (points.length === 0) return;

        const color = (count: number) => count > 20 ? "#C65A5A" : count > 10 ? "#D9A441" : "#256B5A";

        // Try marker clustering
        try {
          await import("leaflet.markercluster");
          const cluster = L.markerClusterGroup({
            chunkedLoading: true,
            showCoverageOnHover: false,
            maxClusterRadius: 50,
            iconCreateFunction: (c: any) => {
              const cnt = c.getChildCount();
              return L.divIcon({
                html: `<div style="background:${color(cnt)};color:white;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.2)">${cnt}</div>`,
                className: "", iconSize: [42, 42], iconAnchor: [21, 21],
              });
            },
          });
          points.forEach((p) => {
            cluster.addLayer(
              L.marker(p.position, {
                icon: L.divIcon({
                  html: `<div style="background:${color(p.count)};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15)">${p.count}</div>`,
                  className: "", iconSize: [32, 32], iconAnchor: [16, 16],
                }),
              }).bindPopup(`<b>${p.label}</b><br/>${p.count} casos`)
            );
          });
          map.addLayer(cluster);
        } catch {
          // Fallback: individual markers
          points.forEach((p) => {
            L.marker(p.position, {
              icon: L.divIcon({
                html: `<div style="background:${color(p.count)};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15)">${p.count}</div>`,
                className: "", iconSize: [32, 32], iconAnchor: [16, 16],
              }),
            }).addTo(map).bindPopup(`<b>${p.label}</b><br/>${p.count} casos`);
          });
        }

        // Fit bounds
        if (points.length > 1) {
          const bounds = L.latLngBounds(points.map(p => [p.position[0], p.position[1]]));
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 7 });
        }

        mapRef.current = map;
      } catch (e) {
        console.error("Map load error:", e);
      }
    };

    load();

    return () => {
      if (map) { try { map.remove(); } catch {} }
      mapRef.current = null;
    };
  }, []);

  if (!markers || markers.length === 0) {
    return <div className="h-[500px] rounded-2xl border border-border bg-gray-50 flex items-center justify-center text-text-secondary">Sem dados para exibir</div>;
  }

  return <div ref={ref} className="h-[500px] w-full rounded-2xl border border-border" />;
}
