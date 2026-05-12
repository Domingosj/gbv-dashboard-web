"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import { MonthlyChart } from "@/components/Charts";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TrendsPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const open = cases.filter(c => c.case_status === "Aberto");

  const projects = Array.from(new Set(cases.map(c => c.project).filter((d): d is string => !!d))) as string[];
  const monthlyData: Record<string, Record<string, number>> = {};
  const allMonths = new Set<string>();

  for (const c of cases) {
    if (!c.identification_date || !c.project) continue;
    const m = c.identification_date.slice(0, 7);
    allMonths.add(m);
    if (!monthlyData[c.project]) monthlyData[c.project] = {};
    monthlyData[c.project][m] = (monthlyData[c.project][m] || 0) + 1;
  }

  const sortedMonths = Array.from(allMonths).sort();
  const projectSeries = projects.map(p => ({
    name: p,
    data: sortedMonths.map(m => monthlyData[p]?.[m] || 0),
  }));
  const palette = ["#256B5A", "#4B7BE5", "#D9A441", "#C65A5A", "#5E9C8A", "#B8BEC6", "#1F2933", "#6B7280"];

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

  const projectTotals: Record<string, number> = {};
  for (const c of open) {
    const p = c.project || "N/A";
    projectTotals[p] = (projectTotals[p] || 0) + 1;
  }
  const topProjects = Object.entries(projectTotals).sort((a, b) => b[1] - a[1]);

  const provinceTrend: Record<string, number> = {};
  for (const c of open) {
    const p = c.province || "N/A";
    provinceTrend[p] = (provinceTrend[p] || 0) + 1;
  }
  const topProvinces = Object.entries(provinceTrend).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Tendências e Padrões</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Casos por Mês (Total)">
          <MonthlyChart cases={cases} />
        </GCRCard>

        <GCRCard title="Casos por Mês por Projeto">
          {sortedMonths.length > 0 ? (
            <ApexChart
              options={{
                chart: { fontFamily: "Inter, sans-serif", type: "bar", toolbar: { show: false }, height: 280, stacked: true },
                colors: palette.slice(0, projectSeries.length),
                plotOptions: { bar: { horizontal: false, columnWidth: "60%", borderRadius: 2 } },
                grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
                dataLabels: { enabled: false },
                xaxis: { categories: sortedMonths, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontSize: "11px", colors: ["#6B7280"] } } },
                yaxis: { labels: { style: { fontSize: "11px", colors: ["#6B7280"] } } },
                legend: { position: "bottom", fontSize: "11px", fontFamily: "Inter", labels: { colors: ["#6B7280"] } },
                tooltip: { y: { formatter: (v: number) => `${v} casos` } },
              }}
              series={projectSeries}
              type="bar"
              height={280}
            />
          ) : <p className="text-text-secondary text-sm">Sem dados</p>}
        </GCRCard>
      </div>

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
