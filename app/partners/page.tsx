"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PartnersPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const partners: Record<string, { total: number; open: number; closed: number; ref: number }> = {};
  for (const c of cases) {
    const p = c.partner || c.project || "Sem parceiro";
    if (!partners[p]) partners[p] = { total: 0, open: 0, closed: 0, ref: 0 };
    partners[p].total++;
    if (c.case_status === "Aberto") partners[p].open++;
    if (c.case_status === "Encerrado") partners[p].closed++;
    if (c.has_referral) partners[p].ref++;
  }

  const rows = Object.entries(partners)
    .map(([name, d]) => ({
      name,
      ...d,
      closeRate: d.total ? ((d.closed / d.total) * 100).toFixed(1) : "0",
      refRate: d.total ? ((d.ref / d.total) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.total - a.total);

  const totalCases = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Desempenho de Projetos</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total de Parceiros", value: rows.length, color: "text-primary" },
          { label: "Total de Casos", value: totalCases, color: "text-info" },
          { label: "Casos Abertos", value: rows.reduce((s, r) => s + r.open, 0), color: "text-warning" },
          { label: "Casos Encerrados", value: rows.reduce((s, r) => s + r.closed, 0), color: "text-success" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <GCRCard title="Desempenho por Parceiro/Projeto">
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Parceiro</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Total</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Abertos</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Encerrados</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Tx Encerramento</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Tx Referência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(r => (
                <tr key={r.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-right">{r.total}</td>
                  <td className="px-4 py-3 text-right">{r.open}</td>
                  <td className="px-4 py-3 text-right">{r.closed}</td>
                  <td className="px-4 py-3 text-right font-semibold">{r.closeRate}%</td>
                  <td className="px-4 py-3 text-right">{r.refRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCRCard>
    </div>
  );
}
