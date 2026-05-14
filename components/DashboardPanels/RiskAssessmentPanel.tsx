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

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">Avaliação de Risco e Segurança</h3>

      {/* Risk indicators */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Críticos", value: risks.critical, icon: AlertTriangle, color: "red", style: { border: "2px solid #fecaca", background: "#fef2f2", iconColor: "#dc2626", textColor: "#b91c1c" } },
          { label: "Não Seguras", value: risks.unsafe, icon: AlertTriangle, color: "red", style: { border: "2px solid #fecaca", background: "#fef2f2", iconColor: "#dc2626", textColor: "#b91c1c" } },
          { label: "Sem Plano Segurança", value: risks.noSafety, icon: Shield, color: "amber", style: { border: "2px solid #fde68a", background: "#fffbeb", iconColor: "#d97706", textColor: "#b45309" } },
          { label: "Menores Envolvidos", value: risks.minor, icon: Users, color: "blue", style: { border: "2px solid #bfdbfe", background: "#eff6ff", iconColor: "#2563eb", textColor: "#1d4ed8" } },
          { label: "Incidentes Anteriores", value: risks.prev, icon: Heart, color: "amber", style: { border: "2px solid #fde68a", background: "#fffbeb", iconColor: "#d97706", textColor: "#b45309" } },
          { label: "Perpetrador Familiar", value: risks.familyPerp, icon: AlertTriangle, color: "red", style: { border: "2px solid #fecaca", background: "#fef2f2", iconColor: "#dc2626", textColor: "#b91c1c" } },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="p-4 rounded-lg text-center"
            style={{ border: color === "red" ? "2px solid #fecaca" : color === "amber" ? "2px solid #fde68a" : "2px solid #bfdbfe", backgroundColor: color === "red" ? "#fef2f2" : color === "amber" ? "#fffbeb" : "#eff6ff" }}
          >
            <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: color === "red" ? "#dc2626" : color === "amber" ? "#d97706" : "#2563eb" }} />
            <p className="text-xs text-gray-600">{label}</p>
            <p className="text-2xl font-bold" style={{ color: color === "red" ? "#b91c1c" : color === "amber" ? "#b45309" : "#1d4ed8" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Cases table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-gray-100 p-4">
          <h4 className="text-sm font-semibold text-text-primary">Detalhes dos Casos Abertos</h4>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {open.length === 0 ? (
            <div className="p-4 text-center text-text-secondary text-sm">
              Nenhum caso aberto para exibir.
            </div>
          ) : (
            open.map((gbvCase) => (
              <GCRCard key={gbvCase.case_id || gbvCase.record_id}>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-text-primary">{gbvCase.case_id}</p>
                  <p className="text-text-secondary">{gbvCase.district || "N/A"} - {gbvCase.violence_type_short || gbvCase.violence_type || "N/A"}</p>
                </div>
              </GCRCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}