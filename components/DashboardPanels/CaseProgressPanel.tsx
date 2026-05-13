"use client";

import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import { calcStats } from "@/lib/risk-calculator";

export function CaseProgressPanel({ cases }: { cases: GBVCase[] }) {
  const stats = calcStats(cases);

  const stages = [
    {
      label: "Identificados",
      value: stats.total,
      color: "primary",
      icon: "📋",
    },
    {
      label: "Entrevistados",
      value: cases.filter(c => c.interview_date).length,
      color: "info",
      icon: "💬",
    },
    {
      label: "Referenciados",
      value: cases.filter(c => c.has_referral).length,
      color: "info",
      icon: "📤",
    },
    {
      label: "Encerrados",
      value: stats.closed,
      color: "success",
      icon: "✅",
    },
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
              <p className={`text-2xl font-bold text-${stage.color}`}>{stage.value}</p>
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
        {cases.map((gbvCase, idx) => (
          <GCRCard key={gbvCase.id} caseData={gbvCase} isFirst={idx === 0} />
        ))}
      </div>
    </div>
  );
}