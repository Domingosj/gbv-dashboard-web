"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { MonthlyChart } from "@/components/Charts";
import GCRCard from "@/components/ui/GCRCard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function compute(cases: GBVCase[]) {
  const now = Date.now();
  const d7 = 7 * 86400000, d14 = 14 * 86400000, d30 = 30 * 86400000;
  const open = cases.filter(c => c.case_status === "Aberto");
  return {
    total: open.length,
    new7d: open.filter(c => c.identification_date && now - new Date(c.identification_date).getTime() < d7).length,
    noRef: open.filter(c => !c.has_referral).length,
    referred: open.filter(c => c.has_referral).length,
    critical: open.filter(c => c.priority_level === "CRÍTICO").length,
    stale: open.filter(c => c.identification_date && now - new Date(c.identification_date).getTime() > d14).length,
    open30: open.filter(c => c.identification_date && now - new Date(c.identification_date).getTime() > d30).length,
  };
}

export default function DailyOperationsPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });

  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const s = compute(cases);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Daily Operations</h1>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Casos Ativos", value: s.total, color: "text-primary" },
          { label: "Novos (7d)", value: s.new7d, color: "text-info" },
          { label: "Críticos", value: s.critical, color: "text-critical" },
          { label: "Sem Referência", value: s.noRef, color: "text-warning" },
          { label: "Abertos >30d", value: s.open30, color: "text-warning" },
          { label: "Sem Atualização", value: s.stale, color: "text-text-secondary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <GCRCard title="Casos por Mês">
          <MonthlyChart cases={cases} />
        </GCRCard>

        <GCRCard title="Pipeline de Referência">
          <div className="space-y-4">
            {[
              { label: "Identificados", value: s.total, pct: 100, color: "bg-primary" },
              { label: "Referenciados", value: s.referred, pct: s.total ? (s.referred / s.total) * 100 : 0, color: "bg-info" },
              { label: "Aguardando Referência", value: s.noRef, pct: s.total ? (s.noRef / s.total) * 100 : 0, color: "bg-warning" },
              { label: "Críticos", value: s.critical, pct: s.total ? (s.critical / s.total) * 100 : 0, color: "bg-critical" },
            ].map(({ label, value, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-label mb-1">
                  <span className="text-text-secondary">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>
    </div>
  );
}
