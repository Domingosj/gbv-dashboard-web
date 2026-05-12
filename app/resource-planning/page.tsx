"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ResourcePlanningPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: openCases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });
  if (!cases || !openCases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const open = openCases;

  const districtLoad: Record<string, { cases: number; critical: number; noRef: number }> = {};
  for (const c of open) {
    const d = c.district || "Desconhecido";
    if (!districtLoad[d]) districtLoad[d] = { cases: 0, critical: 0, noRef: 0 };
    districtLoad[d].cases++;
    if (c.priority_level === "CRÍTICO") districtLoad[d].critical++;
    if (!c.has_referral) districtLoad[d].noRef++;
  }

  const highLoad = Object.entries(districtLoad)
    .filter(([, v]) => v.cases > 5)
    .sort((a, b) => b[1].cases - a[1].cases);

  const lowRef = Object.entries(districtLoad)
    .filter(([, v]) => v.cases > 0 && v.noRef > 0)
    .sort((a, b) => (b[1].noRef / b[1].cases) - (a[1].noRef / a[1].cases));

  const mgrLoad: Record<string, number> = {};
  for (const c of open) {
    const m = c.case_manager || "Sem gestor";
    mgrLoad[m] = (mgrLoad[m] || 0) + 1;
  }
  const overloaded = Object.entries(mgrLoad).filter(([, v]) => v > 15).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Resource Allocation & Planning</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Distritos com Casos", value: Object.keys(districtLoad).length, color: "text-primary" },
          { label: "Distritos Alta Carga (>5)", value: highLoad.length, color: "text-critical" },
          { label: "Gestores Sobrecarregados", value: overloaded.length, color: "text-warning" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Distritos com Maior Carga">
          <div className="space-y-2">
            {highLoad.slice(0, 10).map(([dist, d]) => (
              <div key={dist} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div>
                  <span className="text-body font-medium">{dist}</span>
                  <span className="text-caption text-text-secondary ml-2">{d.cases} casos</span>
                </div>
                <div className="flex gap-2">
                  {d.critical > 0 && <GCRBadge color="red">{d.critical} crítico</GCRBadge>}
                  {d.noRef > 0 && <GCRBadge color="amber">{d.noRef} sem ref</GCRBadge>}
                </div>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Distritos — Prioridade de Intervenção">
          <div className="space-y-2">
            {lowRef.slice(0, 10).map(([dist, d]) => (
              <div key={dist} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div>
                  <span className="text-body font-medium">{dist}</span>
                  <span className="text-caption text-text-secondary ml-2">{((d.noRef / d.cases) * 100).toFixed(0)}% sem referência</span>
                </div>
                <GCRBadge color={d.noRef > d.cases / 2 ? "red" : "amber"}>{d.noRef}/{d.cases}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>

      {overloaded.length > 0 && (
        <GCRCard title="Gestores com Carga Elevada (>15 casos)">
          <div className="space-y-2">
            {overloaded.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-body font-medium">{name}</span>
                <GCRBadge color="red">{count} casos</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>
      )}
    </div>
  );
}
