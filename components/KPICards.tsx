"use client";

import { CaseStats } from "@/lib/types";

interface Props {
  stats: CaseStats;
  label: string;
}

export default function KPICards({ stats }: Props) {
  const cards = [
    { label: "📊 Total", value: stats.total, color: "text-gray-900" },
    { label: "🟢 Abertos", value: stats.open, color: "text-green-600" },
    { label: "🔴 Fechados", value: stats.closed, color: "text-red-600" },
    { label: "⚠️ Críticos", value: stats.critical, color: "text-red-600 font-bold" },
    { label: "⏰ >30d", value: stats.delayed, color: "text-orange-600" },
    { label: "🚫 Sem Ref", value: stats.no_ref, color: "text-yellow-600" },
  ];

  return (
    <div className="grid grid-cols-6 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">{c.label}</p>
          <p className={`text-2xl font-semibold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
