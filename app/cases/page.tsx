"use client";

import { useState } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { fmtViolence, getTimeSinceIdentif, calculateDaysSinceReferral } from "@/lib/risk-calculator";
import ModuleTabs from "@/components/ModuleTabs";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import FilterBar from "@/components/FilterBar";
import { GCRTable, GCRTHead, GCRTBody, GCRTRow, GCRTCell } from "@/components/ui/GCRTable";
import CaseTable from "@/components/CaseTable";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TABS = [
  { key: "priority", label: "Prioritários" },
  { key: "explorer", label: "Explorador" },
  { key: "referrals", label: "Referências" },
];

export default function CasesPage() {
  const [tab, setTab] = useState("explorer");
  const [provFilter, setProvFilter] = useState("");
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: openCases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });
  if (!allCases || !openCases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const provinces = Array.from(new Set(allCases.map(c => c.province).filter((d): d is string => !!d))).sort();
  const filteredAll = provFilter ? allCases.filter(c => c.province === provFilter) : allCases;
  const filteredOpen = provFilter ? openCases.filter(c => c.province === provFilter) : openCases;

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-1">Casos</h1>
      <ModuleTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />
      <FilterBar>
        <select className="genesis-input w-56" value={provFilter} onChange={e => setProvFilter(e.target.value)}>
          <option value="">Todas as províncias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </FilterBar>
      {tab === "priority" && <PriorityTab cases={filteredOpen} />}
      {tab === "explorer" && <ExplorerTab cases={filteredAll} />}
      {tab === "referrals" && <ReferralsTab cases={filteredAll} />}
    </div>
  );
}

function PriorityTab({ cases }: { cases: GBVCase[] }) {
  const critical = cases.filter(c => c.priority_level === "CRÍTICO");
  const noRef = cases.filter(c => !c.has_referral);
  const prior = [...cases].slice(0, 20);
  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Casos Ativos", value: cases.length, color: "text-primary" },
          { label: "Críticos", value: critical.length, color: "text-critical" },
          { label: "Sem Referência", value: noRef.length, color: "text-warning" },
          { label: "Alta Prioridade", value: cases.filter(c => c.priority_level === "ALTO").length, color: "text-warning" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <GCRCard title="Fila Prioritária">
        <div className="overflow-x-auto">
          <GCRTable>
            <GCRTHead>
              <GCRTRow>
                <GCRTCell isHeader>Prior.</GCRTCell>
                <GCRTCell isHeader>ID</GCRTCell>
                <GCRTCell isHeader>Distrito</GCRTCell>
                <GCRTCell isHeader>Tipo</GCRTCell>
                <GCRTCell isHeader>Idade</GCRTCell>
                <GCRTCell isHeader>Tempo</GCRTCell>
                <GCRTCell isHeader>Referência</GCRTCell>
                <GCRTCell isHeader>Segurança</GCRTCell>
                <GCRTCell isHeader>Pontuação</GCRTCell>
              </GCRTRow>
            </GCRTHead>
            <GCRTBody>
              {prior.map((c, i) => {
                const ref = calculateDaysSinceReferral(c);
                const safe = (c.is_safe || "").toLowerCase() === "sim" || !c.is_safe;
                return (
                  <GCRTRow key={c.case_id || i}>
                    <GCRTCell>{c.priority_icon || "–"}</GCRTCell>
                    <GCRTCell className="font-mono text-caption"><a href={`/cases/${c.record_id || encodeURIComponent(c.case_id || "")}`} className="text-primary hover:underline">{c.case_id?.slice(0, 18)}</a></GCRTCell>
                    <GCRTCell>{c.district || "N/A"}</GCRTCell>
                    <GCRTCell>{fmtViolence(c.violence_type)}</GCRTCell>
                    <GCRTCell>{c.age_group || "N/A"}</GCRTCell>
                    <GCRTCell>{getTimeSinceIdentif(c)}</GCRTCell>
                    <GCRTCell><GCRBadge color={ref.has_referral ? "green" : "amber"}>{ref.has_referral ? "Referido" : "Pendente"}</GCRBadge></GCRTCell>
                    <GCRTCell><GCRBadge color={safe ? "green" : "red"}>{safe ? "Segura" : "Risco"}</GCRBadge></GCRTCell>
                    <GCRTCell className="font-semibold">{c.risk_score || 0}</GCRTCell>
                  </GCRTRow>
                );
              })}
            </GCRTBody>
          </GCRTable>
        </div>
      </GCRCard>
    </>
  );
}

function ExplorerTab({ cases }: { cases: GBVCase[] }) {
  return <CaseTable cases={cases} />;
}

function ReferralsTab({ cases }: { cases: GBVCase[] }) {
  const { data: services } = useSWR("/api/services", fetcher);
  const [distFilter, setDistFilter] = useState("");
  const open = cases.filter(c => c.case_status === "Aberto");
  const districts = Array.from(new Set(open.map(c => c.district).filter((d): d is string => !!d))).sort() as string[];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <GCRCard title="Necessidades de Serviço">
          {[
            { label: "Médico", count: open.filter(c => !/sim/i.test(c.referred_medical || "")).length },
            { label: "Psicossocial", count: open.filter(c => !/sim/i.test(c.referred_psychosocial || "")).length },
            { label: "Polícia", count: open.filter(c => !/sim/i.test(c.referred_police || "")).length },
            { label: "Jurídico", count: open.filter(c => !/sim/i.test(c.referred_legal || "")).length },
            { label: "Abrigo", count: open.filter(c => !/sim/i.test(c.referred_safe_house || "")).length },
            { label: "Proteção Infantil", count: open.filter(c => !/sim/i.test(c.referred_child_protection || "")).length },
          ].map(({ label, count }) => (
            <div key={label} className="flex justify-between py-1.5 border-b border-border last:border-0">
              <span className="text-body text-text-secondary">{label}</span>
              <span className="font-semibold">{count} necessitam</span>
            </div>
          ))}
        </GCRCard>
        <GCRCard title="Cobertura por Distrito">
          {districts.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {districts.map(d => (
                <div key={d} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-body">{d}</span>
                  <GCRBadge color={open.filter(c => c.district === d).length > 0 ? "blue" : "grey"}>{open.filter(c => c.district === d).length} casos</GCRBadge>
                </div>
              ))}
            </div>
          ) : <p className="text-text-secondary">Sem dados</p>}
        </GCRCard>
      </div>
      {services && (
        <GCRCard title="Catálogo de Serviços">
          <select className="genesis-input w-64 mb-4" value={distFilter} onChange={e => setDistFilter(e.target.value)}>
            <option value="">Todos os distritos</option>
            {Array.from(new Set((services as any[]).map((s: any) => s.district))).sort().map((d: any) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-label text-text-secondary">Organização</th>
                  <th className="text-left px-4 py-3 text-label text-text-secondary">Categoria</th>
                  <th className="text-left px-4 py-3 text-label text-text-secondary">Distrito</th>
                  <th className="text-left px-4 py-3 text-label text-text-secondary">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(services as any[]).filter((s: any) => !distFilter || s.district === distFilter).map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.organization}</td>
                    <td className="px-4 py-3"><GCRBadge color="blue">{s.service_category}</GCRBadge></td>
                    <td className="px-4 py-3">{s.district}</td>
                    <td className="px-4 py-3 text-caption">{s.focal_point_name}: {s.focal_point_phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GCRCard>
      )}
    </div>
  );
}
