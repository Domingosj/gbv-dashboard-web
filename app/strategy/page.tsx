"use client";

import { useState } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import ModuleTabs from "@/components/ModuleTabs";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import FilterBar from "@/components/FilterBar";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TABS = [
  { key: "portfolio", label: "Portfólio" },
  { key: "protection", label: "Proteção Estratégica" },
];

export default function StrategyPage() {
  const [tab, setTab] = useState("portfolio");
  const [provFilter, setProvFilter] = useState("");
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const provinces = Array.from(new Set(cases.map(c => c.province).filter((d): d is string => !!d))).sort();
  const filtered = provFilter ? cases.filter(c => c.province === provFilter) : cases;

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-1">Estratégia</h1>
      <ModuleTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />
      <FilterBar>
        <select className="genesis-input w-56" value={provFilter} onChange={e => setProvFilter(e.target.value)}>
          <option value="">Todas as províncias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </FilterBar>
      {tab === "portfolio" && <PortfolioTab cases={filtered} />}
      {tab === "protection" && <ProtectionTab cases={filtered} />}
    </div>
  );
}

function PortfolioTab({ cases }: { cases: GBVCase[] }) {
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
  const rows = Object.entries(projects).map(([name, d]) => ({ name, ...d, districts: d.districts.size, closeRate: d.total ? ((d.closed / d.total) * 100).toFixed(1) : "0" })).sort((a, b) => b.total - a.total);
  return (
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
  );
}

function ProtectionTab({ cases }: { cases: GBVCase[] }) {
  const open = cases.filter(c => c.case_status === "Aberto");
  const viol: Record<string, number> = {};
  for (const c of open) { const v = c.violence_type_short || c.violence_type || "N/A"; viol[v] = (viol[v] || 0) + 1; }
  const topViol = Object.entries(viol).sort((a, b) => b[1] - a[1]);

  const perp: Record<string, number> = {};
  for (const c of open) { const r = c.perpetrator_relationship || "N/A"; perp[r] = (perp[r] || 0) + 1; }
  const topPerp = Object.entries(perp).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <GCRCard title="Padrões de Violência">
        <div className="space-y-2">{topViol.map(([l, c]) => (
          <div key={l} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
            <span className="text-body text-text-secondary truncate mr-2">{l}</span>
            <GCRBadge color={c > 10 ? "red" : "amber"}>{c}</GCRBadge>
          </div>
        ))}</div>
      </GCRCard>
      <GCRCard title="Relação com Perpetrador">
        <div className="space-y-2">{topPerp.map(([l, c]) => (
          <div key={l} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
            <span className="text-body text-text-secondary truncate mr-2">{l}</span>
            <GCRBadge color="blue">{c}</GCRBadge>
          </div>
        ))}</div>
      </GCRCard>
    </div>
  );
}
