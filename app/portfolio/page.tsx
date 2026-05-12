"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PortfolioPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const projects: Record<string, { total: number; open: number; closed: number; critical: number; districts: Set<string> }> = {};
  for (const c of cases) {
    const p = c.project || "Sem projeto";
    if (!projects[p]) projects[p] = { total: 0, open: 0, closed: 0, critical: 0, districts: new Set() };
    projects[p].total++;
    if (c.case_status === "Aberto") projects[p].open++;
    if (c.case_status === "Encerrado") projects[p].closed++;
    if (c.priority_level === "CRÍTICO") projects[p].critical++;
    if (c.district) projects[p].districts.add(c.district);
  }

  const rows = Object.entries(projects)
    .map(([name, d]) => ({
      name,
      total: d.total,
      open: d.open,
      closed: d.closed,
      critical: d.critical,
      districts: d.districts.size,
      closeRate: d.total ? ((d.closed / d.total) * 100).toFixed(1) : "0",
      riskRate: d.total ? ((d.critical / d.total) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.total - a.total);

  const totalCases = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Portfolio Analysis</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Projetos", value: rows.length, color: "text-primary" },
          { label: "Total Casos", value: totalCases, color: "text-info" },
          { label: "Taxa Encerramento Média", value: rows.length ? `${(rows.reduce((s, r) => s + Number(r.closeRate), 0) / rows.length).toFixed(1)}%` : "0%", color: "text-success" },
          { label: "Críticos Total", value: rows.reduce((s, r) => s + r.critical, 0), color: "text-critical" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <GCRCard title="Comparação entre Projetos">
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Projeto</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Total</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Abertos</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Encerrados</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Tx Encerramento</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Críticos</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Distritos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(r => (
                <tr key={r.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-right">{r.total}</td>
                  <td className="px-4 py-3 text-right">{r.open}</td>
                  <td className="px-4 py-3 text-right">{r.closed}</td>
                  <td className="px-4 py-3 text-right font-semibold">{r.closeRate}%</td>
                  <td className={`px-4 py-3 text-right ${r.critical > 0 ? "text-critical font-semibold" : ""}`}>{r.critical}</td>
                  <td className="px-4 py-3 text-right text-text-secondary">{r.districts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCRCard>
    </div>
  );
}
