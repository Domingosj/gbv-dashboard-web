"use client";

import { GBVCase } from "@/lib/types";

export function ReferralPanel({ cases }: { cases: GBVCase[] }) {
  const open = cases.filter(c => c.case_status === "Aberto");

  const refs = [
    { label: "Médico", key: "referred_medical", icon: "🏥" },
    { label: "Psicossocial", key: "referred_psychosocial", icon: "🧠" },
    { label: "Polícia", key: "referred_police", icon: "🚔" },
    { label: "Jurídico", key: "referred_legal", icon: "⚖️" },
    { label: "Abrigo Seguro", key: "referred_safe_house", icon: "🏠" },
    { label: "Proteção Infantil", key: "referred_child_protection", icon: "👶" },
  ] as const;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">Vias de Referência</h3>

      <div className="space-y-4">
        {refs.map(({ label, key, icon }) => {
          const sim = open.filter(c => /sim/i.test((c as any)[key] || "")).length;
          const percentage = open.length > 0 ? (sim / open.length) * 100 : 0;

          return (
            <div key={key} className="p-4 rounded-lg bg-gray-50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <span className="font-medium text-text-primary">{label}</span>
                </div>
                <span className="text-sm font-bold text-primary">
                  {sim}/{open.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    percentage >= 75
                      ? "bg-success"
                      : percentage >= 50
                        ? "bg-warning"
                        : "bg-critical"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="text-xs text-text-secondary mt-1">
                {percentage.toFixed(0)}% de cobertura
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}