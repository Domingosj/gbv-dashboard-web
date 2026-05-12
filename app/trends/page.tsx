"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import { MonthlyChart } from "@/components/Charts";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TrendsPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const open = cases.filter(c => c.case_status === "Aberto");

  const violenceTrend: Record<string, number> = {};
  for (const c of open) {
    const t = c.violence_type_short || c.violence_type || "N/A";
    violenceTrend[t] = (violenceTrend[t] || 0) + 1;
  }
  const topViolence = Object.entries(violenceTrend).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const ageTrend: Record<string, number> = {};
  for (const c of open) {
    const a = c.age_group || "N/A";
    ageTrend[a] = (ageTrend[a] || 0) + 1;
  }
  const topAges = Object.entries(ageTrend).sort((a, b) => b[1] - a[1]);

  const projectTrend: Record<string, number> = {};
  for (const c of open) {
    const p = c.project || "N/A";
    projectTrend[p] = (projectTrend[p] || 0) + 1;
  }
  const topProjects = Object.entries(projectTrend).sort((a, b) => b[1] - a[1]);

  const provinceTrend: Record<string, number> = {};
  for (const c of open) {
    const p = c.province || "N/A";
    provinceTrend[p] = (provinceTrend[p] || 0) + 1;
  }
  const topProvinces = Object.entries(provinceTrend).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Trends and Patterns</h1>

      <GCRCard title="Casos por Mês" className="mb-5">
        <MonthlyChart cases={cases} />
      </GCRCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GCRCard title="Tipo de Violência">
          <div className="space-y-2">
            {topViolence.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-body text-text-secondary">{label}</span>
                <GCRBadge color="blue">{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Faixa Etária">
          <div className="space-y-2">
            {topAges.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-body text-text-secondary">{label}</span>
                <GCRBadge color="blue">{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Distribuição por Projeto">
          <div className="space-y-2">
            {topProjects.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-body text-text-secondary">{label}</span>
                <GCRBadge color="blue">{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>

      {topProvinces.length > 0 && (
        <GCRCard title="Casos por Província" className="mt-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {topProvinces.map(([label, count]) => (
              <div key={label} className="p-4 rounded-lg bg-gray-50 text-center">
                <p className="text-metric text-primary">{count}</p>
                <p className="text-label text-text-secondary mt-1">{label}</p>
              </div>
            ))}
          </div>
        </GCRCard>
      )}
    </div>
  );
}
