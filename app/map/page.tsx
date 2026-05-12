"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const MapWithData = dynamic(() => import("@/components/ui/map"), { ssr: false });

const fetcher = (url: string) => fetch(url).then(r => r.json());

const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Beira": [-19.8333, 34.8333], "Mueda": [-11.6667, 39.5], "Montepuez": [-13.1167, 39.0],
  "Pemba": [-12.9667, 40.5], "Nampula": [-15.1167, 39.2667], "Quelimane": [-17.8667, 36.8833],
  "Tete": [-16.1667, 33.5833], "Lichinga": [-13.3167, 35.2333], "Chimoio": [-19.1167, 33.4833],
  "Xai-Xai": [-25.05, 33.65], "Inhambane": [-23.8667, 35.3833], "Maputo": [-25.9667, 32.5833],
  "Mocímboa da Praia": [-11.35, 40.3333], "Dondo": [-19.6167, 34.75], "Gorongosa": [-18.6667, 34.0833],
  "Nhamatanda": [-19.2667, 34.2167], "Gondola": [-18.9833, 33.65], "Manica": [-18.9333, 32.8833],
  "Chiúre": [-12.0, 39.8833], "Macomia": [-12.2333, 40.1167], "Balama": [-13.35, 38.5667],
  "Palma": [-10.7833, 40.4667], "Cuamba": [-14.8, 36.55], "Moatize": [-16.1, 33.7167],
  "Mocuba": [-16.85, 36.9833], "Gurúè": [-15.45, 36.9833], "Angoche": [-16.2333, 39.9167],
};

export default function MapPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: services } = useSWR("/api/services", fetcher);
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const open = cases.filter(c => c.case_status === "Aberto");

  const byDistrict: Record<string, number> = {};
  for (const c of open) {
    const d = c.district || "Desconhecido";
    byDistrict[d] = (byDistrict[d] || 0) + 1;
  }

  const markers = Object.entries(byDistrict)
    .filter(([d]) => DISTRICT_COORDS[d])
    .map(([d, count]) => ({ position: DISTRICT_COORDS[d], label: d, count }));

  const svcCounts: Record<string, number> = {};
  if (services) {
    for (const s of services as any[]) {
      svcCounts[s.district] = (svcCounts[s.district] || 0) + 1;
    }
  }

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Mapa Geográfico</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Distritos (Casos)", value: Object.keys(byDistrict).length, color: "text-primary" },
          { label: "Distritos no Mapa", value: markers.length, color: "text-info" },
          { label: "Casos Mapeados", value: markers.reduce((s, m) => s + m.count, 0), color: "text-success" },
          { label: "Sem Coordenadas", value: Object.keys(byDistrict).length - markers.length, color: "text-warning" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <GCRCard title="Distribuição de Casos por Distrito">
        <MapWithData markers={markers} />
        <div className="flex items-center gap-4 mt-3 text-caption text-text-secondary">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#256B5A] inline-block" /> ≤10 casos</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#D9A441] inline-block" /> 11–20 casos</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#C65A5A] inline-block" /> &gt;20 casos</span>
        </div>
      </GCRCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <GCRCard title="Casos por Distrito">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).map(([d, c]) => (
              <div key={d} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${DISTRICT_COORDS[d] ? "bg-primary" : "bg-warning"}`} />
                  <span className="text-body">{d}</span>
                </div>
                <GCRBadge color={c > 10 ? "red" : c > 5 ? "amber" : "blue"}>{c}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Serviços por Distrito">
          {services ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {Object.entries(svcCounts).sort((a, b) => b[1] - a[1]).map(([d, c]) => (
                <div key={d} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-body">{d}</span>
                  <GCRBadge color="blue">{c} serviços</GCRBadge>
                </div>
              ))}
            </div>
          ) : <p className="text-text-secondary">Carregando...</p>}
        </GCRCard>
      </div>
    </div>
  );
}
