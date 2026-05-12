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
    <div className={`bg-white rounded-xl border border-gray-200 p-5 priority-${level.toLowerCase()} mb-4`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-lg font-semibold">{config.icon} {violence}</span>
          <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Caso #{index}</span>
        </div>
        <span className="text-xs font-medium" style={{ color: config.color }}>
          Score: {c.risk_score || 0}/100
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
        <div>
          <p className="text-gray-500">ID</p>
          <p className="font-medium">{c.case_id}</p>
        </div>
        <div>
          <p className="text-gray-500">📍 Distrito</p>
          <p className="font-medium">{c.district || "N/A"}</p>
        </div>
        <div>
          <p className="text-gray-500">👤 Idade</p>
          <p className="font-medium">{c.age_group || "N/A"}</p>
        </div>
        <div>
          <p className="text-gray-500">📂 Projeto</p>
          <p className="font-medium">{c.project || "N/A"}</p>
        </div>
        <div>
          <p className="text-gray-500">👥 Gestor</p>
          <p className="font-medium">{c.case_manager || "N/A"}</p>
        </div>
        <div>
          <p className="text-gray-500">⏰ Tempo</p>
          <p className="font-medium">{timeSince}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <span>{isSafe ? "🟢 Segura" : "🔴 NÃO SEGURA"}</span>
        <span>| 😔 {c.emotional_state || "N/A"}</span>
      </div>

      {c.incident_description && (
        <details className="mb-3">
          <summary className="text-sm text-blue-600 cursor-pointer">📝 Descrição</summary>
          <p className="text-sm text-gray-600 mt-2">{c.incident_description}</p>
        </details>
      )}

      <div className={`text-sm p-2 rounded ${
        ref.status === "CRITICO" ? "bg-red-50 text-red-700" :
        ref.status === "ALTO" || ref.status === "SEM_REFERENCIA" ? "bg-orange-50 text-orange-700" :
        "bg-blue-50 text-blue-700"
      }`}>
        {ref.alert_icon} {ref.alert}
      </div>
    </div>
  );
}
