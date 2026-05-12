"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import {
  ClipboardList, UserCheck, ArrowRightLeft, CheckCircle2,
  Clock, Timer, TrendingUp, Stethoscope, Brain, Gavel, Shield, Home, Baby
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function compute(cases: GBVCase[]) {
  const open = cases.filter(c => c.case_status === "Aberto");
  const closed = cases.filter(c => c.case_status === "Encerrado");

  const referredTypes = [
    { key: "referred_medical", label: "Médico", icon: Stethoscope },
    { key: "referred_psychosocial", label: "Psicossocial", icon: Brain },
    { key: "referred_legal", label: "Jurídico", icon: Gavel },
    { key: "referred_police", label: "Polícia", icon: Shield },
    { key: "referred_safe_house", label: "Abrigo", icon: Home },
    { key: "referred_child_protection", label: "Protecção Infantil", icon: Baby },
  ].map(({ key, label, icon }) => ({
    label,
    icon,
    count: open.filter(c => /sim/i.test((c as any)[key] || "")).length,
  }));

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

  if (!cases) return (
    <div className="flex items-center justify-center h-[400px]">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-body text-sm">Carregando progresso dos casos...</p>
      </div>
    </div>
  );

  const s = compute(cases);

  const kpis = [
    { label: "Identificados", value: s.pipeline.identified, icon: ClipboardList, color: "text-primary", bg: "bg-primary/10" },
    { label: "Entrevistados", value: s.pipeline.interviewed, icon: UserCheck, color: "text-info", bg: "bg-info/10" },
    { label: "Referenciados", value: s.pipeline.referred, icon: ArrowRightLeft, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Encerrados", value: s.pipeline.closed, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  ];

  return (
    <div className="mx-auto max-w-screen-2xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-text-primary">Case Progress Monitor</h1>
        <p className="text-sm text-body mt-1">Acompanhe o fluxo de casos desde a identificação até ao encerramento.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="gcr-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-body">{label}</span>
                <h4 className="text-[28px] font-bold text-text-primary mt-1">{value}</h4>
              </div>
              <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Pipeline Progress */}
        <GCRCard title="Progresso do Pipeline" className="lg:col-span-7">
          <div className="space-y-6 mt-1">
            {[
              { label: "Identificados → Entrevistados", pct: s.pipeline.identified ? (s.pipeline.interviewed / s.pipeline.identified) * 100 : 0, color: "bg-primary" },
              { label: "Entrevistados → Referenciados", pct: s.pipeline.interviewed ? (s.pipeline.referred / s.pipeline.interviewed) * 100 : 0, color: "bg-secondary" },
              { label: "Referenciados → Encerrados", pct: s.pipeline.referred ? (s.pipeline.closed / s.pipeline.referred) * 100 : 0, color: "bg-success" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-text-primary">{label}</span>
                  <span className="font-bold text-text-primary">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Performance metrics row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-stroke">
            {[
              { label: "Taxa de Referência", value: `${s.refRate}%`, icon: TrendingUp, color: "text-primary" },
              { label: "Taxa de Encerramento", value: `${s.closeRate}%`, icon: CheckCircle2, color: "text-success" },
              { label: "Dias até Referência", value: s.avgDaysToRef, icon: Clock, color: "text-body" },
              { label: "Dias até Encerrar", value: s.avgDaysToClose, icon: Timer, color: "text-body" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="text-center p-3 rounded-sm bg-background">
                <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                <p className="text-[22px] font-bold text-text-primary">{value}</p>
                <p className="text-xs text-body mt-1">{label}</p>
              </div>
            ))}
          </div>
        </GCRCard>

        {/* Referrals by Service */}
        <GCRCard title="Referências por Serviço" className="lg:col-span-5">
          <div className="space-y-4 mt-1">
            {s.referredTypes
              .sort((a, b) => b.count - a.count)
              .map(({ label, count, icon: Icon }) => {
                const max = Math.max(...s.referredTypes.map(r => r.count), 1);
                const pct = (count / max) * 100;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-text-primary">{label}</span>
                      </div>
                      <span className="font-bold">{count}</span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden ml-10">
                      <div className="h-full bg-primary/70 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </GCRCard>
      </div>

      {/* Closure Reasons */}
      {Object.keys(s.closureReasons).length > 0 && (
        <GCRCard title="Motivos de Encerramento">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(s.closureReasons)
              .sort((a, b) => b[1] - a[1])
              .map(([reason, count]) => {
                const totalClosed = s.pipeline.closed || 1;
                const pct = ((count / totalClosed) * 100).toFixed(0);
                return (
                  <div key={reason} className="p-4 rounded-sm bg-background border border-stroke text-center">
                    <p className="text-[22px] font-bold text-text-primary">{count}</p>
                    <p className="text-xs text-body mt-1 truncate" title={reason}>{reason}</p>
                    <GCRBadge color="grey" className="mt-2">{pct}%</GCRBadge>
                  </div>
                );
              })}
          </div>
        </GCRCard>
      )}
    </div>
  );
}
