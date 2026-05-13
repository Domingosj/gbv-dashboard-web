"use client";

import { useState } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import ModuleTabs from "@/components/ModuleTabs";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import FilterBar from "@/components/FilterBar";
import { MonthlyChart } from "@/components/Charts";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TABS = [
  { key: "trends", label: "Tendências" },
  { key: "quality", label: "Qualidade de Dados" },
  { key: "pathways", label: "Vias de Referência" },
  { key: "partners", label: "Projetos" },
];

const CHECKS = [
  { label: "Sem consentimento", check: (c: GBVCase) => !c.consent },
  { label: "Sem data de incidente", check: (c: GBVCase) => !c.incident_date },
  { label: "Sem data de identificação", check: (c: GBVCase) => !c.identification_date },
  { label: "Sem tipo de violência", check: (c: GBVCase) => !c.violence_type },
  { label: "Sem distrito", check: (c: GBVCase) => !c.district },
  { label: "Sem gestor de caso", check: (c: GBVCase) => !c.case_manager },
  { label: "Encerrado sem motivo", check: (c: GBVCase) => c.case_status === "Encerrado" && !c.closure_reason },
  { label: "Não validado", check: (c: GBVCase) => c.validated !== "Sim" },
  { label: "Sem estado de segurança", check: (c: GBVCase) => !c.is_safe },
];

export default function AnalyticsPage() {
  const [tab, setTab] = useState("trends");
  const [provFilter, setProvFilter] = useState("");
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!allCases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const provinces = Array.from(new Set(allCases.map(c => c.province).filter((d): d is string => !!d))).sort();
  const filtered = provFilter ? allCases.filter(c => c.province === provFilter) : allCases;

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-1">Análises</h1>
      <ModuleTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />
      <FilterBar>
        <select className="gcr-input w-56" value={provFilter} onChange={e => setProvFilter(e.target.value)}>
          <option value="">Todas as províncias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </FilterBar>
      {tab === "trends" && <TrendsTab cases={filtered} />}
      {tab === "quality" && <QualityTab cases={filtered} />}
      {tab === "pathways" && <PathwaysTab cases={filtered} />}
      {tab === "partners" && <PartnersTab cases={filtered} />}
    </div>
  );
}

function TrendsTab({ cases }: { cases: GBVCase[] }) {
  const [period, setPeriod] = useState("month");
  const periods = [
    { key: "day", label: "Dia" },
    { key: "week", label: "Semana" },
    { key: "month", label: "Mês" },
    { key: "quarter", label: "Trimestre" },
    { key: "semester", label: "Semestre" },
    { key: "year", label: "Ano" },
  ];

  const bucketBy = (c: GBVCase): string | null => {
    if (!c.identification_date) return null;
    const d = new Date(c.identification_date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    switch (period) {
      case "day": return `${y}-${m}-${day}`;
      case "week": { const jan1 = new Date(y, 0, 1); const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000); return `${y}-S${String(Math.ceil((days + jan1.getDay() + 1) / 7)).padStart(2, "0")}`; }
      case "month": return `${y}-${m}`;
      case "quarter": return `${y}-T${Math.ceil((d.getMonth() + 1) / 3)}`;
      case "semester": return `${y}-S${Math.ceil((d.getMonth() + 1) / 6)}`;
      case "year": return String(y);
      default: return null;
    }
  };

  const buckets: Record<string, number> = {};
  for (const c of cases) {
    const key = bucketBy(c);
    if (key) buckets[key] = (buckets[key] || 0) + 1;
  }
  const entries = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b));
  const categories = entries.map(([k]) => k);
  const data = entries.map(([, v]) => v);

  const open = cases.filter(c => c.case_status === "Aberto");
  const viol: Record<string, number> = {};
  for (const c of open) { const v = c.violence_type_short || c.violence_type || "N/A"; viol[v] = (viol[v] || 0) + 1; }
  const topViol = Object.entries(viol).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-label text-text-secondary">Agrupar por:</span>
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-caption font-medium rounded-md transition-all ${period === p.key ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
            >{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title={`Casos por ${periods.find(p => p.key === period)?.label}`}>
          <div className="max-h-80 overflow-y-auto space-y-1 pr-2">
            {entries.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 py-1">
                <span className="text-caption text-text-secondary w-24 shrink-0">{k}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(v / Math.max(...data)) * 100}%` }} />
                </div>
                <span className="text-label font-semibold w-10 text-right">{v}</span>
              </div>
            ))}
          </div>
        </GCRCard>
        <GCRCard title="Casos por Mês (Total)">
          <MonthlyChart cases={cases} />
        </GCRCard>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <GCRCard title="Tipo de Violência">
          <div className="space-y-2">{topViol.map(([l, c]) => (
            <div key={l} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <span className="text-body text-text-secondary truncate mr-2">{l}</span>
              <GCRBadge color="blue">{c}</GCRBadge>
            </div>
          ))}</div>
        </GCRCard>
        <GCRCard title="Distribuição por Projeto">
          <div className="space-y-2">
            {Object.entries(open.reduce((acc: Record<string, number>, c) => { const p = c.project || "N/A"; acc[p] = (acc[p] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([l, c]) => (
              <div key={l} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-body text-text-secondary truncate mr-2">{l}</span>
                <GCRBadge color="blue">{c}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>
    </>
  );
}

function QualityTab({ cases }: { cases: GBVCase[] }) {
  const results = CHECKS.map(c => ({ ...c, count: cases.filter(c.check).length, pct: ((cases.filter(c.check).length / cases.length) * 100).toFixed(1) }));
  return (
    <div className="space-y-3">
      {results.sort((a, b) => b.count - a.count).map(r => (
        <div key={r.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${r.count > 10 ? "bg-critical" : r.count > 0 ? "bg-warning" : "bg-success"}`} />
            <span className="text-body">{r.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-label text-text-secondary">{r.pct}%</span>
            <GCRBadge color={r.count > 10 ? "red" : r.count > 0 ? "amber" : "green"}>{r.count}</GCRBadge>
          </div>
        </div>
      ))}
    </div>
  );
}

function PathwaysTab({ cases }: { cases: GBVCase[] }) {
  const open = cases.filter(c => c.case_status === "Aberto");
  const refs = [
    { label: "Médico", key: "referred_medical" },
    { label: "Psicossocial", key: "referred_psychosocial" },
    { label: "Polícia", key: "referred_police" },
    { label: "Jurídico", key: "referred_legal" },
    { label: "Abrigo Seguro", key: "referred_safe_house" },
    { label: "Proteção Infantil", key: "referred_child_protection" },
  ] as const;
  return (
    <div className="space-y-3">
      {refs.map(({ label, key }) => {
        const sim = open.filter(c => /sim/i.test((c as any)[key] || "")).length;
        return (
          <div key={key}>
            <div className="flex justify-between text-label mb-1">
              <span className="text-text-secondary">{label}</span>
              <span className="font-semibold">{sim}/{open.length}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(sim / open.length) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PartnersTab({ cases }: { cases: GBVCase[] }) {
  const partners: Record<string, { total: number; open: number; closed: number }> = {};
  for (const c of cases) {
    const p = c.project || "Sem projeto";
    if (!partners[p]) partners[p] = { total: 0, open: 0, closed: 0 };
    partners[p].total++;
    if (c.case_status === "Aberto") partners[p].open++;
    if (c.case_status === "Encerrado") partners[p].closed++;
  }
  const rows = Object.entries(partners).map(([name, d]) => ({ name, ...d, rate: d.total ? ((d.closed / d.total) * 100).toFixed(1) : "0" })).sort((a, b) => b.total - a.total);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body">
        <thead className="bg-gray-50 border-b border-border">
          <tr>
            <th className="text-left px-4 py-3 text-label text-text-secondary">Projeto</th>
            <th className="text-right px-4 py-3 text-label text-text-secondary">Total</th>
            <th className="text-right px-4 py-3 text-label text-text-secondary">Abertos</th>
            <th className="text-right px-4 py-3 text-label text-text-secondary">Encerrados</th>
            <th className="text-right px-4 py-3 text-label text-text-secondary">Taxa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(r => (
            <tr key={r.name} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{r.name}</td>
              <td className="px-4 py-3 text-right">{r.total}</td>
              <td className="px-4 py-3 text-right">{r.open}</td>
              <td className="px-4 py-3 text-right">{r.closed}</td>
              <td className="px-4 py-3 text-right font-semibold">{r.rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
