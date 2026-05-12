"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { Users, AlertTriangle, FileX, Clock } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface MgrStats {
  name: string;
  active: number;
  critical: number;
  noRef: number;
  open30: number;
}

function compute(cases: GBVCase[]): MgrStats[] {
  const open = cases.filter(c => c.case_status === "Aberto");
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const map = new Map<string, MgrStats>();

  for (const c of open) {
    const name = c.case_manager || "Sem gestor";
    if (!map.has(name)) map.set(name, { name, active: 0, critical: 0, noRef: 0, open30: 0 });
    const s = map.get(name)!;
    s.active++;
    if (c.priority_level === "CRÍTICO") s.critical++;
    if (!c.has_referral) s.noRef++;
    if (c.identification_date && now - new Date(c.identification_date).getTime() > thirtyDays) {
      s.open30++;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.active - a.active);
}

export default function WorkloadPage() {
  const { data: cases, error } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });

  if (error) return <p className="text-critical p-8">Erro ao carregar dados</p>;
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const rows = compute(cases);
  const totalActive = rows.reduce((s, r) => s + r.active, 0);
  const avgLoad = rows.length ? (totalActive / rows.length).toFixed(1) : 0;

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Workload Distribution</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Ativos", value: totalActive, icon: Users, color: "text-primary" },
          { label: "Gestores", value: rows.length, icon: Users, color: "text-info" },
          { label: "Média/Gestor", value: avgLoad, icon: Clock, color: "text-text-primary" },
          { label: "Críticos Total", value: rows.reduce((s, r) => s + r.critical, 0), icon: AlertTriangle, color: "text-critical" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="gcr-card p-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-label text-text-secondary">{label}</span>
            </div>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="gcr-card overflow-hidden">
        <div className="p-card border-b border-border">
          <h2 className="text-section-title">Casos por Gestor</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-5 py-3.5 text-label text-text-secondary">Gestor</th>
                <th className="text-right px-5 py-3.5 text-label text-text-secondary">Ativos</th>
                <th className="text-right px-5 py-3.5 text-label text-text-secondary">Críticos</th>
                <th className="text-right px-5 py-3.5 text-label text-text-secondary">Sem Ref.</th>
                <th className="text-right px-5 py-3.5 text-label text-text-secondary">&gt;30d</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{r.name}</td>
                  <td className="px-5 py-3.5 text-right font-semibold">{r.active}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={r.critical > 0 ? "text-critical font-semibold" : "text-text-secondary"}>{r.critical}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={r.noRef > 0 ? "text-warning font-semibold" : "text-text-secondary"}>{r.noRef}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={r.open30 > 0 ? "text-warning font-semibold" : "text-text-secondary"}>{r.open30}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="gcr-card p-card">
          <h2 className="text-section-title mb-4">📊 Load Distribution</h2>
          <div className="space-y-3">
            {rows.slice(0, 8).map((r) => {
              const pct = (r.active / totalActive) * 100;
              return (
                <div key={r.name}>
                  <div className="flex justify-between text-label mb-1">
                    <span className="text-text-secondary truncate">{r.name}</span>
                    <span className="font-semibold">{r.active}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: r.critical > 0 ? "#C65A5A" : "#256B5A" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gcr-card p-card">
          <h2 className="text-section-title mb-4">⚠️ Needs Support</h2>
          <div className="space-y-2">
            {rows.filter(r => r.critical > 0 || r.noRef > 3).length === 0 ? (
              <p className="text-text-secondary">No critical workload alerts</p>
            ) : (
              rows.filter(r => r.critical > 0 || r.noRef > 3).map(r => (
                <div key={r.name} className="flex items-center justify-between p-3 rounded-button bg-warning/10">
                  <div>
                    <p className="text-body font-medium">{r.name}</p>
                    <p className="text-caption text-text-secondary">
                      {r.critical > 0 && `${r.critical} crítico(s) `}
                      {r.noRef > 3 && `| ${r.noRef} sem referência`}
                    </p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
