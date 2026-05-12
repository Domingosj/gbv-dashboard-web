"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProjectsPage() {
  const { data: allCases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const [selected, setSelected] = useState<string>("");

  if (error) return <div className="text-error">Erro: {error.message}</div>;
  if (!allCases) return <div className="text-text-secondary">Carregando...</div>;

  const projects = Array.from(new Set(allCases.map(c => c.project).filter(Boolean))).sort() as string[];
  const projectCases = selected ? allCases.filter(c => c.project === selected) : [];
  const stats = projectCases.length > 0 ? calcStats(projectCases) : null;

  const provCounts: Record<string, number> = {};
  for (const c of projectCases) {
    if (c.province) provCounts[c.province] = (provCounts[c.province] || 0) + 1;
  }

  return (
    <div>
      <h1 className="font-display text-section-title text-text-primary mb-8">
        📂 Análise por Projeto
      </h1>

      <div className="mb-6">
        <select
          className="genesis-input max-w-md"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">Selecionar projeto...</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-4 gap-5 mb-6">
            {[
              { label: "Total", value: stats.total, color: "text-text-primary" },
              { label: "Abertos", value: stats.open, color: "text-low" },
              { label: "Fechados", value: stats.closed, color: "text-text-secondary" },
              {
                label: "Taxa",
                value: stats.total > 0 ? `${(stats.closed / stats.total * 100).toFixed(1)}%` : "0%",
                color: "text-primary",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="genesis-card p-5">
                <p className="text-caption text-neutral mb-1">{label}</p>
                <p className={`font-display text-subhead font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {Object.keys(provCounts).length > 0 && (
            <div className="genesis-card p-5">
              <h2 className="font-display text-subhead text-text-primary mb-5">📍 Cobertura por Província</h2>
              <div className="space-y-3">
                {Object.entries(provCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([prov, count]) => (
                    <div key={prov} className="flex items-center gap-3">
                      <span className="text-small w-32">{prov}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full transition-all"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-small text-text-secondary w-8 text-right">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {selected && !stats && <p className="text-text-secondary">Nenhum dado disponível</p>}
    </div>
  );
}
