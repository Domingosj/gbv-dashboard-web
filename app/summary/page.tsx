"use client";

import { useState } from "react";
import useSWR from "swr";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import FilterBar from "@/components/FilterBar";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SummaryPage() {
  const [scope, setScope] = useState("total");
  const [provFilter, setProvFilter] = useState("");
  const [timeRange, setTimeRange] = useState("90d");
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: openCases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });
  if (!allCases || !openCases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const isTotal = scope === "total";
  const baseCases = isTotal ? allCases : openCases;
  const filtered = provFilter ? baseCases.filter(c => c.province === provFilter) : baseCases;
  const filteredOpen = provFilter ? openCases.filter(c => c.province === provFilter) : openCases;

  const s = calcStats(filtered);
  const open = calcStats(filteredOpen);

  const provinces = Array.from(new Set(allCases.map(c => c.province).filter((d): d is string => !!d))).sort();
  const districts = Array.from(new Set(filtered.map(c => c.district).filter((d): d is string => !!d))).length;

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const casesThisMonth = filtered.filter(c => c.identification_date && new Date(c.identification_date).getMonth() === thisMonth && new Date(c.identification_date).getFullYear() === thisYear).length;
  const casesLastMonth = filtered.filter(c => {
    if (!c.identification_date) return false;
    const d = new Date(c.identification_date);
    const lm = thisMonth === 0 ? 11 : thisMonth - 1;
    const ly = thisMonth === 0 ? thisYear - 1 : thisYear;
    return d.getMonth() === lm && d.getFullYear() === ly;
  }).length;
  const sexCounts: Record<string, number> = {};
  for (const c of filtered) { const x = c.sex || "N/E"; sexCounts[x] = (sexCounts[x] || 0) + 1; }
  const sexData = Object.entries(sexCounts).sort((a, b) => b[1] - a[1]);

  const disabilitySim = filtered.filter(c => (c.disability || "").toLowerCase() === "sim").length;

  const provCounts: Record<string, number> = {};
  for (const c of filtered) { const p = c.province || "N/E"; provCounts[p] = (provCounts[p] || 0) + 1; }
  const provData = Object.entries(provCounts).sort((a, b) => b[1] - a[1]);

  const violCounts: Record<string, number> = {};
  for (const c of filtered) { const v = c.violence_type_short || c.violence_type || "N/E"; violCounts[v] = (violCounts[v] || 0) + 1; }
  const violData = Object.entries(violCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const perpCounts: Record<string, number> = {};
  for (const c of filtered) { const r = c.perpetrator_relationship || "N/E"; perpCounts[r] = (perpCounts[r] || 0) + 1; }
  const perpData = Object.entries(perpCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const topDistricts: Record<string, number> = {};
  for (const c of filteredOpen) { const d = c.district || "Desconhecido"; topDistricts[d] = (topDistricts[d] || 0) + 1; }
  const topDist = Object.entries(topDistricts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-page-title text-text-primary">Resumo Executivo</h1>
        <div className="flex items-center gap-2 text-label text-text-secondary bg-gray-100 rounded-lg px-3 py-1.5">
          <span>Última atualização:</span>
          <span className="font-medium text-text-primary">{new Date().toLocaleDateString("pt-MZ")}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button onClick={() => setScope("total")}
            className={`px-4 py-1.5 text-label font-medium rounded-md transition-all ${scope === "total" ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
            Total
          </button>
          <button onClick={() => setScope("active")}
            className={`px-4 py-1.5 text-label font-medium rounded-md transition-all ${scope === "active" ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
            Activos
          </button>
        </div>
        <span className="text-caption text-text-secondary">
          {isTotal ? `Todos os casos (${allCases.length})` : `Apenas casos abertos (${openCases.length})`}
        </span>
      </div>

      <FilterBar>
        <select className="gcr-input w-56" value={provFilter} onChange={e => setProvFilter(e.target.value)}>
          <option value="">Todas as províncias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </FilterBar>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
        {[
          { label: "Total de Casos", value: s.total, href: "/operations", color: "text-text-primary" },
          { label: "Casos Abertos", value: s.open, href: "/cases", color: "text-info" },
          { label: "Encerrados", value: s.closed, href: "/operations?tab=progress", color: "text-success" },
          { label: "Casos por Género", value: "", href: "", color: "", isGender: true },
          { label: "Pessoas com Deficiência", value: "", href: "", color: "", isDisability: true },
        ].map(({ label, value, href, color, isGender, isDisability }) =>
          isGender ? (
            <div key={label} className="gcr-card p-5">
              <p className="text-label text-text-secondary mb-2">{label}</p>
              <div className="space-y-2">
                {sexData.length > 0 ? sexData.map(([l, c]) => {
                  const pct = filtered.length > 0 ? (c / filtered.length) * 100 : 0;
                  const isF = /femenino|feminino|f/i.test(l);
                  return (
                    <div key={l} className="flex items-center gap-2">
                      <span className="text-lg">{isF ? "♀" : "♂"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-caption">
                          <span className="text-text-secondary truncate">{isF ? "Feminino" : "Masculino"}</span>
                          <span className="font-semibold text-text-primary">{c} <span className="text-caption text-text-secondary font-normal">({pct.toFixed(1)}%)</span></span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isF ? "#E91E8C" : "#2563EB" }} />
                        </div>
                      </div>
                    </div>
                  );
                }) : <p className="text-caption text-text-secondary">Nenhum dado</p>}
              </div>
            </div>
          ) : isDisability ? (
            <div key={label} className="gcr-card p-5">
              <p className="text-label text-text-secondary mb-2">{label}</p>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-metric text-critical">{disabilitySim}</p>
                  <p className="text-caption text-text-secondary">Com deficiência</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-critical" style={{ width: `${filtered.length > 0 ? (disabilitySim / filtered.length) * 100 : 0}%` }} />
                  </div>
                  <p className="text-caption text-text-secondary mt-1">{filtered.length > 0 ? ((disabilitySim / filtered.length) * 100).toFixed(1) : 0}% do total</p>
                </div>
              </div>
            </div>
          ) : (
            <a key={label} href={href} className="gcr-card p-5 block hover:shadow-card-hover transition-shadow cursor-pointer">
              <p className="text-label text-text-secondary mb-1">{label}</p>
              <p className={`text-metric ${color}`}>{value}</p>
              <p className="text-caption text-text-secondary mt-1">Clique para detalhes →</p>
            </a>
          )
        )}
      </div>

      {/* Pipeline tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Registered by type */}
        <GCRCard title="Registados por Tipo">
          {violData.length > 0 ? (
            <div className="space-y-2">
              {violData.map(([label, count]) => {
                const pct = filtered.length > 0 ? (count / filtered.length) * 100 : 0;
                return (
                  <PipelineRow key={label} label={label} count={count} pct={pct} />
                );
              })}
            </div>
          ) : <p className="text-text-secondary text-sm">Nenhum dado</p>}
        </GCRCard>

        {/* Referred by type */}
        <GCRCard title="Referenciados por Tipo">
          {(() => {
            const refTypes = [
              { label: "Médico", key: "referred_medical" },
              { label: "Psicossocial", key: "referred_psychosocial" },
              { label: "Polícia", key: "referred_police" },
              { label: "Jurídico", key: "referred_legal" },
              { label: "Abrigo", key: "referred_safe_house" },
              { label: "Prot. Infantil", key: "referred_child_protection" },
            ];
            const refCounts = refTypes.map(({ label, key }) => ({
              label,
              count: filtered.filter(c => /sim/i.test((c as any)[key] || "")).length,
            }));
            return (
              <div className="space-y-2">
                {refCounts.map(({ label, count }) => {
                  const pct = filtered.length > 0 ? (count / filtered.length) * 100 : 0;
                  return (
                    <PipelineRow key={label} label={label} count={count} pct={pct} />
                  );
                })}
              </div>
            );
          })()}
        </GCRCard>

        {/* Closed by reason */}
        <GCRCard title="Encerrados por Motivo">
          {(() => {
            const closed = filtered.filter(c => c.case_status === "Encerrado");
            const reasons: Record<string, number> = {};
            for (const c of closed) {
              const r = c.closure_reason || "Não especificado";
              reasons[r] = (reasons[r] || 0) + 1;
            }
            const sorted = Object.entries(reasons).sort((a, b) => b[1] - a[1]);
            return sorted.length > 0 ? (
              <div className="space-y-2">
                {sorted.map(([label, count]) => {
                  const pct = closed.length > 0 ? (count / closed.length) * 100 : 0;
                  return (
                    <PipelineRow key={label} label={label} count={count} pct={pct} />
                  );
                })}
              </div>
            ) : <p className="text-text-secondary text-sm">Nenhum caso encerrado</p>;
          })()}
        </GCRCard>
      </div>

      <GCRCard className="mb-6">
        <div className="flex items-center gap-2 justify-between px-7 py-5 border-b border-stroke bg-surface sm:flex-row">
          <div className="grid flex-1 gap-1">
            <h3 className="text-[18px] font-bold text-text-primary">Casos por Mês/Ano</h3>
            <p className="mt-1 text-sm text-body">Evolução mensal de casos registados</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="hidden w-40 rounded-lg sm:flex" aria-label="Período">
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">Últimos 7 dias</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Últimos 30 dias</SelectItem>
              <SelectItem value="90d" className="rounded-lg">Último trimestre</SelectItem>
              <SelectItem value="180d" className="rounded-lg">Último semestre</SelectItem>
              <SelectItem value="365d" className="rounded-lg">Último ano</SelectItem>
              <SelectItem value="all" className="rounded-lg">Todos os períodos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="p-7">
          {(() => {
            const months: Record<string, number> = {};
            for (const c of filtered) {
              if (!c.identification_date) continue;
              const m = c.identification_date.slice(0, 7);
              months[m] = (months[m] || 0) + 1;
            }
            let chartData = Object.entries(months)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([month, count]) => ({ month, casos: count }));

            if (chartData.length > 0 && timeRange !== "all") {
              const now = new Date();
              const ref = new Date(now.getFullYear(), now.getMonth(), 1);
              const cutoff = new Date(ref);
              const days = parseInt(timeRange);
              if (days >= 365) cutoff.setFullYear(cutoff.getFullYear() - Math.floor(days / 365));
              else if (days >= 30) cutoff.setMonth(cutoff.getMonth() - Math.floor(days / 30));
              else cutoff.setDate(cutoff.getDate() - days);
              chartData = chartData.filter(d => new Date(d.month + "-01") >= cutoff);
            }

            const chartConfig = {
              casos: {
                label: "Casos",
                color: "#256B5A",
              },
            } satisfies ChartConfig;

            return chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                <AreaChart data={chartData} accessibilityLayer>
                  <defs>
                    <linearGradient id="fillCasos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#256B5A" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#256B5A" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="casos"
                    type="natural"
                    fill="url(#fillCasos)"
                    stroke="#256B5A"
                    stackId="a"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            ) : <p className="text-text-secondary text-sm py-8 text-center">Sem dados para o período selecionado</p>;
          })()}
        </div>
      </GCRCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Casos por Província">
          <div className="space-y-3">{provData.length > 0 ? provData.map(([l, c]) => (
            <div key={l}>
              <div className="flex justify-between text-label mb-1"><span className="text-text-secondary">{l}</span><span className="font-semibold">{c}</span></div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(c / provData[0][1]) * 100}%` }} /></div>
            </div>
          )) : <p className="text-text-secondary">Nenhum dado</p>}</div>
        </GCRCard>

        <GCRCard title="Casos por Faixa Etária (desagregado por género)">
          {(() => {
            const ageGender: Record<string, { f: number; m: number }> = {};
            for (const c of filtered) {
              const a = c.age_group || "N/E";
              const isF = /femenino|feminino|f/i.test(c.sex || "");
              if (!ageGender[a]) ageGender[a] = { f: 0, m: 0 };
              if (isF) ageGender[a].f++;
              else if (c.sex) ageGender[a].m++;
              else ageGender[a].m++;
            }
            const sorted = Object.entries(ageGender).sort((a, b) => (a[1].f + a[1].m) - (b[1].f + b[1].m));
            const maxF = Math.max(...sorted.map(([, v]) => v.f), 1);
            const maxM = Math.max(...sorted.map(([, v]) => v.m), 1);
            return sorted.length > 0 ? (
              <div className="space-y-2.5">
                {sorted.map(([age, { f, m }]) => {
                  const pctF = (f / maxF) * 100;
                  const pctM = (m / maxM) * 100;
                  const total = f + m;
                  const pctFOfTotal = total > 0 ? (f / total) * 100 : 0;
                  const pctMOfTotal = total > 0 ? (m / total) * 100 : 0;
                  return (
                    <div key={age} className="flex items-center gap-1.5">
                      <div className="flex-1 flex items-center justify-end gap-1">
                        <span className="text-caption text-blue-600 font-medium tabular-nums">{m} ({pctMOfTotal.toFixed(0)}%)</span>
                        <div className="h-4 w-full max-w-[120px] rounded-l-full bg-blue-100" style={{ width: `${pctM}%` }}>
                          <div className="h-full rounded-l-full bg-blue-400" style={{ width: `${pctMOfTotal}%` }} />
                        </div>
                      </div>
                      <div className="w-20 text-center shrink-0">
                        <span className="text-caption font-medium text-text-primary">{age}</span>
                      </div>
                      <div className="flex-1 flex items-center justify-start gap-1">
                        <div className="h-4 w-full max-w-[120px] rounded-r-full bg-pink-100" style={{ width: `${pctF}%` }}>
                          <div className="h-full rounded-r-full bg-pink-400" style={{ width: `${pctFOfTotal}%` }} />
                        </div>
                        <span className="text-caption text-pink-600 font-medium tabular-nums">{f} ({pctFOfTotal.toFixed(0)}%)</span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-center gap-6 pt-2 text-caption text-text-secondary">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-200" /> Masculino</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-pink-200" /> Feminino</span>
                </div>
              </div>
            ) : <p className="text-text-secondary text-sm">Nenhum dado</p>;
          })()}
        </GCRCard>
      </div>

      <GCRCard title="Relação com Perpetrador" className="mb-6">
        {perpData.length > 0 ? <div className="space-y-2">{perpData.map(([l, c]) => (
          <div key={l} className="flex items-center justify-between py-1.5 border-b border-border last:border-0"><span className="text-body text-text-secondary truncate mr-2">{l}</span><GCRBadge color="blue">{c}</GCRBadge></div>
        ))}</div> : <p className="text-text-secondary">Nenhum dado</p>}
      </GCRCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Distritos com Mais Casos">
          {topDist.length > 0 ? <div className="space-y-3">{topDist.map(([d, c], i) => (
            <div key={d}>
              <div className="flex justify-between text-label mb-1"><span className="text-text-secondary">{i + 1}. {d}</span><span className="font-semibold">{c}</span></div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(c / Math.max(topDist[0][1], 1)) * 100}%` }} /></div>
            </div>
          ))}</div> : <p className="text-text-secondary">Sem dados</p>}
        </GCRCard>
        <GCRCard title="Alertas">
          <div className="space-y-2">
            <a href="/cases" className={`block p-3 rounded-lg ${open.critical > 0 ? "bg-critical/10" : "bg-success/10"} hover:opacity-80 transition-opacity`}>
              <p className={`text-body font-medium ${open.critical > 0 ? "text-critical" : "text-success"}`}>
                {open.critical > 0 ? `${open.critical} casos críticos` : "Nenhum caso crítico"}
                <span className="text-caption ml-2">Clique para ver →</span>
              </p>
            </a>
            <a href="/cases" className={`block p-3 rounded-lg ${open.no_ref > 0 ? "bg-warning/10" : "bg-success/10"} hover:opacity-80 transition-opacity`}>
              <p className={`text-body font-medium ${open.no_ref > 0 ? "text-warning" : "text-success"}`}>
                {open.no_ref > 0 ? `${open.no_ref} sem referência` : "Todos referenciados"}
                <span className="text-caption ml-2">Clique para ver →</span>
              </p>
            </a>
            <a href="/operations" className={`block p-3 rounded-lg ${open.delayed > 0 ? "bg-critical/10" : "bg-success/10"} hover:opacity-80 transition-opacity`}>
              <p className={`text-body font-medium ${open.delayed > 0 ? "text-critical" : "text-success"}`}>
                {open.delayed > 0 ? `${open.delayed} atrasados >30d` : "Sem atrasos"}
                <span className="text-caption ml-2">Clique para ver →</span>
              </p>
            </a>
          </div>
        </GCRCard>
      </div>

      <GCRCard title="Visão Geral">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Províncias", value: provinces.length.toString(), desc: `${districts} distritos` },
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

function PipelineRow({ label, count, pct }: { label: string; count: number; pct: number }) {
  const w = Math.min(pct, 100);
  return (
    <div className="py-1.5 border-b border-border last:border-0">
      <div className="flex items-center justify-between text-label mb-1">
        <span className="text-text-secondary truncate mr-2 text-[13px]">{label}</span>
        <span className="font-semibold text-text-primary text-sm whitespace-nowrap ml-2">{count} <span className="text-caption text-text-secondary font-normal">({pct.toFixed(1)}%)</span></span>
      </div>
      <div className="h-3 rounded-full overflow-hidden bg-gray-100">
        <div className="h-full rounded-full bg-primary/60" style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}
