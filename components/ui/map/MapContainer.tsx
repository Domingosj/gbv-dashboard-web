"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { getCoord, fuzzyCoord } from "@/lib/map-data";
import "leaflet/dist/leaflet.css";

interface Props {
  markers: { label: string; count: number }[];
  // heatPoints: one [lat, lng, intensity] per case (pre-computed by caller)
  heatPoints?: [number, number, number][];
}

export default function MapContainer({ markers, heatPoints }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const readyRef = useRef(false);
  const markersRef = useRef(markers);
  const heatRef = useRef(heatPoints);
  markersRef.current = markers;
  heatRef.current = heatPoints;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<"bubbles" | "heat">("bubbles");
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (!isFullscreen || !mapRef.current) return;
    const t = setTimeout(() => mapRef.current.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [isFullscreen]);

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
        renderLayer(map, modeRef.current, markersRef.current, heatRef.current);
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

  useEffect(() => {
    if (!readyRef.current || !mapRef.current) return;
    renderLayer(mapRef.current, mode, markers, heatPoints);
  }, [markers, heatPoints, mode]);

  function clearDataLayers(map: any) {
    map.eachLayer((layer: any) => {
      if (layer._latlng || layer._featureGroup || layer._heat) map.removeLayer(layer);
    });
  }

  async function renderLayer(
    map: any,
    viewMode: "bubbles" | "heat",
    pts: { label: string; count: number }[],
    heat?: [number, number, number][],
  ) {
    try {
      clearDataLayers(map);
      const L = (await import("leaflet")).default;

      // Resolve coordinates for bubble mode (and for heat fallback)
      const resolved: { position: [number, number]; label: string; count: number }[] = [];
      for (const m of pts) {
        const coord = getCoord(m.label) || fuzzyCoord(m.label);
        if (coord) resolved.push({ position: coord, label: m.label, count: m.count });
      }

      if (viewMode === "heat") {
        // Build heat points: use provided heatPoints or fall back to district centroids × count
        let points: [number, number, number][] = [];
        if (heat && heat.length > 0) {
          points = heat;
        } else {
          // Fallback: repeat centroid for each case count
          for (const r of resolved) {
            for (let i = 0; i < r.count; i++) {
              // Slight jitter so points don't stack perfectly
              const jLat = r.position[0] + (Math.random() - 0.5) * 0.3;
              const jLng = r.position[1] + (Math.random() - 0.5) * 0.3;
              points.push([jLat, jLng, 1]);
            }
          }
        }
        if (points.length === 0) return;
        try {
          await import("leaflet.heat");
          const heatLayer = (L as any).heatLayer(points, {
            radius: 35,
            blur: 25,
            maxZoom: 8,
            gradient: { 0.2: "#005243", 0.5: "#FFA70B", 0.8: "#D34053", 1.0: "#7b0000" },
          });
          heatLayer._heat = true;
          map.addLayer(heatLayer);
        } catch (e) {
          console.error("Heat layer error:", e);
        }
      } else {
        // Bubble mode
        if (resolved.length === 0) return;
        const color = (n: number) => n > 100 ? "#C65A5A" : n > 30 ? "#D9A441" : "#256B5A";
        const makeIcon = (n: number, size: number, fs: string) => L.divIcon({
          html: `<div style="background:${color(n)};color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${fs};font-weight:700;border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.2)">${n}</div>`,
          className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        });
        try {
          await import("leaflet.markercluster");
          const cluster = L.markerClusterGroup({
            chunkedLoading: true, showCoverageOnHover: false, maxClusterRadius: 50,
            iconCreateFunction: (c: any) => makeIcon(c.getChildCount(), 42, "14px"),
          });
          resolved.forEach(p => cluster.addLayer(
            L.marker(p.position, { icon: makeIcon(p.count, 32, "11px") })
              .bindPopup(`<b>${p.label}</b><br/>${p.count} casos`)
          ));
          map.addLayer(cluster);
        } catch {
          resolved.forEach(p => L.marker(p.position, { icon: makeIcon(p.count, 32, "11px") })
            .addTo(map).bindPopup(`<b>${p.label}</b><br/>${p.count} casos`));
        }
        if (resolved.length > 1) {
          map.fitBounds(L.latLngBounds(resolved.map(p => p.position)), { padding: [30, 30], maxZoom: 7 });
        }
      }
    } catch (e) {
      console.error("Map render error:", e);
    }
  }

  if (!markers || markers.length === 0) {
    return <div className="h-[500px] rounded-lg border border-outline-variant bg-surface-container-low flex items-center justify-center text-on-surface-variant">Sem dados para exibir</div>;
  }

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50 bg-white" : "relative"}>
      {/* Controls bar */}
      <div className={`flex items-center justify-between ${isFullscreen ? "absolute top-4 left-4 right-4 z-[9999] bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg" : "mb-2"}`}>
        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
          {([["bubbles", "Bolhas"], ["heat", "Calor"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === k ? "bg-white text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
              {l}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsFullscreen(f => !f)}
          className="p-1.5 rounded-md hover:bg-surface-container transition-colors text-on-surface-variant"
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
      <div ref={ref} className={`${isFullscreen ? "h-screen w-screen" : "h-[500px] w-full"} rounded-lg border border-outline-variant`} />
    </div>
  );
}
