"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";

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
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const s = compute(cases);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Risk, Safety & Referral Gaps</h1>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: "Críticos", value: s.critical, color: "text-critical" },
          { label: "Não Seguras", value: s.unsafe, color: "text-critical" },
          { label: "Sem Plano Segurança", value: s.noSafety, color: "text-warning" },
          { label: "Menores Envolvidos", value: s.minor, color: "text-info" },
          { label: "Incidentes Anteriores", value: s.prev, color: "text-warning" },
          { label: "Perpetrador Familiar", value: s.familyPerp, color: "text-critical" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GCRCard title="Indicadores de Risco">
          <div className="space-y-3">
            {Object.entries(s.riskFlags).map(([label, value]) => {
              const pct = s.total ? (value / s.total) * 100 : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-label mb-1">
                    <span className="text-text-secondary">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: value > 5 ? "#C65A5A" : "#D9A441" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GCRCard>

        <GCRCard title="Gaps de Segurança">
          <div className="space-y-3">
            {[
              { label: "Sobreviventes não seguras", value: s.unsafe, total: s.total },
              { label: "Sem plano de segurança", value: s.noSafety, total: s.total },
              { label: "Perpetrador familiar/parceiro", value: s.familyPerp, total: s.total },
              { label: "Com histórico anterior", value: s.prev, total: s.total },
            ].map(({ label, value, total }) => (
              <div key={label} className="flex justify-between py-2 px-3 rounded-lg bg-gray-50">
                <span className="text-body text-text-secondary">{label}</span>
                <span className="font-semibold">{value} <span className="text-caption text-text-secondary">({total ? ((value / total) * 100).toFixed(0) : 0}%)</span></span>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>
    </div>
  );
}
