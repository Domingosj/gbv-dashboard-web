"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const MapContainer = dynamic(() => import("@/components/ui/map/MapContainer"), { ssr: false });

const fetcher = (url: string) => fetch(url).then(r => r.json());

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
          { label: "Casos Mapeados", value: Object.entries(byDistrict).reduce((s, [, c]) => s + c, 0), color: "text-info" },
          { label: "Casos Abertos", value: open.length, color: "text-success" },
          { label: "Com Referência", value: open.filter(c => c.has_referral).length, color: "text-success" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <GCRCard title="Distribuição de Casos por Distrito">
        <MapContainer markers={Object.entries(byDistrict).map(([label, count]) => ({ label, count }))} />
        <div className="flex items-center gap-4 mt-3 text-caption text-text-secondary">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#256B5A] inline-block" /> ≤10</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#D9A441] inline-block" /> 11–20</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#C65A5A] inline-block" /> &gt;20</span>
        </div>
      </GCRCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <GCRCard title="Casos por Distrito">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).map(([d, c]) => (
              <div key={d} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-body">{d}</span>
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
