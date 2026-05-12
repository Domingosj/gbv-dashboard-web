"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProjectsPage() {
  const { data: allCases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const [selected, setSelected] = useState<string>("");

  if (error) return <div className="text-red-500">Erro: {error.message}</div>;
  if (!allCases) return <div className="text-gray-400">Carregando...</div>;

  const projects = Array.from(new Set(allCases.map(c => c.project).filter(Boolean))).sort() as string[];
  const projectCases = selected ? allCases.filter(c => c.project === selected) : [];
  const stats = projectCases.length > 0 ? calcStats(projectCases) : null;

  const provCounts: Record<string, number> = {};
  for (const c of projectCases) {
    if (c.province) provCounts[c.province] = (provCounts[c.province] || 0) + 1;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-2 mb-6">
        📂 Análise por Projeto
      </h1>

      <div className="mb-6">
        <select
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">Selecionar projeto...</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Abertos</p>
              <p className="text-2xl font-semibold text-green-600">{stats.open}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Fechados</p>
              <p className="text-2xl font-semibold text-gray-600">{stats.closed}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500">Taxa</p>
              <p className="text-2xl font-semibold text-blue-600">
                {stats.total > 0 ? `${(stats.closed / stats.total * 100).toFixed(1)}%` : "0%"}
              </p>
            </div>
          </div>

          {Object.keys(provCounts).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">📍 Cobertura por Província</h2>
              <div className="space-y-2">
                {Object.entries(provCounts).sort((a, b) => b[1] - a[1]).map(([prov, count]) => (
                  <div key={prov} className="flex items-center gap-2">
                    <span className="text-sm">{prov}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(count / stats.total) * 100}%` }} />
                    </div>
                    <span className="text-sm text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selected && !stats && <p className="text-gray-400">Nenhum dado disponível</p>}
    </div>
  );
}
