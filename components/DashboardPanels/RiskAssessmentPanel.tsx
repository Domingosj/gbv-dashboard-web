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
          { label: "Críticos", value: risks.critical, icon: AlertTriangle, color: "red" },
          { label: "Não Seguras", value: risks.unsafe, icon: AlertTriangle, color: "red" },
          { label: "Sem Plano Segurança", value: risks.noSafety, icon: Shield, color: "orange" },
          { label: "Menores Envolvidos", value: risks.minor, icon: Users, color: "blue" },
          { label: "Incidentes Anteriores", value: risks.prev, icon: Heart, color: "orange" },
          { label: "Perpetrador Familiar", value: risks.familyPerp, icon: AlertTriangle, color: "red" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className={`p-4 rounded-lg border-2 border-${color}-200 bg-${color}-50 text-center`}
          >
            <Icon className={`w-5 h-5 text-${color}-600 mx-auto mb-2`} />
            <p className="text-xs text-gray-600">{label}</p>
            <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
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
            open.map((gbvCase, index) => (
              <GCRCard key={gbvCase.id} caseData={gbvCase} isLast={index === open.length - 1} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}