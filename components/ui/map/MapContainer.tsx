"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { getCoord, fuzzyCoord } from "@/lib/map-data";
import "leaflet/dist/leaflet.css";

interface Props { markers: { label: string; count: number }[] }

export default function MapContainer({ markers }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const readyRef = useRef(false);
  const markersRef = useRef(markers);
  markersRef.current = markers;
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen || !mapRef.current) return;
    const t = setTimeout(() => mapRef.current.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [isFullscreen]);

  // Initialize map once and then add markers
  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const init = async () => {
      try {
        const L = (await import("leaflet")).default;

        const map = L.map(ref.current!, { zoomControl: true }).setView([-17.5, 36.5], 6);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);

        mapRef.current = map;
        readyRef.current = true;
        addMarkers(map, markersRef.current);
      } catch (e) {
        console.error("Map init error:", e);
      }
    };

    init();

    return () => {
      if (mapRef.current) { try { mapRef.current.remove(); } catch {} }
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // Re-add markers when they change
  useEffect(() => {
    if (!readyRef.current || !mapRef.current) return;
    addMarkers(mapRef.current, markers);
  }, [markers]);

  async function addMarkers(map: any, pts: { label: string; count: number }[]) {
    if (!pts || pts.length === 0) return;
    try {
      map.eachLayer((layer: any) => {
        if (layer._latlng || layer._featureGroup) {
          map.removeLayer(layer);
        }
      });

      const L = (await import("leaflet")).default;

      const points: { position: [number, number]; label: string; count: number }[] = [];
      const unmapped: string[] = [];
      for (const m of pts) {
        const coord = getCoord(m.label) || fuzzyCoord(m.label);
        if (coord) points.push({ position: coord, label: m.label, count: m.count });
        else unmapped.push(m.label);
      }
      if (unmapped.length > 0) console.warn("Unmapped districts:", unmapped.join(", "));
      if (points.length === 0) return;

      const color = (count: number) => count > 20 ? "#C65A5A" : count > 10 ? "#D9A441" : "#256B5A";
      const makeIcon = (count: number, size: number, fontSize: string) => L.divIcon({
        html: `<div style="background:${color(count)};color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${fontSize};font-weight:700;border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.2)">${count}</div>`,
        className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });

      try {
        await import("leaflet.markercluster");
        const cluster = L.markerClusterGroup({
          chunkedLoading: true,
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          iconCreateFunction: (c: any) => makeIcon(c.getChildCount(), 42, "14px"),
        });
        points.forEach((p) => cluster.addLayer(L.marker(p.position, { icon: makeIcon(p.count, 32, "11px") }).bindPopup(`<b>${p.label}</b><br/>${p.count} casos`)));
        map.addLayer(cluster);
      } catch {
        points.forEach((p) => L.marker(p.position, { icon: makeIcon(p.count, 32, "11px") }).addTo(map).bindPopup(`<b>${p.label}</b><br/>${p.count} casos`));
      }

      if (points.length > 1) {
        const L2 = (await import("leaflet")).default;
        map.fitBounds(L2.latLngBounds(points.map(p => [p.position[0], p.position[1]])), { padding: [30, 30], maxZoom: 7 });
      }
    } catch (e) {
      console.error("Map markers error:", e);
    }
  }

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-white"
    : "relative";

  if (!markers || markers.length === 0) {
    return <div className="h-[500px] rounded-2xl border border-border bg-gray-50 flex items-center justify-center text-text-secondary">Sem dados para exibir</div>;
  }

  return (
    <div className={containerClass}>
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
          <span className="text-sm font-medium text-text-secondary">Mapa de Distribuição</span>
          <button onClick={() => setIsFullscreen(false)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-text-secondary" title="Sair da tela cheia">
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      )}
      {!isFullscreen && (
        <div className="flex items-center justify-end mb-2">
          <button onClick={() => setIsFullscreen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-caption text-text-secondary" title="Tela cheia">
            <Maximize2 className="w-3.5 h-3.5" /> Tela cheia
          </button>
        </div>
      )}
      <div ref={ref} className={`${isFullscreen ? "h-screen w-screen" : "h-[500px] w-full"} rounded-2xl border border-border`} />
    </div>
  );
}
