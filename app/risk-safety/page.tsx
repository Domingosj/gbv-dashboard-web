"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { ShieldAlert, AlertTriangle, Users, FileX, Eye, RefreshCcw } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function compute(cases: GBVCase[]) {
  const open = cases.filter(c => c.case_status === "Aberto");

  const critical = open.filter(c => c.priority_level === "CRÍTICO").length;
  const alto = open.filter(c => c.priority_level === "ALTO").length;
  const unsafe = open.filter(c => (c.is_safe || "").toLowerCase() === "não" || (c.is_safe || "").toLowerCase() === "nao").length;
  const noSafety = open.filter(c => !c.safety_measures || c.safety_measures.trim() === "").length;
  const minorSerious = open.filter(c =>
    (c.age_group || "").includes("0-11") || (c.age_group || "").includes("12-17")
  ).length;
  const prevIncident = open.filter(c => (c.previous_incident || "").toLowerCase() === "sim").length;
  const familyPerp = open.filter(c => {
    const rel = (c.perpetrator_relationship || "").toLowerCase();
    return rel.includes("família") || rel.includes("familiar") || rel.includes("parceiro") || rel.includes("íntimo") || rel.includes("intimo") || rel.includes("cuidador");
  }).length;

  const riskFlags = {
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

  return { total: open.length, critical, alto, unsafe, noSafety, minorSerious, prevIncident, familyPerp, riskFlags };
}

export default function RiskSafetyPage() {
  const { data: cases, error } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });

  if (error) return <p className="text-critical p-8">Erro ao carregar dados</p>;
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const s = compute(cases);

  const summaryCards = [
    { label: "Críticos", value: s.critical, icon: ShieldAlert, color: "text-critical", bg: "bg-critical/10" },
    { label: "Não Seguras", value: s.unsafe, icon: AlertTriangle, color: "text-critical", bg: "bg-critical/10" },
    { label: "Sem Plano de Segurança", value: s.noSafety, icon: Eye, color: "text-warning", bg: "bg-warning/10" },
    { label: "Menores Envolvidos", value: s.minorSerious, icon: Users, color: "text-info", bg: "bg-info/10" },
    { label: "Incidentes Anteriores", value: s.prevIncident, icon: RefreshCcw, color: "text-warning", bg: "bg-warning/10" },
    { label: "Perpetrador Familiar/Íntimo", value: s.familyPerp, icon: Users, color: "text-critical", bg: "bg-critical/10" },
  ];

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Risk, Safety & Referral Gaps</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="gcr-card p-card">
            <div className={`inline-flex p-2 rounded-button ${bg} mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-metric ${color}`}>{value}</p>
            <p className="text-label text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="gcr-card p-card">
          <h2 className="text-section-title mb-4">🚩 Risk Flags Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(s.riskFlags).map(([label, value]) => {
              const pct = s.total > 0 ? (value / s.total) * 100 : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-label mb-1">
                    <span className="text-text-secondary">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: value > 5 ? "#C65A5A" : "#D9A441" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gcr-card p-card">
          <h2 className="text-section-title mb-4">🛡️ Safety Gaps</h2>
          <div className="space-y-3">
            {[
              { label: "Sobreviventes não seguras", value: s.unsafe, total: s.total, color: "critical" },
              { label: "Sem plano de segurança documentado", value: s.noSafety, total: s.total, color: "warning" },
              { label: "Perpetrator é familiar/parceiro", value: s.familyPerp, total: s.total, color: "critical" },
              { label: "Com histórico de incidentes anteriores", value: s.prevIncident, total: s.total, color: "warning" },
            ].map(({ label, value, total, color }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-button bg-gray-50">
                <span className="text-body text-text-secondary">{label}</span>
                <span className={`font-semibold ${color === "critical" ? "text-critical" : "text-warning"}`}>
                  {value} ({total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
