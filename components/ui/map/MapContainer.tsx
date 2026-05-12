import { MapContainer as LeafletMap, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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
};

const COLORS = ["#256B5A", "#4B7BE5", "#D9A441", "#C65A5A", "#5E9C8A"];

function createMarkerIcon(count: number): L.DivIcon {
  const color = count > 20 ? "#C65A5A" : count > 10 ? "#D9A441" : "#256B5A";
  return L.divIcon({
    html: `<div style="background:${color};color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15)">${count}</div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

// Sub-component that auto-fits map bounds to markers
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map(c => [c[0], c[1]] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 });
    }
  }, [map, coords.length]);
  return null;
}

// Sub-component for marker cluster using leaflet.markercluster
function ClusterGroup({ markers }: { markers: { position: [number, number]; label: string; count: number }[] }) {
  const map = useMap();
  const clusterRef = useRef<any>(null);

  useEffect(() => {
    let cluster: any;
    let mounted = true;

    (async () => {
      try {
        const MCG = (await import("leaflet.markercluster")).default;
        cluster = L.markerClusterGroup({
          chunkedLoading: true,
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          maxClusterRadius: 50,
          zoomToBoundsOnClick: true,
          iconCreateFunction: (c: any) => {
            const count = c.getChildCount();
            const color = count > 10 ? "#C65A5A" : count > 5 ? "#D9A441" : "#256B5A";
            return L.divIcon({
              html: `<div style="background:${color};color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${count}</div>`,
              className: "",
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            });
          },
        });

        markers.forEach(({ position: [lat, lng], label, count }) => {
          const marker = L.marker([lat, lng], { icon: createMarkerIcon(count) });
          marker.bindPopup(`<b>${label}</b><br/>${count} casos`);
          if (mounted) cluster.addLayer(marker);
        });

        if (mounted) {
          map.addLayer(cluster);
          clusterRef.current = cluster;
        }
      } catch {
        // fallback: add markers directly
        markers.forEach(({ position: [lat, lng], label, count }) => {
          L.marker([lat, lng], { icon: createMarkerIcon(count) })
            .addTo(map)
            .bindPopup(`<b>${label}</b><br/>${count} casos`);
        });
      }
    })();

    return () => { mounted = false; if (clusterRef.current) map.removeLayer(clusterRef.current); };
  }, [map]);

  return null;
}

interface Props { markers: { label: string; count: number }[] }

export default function MapContainer({ markers }: Props) {
  const points = markers
    .filter(m => DISTRICT_COORDS[m.label])
    .map(m => ({ position: DISTRICT_COORDS[m.label], label: m.label, count: m.count }));

  if (points.length === 0) {
    return <div className="h-[500px] rounded-2xl border border-border bg-gray-50 flex items-center justify-center text-text-secondary">Sem distritos para exibir</div>;
  }

  return (
    <div className="h-[500px] rounded-2xl overflow-hidden border border-border">
      <LeafletMap center={[-17.5, 36.5]} zoom={6} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClusterGroup markers={points} />
        <FitBounds coords={points.map(p => p.position)} />
      </LeafletMap>
    </div>
  );
}
