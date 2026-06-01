"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { fmtViolence, getTimeSinceIdentif, calculateDaysSinceReferral } from "@/lib/risk-calculator";
import GCRCard from "@/components/ui/GCRCard";
import { GCRTable, GCRTHead, GCRTBody, GCRTRow, GCRTCell } from "@/components/ui/GCRTable";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PriorityListPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-on-surface-variant p-8">Carregando...</p>;

  const critical = cases.filter(c => c.priority_level === "CRÍTICO");
  const alto = cases.filter(c => c.priority_level === "ALTO");
  const noRef = cases.filter(c => !c.has_referral);
  const unsafe = cases.filter(c => (c.is_safe || "").toLowerCase() === "não" || (c.is_safe || "").toLowerCase() === "nao");
  const overdue = cases.filter(c => {
    const ref = calculateDaysSinceReferral(c);
    return ref.days_waiting > 30;
  });

  const alerts = [
    ...(critical.length > 0 ? [{ text: `${critical.length} casos críticos — ação imediata necessária`, count: critical.length, color: "text-critical" as const }] : []),
    ...(noRef.length > 0 ? [{ text: `${noRef.length} casos sem referência`, count: noRef.length, color: "text-warning" as const }] : []),
    ...(unsafe.length > 0 ? [{ text: `${unsafe.length} sobreviventes não seguras`, count: unsafe.length, color: "text-critical" as const }] : []),
    ...(overdue.length > 0 ? [{ text: `${overdue.length} casos >30d sem desfecho`, count: overdue.length, color: "text-critical" as const }] : []),
  ];

  const priorityQueue = [...cases].slice(0, 20);

  return (
    <div>
      <h1 className="text-page-title text-on-surface mb-6">Lista Prioritária</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Casos Ativos", value: cases.length, color: "text-primary" },
          { label: "Críticos", value: critical.length, color: "text-critical" },
          { label: "Sem Referência", value: noRef.length, color: "text-warning" },
          { label: "Atrasados >30d", value: overdue.length, color: "text-critical" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-on-surface-variant mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
          {alerts.map((a, i) => (
            <div key={i} className={`p-3 rounded-lg ${a.color.includes("critical") ? "bg-critical/10" : "bg-warning/10"} flex items-center justify-between`}>
              <span className={`text-body font-medium ${a.color}`}>{a.text}</span>
              <span className={`text-metric ${a.color}`}>{a.count}</span>
            </div>
          ))}
        </div>
      )}

      <GCRCard title="Fila de Prioridade">
        <div className="overflow-x-auto">
          <GCRTable>
            <GCRTHead>
              <GCRTRow>
                <GCRTCell isHeader>Prior.</GCRTCell>
                <GCRTCell isHeader>ID</GCRTCell>
                <GCRTCell isHeader>Distrito</GCRTCell>
                <GCRTCell isHeader>Tipo</GCRTCell>
                <GCRTCell isHeader>Idade</GCRTCell>
                <GCRTCell isHeader>Tempo</GCRTCell>
                <GCRTCell isHeader>Referência</GCRTCell>
                <GCRTCell isHeader>Segurança</GCRTCell>
                <GCRTCell isHeader>Risco</GCRTCell>
              </GCRTRow>
            </GCRTHead>
            <GCRTBody>
              {priorityQueue.map((c, i) => {
                const ref = calculateDaysSinceReferral(c);
                const time = getTimeSinceIdentif(c);
                const safe = (c.is_safe || "").toLowerCase() === "sim" || !c.is_safe;
                return (
                  <GCRTRow key={c.case_id || i}>
                    <GCRTCell>{c.priority_icon || "–"}</GCRTCell>
                    <GCRTCell className="font-mono text-caption text-on-surface-variant">{c.case_id?.slice(0, 18)}</GCRTCell>
                    <GCRTCell>{c.district || "N/A"}</GCRTCell>
                    <GCRTCell>{fmtViolence(c.violence_type)}</GCRTCell>
                    <GCRTCell>{c.age_group || "N/A"}</GCRTCell>
                    <GCRTCell>{time}</GCRTCell>
                    <GCRTCell>
                      <GCRBadge color={ref.has_referral ? "green" : "amber"}>
                        {ref.has_referral ? "Referido" : "Pendente"}
                      </GCRBadge>
                    </GCRTCell>
                    <GCRTCell>
                      <GCRBadge color={safe ? "green" : "red"}>{safe ? "Segura" : "Risco"}</GCRBadge>
                    </GCRTCell>
                    <GCRTCell className="font-semibold">{c.risk_score || 0}</GCRTCell>
                  </GCRTRow>
                );
              })}
            </GCRTBody>
          </GCRTable>
        </div>
      </GCRCard>
    </div>
  );
}
