"use client";

import { useEffect, useRef } from "react";

interface Props {
  markers: { label: string; count: number }[];
}

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
};

export default function MapContainer({ markers }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !ref.current) return;
    initialized.current = true;

    const loadMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(ref.current!).setView([-17.5, 36.5], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const points = markers
        .filter(m => DISTRICT_COORDS[m.label])
        .map(m => ({ ...m, position: DISTRICT_COORDS[m.label] }));

      points.forEach(({ label, count, position: [lat, lng] }) => {
        const color = count > 20 ? "#C65A5A" : count > 10 ? "#D9A441" : "#256B5A";
        const icon = L.divIcon({
          html: `<div style="background:${color};color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15)">${count}</div>`,
          className: "", iconSize: [34, 34], iconAnchor: [17, 17],
        });
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b>${label}</b><br/>${count} casos`);
      });
    };

    loadMap();
  }, []);

  return <div ref={ref} className="h-[500px] w-full rounded-2xl border border-border" />;
}
