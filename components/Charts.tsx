"use client";

import { GBVCase } from "@/lib/types";
import { fmtViolence } from "@/lib/risk-calculator";

const COLORS = ["#3C50E0", "#80CAEE", "#219653", "#FFA70B", "#D34053", "#AEB7C0"];

interface MonthlyChartProps { cases: GBVCase[] }
export function MonthlyChart({ cases }: MonthlyChartProps) {
  const byMonth: Record<string, number> = {};
  for (const c of cases) {
    if (!c.identification_date) continue;
    const m = c.identification_date.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  }
  const entries = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return <p className="text-body text-sm">Sem dados</p>;
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex items-end gap-1.5 h-48 mt-4">
      {entries.map(([m, v]) => {
        const [y, mo] = m.split("-");
        const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
        return (
          <div key={m} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-caption font-medium text-text-primary">{v}</span>
            <div className="w-full rounded-sm" style={{ height: `${(v / maxVal) * 100}%`, backgroundColor: COLORS[0], minHeight: v > 0 ? 4 : 0 }} />
            <span className="text-caption text-text-secondary truncate w-full text-center">{months[parseInt(mo) - 1]}</span>
          </div>
        );
      })}
    </div>
  );
}

interface ViolencePieProps { cases: GBVCase[] }
export function ViolencePie({ cases }: ViolencePieProps) {
  const counts: Record<string, number> = {};
  for (const c of cases) {
    const v = fmtViolence(c.violence_type);
    counts[v] = (counts[v] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (entries.length === 0) return <p className="text-body text-sm">Sem dados</p>;

  return (
    <div className="space-y-2 py-4">
      {entries.map(([label, count], i) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
          <span className="text-body text-text-secondary flex-1 truncate">{label}</span>
          <span className="text-body font-semibold">{count}</span>
          <span className="text-caption text-text-secondary w-10 text-right">{total > 0 ? ((count / total) * 100).toFixed(0) : 0}%</span>
        </div>
      ))}
    </div>
  );
}

interface BarChartProps { cases: GBVCase[]; field: keyof GBVCase; }
export function SimpleBarChart({ cases, field }: BarChartProps) {
  const counts: Record<string, number> = {};
  for (const c of cases) {
    const v = (c[field] as string) || "N/A";
    counts[v] = (counts[v] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  if (entries.length === 0) return <p className="text-body text-sm">Sem dados</p>;

  return (
    <div className="space-y-2 py-4">
      {entries.map(([label, count]) => (
        <div key={label}>
          <div className="flex justify-between text-label mb-1">
            <span className="text-text-secondary truncate">{label}</span>
            <span className="font-semibold">{count}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(count / maxVal) * 100}%`, backgroundColor: COLORS[0] }} />
          </div>
        </div>
      ))}
    </div>
  );
}
