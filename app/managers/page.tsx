"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ManagersPage() {
  const { data: allCases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });

  if (error) return <div className="text-red-500">Erro: {error.message}</div>;
  if (!allCases) return <div className="text-gray-400">Carregando...</div>;

  const managerCounts: Record<string, { total: number; closed: number }> = {};
  for (const c of allCases) {
    if (!c.case_manager) continue;
    if (!managerCounts[c.case_manager]) managerCounts[c.case_manager] = { total: 0, closed: 0 };
    managerCounts[c.case_manager].total++;
    if (c.case_status === "Encerrado") managerCounts[c.case_manager].closed++;
  }

  const rows = Object.entries(managerCounts)
    .map(([name, { total, closed }]) => ({
      name,
      total,
      closed,
      rate: total > 0 ? (closed / total * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
    .map((r, i) => ({
      ...r,
      rank: i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1),
    }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-2 mb-6">
        👥 Gestores de Caso
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gestor</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fechado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.name} className="hover:bg-gray-50">
                <td className="px-4 py-3">{r.rank}</td>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-right">{r.total}</td>
                <td className="px-4 py-3 text-right">{r.closed}</td>
                <td className="px-4 py-3 text-right font-medium">{r.rate.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
