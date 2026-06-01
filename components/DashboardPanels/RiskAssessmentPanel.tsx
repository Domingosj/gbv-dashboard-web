"use client";

import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import { AlertTriangle, Shield, Users, Heart } from "lucide-react";

export function RiskAssessmentPanel({ cases }: { cases: GBVCase[] }) {
  const open = cases.filter(c => c.case_status === "Aberto");

  const risks = {
    critical: open.filter(c => c.priority_level === "CRÍTICO").length,
    unsafe: open.filter(
      c => (c.is_safe || "").toLowerCase() === "não" || (c.is_safe || "").toLowerCase() === "nao"
    ).length,
    noSafety: open.filter(c => !c.safety_measures || c.safety_measures.trim() === "").length,
    minor: open.filter(
      c => (c.age_group || "").includes("0-11") || (c.age_group || "").includes("12-17")
    ).length,
    prev: open.filter(c => (c.previous_incident || "").toLowerCase() === "sim").length,
    familyPerp: open.filter(c => {
      const rel = (c.perpetrator_relationship || "").toLowerCase();
      return (
        rel.includes("família") ||
        rel.includes("familiar") ||
        rel.includes("parceiro") ||
        rel.includes("íntimo") ||
        rel.includes("intimo") ||
        rel.includes("cuidador")
      );
    }).length,
  };

  const cardStyle = (color: "red" | "amber" | "blue") => {
    const colors = {
      red: { border: "2px solid rgba(211, 64, 83, 0.25)", background: "rgba(211, 64, 83, 0.06)", icon: "#D34053", text: "#93000a" },
      amber: { border: "2px solid rgba(255, 167, 11, 0.25)", background: "rgba(255, 167, 11, 0.06)", icon: "#FFA70B", text: "#644119" },
      blue: { border: "2px solid rgba(0, 82, 67, 0.25)", background: "rgba(0, 82, 67, 0.06)", icon: "#005243", text: "#005141" },
    };
    return colors[color];
  };

  return (
    <div className="space-y-6">
      <h3 className="text-headline-lg text-on-surface">Avaliação de Risco e Segurança</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Críticos", value: risks.critical, icon: AlertTriangle, color: "red" as const },
          { label: "Não Seguras", value: risks.unsafe, icon: AlertTriangle, color: "red" as const },
          { label: "Sem Plano Segurança", value: risks.noSafety, icon: Shield, color: "amber" as const },
          { label: "Menores Envolvidos", value: risks.minor, icon: Users, color: "blue" as const },
          { label: "Incidentes Anteriores", value: risks.prev, icon: Heart, color: "amber" as const },
          { label: "Perpetrador Familiar", value: risks.familyPerp, icon: AlertTriangle, color: "red" as const },
        ].map(({ label, value, icon: Icon, color }) => {
          const s = cardStyle(color);
          return (
            <div key={label} className="p-4 rounded-xl text-center" style={{ border: s.border, backgroundColor: s.background }}>
              <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.icon }} />
              <p className="text-caption text-on-surface-variant">{label}</p>
              <p className="text-metric font-bold" style={{ color: s.text }}>{value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-outline-variant overflow-hidden">
        <div className="bg-surface-container p-4 border-b border-outline-variant">
          <h4 className="text-label font-semibold text-on-surface">Detalhes dos Casos Abertos</h4>
        </div>
        <div className="max-h-60 overflow-y-auto divide-y divide-outline-variant/50">
          {open.length === 0 ? (
            <div className="p-4 text-center text-on-surface-variant text-body-sm">
              Nenhum caso aberto para exibir.
            </div>
          ) : (
            open.map((gbvCase) => (
              <GCRCard key={gbvCase.case_id || gbvCase.record_id}>
                <div className="text-body-sm space-y-1">
                  <p className="font-semibold text-on-surface font-mono text-data-sm">{gbvCase.case_id}</p>
                  <p className="text-on-surface-variant">{gbvCase.district || "N/A"} - {gbvCase.violence_type_short || gbvCase.violence_type || "N/A"}</p>
                </div>
              </GCRCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
