"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import ModuleTabs from "@/components/ModuleTabs";
import { fuzzyCoord, getCoord, normalizeDistrict } from "@/lib/map-data";

const MapContainer = dynamic(() => import("@/components/ui/map/MapContainer"), { ssr: false });

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TABS = [
  { key: "open", label: "Casos Abertos" },
  { key: "all", label: "Todos os Casos" },
];

function hasRef(c: GBVCase) {
  return ["referred_medical","referred_psychosocial","referred_police","referred_legal","referred_safe_house","referred_child_protection"]
    .some(k => /sim/i.test((c as any)[k] || ""));
}

function aggregateCasesByDistrict(cases: GBVCase[]) {
  const byDistrict: Record<string, number> = {};

  for (const c of cases) {
    const rawDistrict = c.district?.trim();
    const district = rawDistrict ? normalizeDistrict(rawDistrict) : "Desconhecido";
    byDistrict[district] = (byDistrict[district] || 0) + 1;
  }

  const markers = Object.entries(byDistrict)
    .filter(([label]) => !!(getCoord(label) || fuzzyCoord(label)))
    .map(([label, count]) => ({ label, count }));

  const mappedTotal = markers.reduce((sum, marker) => sum + marker.count, 0);

  return {
    byDistrict,
    markers,
    mappedTotal,
    districtCount: Object.keys(byDistrict).length,
  };
}

function MapView({ cases, services }: { cases: GBVCase[]; services: any }) {
  const { byDistrict, markers } = useMemo(() => aggregateCasesByDistrict(cases), [cases]);
  const svcCounts: Record<string, number> = {};
  if (services) {
    for (const s of services as any[]) {
      const rawDistrict = s.district?.trim();
      const district = rawDistrict ? normalizeDistrict(rawDistrict) : "Desconhecido";
      svcCounts[district] = (svcCounts[district] || 0) + 1;
    }
  }

  return (
    <>
      <GCRCard title="Distribuição de Casos por Distrito">
        <MapContainer markers={markers} />
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
    </>
  );
}

export default function MapPage() {
  const [tab, setTab] = useState("open");
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: services } = useSWR("/api/services", fetcher);
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const open = cases.filter(c => c.case_status === "Aberto");
  const openStats = useMemo(() => aggregateCasesByDistrict(open), [open]);
  const allStats = useMemo(() => aggregateCasesByDistrict(cases), [cases]);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-1">Mapa Geográfico</h1>
      <ModuleTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {tab === "open" && (
        <>
          <div className="grid grid-cols-4 gap-4 my-6">
            {[
              { label: "Distritos", value: openStats.districtCount, color: "text-primary" },
              { label: "Casos Mapeados", value: openStats.mappedTotal, color: "text-info" },
              { label: "Casos Abertos", value: open.length, color: "text-success" },
              { label: "Com Referência", value: open.filter(c => hasRef(c)).length, color: "text-success" },
            ].map(({ label, value, color }) => (
              <div key={label} className="gcr-card p-4 text-center">
                <p className="text-label text-text-secondary mb-1">{label}</p>
                <p className={`text-metric ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <MapView cases={open} services={services} />
        </>
      )}

      {tab === "all" && (
        <>
          <div className="grid grid-cols-4 gap-4 my-6">
            {[
              { label: "Distritos", value: allStats.districtCount, color: "text-primary" },
              { label: "Casos Mapeados", value: allStats.mappedTotal, color: "text-info" },
              { label: "Casos Abertos", value: open.length, color: "text-warning" },
              { label: "Casos Encerrados", value: cases.filter(c => c.case_status === "Encerrado").length, color: "text-success" },
            ].map(({ label, value, color }) => (
              <div key={label} className="gcr-card p-4 text-center">
                <p className="text-label text-text-secondary mb-1">{label}</p>
                <p className={`text-metric ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <MapView cases={cases} services={services} />
        </>
      )}
    </div>
  );
}
