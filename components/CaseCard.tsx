"use client";

import { GBVCase, PRIORITY_CONFIG } from "@/lib/types";
import { calculateDaysSinceReferral, getTimeSinceIdentif, fmtViolence } from "@/lib/risk-calculator";

interface Props {
  case: GBVCase;
  index: number;
}

export default function CaseCard({ case: c, index }: Props) {
  const level = c.priority_level || "BAIXO";
  const config = PRIORITY_CONFIG[level];
  const ref = calculateDaysSinceReferral(c);
  const timeSince = getTimeSinceIdentif(c);
  const violence = fmtViolence(c.violence_type);
  const isSafe = (c.is_safe || "").toLowerCase() === "sim" || !c.is_safe;

  return (
    <div className={`gcr-card p-5 priority-${level.toLowerCase()} hover:shadow-card-hover hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="font-display text-lg font-semibold text-text-primary">{violence}</span>
          <span className="ml-3 text-caption text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">Caso #{index}</span>
        </div>
        <span className="text-small font-medium" style={{ color: config.color }}>
          Risco: {c.risk_score || 0}/100
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-small mb-4">
        {[
          ["ID", c.case_id],
          ["Distrito", c.district || "N/A"],
          ["Idade", c.age_group || "N/A"],
          ["Projeto", c.project || "N/A"],
          ["Gestor", c.case_manager || "N/A"],
          ["Tempo", timeSince],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-caption text-text-secondary">{label}</p>
            <p className="font-medium text-text-primary truncate">{value || "N/A"}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 text-small">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isSafe ? "bg-success/10 text-success" : "bg-critical/10 text-critical"}`}>
          {isSafe ? "Segura" : "NÃO SEGURA"}
        </span>
        <span className="text-text-secondary">|</span>
        <span>{c.emotional_state || "N/A"}</span>
      </div>

      {c.incident_description && (
        <details className="mb-4">
          <summary className="text-small text-primary cursor-pointer font-medium">Descrição</summary>
          <p className="text-small text-text-secondary mt-2 leading-relaxed">{c.incident_description}</p>
        </details>
      )}

      <div className={`text-small p-3 rounded-button font-medium ${ref.status === "CRITICO" ? "bg-red-50 text-critical" : ref.status === "ALTO" || ref.status === "SEM_REFERENCIA" ? "bg-orange-50 text-high" : "bg-blue-50 text-primary"}`}>
        {ref.alert}
      </div>
    </div>
  );
}
