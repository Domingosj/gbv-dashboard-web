"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SummaryPage() {
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: openCases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });
  if (!allCases || !openCases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const s = calcStats(allCases);
  const open = calcStats(openCases);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const casesThisMonth = allCases.filter(c => {
    if (!c.identification_date) return false;
    const d = new Date(c.identification_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const casesLastMonth = allCases.filter(c => {
    if (!c.identification_date) return false;
    const d = new Date(c.identification_date);
    const lm = thisMonth === 0 ? 11 : thisMonth - 1;
    const ly = thisMonth === 0 ? thisYear - 1 : thisYear;
    return d.getMonth() === lm && d.getFullYear() === ly;
  }).length;

  const trendPct = casesLastMonth > 0 ? (((casesThisMonth - casesLastMonth) / casesLastMonth) * 100).toFixed(1) : "0";
  const trendUp = Number(trendPct) >= 0;

  const provinces = Array.from(new Set(allCases.map(c => c.province).filter(Boolean))).length;
  const districts = Array.from(new Set(allCases.map(c => c.district).filter(Boolean))).length;

  const topDistricts: Record<string, number> = {};
  for (const c of openCases) {
    const d = c.district || "Desconhecido";
    topDistricts[d] = (topDistricts[d] || 0) + 1;
  }
  const top5 = Object.entries(topDistricts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const oldestOpen = [...openCases].sort((a, b) => {
    const da = a.identification_date ? new Date(a.identification_date).getTime() : 0;
    const db = b.identification_date ? new Date(b.identification_date).getTime() : 0;
    return da - db;
  }).slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-page-title text-text-primary">Executive Summary</h1>
        <div className="flex items-center gap-2 text-label text-text-secondary bg-gray-100 rounded-lg px-3 py-1.5">
          <span>Última atualização:</span>
          <span className="font-medium text-text-primary">{new Date().toLocaleDateString("pt-MZ")}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          { label: "Total de Casos", value: s.total, trend: `${trendPct}%`, up: trendUp, color: "text-text-primary" },
          { label: "Casos Abertos", value: s.open, trend: `${((s.open / Math.max(s.total, 1)) * 100).toFixed(0)}%`, up: true, color: "text-info" },
          { label: "Encerrados", value: s.closed, trend: `${((s.closed / Math.max(s.total, 1)) * 100).toFixed(0)}%`, up: true, color: "text-success" },
          { label: "Alta Prioridade", value: open.critical + open.high, trend: `${open.critical} críticos`, up: false, color: "text-critical" },
        ].map(({ label, value, trend, up, color }) => (
          <div key={label} className="gcr-card p-5">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <div className="flex items-end justify-between">
              <p className={`text-metric ${color}`}>{value}</p>
              <span className={`text-caption font-medium flex items-center gap-1 ${up ? "text-success" : "text-critical"}`}>
                {up ? "↑" : "↓"} {trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <GCRCard title="Visão Geral">
          <div className="space-y-4">
            {[
              { label: "Taxa de Encerramento", value: `${s.total ? ((s.closed / s.total) * 100).toFixed(1) : 0}%`, desc: `${s.closed} de ${s.total} casos` },
              { label: "Províncias Abrangidas", value: provinces.toString(), desc: `${districts} distritos` },
              { label: "Casos este Mês", value: casesThisMonth.toString(), desc: `${casesLastMonth} no mês passado` },
              { label: "Sem Referência", value: `${((open.no_ref / Math.max(open.total, 1)) * 100).toFixed(0)}%`, desc: `${open.no_ref} dos ${open.total} abertos` },
            ].map(({ label, value, desc }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-body text-text-secondary">{label}</p>
                  <p className="text-caption text-text-secondary">{desc}</p>
                </div>
                <span className="text-subhead font-bold text-primary">{value}</span>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Distritos com Mais Casos">
          <div className="space-y-3">
            {top5.map(([dist, count], i) => (
              <div key={dist}>
                <div className="flex justify-between text-label mb-1">
                  <span className="text-text-secondary">{i + 1}. {dist}</span>
                  <span className="font-semibold">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(count / Math.max(top5[0][1], 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Alertas">
          <div className="space-y-2">
            {[
              { text: `${open.critical} casos críticos`, type: open.critical > 0 ? "critical" as const : "ok" as const },
              { text: `${open.no_ref} sem referência`, type: open.no_ref > 0 ? "warning" as const : "ok" as const },
              { text: `${open.delayed} atrasados >30d`, type: open.delayed > 0 ? "critical" as const : "ok" as const },
            ].map((a, i) => (
              <div key={i} className={`p-3 rounded-lg ${a.type === "critical" ? "bg-critical/10" : a.type === "warning" ? "bg-warning/10" : "bg-success/10"}`}>
                <p className={`text-body font-medium ${a.type === "critical" ? "text-critical" : a.type === "warning" ? "text-warning" : "text-success"}`}>{a.text}</p>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>

      <GCRCard title="Casos Abertos Há Mais Tempo">
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-label text-text-secondary">ID</th>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Distrito</th>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Gestor</th>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Prioridade</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Tempo Aberto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {oldestOpen.map(c => (
                <tr key={c.case_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-caption text-text-secondary">{c.case_id?.slice(0, 20)}</td>
                  <td className="px-4 py-3">{c.district || "N/A"}</td>
                  <td className="px-4 py-3">{c.case_manager || "N/A"}</td>
                  <td className="px-4 py-3">{c.priority_icon} {c.priority_level || "N/A"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{c.days_since_identification || 0}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCRCard>
    </div>
  );
}
