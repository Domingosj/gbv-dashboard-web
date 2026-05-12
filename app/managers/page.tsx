"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ManagersPage() {
  const { data: allCases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });

  if (error) return <div className="text-error">Erro: {error.message}</div>;
  if (!allCases) return <div className="text-text-secondary">Carregando...</div>;

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
      <h1 className="font-display text-section-title text-text-primary mb-8">
        👥 Gestores de Caso
      </h1>

      <div className="genesis-card overflow-hidden">
        <table className="w-full text-small">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              {["#", "Gestor", "Total", "Fechado", "Taxa"].map(h => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-left text-overline text-text-secondary uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">{r.rank}</td>
                <td className="px-5 py-3.5 font-medium text-text-primary">{r.name}</td>
                <td className="px-5 py-3.5 text-text-secondary">{r.total}</td>
                <td className="px-5 py-3.5 text-text-secondary">{r.closed}</td>
                <td className="px-5 py-3.5 font-semibold text-primary">{r.rate.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
