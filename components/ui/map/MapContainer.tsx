"use client";

import { Map, MapTileLayer, MapMarker, MapMarkerClusterGroup, useMap } from "@/components/ui/map";

const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Beira": [-19.8333, 34.8333], "Mueda": [-11.6667, 39.5], "Montepuez": [-13.1167, 39.0],
  "Pemba": [-12.9667, 40.5], "Nampula": [-15.1167, 39.2667], "Quelimane": [-17.8667, 36.8833],
  "Tete": [-16.1667, 33.5833], "Lichinga": [-13.3167, 35.2333], "Chimoio": [-19.1167, 33.4833],
  "Xai-Xai": [-25.05, 33.65], "Inhambane": [-23.8667, 35.3833], "Maputo": [-25.9667, 32.5833],
  "Mocímboa da Praia": [-11.35, 40.3333], "Dondo": [-19.6167, 34.75], "Gorongosa": [-18.6667, 34.0833],
  "Nhamatanda": [-19.2667, 34.2167], "Gondola": [-18.9833, 33.65], "Manica": [-18.9333, 32.8833],
  "Chiúre": [-12.0, 39.8833], "Macomia": [-12.2333, 40.1167], "Balama": [-13.35, 38.5667],
  "Palma": [-10.7833, 40.4667], "Cuamba": [-14.8, 36.55], "Moatize": [-16.1, 33.7167],
};

interface Props { markers: { label: string; count: number }[] }

export default function MapContainer({ markers }: Props) {
  const points = markers
    .filter(m => DISTRICT_COORDS[m.label])
    .map(m => ({ position: DISTRICT_COORDS[m.label] as [number, number], label: m.label, count: m.count }));

  return (
    <Map center={[-17.5, 36.5]} zoom={6}>
      <MapTileLayer />
      <MapMarkerClusterGroup>
        {points.map(({ position, label, count }) => (
          <MapMarker key={label} position={position} popup={`<b>${label}</b><br/>${count} casos`} />
        ))}
      </MapMarkerClusterGroup>
    </Map>
  );
}
