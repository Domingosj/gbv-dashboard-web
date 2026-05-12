"use client";

import useSWR from "swr";
import { GBVCase, Service } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function MapPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: services } = useSWR<Service[]>("/api/services", fetcher);
  if (!cases || !services) return <p className="text-text-secondary p-8">Carregando...</p>;

  const open = cases.filter(c => c.case_status === "Aberto");

  const districtData: Record<string, {
    cases: number; critical: number; noRef: number; unsafe: number;
    services: number; categories: Set<string>; provinces: Set<string>;
  }> = {};

  for (const c of open) {
    const d = c.district || "Desconhecido";
    if (!districtData[d]) districtData[d] = { cases: 0, critical: 0, noRef: 0, unsafe: 0, services: 0, categories: new Set(), provinces: new Set() };
    districtData[d].cases++;
    if (c.priority_level === "CRÍTICO") districtData[d].critical++;
    if (!c.has_referral) districtData[d].noRef++;
    if ((c.is_safe || "").toLowerCase() === "não" || (c.is_safe || "").toLowerCase() === "nao") districtData[d].unsafe++;
    if (c.province) districtData[d].provinces.add(c.province);
  }

  for (const s of services) {
    const d = s.district;
    if (districtData[d]) {
      districtData[d].services++;
      districtData[d].categories.add(s.service_category);
    } else {
      districtData[d] = { cases: 0, critical: 0, noRef: 0, unsafe: 0, services: 1, categories: new Set([s.service_category]), provinces: new Set() };
    }
  }

  const rows = Object.entries(districtData)
    .map(([district, d]) => ({
      district,
      cases: d.cases,
      critical: d.critical,
      noRef: d.noRef,
      unsafe: d.unsafe,
      services: d.services,
      categories: d.categories.size,
      province: Array.from(d.provinces)[0] || "",
      hasGap: d.cases > 0 && d.services === 0,
    }))
    .sort((a, b) => b.cases - a.cases);

  const totalCases = rows.reduce((s, r) => s + r.cases, 0);
  const districtsWithGaps = rows.filter(r => r.hasGap);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Geographic & Protection Gap Analysis</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Distritos com Casos", value: rows.filter(r => r.cases > 0).length, color: "text-primary" },
          { label: "Distritos sem Serviços", value: districtsWithGaps.length, color: "text-critical" },
          { label: "Casos (Abertos)", value: totalCases, color: "text-info" },
          { label: "Serviços Registados", value: services.length, color: "text-success" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {districtsWithGaps.length > 0 && (
        <div className="bg-critical/10 border border-critical/20 rounded-card p-4 mb-6">
          <p className="text-body font-medium text-critical mb-2">⚠️ Distritos com casos mas sem serviços registados:</p>
          <div className="flex flex-wrap gap-2">
            {districtsWithGaps.map(d => (
              <GCRBadge key={d.district} color="red">{d.district} ({d.cases} casos)</GCRBadge>
            ))}
          </div>
        </div>
      )}

      <GCRCard title="Cobertura por Distrito">
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Distrito</th>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Província</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Casos</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Críticos</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Sem Ref.</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Não Seguras</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Serviços</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Categorias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(r => (
                <tr key={r.district} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.district}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.province || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{r.cases}</td>
                  <td className={`px-4 py-3 text-right ${r.critical > 0 ? "text-critical font-semibold" : ""}`}>{r.critical || 0}</td>
                  <td className={`px-4 py-3 text-right ${r.noRef > 0 ? "text-warning font-semibold" : ""}`}>{r.noRef || 0}</td>
                  <td className={`px-4 py-3 text-right ${r.unsafe > 0 ? "text-critical font-semibold" : ""}`}>{r.unsafe || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <GCRBadge color={r.services > 0 ? "green" : "red"}>{r.services}</GCRBadge>
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">{r.categories}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCRCard>
    </div>
  );
}
