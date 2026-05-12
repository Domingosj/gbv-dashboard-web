"use client";

import { useState } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import FilterBar from "@/components/FilterBar";
import { MonthlyChart } from "@/components/Charts";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SummaryPage() {
  const [provFilter, setProvFilter] = useState("");
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: openCases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });
  if (!allCases || !openCases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const filtered = provFilter ? allCases.filter(c => c.province === provFilter) : allCases;
  const filteredOpen = provFilter ? openCases.filter(c => c.province === provFilter) : openCases;

  const s = calcStats(filtered);
  const open = calcStats(filteredOpen);

  const provinces = Array.from(new Set(allCases.map(c => c.province).filter((d): d is string => !!d))).sort();
  const districts = Array.from(new Set(filtered.map(c => c.district).filter((d): d is string => !!d))).length;

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const casesThisMonth = filtered.filter(c => c.identification_date && new Date(c.identification_date).getMonth() === thisMonth && new Date(c.identification_date).getFullYear() === thisYear).length;
  const casesLastMonth = filtered.filter(c => {
    if (!c.identification_date) return false;
    const d = new Date(c.identification_date);
    const lm = thisMonth === 0 ? 11 : thisMonth - 1;
    const ly = thisMonth === 0 ? thisYear - 1 : thisYear;
    return d.getMonth() === lm && d.getFullYear() === ly;
  }).length;
  const trendPct = casesLastMonth > 0 ? (((casesThisMonth - casesLastMonth) / casesLastMonth) * 100).toFixed(1) : "0";

  const sexCounts: Record<string, number> = {};
  for (const c of filtered) { const x = c.sex || "N/E"; sexCounts[x] = (sexCounts[x] || 0) + 1; }
  const sexData = Object.entries(sexCounts).sort((a, b) => b[1] - a[1]);

  const ageCounts: Record<string, number> = {};
  for (const c of filtered) { const a = c.age_group || "N/E"; ageCounts[a] = (ageCounts[a] || 0) + 1; }
  const ageData = Object.entries(ageCounts).sort((a, b) => b[1] - a[1]);

  const disabilitySim = filtered.filter(c => (c.disability || "").toLowerCase() === "sim").length;
  const disabilityNao = filtered.filter(c => (c.disability || "").toLowerCase() === "nao" || !c.disability).length;

  const provCounts: Record<string, number> = {};
  for (const c of filtered) { const p = c.province || "N/E"; provCounts[p] = (provCounts[p] || 0) + 1; }
  const provData = Object.entries(provCounts).sort((a, b) => b[1] - a[1]);

  const violCounts: Record<string, number> = {};
  for (const c of filtered) { const v = c.violence_type_short || c.violence_type || "N/E"; violCounts[v] = (violCounts[v] || 0) + 1; }
  const violData = Object.entries(violCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const perpCounts: Record<string, number> = {};
  for (const c of filtered) { const r = c.perpetrator_relationship || "N/E"; perpCounts[r] = (perpCounts[r] || 0) + 1; }
  const perpData = Object.entries(perpCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const topDistricts: Record<string, number> = {};
  for (const c of filteredOpen) { const d = c.district || "Desconhecido"; topDistricts[d] = (topDistricts[d] || 0) + 1; }
  const topDist = Object.entries(topDistricts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-page-title text-text-primary">Resumo Executivo</h1>
        <div className="flex items-center gap-2 text-label text-text-secondary bg-gray-100 rounded-lg px-3 py-1.5">
          <span>Última atualização:</span>
          <span className="font-medium text-text-primary">{new Date().toLocaleDateString("pt-MZ")}</span>
        </div>
      </div>

      <FilterBar>
        <select className="genesis-input w-56" value={provFilter} onChange={e => setProvFilter(e.target.value)}>
          <option value="">Todas as províncias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </FilterBar>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          { label: "Total de Casos", value: s.total, href: "/operations", color: "text-text-primary" },
          { label: "Casos Abertos", value: s.open, href: "/cases", color: "text-info" },
          { label: "Encerrados", value: s.closed, href: "/operations?tab=progress", color: "text-success" },
          { label: "Alta Prioridade", value: open.critical + open.high, href: "/cases", color: "text-critical" },
        ].map(({ label, value, href, color }) => (
          <a key={label} href={href} className="gcr-card p-5 block hover:shadow-card-hover transition-shadow cursor-pointer">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
            <p className="text-caption text-text-secondary mt-1">Clique para detalhes →</p>
          </a>
        ))}
      </div>

      <GCRCard title="📈 Casos por Mês/Ano" className="mb-6">
        <MonthlyChart cases={filtered} />
      </GCRCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="⚥ Casos por Sexo">
          <div className="space-y-3">{sexData.length > 0 ? sexData.map(([l, c], i) => (
            <div key={l}>
              <div className="flex justify-between text-label mb-1"><span className="text-text-secondary">{l}</span><span className="font-semibold">{c}</span></div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(c / sexData[0][1]) * 100}%`, backgroundColor: i === 0 ? "#256B5A" : "#5E9C8A" }} /></div>
            </div>
          )) : <p className="text-text-secondary">Nenhum dado</p>}</div>
        </GCRCard>
        <GCRCard title="📊 Casos por Faixa Etária">
          <div className="space-y-3">{ageData.length > 0 ? ageData.map(([l, c]) => (
            <div key={l}>
              <div className="flex justify-between text-label mb-1"><span className="text-text-secondary">{l}</span><span className="font-semibold">{c}</span></div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-info" style={{ width: `${(c / ageData[0][1]) * 100}%` }} /></div>
            </div>
          )) : <p className="text-text-secondary">Nenhum dado</p>}</div>
        </GCRCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="♿ Pessoa com Deficiência">
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="text-center">
              <p className="text-metric text-critical">{disabilitySim}</p>
              <p className="text-label text-text-secondary">Com deficiência</p>
              <div className="mt-2 h-4 bg-critical/10 rounded-full overflow-hidden" style={{ width: 120 }}><div className="h-full bg-critical rounded-full" style={{ width: `${(disabilitySim / Math.max(disabilitySim + disabilityNao, 1)) * 100}%` }} /></div>
            </div>
            <div className="text-center">
              <p className="text-metric text-success">{disabilityNao}</p>
              <p className="text-label text-text-secondary">Sem deficiência</p>
              <div className="mt-2 h-4 bg-success/10 rounded-full overflow-hidden" style={{ width: 120 }}><div className="h-full bg-success rounded-full ml-auto" style={{ width: `${(disabilityNao / Math.max(disabilitySim + disabilityNao, 1)) * 100}%` }} /></div>
            </div>
          </div>
          <div className="text-center mt-2"><p className="text-caption text-text-secondary">{(disabilitySim / Math.max(disabilitySim + disabilityNao, 1) * 100).toFixed(1)}% dos casos envolvem pessoas com deficiência</p></div>
        </GCRCard>
        <GCRCard title="📍 Casos por Província">
          <div className="space-y-3">{provData.length > 0 ? provData.map(([l, c]) => (
            <div key={l}>
              <div className="flex justify-between text-label mb-1"><span className="text-text-secondary">{l}</span><span className="font-semibold">{c}</span></div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(c / provData[0][1]) * 100}%` }} /></div>
            </div>
          )) : <p className="text-text-secondary">Nenhum dado</p>}</div>
        </GCRCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Padrões de Violência">
          {violData.length > 0 ? <div className="space-y-2">{violData.map(([l, c]) => (
            <div key={l} className="flex items-center justify-between py-1.5 border-b border-border last:border-0"><span className="text-body text-text-secondary truncate mr-2">{l}</span><GCRBadge color={c > 10 ? "red" : "amber"}>{c}</GCRBadge></div>
          ))}</div> : <p className="text-text-secondary">Nenhum dado</p>}
        </GCRCard>
        <GCRCard title="Relação com Perpetrador">
          {perpData.length > 0 ? <div className="space-y-2">{perpData.map(([l, c]) => (
            <div key={l} className="flex items-center justify-between py-1.5 border-b border-border last:border-0"><span className="text-body text-text-secondary truncate mr-2">{l}</span><GCRBadge color="blue">{c}</GCRBadge></div>
          ))}</div> : <p className="text-text-secondary">Nenhum dado</p>}
        </GCRCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Distritos com Mais Casos">
          {topDist.length > 0 ? <div className="space-y-3">{topDist.map(([d, c], i) => (
            <div key={d}>
              <div className="flex justify-between text-label mb-1"><span className="text-text-secondary">{i + 1}. {d}</span><span className="font-semibold">{c}</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(c / Math.max(topDist[0][1], 1)) * 100}%` }} /></div>
            </div>
          ))}</div> : <p className="text-text-secondary">Sem dados</p>}
        </GCRCard>
        <GCRCard title="🔴 Alertas">
          <div className="space-y-2">
            <a href="/cases" className={`block p-3 rounded-lg ${open.critical > 0 ? "bg-critical/10" : "bg-success/10"} hover:opacity-80 transition-opacity`}>
              <p className={`text-body font-medium ${open.critical > 0 ? "text-critical" : "text-success"}`}>
                {open.critical > 0 ? `🔴 ${open.critical} casos críticos` : "✅ Nenhum caso crítico"}
                <span className="text-caption ml-2">Clique para ver →</span>
              </p>
            </a>
            <a href="/cases" className={`block p-3 rounded-lg ${open.no_ref > 0 ? "bg-warning/10" : "bg-success/10"} hover:opacity-80 transition-opacity`}>
              <p className={`text-body font-medium ${open.no_ref > 0 ? "text-warning" : "text-success"}`}>
                {open.no_ref > 0 ? `⚠️ ${open.no_ref} sem referência` : "✅ Todos referenciados"}
                <span className="text-caption ml-2">Clique para ver →</span>
              </p>
            </a>
            <a href="/operations" className={`block p-3 rounded-lg ${open.delayed > 0 ? "bg-critical/10" : "bg-success/10"} hover:opacity-80 transition-opacity`}>
              <p className={`text-body font-medium ${open.delayed > 0 ? "text-critical" : "text-success"}`}>
                {open.delayed > 0 ? `🕐 ${open.delayed} atrasados >30d` : "✅ Sem atrasos"}
                <span className="text-caption ml-2">Clique para ver →</span>
              </p>
            </a>
          </div>
        </GCRCard>
      </div>

      <GCRCard title="Visão Geral">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Províncias", value: provinces.length.toString(), desc: `${districts} distritos` },
            { label: "Casos este Mês", value: casesThisMonth.toString(), desc: `${casesLastMonth} mês passado` },
            { label: "Taxa Encerramento", value: `${s.total ? ((s.closed / s.total) * 100).toFixed(1) : 0}%`, desc: `${s.closed} de ${s.total}` },
            { label: "Sem Referência", value: `${((open.no_ref / Math.max(open.total, 1)) * 100).toFixed(0)}%`, desc: `${open.no_ref} dos ${open.total} abertos` },
          ].map(({ label, value, desc }) => (
            <div key={label} className="p-4 rounded-lg bg-gray-50 text-center">
              <p className="text-metric text-primary">{value}</p>
              <p className="text-label text-text-secondary mt-1">{label}</p>
              <p className="text-caption text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
      </GCRCard>
    </div>
  );
}
