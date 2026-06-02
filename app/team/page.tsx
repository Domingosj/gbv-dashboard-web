"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import { groupByField, sortedEntries } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TeamPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-on-surface-variant p-8">Carregando...</p>;

  const open = cases.filter(c => c.case_status === "Aberto");
  const closed = cases.filter(c => c.case_status === "Encerrado");

  const openByMgr = groupByField(open, c => c.case_manager);
  const closedByMgr = groupByField(closed, c => c.case_manager);
  const criticalByMgr = groupByField(open.filter(c => c.priority_level === "CRÍTICO"), c => c.case_manager);
  const noRefByMgr = groupByField(open.filter(c => !c.has_referral), c => c.case_manager);

  const allManagers = Array.from(new Set([
    ...Object.keys(openByMgr),
    ...Object.keys(closedByMgr),
  ])).sort();

  const mgrData = allManagers.map(mgr => ({
    manager: mgr,
    open: openByMgr[mgr] || 0,
    closed: closedByMgr[mgr] || 0,
    critical: criticalByMgr[mgr] || 0,
    noRef: noRefByMgr[mgr] || 0,
    total: (openByMgr[mgr] || 0) + (closedByMgr[mgr] || 0),
  })).sort((a, b) => b.open - a.open);

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-page-title text-on-surface mb-1">Carga da Equipa</h1>
          <p className="text-body text-on-surface-variant">Distribuição de casos por gestor de caso</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20 text-caption text-warning font-medium">
          Fase 2 — Opcional
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-surface-container-low border border-outline-variant text-body text-on-surface-variant mb-6">
        Esta página está marcada como <strong>Fase 2 / Opcional</strong>. O conteúdo foi preservado e está disponível para revisão, mas não faz parte da navegação principal do dashboard nesta fase.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Gestores de Caso", value: allManagers.length, color: "text-primary" },
          { label: "Total Abertos", value: open.length, color: "text-info" },
          { label: "Casos Críticos", value: open.filter(c => c.priority_level === "CRÍTICO").length, color: "text-critical" },
          { label: "Sem Referência", value: open.filter(c => !c.has_referral).length, color: "text-warning" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-on-surface-variant mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <GCRCard title="Carga por Gestor de Caso">
        <div className="overflow-x-auto">
          <table className="w-full text-caption">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left py-2 pr-4 text-on-surface-variant font-medium">Gestor</th>
                <th className="text-right py-2 px-3 text-info font-medium">Abertos</th>
                <th className="text-right py-2 px-3 text-success font-medium">Encerrados</th>
                <th className="text-right py-2 px-3 text-critical font-medium">Críticos</th>
                <th className="text-right py-2 px-3 text-warning font-medium">Sem Ref.</th>
                <th className="text-right py-2 pl-3 text-on-surface-variant font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {mgrData.map(({ manager, open: o, closed: cl, critical, noRef, total }) => (
                <tr key={manager} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                  <td className="py-2 pr-4 text-on-surface font-medium truncate max-w-[180px]">{manager}</td>
                  <td className="text-right py-2 px-3">
                    <GCRBadge color="blue">{o}</GCRBadge>
                  </td>
                  <td className="text-right py-2 px-3">
                    <GCRBadge color="green">{cl}</GCRBadge>
                  </td>
                  <td className="text-right py-2 px-3">
                    {critical > 0 ? <GCRBadge color="red">{critical}</GCRBadge> : <span className="text-on-surface-variant">–</span>}
                  </td>
                  <td className="text-right py-2 px-3">
                    {noRef > 0 ? <GCRBadge color="amber">{noRef}</GCRBadge> : <span className="text-on-surface-variant">–</span>}
                  </td>
                  <td className="text-right py-2 pl-3 text-on-surface font-semibold">{total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCRCard>
    </div>
  );
}
