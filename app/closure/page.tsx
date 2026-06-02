"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import FilterBar from "@/components/FilterBar";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ClosurePage() {
  const [provFilter, setProvFilter] = useState("");
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!allCases) return <p className="text-on-surface-variant p-8">Carregando...</p>;

  const provinces = Array.from(new Set(allCases.map(c => c.province).filter((d): d is string => !!d))).sort();
  const cases = provFilter ? allCases.filter(c => c.province === provFilter) : allCases;

  return (
    <div>
      <h1 className="text-page-title text-on-surface mb-1">Encerramento e Resultados</h1>
      <p className="text-body text-on-surface-variant mb-4">Como os casos estão a ser encerrados e se os objectivos estão a ser alcançados</p>
      <FilterBar>
        <select className="gcr-input w-56" value={provFilter} onChange={e => setProvFilter(e.target.value)}>
          <option value="">Todas as províncias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </FilterBar>
      <ClosureContent cases={cases} />
    </div>
  );
}

function ClosureContent({ cases }: { cases: GBVCase[] }) {
  const total = cases.length;
  const closed = cases.filter(c => c.case_status === "Encerrado");
  const open = cases.filter(c => c.case_status === "Aberto");
  const closureRate = total > 0 ? (closed.length / total) * 100 : 0;

  // Average time to closure (identification → closure)
  const timesToClosure = closed
    .filter(c => c.identification_date && c.closure_date)
    .map(c => (new Date(c.closure_date!).getTime() - new Date(c.identification_date!).getTime()) / 86400000)
    .filter(d => d >= 0);
  const avgClosureDays = timesToClosure.length > 0
    ? Math.round(timesToClosure.reduce((a, b) => a + b, 0) / timesToClosure.length)
    : null;

  // Closure reasons
  const reasons: Record<string, number> = {};
  for (const c of closed) {
    const r = c.closure_reason || "Não especificado";
    reasons[r] = (reasons[r] || 0) + 1;
  }
  const reasonsSorted = Object.entries(reasons).sort((a, b) => b[1] - a[1]);
  const noReason = closed.filter(c => !c.closure_reason).length;

  // Validated cases
  const validated = closed.filter(c => c.validated === "Sim").length;

  // Lost to follow-up (closed without reason or reason contains "perdido"/"follow")
  const lostFollowUp = closed.filter(c => {
    const r = (c.closure_reason || "").toLowerCase();
    return r.includes("perdido") || r.includes("follow") || r.includes("sem contacto") || r.includes("desaparecido");
  }).length;

  // Transferred
  const transferred = closed.filter(c => {
    const r = (c.closure_reason || "").toLowerCase();
    return r.includes("transfer") || r.includes("encaminhado");
  }).length;

  // Monthly trend: opened vs closed per month
  const monthlyData = useMemo(() => {
    const opened: Record<string, number> = {};
    const closedByMonth: Record<string, number> = {};
    for (const c of cases) {
      if (c.identification_date) {
        const m = c.identification_date.slice(0, 7);
        opened[m] = (opened[m] || 0) + 1;
      }
      if (c.case_status === "Encerrado" && c.closure_date) {
        const m = c.closure_date.slice(0, 7);
        closedByMonth[m] = (closedByMonth[m] || 0) + 1;
      }
    }
    const allMonths = Array.from(new Set([...Object.keys(opened), ...Object.keys(closedByMonth)])).sort();
    return allMonths.map(m => ({ month: m, abertos: opened[m] || 0, encerrados: closedByMonth[m] || 0 }));
  }, [cases]);

  // Closure time distribution buckets
  const within30 = timesToClosure.filter(d => d <= 30).length;
  const within60 = timesToClosure.filter(d => d > 30 && d <= 60).length;
  const within90 = timesToClosure.filter(d => d > 60 && d <= 90).length;
  const over90 = timesToClosure.filter(d => d > 90).length;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Casos Encerrados", value: closed.length, color: "text-success", desc: `de ${total} totais` },
          { label: "Taxa de Encerramento", value: `${closureRate.toFixed(1)}%`, color: closureRate >= 50 ? "text-success" : "text-warning", desc: "encerrados / total" },
          { label: "Média até Encerrar", value: avgClosureDays !== null ? `${avgClosureDays}d` : "N/D", color: avgClosureDays !== null && avgClosureDays <= 60 ? "text-success" : "text-warning", desc: "identificação → encerramento" },
          { label: "Sem Motivo Registado", value: noReason, color: noReason > 0 ? "text-critical" : "text-success", desc: "casos sem motivo de encerramento" },
          { label: "Casos Abertos", value: open.length, color: "text-info", desc: "ainda em acompanhamento" },
        ].map(({ label, value, color, desc }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-on-surface-variant mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
            <p className="text-caption text-on-surface-variant mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* Closure reasons + outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GCRCard title="Motivos de Encerramento">
          {reasonsSorted.length > 0 ? (
            <div className="space-y-2">
              {reasonsSorted.map(([label, count]) => {
                const pct = closed.length > 0 ? (count / closed.length) * 100 : 0;
                return (
                  <div key={label} className="py-1.5 border-b border-outline-variant last:border-0">
                    <div className="flex items-center justify-between text-label mb-1">
                      <span className="text-on-surface-variant truncate mr-2 text-[13px]">{label}</span>
                      <span className="font-semibold text-on-surface text-sm whitespace-nowrap">{count} <span className="text-caption text-on-surface-variant font-normal">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden bg-surface-container">
                      <div className="h-full rounded-full bg-success/70" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-on-surface-variant text-sm">Nenhum caso encerrado registado</p>}
        </GCRCard>

        <GCRCard title="Resultados e Desfechos">
          <div className="space-y-4">
            {[
              { label: "Validados", value: validated, total: closed.length, color: "bg-success" },
              { label: "Transferidos", value: transferred, total: closed.length, color: "bg-info" },
              { label: "Perda de Seguimento", value: lostFollowUp, total: closed.length, color: "bg-warning" },
              { label: "Sem Motivo Registado", value: noReason, total: closed.length, color: "bg-critical" },
            ].map(({ label, value, total: t, color }) => (
              <div key={label}>
                <div className="flex justify-between text-label mb-1">
                  <span className="text-on-surface-variant">{label}</span>
                  <span className="font-semibold">{value} <span className="text-caption text-on-surface-variant font-normal">/ {t}</span></span>
                </div>
                <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${t > 0 ? (value / t) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>

      {/* Time to closure distribution */}
      <GCRCard title="Distribuição do Tempo até Encerramento">
        {timesToClosure.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Até 30 dias", value: within30, color: "text-success", bg: "bg-success/10 border-success/20" },
              { label: "31–60 dias", value: within60, color: "text-info", bg: "bg-info/10 border-info/20" },
              { label: "61–90 dias", value: within90, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
              { label: "Mais de 90 dias", value: over90, color: "text-critical", bg: "bg-critical/10 border-critical/20" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`p-4 rounded-lg border text-center ${bg}`}>
                <p className={`text-metric font-bold ${color}`}>{value}</p>
                <p className="text-label text-on-surface-variant mt-1">{label}</p>
                <p className="text-caption text-on-surface-variant">{timesToClosure.length > 0 ? ((value / timesToClosure.length) * 100).toFixed(0) : 0}%</p>
              </div>
            ))}
          </div>
        ) : <p className="text-on-surface-variant text-sm">Dados insuficientes para calcular tempo de encerramento</p>}
      </GCRCard>

      {/* Monthly trend: opened vs closed */}
      <GCRCard title="Tendência Mensal: Abertos vs Encerrados">
        {monthlyData.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-6 text-caption text-on-surface-variant mb-2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary" /> Identificados</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-success" /> Encerrados</span>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {[...monthlyData].reverse().map(({ month, abertos, encerrados }) => {
                const maxVal = Math.max(...monthlyData.map(d => Math.max(d.abertos, d.encerrados)), 1);
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-caption text-on-surface-variant w-16 shrink-0 tabular-nums">{month}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(abertos / maxVal) * 100}%` }} />
                        </div>
                        <span className="text-caption text-on-surface w-6 text-right">{abertos}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-success" style={{ width: `${(encerrados / maxVal) * 100}%` }} />
                        </div>
                        <span className="text-caption text-on-surface w-6 text-right">{encerrados}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : <p className="text-on-surface-variant text-sm">Nenhum dado de tendência disponível</p>}
      </GCRCard>
    </div>
  );
}
