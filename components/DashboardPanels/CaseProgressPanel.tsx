"use client";

import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import { calcStats } from "@/lib/risk-calculator";

export function CaseProgressPanel({ cases }: { cases: GBVCase[] }) {
  const stats = calcStats(cases);

  const stages = [
    { label: "Identificados", value: stats.total, className: "text-primary", icon: "📋" },
    { label: "Entrevistados", value: cases.filter(c => c.interview_date).length, className: "text-info", icon: "💬" },
    { label: "Referenciados", value: cases.filter(c => c.has_referral).length, className: "text-info", icon: "📤" },
    { label: "Encerrados", value: stats.closed, className: "text-success", icon: "✅" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary">Progresso dos Casos</h3>

      {/* Pipeline visualization */}
      <div className="flex items-stretch gap-4">
        {stages.map((stage, idx) => (
          <div key={stage.label} className="flex-1 flex flex-col">
            {/* Arrow */}
            {idx < stages.length - 1 && (
              <div className="flex items-center justify-center text-2xl text-gray-300 h-12">→</div>
            )}

            {/* Stage box */}
            <div className="flex-1 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-border">
              <p className="text-3xl mb-2">{stage.icon}</p>
              <p className="text-sm text-text-secondary">{stage.label}</p>
              <p className={`text-2xl font-bold ${stage.className}`}>{stage.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            label: "Taxa Referência",
            value: stats.total ? ((stats.total - stats.no_ref) / stats.total * 100).toFixed(0) : 0,
            unit: "%",
          },
          {
            label: "Taxa Encerramento",
            value: stats.total ? (stats.closed / stats.total * 100).toFixed(0) : 0,
            unit: "%",
          },
          { label: "Abertos", value: stats.open, unit: "casos" },
          { label: "Atrasados", value: stats.delayed, unit: "casos" },
        ].map(({ label, value, unit }) => (
          <div key={label} className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="text-2xl font-bold text-primary">
              {value}
              <span className="text-sm ml-1">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Case details cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.slice(0, 6).map((gbvCase) => (
          <GCRCard key={gbvCase.case_id || gbvCase.record_id}>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-text-primary">{gbvCase.case_id}</p>
              <p className="text-text-secondary">{gbvCase.district || "N/A"}</p>
              <p className="text-text-secondary">{gbvCase.violence_type_short || gbvCase.violence_type || "N/A"}</p>
              {gbvCase.priority_level === "CRÍTICO" && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-caption font-medium bg-critical/10 text-critical">CRÍTICO</span>
              )}
            </div>
          </GCRCard>
        ))}
      </div>
    </div>
  );
}