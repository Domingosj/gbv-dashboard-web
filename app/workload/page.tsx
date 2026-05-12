"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { GCRTable, GCRTHead, GCRTBody, GCRTRow, GCRTCell } from "@/components/ui/GCRTable";
import GCRCard from "@/components/ui/GCRCard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Row { name: string; active: number; critical: number; noRef: number; open30: number; }

function compute(cases: GBVCase[]): Row[] {
  const now = Date.now();
  const d30 = 30 * 86400000;
  const open = cases.filter(c => c.case_status === "Aberto");
  const map = new Map<string, Row>();
  for (const c of open) {
    const n = c.case_manager || "Sem gestor";
    if (!map.has(n)) map.set(n, { name: n, active: 0, critical: 0, noRef: 0, open30: 0 });
    const r = map.get(n)!;
    r.active++;
    if (c.priority_level === "CRÍTICO") r.critical++;
    if (!c.has_referral) r.noRef++;
    if (c.identification_date && now - new Date(c.identification_date).getTime() > d30) r.open30++;
  }
  return Array.from(map.values()).sort((a, b) => b.active - a.active);
}

export default function WorkloadPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const rows = compute(cases);
  const total = rows.reduce((s, r) => s + r.active, 0);
  const avg = rows.length ? (total / rows.length).toFixed(1) : "0";
  const alerted = rows.filter(r => r.critical > 0 || r.noRef > 3);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Workload Distribution</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Ativos", value: total, color: "text-primary" },
          { label: "Gestores", value: rows.length, color: "text-info" },
          { label: "Média por Gestor", value: avg, color: "text-text-primary" },
          { label: "Críticos Total", value: rows.reduce((s, r) => s + r.critical, 0), color: "text-critical" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GCRCard title="Distribuição de Casos">
          <div className="space-y-3">
            {rows.slice(0, 10).map((r) => {
              const pct = (r.active / total) * 100;
              return (
                <div key={r.name}>
                  <div className="flex justify-between text-label mb-1">
                    <span className="text-text-secondary truncate">{r.name}</span>
                    <span className="font-semibold">{r.active}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: r.critical > 0 ? "#C65A5A" : "#256B5A" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GCRCard>

        <GCRCard title="Casos por Gestor">
          <div className="overflow-x-auto">
            <GCRTable>
              <GCRTHead>
                <GCRTRow>
                  <GCRTCell isHeader>Gestor</GCRTCell>
                  <GCRTCell isHeader className="text-right">Ativos</GCRTCell>
                  <GCRTCell isHeader className="text-right">Críticos</GCRTCell>
                  <GCRTCell isHeader className="text-right">Sem Ref.</GCRTCell>
                  <GCRTCell isHeader className="text-right">&gt;30d</GCRTCell>
                </GCRTRow>
              </GCRTHead>
              <GCRTBody>
                {rows.map(r => (
                  <GCRTRow key={r.name}>
                    <GCRTCell className="font-medium">{r.name}</GCRTCell>
                    <GCRTCell className="text-right font-semibold">{r.active}</GCRTCell>
                    <GCRTCell className={`text-right ${r.critical > 0 ? "text-critical font-semibold" : ""}`}>{r.critical}</GCRTCell>
                    <GCRTCell className={`text-right ${r.noRef > 0 ? "text-warning font-semibold" : ""}`}>{r.noRef}</GCRTCell>
                    <GCRTCell className={`text-right ${r.open30 > 0 ? "text-warning font-semibold" : ""}`}>{r.open30}</GCRTCell>
                  </GCRTRow>
                ))}
              </GCRTBody>
            </GCRTable>
          </div>
        </GCRCard>
      </div>

      {alerted.length > 0 && (
        <GCRCard title="Atenção" className="mt-5">
          <div className="space-y-2">
            {alerted.map(r => (
              <div key={r.name} className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                <div>
                  <p className="text-body font-medium">{r.name}</p>
                  <p className="text-caption text-text-secondary">
                    {r.critical > 0 && `${r.critical} crítico(s)`}
                    {r.critical > 0 && r.noRef > 3 ? " | " : ""}
                    {r.noRef > 3 && `${r.noRef} sem referência`}
                  </p>
                </div>
                <span className="text-warning text-xl">!</span>
              </div>
            ))}
          </div>
        </GCRCard>
      )}
    </div>
  );
}
