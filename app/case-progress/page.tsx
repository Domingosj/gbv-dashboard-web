"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { Activity, Clock, CheckCircle, ArrowRight } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function compute(cases: GBVCase[]) {
  const open = cases.filter(c => c.case_status === "Aberto");
  const closed = cases.filter(c => c.case_status === "Encerrado");

  const referredTypes: Record<string, number> = {
    "Médico": open.filter(c => /sim/i.test(c.referred_medical || "")).length,
    "Psicossocial": open.filter(c => /sim/i.test(c.referred_psychosocial || "")).length,
    "Polícia": open.filter(c => /sim/i.test(c.referred_police || "")).length,
    "Jurídico": open.filter(c => /sim/i.test(c.referred_legal || "")).length,
    "Casa Segura": open.filter(c => /sim/i.test(c.referred_safe_house || "")).length,
    "Proteção Infantil": open.filter(c => /sim/i.test(c.referred_child_protection || "")).length,
  };

  const closureReasons: Record<string, number> = {};
  for (const c of closed) {
    const r = c.closure_reason || "Não especificado";
    closureReasons[r] = (closureReasons[r] || 0) + 1;
  }

  let totalDaysToRef = 0;
  let refCount = 0;
  for (const c of open) {
    const id = c.identification_date;
    const refDates = [c.date_referred_medical, c.date_referred_psychosocial, c.date_referred_police, c.date_referred_safe_house].filter(Boolean);
    if (id && refDates.length > 0) {
      const earliestRef = new Date(Math.min(...refDates.map(d => new Date(d!).getTime())));
      totalDaysToRef += (earliestRef.getTime() - new Date(id).getTime()) / (1000 * 60 * 60 * 24);
      refCount++;
    }
  }

  let totalDaysToClose = 0;
  let closeCount = 0;
  for (const c of closed) {
    if (c.identification_date && c.closure_date) {
      totalDaysToClose += (new Date(c.closure_date).getTime() - new Date(c.identification_date).getTime()) / (1000 * 60 * 60 * 24);
      closeCount++;
    }
  }

  const totalCases = cases.length;
  const identified = totalCases;
  const interviewed = cases.filter(c => c.interview_date).length;
  const referred = cases.filter(c => c.has_referral).length;
  const closedCount = closed.length;

  return {
    referredTypes,
    closureReasons,
    avgDaysToRef: refCount > 0 ? (totalDaysToRef / refCount).toFixed(1) : "—",
    avgDaysToClose: closeCount > 0 ? (totalDaysToClose / closeCount).toFixed(1) : "—",
    pipeline: { identified, interviewed, referred, closed: closedCount },
    refRate: totalCases > 0 ? ((referred / totalCases) * 100).toFixed(0) : "0",
    closeRate: totalCases > 0 ? ((closedCount / totalCases) * 100).toFixed(0) : "0",
  };
}

export default function CaseProgressPage() {
  const { data: cases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });

  if (error) return <p className="text-critical p-8">Erro ao carregar dados</p>;
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const s = compute(cases);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Case Progress Monitor</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pipeline: Identificados", value: s.pipeline.identified, icon: Activity, color: "text-primary" },
          { label: "Entrevistados", value: s.pipeline.interviewed, icon: ArrowRight, color: "text-info" },
          { label: "Referenciados", value: s.pipeline.referred, icon: ArrowRight, color: "text-info" },
          { label: "Encerrados", value: s.pipeline.closed, icon: CheckCircle, color: "text-success" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="gcr-card p-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-label text-text-secondary">{label}</span>
            </div>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="gcr-card p-card">
          <h2 className="text-section-title mb-4">🔄 Pipeline Progress</h2>
          <div className="space-y-4">
            {[
              { label: "Identificados → Entrevistados", pct: s.pipeline.interviewed / s.pipeline.identified * 100, color: "bg-primary" },
              { label: "Entrevistados → Referenciados", pct: s.pipeline.referred / s.pipeline.interviewed * 100, color: "bg-info" },
              { label: "Referenciados → Encerrados", pct: s.pipeline.closed / s.pipeline.referred * 100, color: "bg-success" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-label mb-1">
                  <span className="text-text-secondary">{label}</span>
                  <span className="font-semibold">{pct > 0 ? pct.toFixed(0) : 0}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center flex-1">
              <p className="text-label text-text-secondary">Taxa de Referência</p>
              <p className="text-metric text-primary">{s.refRate}%</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-label text-text-secondary">Taxa de Encerramento</p>
              <p className="text-metric text-success">{s.closeRate}%</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-label text-text-secondary">Dias p/ Referência</p>
              <p className="text-metric text-text-primary">{s.avgDaysToRef}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-label text-text-secondary">Dias p/ Encerramento</p>
              <p className="text-metric text-text-primary">{s.avgDaysToClose}</p>
            </div>
          </div>
        </div>

        <div className="gcr-card p-card">
          <h2 className="text-section-title mb-4">📞 Referrals by Service</h2>
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
        </div>
      </div>

      {Object.keys(s.closureReasons).length > 0 && (
        <div className="gcr-card p-card">
          <h2 className="text-section-title mb-4">📋 Closure Reasons</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(s.closureReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
              <div key={reason} className="p-3 rounded-button bg-gray-50 text-center">
                <p className="text-metric text-text-primary">{count}</p>
                <p className="text-caption text-text-secondary mt-1 truncate">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
