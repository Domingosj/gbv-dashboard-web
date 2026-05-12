"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function compute(cases: GBVCase[]) {
  const open = cases.filter(c => c.case_status === "Aberto");
  const closed = cases.filter(c => c.case_status === "Encerrado");

  const referredTypes: Record<string, number> = {
    "Médico": open.filter(c => /sim/i.test(c.referred_medical || "")).length,
    "Psicossocial": open.filter(c => /sim/i.test(c.referred_psychosocial || "")).length,
    "Polícia": open.filter(c => /sim/i.test(c.referred_police || "")).length,
    "Jurídico": open.filter(c => /sim/i.test(c.referred_legal || "")).length,
    "Abrigo": open.filter(c => /sim/i.test(c.referred_safe_house || "")).length,
    "Proteção Infantil": open.filter(c => /sim/i.test(c.referred_child_protection || "")).length,
  };

  const closureReasons: Record<string, number> = {};
  for (const c of closed) {
    const r = c.closure_reason || "Não especificado";
    closureReasons[r] = (closureReasons[r] || 0) + 1;
  }

  let refDays = 0, refCount = 0;
  for (const c of open) {
    const id = c.identification_date;
    const dates = [c.date_referred_medical, c.date_referred_psychosocial, c.date_referred_police, c.date_referred_safe_house].filter(Boolean);
    if (id && dates.length) {
      const earliest = new Date(Math.min(...dates.map(d => new Date(d!).getTime())));
      refDays += (earliest.getTime() - new Date(id).getTime()) / 86400000;
      refCount++;
    }
  }

  let closeDays = 0, closeCount = 0;
  for (const c of closed) {
    if (c.identification_date && c.closure_date) {
      closeDays += (new Date(c.closure_date).getTime() - new Date(c.identification_date).getTime()) / 86400000;
      closeCount++;
    }
  }

  const total = cases.length;
  const interviewed = cases.filter(c => c.interview_date).length;
  const referred = cases.filter(c => c.has_referral).length;

  return {
    pipeline: { identified: total, interviewed, referred, closed: closed.length },
    referredTypes, closureReasons,
    avgDaysToRef: refCount ? (refDays / refCount).toFixed(1) : "—",
    avgDaysToClose: closeCount ? (closeDays / closeCount).toFixed(1) : "—",
    refRate: total ? ((referred / total) * 100).toFixed(0) : "0",
    closeRate: total ? ((closed.length / total) * 100).toFixed(0) : "0",
  };
}

export default function CaseProgressPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const s = compute(cases);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Case Progress Monitor</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Identificados", value: s.pipeline.identified, color: "text-primary" },
          { label: "Entrevistados", value: s.pipeline.interviewed, color: "text-info" },
          { label: "Referenciados", value: s.pipeline.referred, color: "text-info" },
          { label: "Encerrados", value: s.pipeline.closed, color: "text-success" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Progresso do Pipeline">
          <div className="space-y-4">
            {[
              { label: "Identificados → Entrevistados", pct: s.pipeline.identified ? (s.pipeline.interviewed / s.pipeline.identified) * 100 : 0, color: "bg-primary" },
              { label: "Entrevistados → Referenciados", pct: s.pipeline.interviewed ? (s.pipeline.referred / s.pipeline.interviewed) * 100 : 0, color: "bg-info" },
              { label: "Referenciados → Encerrados", pct: s.pipeline.referred ? (s.pipeline.closed / s.pipeline.referred) * 100 : 0, color: "bg-success" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-label mb-1">
                  <span className="text-text-secondary">{label}</span>
                  <span className="font-semibold">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-border">
            {[
              { label: "Taxa Referência", value: `${s.refRate}%`, color: "text-primary" },
              { label: "Taxa Encerramento", value: `${s.closeRate}%`, color: "text-success" },
              { label: "Dias p/ Referência", value: s.avgDaysToRef, color: "text-text-primary" },
              { label: "Dias p/ Encerramento", value: s.avgDaysToClose, color: "text-text-primary" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center flex-1">
                <p className="text-label text-text-secondary">{label}</p>
                <p className={`text-metric ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Referências por Serviço">
          <div className="space-y-3">
            {Object.entries(s.referredTypes).sort((a, b) => b[1] - a[1]).map(([label, value]) => {
              const max = Math.max(...Object.values(s.referredTypes));
              return (
                <div key={label}>
                  <div className="flex justify-between text-label mb-1">
                    <span className="text-text-secondary">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-info rounded-full" style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GCRCard>
      </div>

      {Object.keys(s.closureReasons).length > 0 && (
        <GCRCard title="Motivos de Encerramento">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(s.closureReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
              <div key={reason} className="p-3 rounded-lg bg-gray-50 text-center">
                <p className="text-metric text-text-primary">{count}</p>
                <p className="text-caption text-text-secondary mt-1 truncate">{reason}</p>
              </div>
            ))}
          </div>
        </GCRCard>
      )}
    </div>
  );
}
