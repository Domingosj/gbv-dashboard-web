"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import {
  ShieldAlert, ShieldOff, Baby, AlertTriangle, Repeat, HeartCrack
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function compute(cases: GBVCase[]) {
  const open = cases.filter(c => c.case_status === "Aberto");
  const critical = open.filter(c => c.priority_level === "CRÍTICO").length;
  const alto = open.filter(c => c.priority_level === "ALTO").length;
  const unsafe = open.filter(c => (c.is_safe || "").toLowerCase() === "não" || (c.is_safe || "").toLowerCase() === "nao").length;
  const noSafety = open.filter(c => !c.safety_measures || c.safety_measures.trim() === "").length;
  const minor = open.filter(c => (c.age_group || "").includes("0-11") || (c.age_group || "").includes("12-17")).length;
  const prev = open.filter(c => (c.previous_incident || "").toLowerCase() === "sim").length;
  const familyPerp = open.filter(c => {
    const rel = (c.perpetrator_relationship || "").toLowerCase();
    return rel.includes("família") || rel.includes("familiar") || rel.includes("parceiro") || rel.includes("íntimo") || rel.includes("intimo") || rel.includes("cuidador");
  }).length;

  const riskFlags: Record<string, number> = {
    "Violação": open.filter(c => (c.violence_type || "").toLowerCase().includes("violação")).length,
    "Agressão Física": open.filter(c => (c.violence_type || "").toLowerCase().includes("agressão física")).length,
    "Agressão Sexual": open.filter(c => (c.violence_type || "").toLowerCase().includes("agressão sexual")).length,
    "Menor + Violência Grave": open.filter(c => {
      const age = c.age_group || "";
      const vt = c.violence_type || "";
      return (age.includes("0-11") || age.includes("12-17")) &&
        (vt.toLowerCase().includes("violação") || vt.toLowerCase().includes("agressão sexual") || vt.toLowerCase().includes("agressão física"));
    }).length,
  };

  return { total: open.length, critical, alto, unsafe, noSafety, minor, prev, familyPerp, riskFlags };
}

export default function RiskSafetyPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });

  if (!cases) return (
    <div className="flex items-center justify-center h-[400px]">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-danger/30 border-t-danger rounded-full animate-spin" />
        <p className="text-body text-sm">A carregar indicadores de risco...</p>
      </div>
    </div>
  );

  const s = compute(cases);

  const stats = [
    { label: "Casos Críticos", value: s.critical, icon: ShieldAlert, color: "text-danger", bg: "bg-danger/10", desc: "Nível máximo de risco" },
    { label: "Não Seguras", value: s.unsafe, icon: ShieldOff, color: "text-danger", bg: "bg-danger/10", desc: "Retorno não seguro" },
    { label: "Sem Plano de Segurança", value: s.noSafety, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", desc: "Medidas não documentadas" },
    { label: "Menores Envolvidos", value: s.minor, icon: Baby, color: "text-info", bg: "bg-info/10", desc: "0-17 anos" },
    { label: "Incidentes Anteriores", value: s.prev, icon: Repeat, color: "text-warning", bg: "bg-warning/10", desc: "Recorrência de VBG" },
    { label: "Perpetrador Familiar", value: s.familyPerp, icon: HeartCrack, color: "text-danger", bg: "bg-danger/10", desc: "Contexto doméstico" },
  ];

  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-text-primary">Risco, Segurança e Lacunas de Referência</h1>
        <p className="text-sm text-body mt-1">Monitoramento de indicadores de risco e lacunas de segurança nos casos activos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg, desc }) => (
          <div key={label} className="gcr-card p-5">
            <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h4 className="text-[24px] font-bold text-text-primary">{value}</h4>
            <p className="text-sm font-medium text-text-primary mt-1">{label}</p>
            <p className="text-xs text-body mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GCRCard title="Indicadores de Risco por Tipo de Violência">
          <div className="space-y-5 mt-1">
            {Object.entries(s.riskFlags)
              .sort(([, a], [, b]) => b - a)
              .map(([label, value]) => {
                const pct = s.total ? (value / s.total) * 100 : 0;
                const severity = pct > 15 ? "danger" : pct > 5 ? "warning" : "info";
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-text-primary">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{value}</span>
                        <GCRBadge color={severity === "danger" ? "red" : severity === "warning" ? "amber" : "blue"}>
                          {pct.toFixed(0)}%
                        </GCRBadge>
                      </div>
                    </div>
                    <div className="h-2.5 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          severity === "danger" ? "bg-danger" : severity === "warning" ? "bg-warning" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </GCRCard>

        <GCRCard title="Lacunas de Segurança">
          <div className="space-y-3 mt-1">
            {[
              { label: "Sobreviventes com retorno não seguro", value: s.unsafe, total: s.total, icon: ShieldOff, severity: "high" as const },
              { label: "Sem plano de segurança documentado", value: s.noSafety, total: s.total, icon: AlertTriangle, severity: "medium" as const },
              { label: "Perpetrador familiar ou parceiro", value: s.familyPerp, total: s.total, icon: HeartCrack, severity: "high" as const },
              { label: "Com histórico de VBG anterior", value: s.prev, total: s.total, icon: Repeat, severity: "medium" as const },
            ].map(({ label, value, total, icon: Icon, severity }) => {
              const pct = total ? ((value / total) * 100).toFixed(0) : "0";
              return (
                <div key={label} className={`flex items-center justify-between p-4 rounded-sm border ${
                  severity === "high" ? "border-danger/20 bg-danger/5" : "border-warning/20 bg-warning/5"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      severity === "high" ? "bg-danger/10" : "bg-warning/10"
                    }`}>
                      <Icon className={`w-4.5 h-4.5 ${severity === "high" ? "text-danger" : "text-warning"}`} />
                    </div>
                    <span className="text-sm font-medium text-text-primary">{label}</span>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-lg font-bold text-text-primary">{value}</span>
                    <span className="text-xs text-body ml-1.5">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-4 rounded-sm bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Resumo de Risco</p>
                <p className="text-xs text-body mt-1 leading-relaxed">
                  {s.critical + s.unsafe} casos requerem intervenção imediata.
                  {s.minor > 0 && ` ${s.minor} envolvem menores.`}
                  {s.familyPerp > 0 && ` ${s.familyPerp} ocorrem em contexto familiar.`}
                </p>
              </div>
            </div>
          </div>
        </GCRCard>
      </div>
    </div>
  );
}
