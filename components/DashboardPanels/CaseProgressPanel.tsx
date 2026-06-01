"use client";

import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import { calcStats } from "@/lib/risk-calculator";
import { Search, MessageSquare, Send, CheckCircle, ArrowRight } from "lucide-react";

export function CaseProgressPanel({ cases }: { cases: GBVCase[] }) {
  const stats = calcStats(cases);

  const stages = [
    { label: "Identificados", value: stats.total, className: "text-primary", icon: <Search className="w-8 h-8" /> },
    { label: "Entrevistados", value: cases.filter(c => c.interview_date).length, className: "text-primary", icon: <MessageSquare className="w-8 h-8" /> },
    { label: "Referenciados", value: cases.filter(c => c.has_referral).length, className: "text-primary", icon: <Send className="w-8 h-8" /> },
    { label: "Encerrados", value: stats.closed, className: "text-success", icon: <CheckCircle className="w-8 h-8" /> },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-headline-lg text-on-surface">Progresso dos Casos</h3>

      <div className="flex items-stretch gap-4">
        {stages.map((stage, idx) => (
          <div key={stage.label} className="flex-1 flex flex-col">
            {idx < stages.length - 1 && (
              <div className="flex items-center justify-center text-2xl text-outline h-12"><ArrowRight className="w-6 h-6" /></div>
            )}
            <div className="flex-1 p-4 rounded-lg bg-gradient-to-br from-surface-container-low to-surface-container border border-outline-variant">
              <div className="mb-2 text-primary">{stage.icon}</div>
              <p className="text-body-sm text-on-surface-variant">{stage.label}</p>
              <p className={`text-metric font-bold ${stage.className}`}>{stage.value}</p>
            </div>
          </div>
        ))}
      </div>

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
          <div key={label} className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-body-sm text-on-surface-variant">{label}</p>
            <p className="text-metric font-bold text-primary">
              {value}
              <span className="text-body-sm ml-1">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.slice(0, 6).map((gbvCase) => (
          <GCRCard key={gbvCase.case_id || gbvCase.record_id}>
            <div className="text-body-sm space-y-1">
              <p className="font-semibold text-on-surface font-mono text-data-sm">{gbvCase.case_id}</p>
              <p className="text-on-surface-variant">{gbvCase.district || "N/A"}</p>
              <p className="text-on-surface-variant">{gbvCase.violence_type_short || gbvCase.violence_type || "N/A"}</p>
              {gbvCase.priority_level === "CRÍTICO" && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-caption font-medium bg-danger/10 text-critical">CRÍTICO</span>
              )}
            </div>
          </GCRCard>
        ))}
      </div>
    </div>
  );
}
