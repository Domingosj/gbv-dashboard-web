"use client";

import { useEffect, useRef } from "react";

const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Beira": [-19.8333, 34.8333], "Mueda": [-11.6667, 39.5], "Montepuez": [-13.1167, 39.0],
  "Pemba": [-12.9667, 40.5], "Nampula": [-15.1167, 39.2667], "Quelimane": [-17.8667, 36.8833],
  "Tete": [-16.1667, 33.5833], "Lichinga": [-13.3167, 35.2333], "Chimoio": [-19.1167, 33.4833],
  "Xai-Xai": [-25.05, 33.65], "Inhambane": [-23.8667, 35.3833], "Maputo": [-25.9667, 32.5833],
  "Mocímboa da Praia": [-11.35, 40.3333], "Dondo": [-19.6167, 34.75], "Gorongosa": [-18.6667, 34.0833],
  "Nhamatanda": [-19.2667, 34.2167], "Gondola": [-18.9833, 33.65], "Manica": [-18.9333, 32.8833],
  "Chiúre": [-12.0, 39.8833], "Macomia": [-12.2333, 40.1167], "Balama": [-13.35, 38.5667],
  "Palma": [-10.7833, 40.4667], "Cuamba": [-14.8, 36.55], "Moatize": [-16.1, 33.7167],
  "Angoche": [-16.2333, 39.9167], "Mocuba": [-16.85, 36.9833], "Gurúè": [-15.45, 36.9833],
  "Malema": [-14.95, 37.1], "Changara": [-16.6, 33.0], "Zumbo": [-15.6167, 31.6667],
  "Milange": [-16.1, 35.3], "Marrumeu": [-15.4667, 38.65], "Ribáuè": [-14.95, 38.3167],
  "Mágoe": [-15.3833, 32.75], "Cahora-Bassa": [-15.5833, 32.6833], "Alto Molócuè": [-15.65, 37.6833],
  "Moma": [-16.75, 39.2167], "Mogovolas": [-15.7333, 39.3667], "Mecubúri": [-14.8333, 39.8],
  "Memba": [-14.1667, 40.55], "Eráti": [-14.6833, 40.55], "Nacala": [-14.55, 40.6833],
  "Nacarôa": [-14.4, 40.35], "Rapale": [-14.55, 36.9167], "Mecula": [-12.1, 37.6667],
  "Mavago": [-11.9667, 37.75], "Sanga": [-13.3, 35.7333], "Muembe": [-13.0167, 36.9833],
  "Macanga": [-14.85, 33.5], "Maravia": [-14.9, 32.1333], "Chiuta": [-14.7667, 33.4333],
  "Mecanhelas": [-14.7337, 35.6667], "Mandimba": [-14.3667, 35.7833],
  "Mossuril": [-15.1, 40.0667], "Ilha de Moçambique": [-15.0333, 40.7333],
};

interface Props { markers: { label: string; count: number }[] }

export default function MapContainer({ markers }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current || !ref.current) return;

    const loadMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(ref.current!, { zoomControl: true }).setView([-17.5, 36.5], 6);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const points = markers
        .filter(m => DISTRICT_COORDS[m.label])
        .map(m => ({ position: DISTRICT_COORDS[m.label], label: m.label, count: m.count }));

      // Try marker clustering, fallback to individual markers
      try {
        await import("leaflet.markercluster");
        const cluster = L.markerClusterGroup({
          chunkedLoading: true,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          maxClusterRadius: 50,
          zoomToBoundsOnClick: true,
          iconCreateFunction: (c: any) => {
            const cnt = c.getChildCount();
            const clr = cnt > 15 ? "#C65A5A" : cnt > 8 ? "#D9A441" : "#256B5A";
            return L.divIcon({
              html: `<div style="background:${clr};color:white;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.2)">${cnt}</div>`,
              className: "", iconSize: [42, 42], iconAnchor: [21, 21],
            });
          },
        });

        points.forEach(({ position: [lat, lng], label, count }) => {
          const color = count > 20 ? "#C65A5A" : count > 10 ? "#D9A441" : "#256B5A";
          const icon = L.divIcon({
            html: `<div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15)">${count}</div>`,
            className: "", iconSize: [32, 32], iconAnchor: [16, 16],
          });
          const marker = L.marker([lat, lng], { icon }).bindPopup(`<b>${label}</b><br/>${count} casos`);
          cluster.addLayer(marker);
        });

        map.addLayer(cluster);
      } catch {
        // Fallback: individual markers without clustering
        points.forEach(({ position: [lat, lng], label, count }) => {
          const color = count > 20 ? "#C65A5A" : count > 10 ? "#D9A441" : "#256B5A";
          const icon = L.divIcon({
            html: `<div style="background:${color};color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15)">${count}</div>`,
            className: "", iconSize: [32, 32], iconAnchor: [16, 16],
          });
          L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b>${label}</b><br/>${count} casos`);
        });
      }

      // Fit bounds to markers
      if (points.length > 1) {
        const bounds = L.latLngBounds(points.map(p => [p.position[0], p.position[1]]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 7 });
      }

      mapRef.current = map;
    };

    loadMap();

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  if (!markers || markers.length === 0) {
    return <div className="h-[500px] rounded-2xl border border-border bg-gray-50 flex items-center justify-center text-text-secondary">Sem dados para exibir</div>;
  }

  return <div ref={ref} className="h-[500px] w-full rounded-2xl border border-border" />;
}
