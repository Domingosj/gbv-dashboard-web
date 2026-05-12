"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import { MonthlyChart } from "@/components/Charts";

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

  // Sex
  const sexCounts: Record<string, number> = {};
  for (const c of allCases) {
    const x = c.sex || "N/E";
    sexCounts[x] = (sexCounts[x] || 0) + 1;
  }
  const sexData = Object.entries(sexCounts).sort((a, b) => b[1] - a[1]);

  // Age group
  const ageCounts: Record<string, number> = {};
  for (const c of allCases) {
    const a = c.age_group || "N/E";
    ageCounts[a] = (ageCounts[a] || 0) + 1;
  }
  const ageData = Object.entries(ageCounts).sort((a, b) => b[1] - a[1]);

  // Disability (butterfly)
  const disabilitySim = allCases.filter(c => (c.disability || "").toLowerCase() === "sim").length;
  const disabilityNao = allCases.filter(c => (c.disability || "").toLowerCase() === "nao" || !c.disability).length;

  // Province
  const provCounts: Record<string, number> = {};
  for (const c of allCases) {
    const p = c.province || "N/E";
    provCounts[p] = (provCounts[p] || 0) + 1;
  }
  const provData = Object.entries(provCounts).sort((a, b) => b[1] - a[1]);

  // Violence type
  const violCounts: Record<string, number> = {};
  for (const c of allCases) {
    const v = c.violence_type_short || c.violence_type || "N/E";
    violCounts[v] = (violCounts[v] || 0) + 1;
  }
  const violData = Object.entries(violCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Top districts
  const topDistricts: Record<string, number> = {};
  for (const c of openCases) {
    const d = c.district || "Desconhecido";
    topDistricts[d] = (topDistricts[d] || 0) + 1;
  }
  const topDist = Object.entries(topDistricts).sort((a, b) => b[1] - a[1]).slice(0, 5);

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

      <GCRCard title="📈 Casos por Mês/Ano" className="mb-6">
        <MonthlyChart cases={allCases} />
      </GCRCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="⚥ Casos por Sexo">
          <div className="space-y-3">
            {sexData.length > 0 ? (
              <div className="space-y-3">
                {sexData.map(([label, count], i) => {
                  const maxVal = sexData[0][1];
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-label mb-1">
                        <span className="text-text-secondary">{label}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(count / maxVal) * 100}%`, backgroundColor: i === 0 ? "#256B5A" : "#5E9C8A" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-text-secondary">Nenhum dado</p>}
          </div>
        </GCRCard>

        <GCRCard title="📊 Casos por Faixa Etária">
          <div className="space-y-2">
            {ageData.length > 0 ? (
              <div className="space-y-3">
                {ageData.map(([label, count]) => {
                  const maxVal = ageData[0][1];
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-label mb-1">
                        <span className="text-text-secondary">{label}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-info" style={{ width: `${(count / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-text-secondary">Nenhum dado</p>}
          </div>
        </GCRCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="♿ Pessoa com Deficiência">
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="text-center">
              <p className="text-metric text-critical">{disabilitySim}</p>
              <p className="text-label text-text-secondary">Com deficiência</p>
              <div className="mt-2 h-4 bg-critical/10 rounded-full overflow-hidden" style={{ width: 120 }}>
                <div className="h-full bg-critical rounded-full" style={{ width: `${(disabilitySim / Math.max(disabilitySim + disabilityNao, 1)) * 100}%` }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-metric text-success">{disabilityNao}</p>
              <p className="text-label text-text-secondary">Sem deficiência</p>
              <div className="mt-2 h-4 bg-success/10 rounded-full overflow-hidden" style={{ width: 120 }}>
                <div className="h-full bg-success rounded-full ml-auto" style={{ width: `${(disabilityNao / Math.max(disabilitySim + disabilityNao, 1)) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="text-center mt-2">
            <p className="text-caption text-text-secondary">
              {(disabilitySim / Math.max(disabilitySim + disabilityNao, 1) * 100).toFixed(1)}% dos casos envolvem pessoas com deficiência
            </p>
          </div>
        </GCRCard>

        <GCRCard title="📍 Casos por Província">
          <div className="space-y-2">
            {provData.length > 0 ? (
              <div className="space-y-3">
                {provData.map(([label, count]) => {
                  const maxVal = provData[0][1];
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-label mb-1">
                        <span className="text-text-secondary">{label}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(count / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-text-secondary">Nenhum dado</p>}
          </div>
        </GCRCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <GCRCard title="🥧 Tipos de Violência">
          {violData.length > 0 ? (
            <div className="space-y-2">
              {violData.map(([label, count]) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-body text-text-secondary truncate mr-2">{label}</span>
                  <GCRBadge color="blue">{count}</GCRBadge>
                </div>
              ))}
            </div>
          ) : <p className="text-text-secondary">Nenhum dado</p>}
        </GCRCard>

        <GCRCard title="📍 Distritos com Mais Casos (Abertos)">
          {topDist.length > 0 ? (
            <div className="space-y-3">
              {topDist.map(([dist, count], i) => (
                <div key={dist}>
                  <div className="flex justify-between text-label mb-1">
                    <span className="text-text-secondary">{i + 1}. {dist}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(count / Math.max(topDist[0][1], 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-text-secondary">Sem dados</p>}
        </GCRCard>

        <GCRCard title="🔴 Alertas">
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

      <GCRCard title="Visão Geral">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Províncias", value: provinces.toString(), desc: `${districts} distritos` },
            { label: "Casos este Mês", value: casesThisMonth.toString(), desc: `${casesLastMonth} mês passado` },
            { label: "Taxa Encerramento", value: `${s.total ? ((s.closed / s.total) * 100).toFixed(1) : 0}%`, desc: `${s.closed} de ${s.total}` },
            { label: "Sem Referência", value: `${((open.no_ref / Math.max(open.total, 1)) * 100).toFixed(0)}%`, desc: `${open.no_ref} dos ${open.total} abertos` },
          ].map(({ label, value, desc }) => (
            <div key={label} className="p-4 rounded-lg bg-gray-50 text-center">
              <p className="text-metric text-primary">{value}</p>
              <p className="text-label text-text-secondary mt-1">{label}</p>
              <p className="text-caption text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
      </GCRCard>
    </div>
  );
}
