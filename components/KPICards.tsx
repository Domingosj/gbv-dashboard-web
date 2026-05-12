"use client";

import { CaseStats } from "@/lib/types";

interface Props {
  stats: CaseStats;
}

const CARDS = [
  { key: "total", label: "📊 Total", color: "text-text-primary" },
  { key: "open", label: "🟢 Abertos", color: "text-low" },
  { key: "closed", label: "🔴 Fechados", color: "text-critical" },
  { key: "critical", label: "⚠️ Críticos", color: "text-critical font-bold" },
  { key: "delayed", label: "⏰ >30d", color: "text-high" },
  { key: "no_ref", label: "🚫 Sem Ref", color: "text-medium" },
] as const;

export default function KPICards({ stats }: Props) {
  return (
    <div className="grid grid-cols-6 gap-5">
      {CARDS.map(({ key, label, color }) => (
        <div key={key} className="genesis-card p-5 hover:shadow-card-hover hover:-translate-y-0.5">
          <p className="text-caption text-neutral mb-2">{label}</p>
          <p className={`text-subhead font-bold ${color}`}>
            {stats[key as keyof CaseStats] ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}
