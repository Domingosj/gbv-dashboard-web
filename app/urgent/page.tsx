"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import CaseCard from "@/components/CaseCard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function UrgentPage() {
  const { data: cases, error } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });

  if (error) return <div className="text-error">Erro: {error.message}</div>;
  if (!cases) return <div className="text-text-secondary">Carregando...</div>;

  const stats = calcStats(cases);

  return (
    <div>
      <h1 className="font-display text-section-title text-text-primary mb-8">
        🚨 Casos Urgentes — Ação Imediata
      </h1>

      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { label: "🔴 Crítico", value: stats.critical, color: "text-critical", bg: "bg-red-50" },
          { label: "🟠 Alto", value: stats.high, color: "text-high", bg: "bg-orange-50" },
          { label: "⚠️ Sem Ref", value: stats.no_ref, color: "text-medium", bg: "bg-yellow-50" },
          { label: "⏰ >30d", value: stats.delayed, color: "text-critical", bg: "bg-red-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-card border border-border p-5 text-center`}>
            <p className={`font-display text-subhead font-bold ${color}`}>{value}</p>
            <p className="text-small text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {cases.slice(0, 10).map((c, i) => (
          <CaseCard key={c.case_id || i} case={c} index={i + 1} />
        ))}
      </div>

      {cases.length === 0 && (
        <div className="genesis-card p-10 text-center">
          <p className="text-success text-subhead font-semibold">✅ Nenhum caso urgente!</p>
        </div>
      )}
    </div>
  );
}
