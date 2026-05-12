"use client";

import { useState } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import ModuleTabs from "@/components/ModuleTabs";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import { MonthlyChart } from "@/components/Charts";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TABS = [
  { key: "daily", label: "Operações Diárias" },
  { key: "workload", label: "Carga de Trabalho" },
  { key: "risk", label: "Risco e Segurança" },
  { key: "progress", label: "Progresso dos Casos" },
];

function computeDaily(cases: GBVCase[]) {
  const now = Date.now();
  const d7 = 7 * 86400000, d14 = 14 * 86400000, d30 = 30 * 86400000;
  const open = cases.filter(c => c.case_status === "Aberto");
  return {
    total: open.length,
    new7d: open.filter(c => c.identification_date && now - new Date(c.identification_date).getTime() < d7).length,
    noRef: open.filter(c => !c.has_referral).length,
    referred: open.filter(c => c.has_referral).length,
    critical: open.filter(c => c.priority_level === "CRÍTICO").length,
    stale: open.filter(c => c.identification_date && now - new Date(c.identification_date).getTime() > d14).length,
    open30: open.filter(c => c.identification_date && now - new Date(c.identification_date).getTime() > d30).length,
  };
}

function computeWorkload(cases: GBVCase[]) {
  const now = Date.now();
  const d30 = 30 * 86400000;
  const open = cases.filter(c => c.case_status === "Aberto");
  const map = new Map<string, { name: string; active: number; critical: number; noRef: number; open30: number }>();
  for (const c of open) {
    const n = c.case_manager || "Sem gestor";
    if (!map.has(n)) map.set(n, { name: n, active: 0, critical: 0, noRef: 0, open30: 0 });
    const r = map.get(n)!;
    r.active++;
    if (c.priority_level === "CRÍTICO") r.critical++;
    if (!c.has_referral) r.noRef++;
    if (c.identification_date && now - new Date(c.identification_date).getTime() > d30) r.open30++;
  }
  return Array.from(map.values()).sort((a, b) => b.active - a.active);
}

function computeRisk(cases: GBVCase[]) {
  const open = cases.filter(c => c.case_status === "Aberto");
  return {
    critical: open.filter(c => c.priority_level === "CRÍTICO").length,
    unsafe: open.filter(c => (c.is_safe || "").toLowerCase() === "não" || (c.is_safe || "").toLowerCase() === "nao").length,
    noSafety: open.filter(c => !c.safety_measures || c.safety_measures.trim() === "").length,
    minor: open.filter(c => (c.age_group || "").includes("0-11") || (c.age_group || "").includes("12-17")).length,
    prev: open.filter(c => (c.previous_incident || "").toLowerCase() === "sim").length,
    familyPerp: open.filter(c => {
      const rel = (c.perpetrator_relationship || "").toLowerCase();
      return rel.includes("família") || rel.includes("familiar") || rel.includes("parceiro") || rel.includes("íntimo") || rel.includes("intimo") || rel.includes("cuidador");
    }).length,
  };
}

function computeProgress(cases: GBVCase[]) {
  const open = cases.filter(c => c.case_status === "Aberto");
  const closed = cases.filter(c => c.case_status === "Encerrado");
  return {
    total: cases.length,
    open: open.length,
    closed: closed.length,
    interviewed: cases.filter(c => c.interview_date).length,
    referred: cases.filter(c => c.has_referral).length,
  };
}

export default function OperationsPage() {
  const [tab, setTab] = useState("daily");
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  const { data: openCases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });
  if (!cases || !openCases) return <p className="text-text-secondary p-8">Carregando...</p>;

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-1">Operações</h1>
      <ModuleTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {tab === "daily" && <DailyTab cases={openCases} />}
      {tab === "workload" && <WorkloadTab cases={openCases} />}
      {tab === "risk" && <RiskTab cases={openCases} />}
      {tab === "progress" && <ProgressTab cases={cases} />}
    </div>
  );
}

function DailyTab({ cases }: { cases: GBVCase[] }) {
  const s = computeDaily(cases);
  return (
    <>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: "Casos Ativos", value: s.total, color: "text-primary" },
          { label: "Novos (7d)", value: s.new7d, color: "text-info" },
          { label: "Críticos", value: s.critical, color: "text-critical" },
          { label: "Sem Referência", value: s.noRef, color: "text-warning" },
          { label: "Abertos >30d", value: s.open30, color: "text-warning" },
          { label: "Sem Atualização", value: s.stale, color: "text-text-secondary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GCRCard title="Casos por Mês"><MonthlyChart cases={cases} /></GCRCard>
        <GCRCard title="Pipeline de Referência">
          <div className="space-y-4">
            {[
              { label: "Identificados", value: s.total, pct: 100, color: "bg-primary" },
              { label: "Referenciados", value: s.referred, pct: s.total ? (s.referred / s.total) * 100 : 0, color: "bg-info" },
              { label: "Aguardando Referência", value: s.noRef, pct: s.total ? (s.noRef / s.total) * 100 : 0, color: "bg-warning" },
              { label: "Críticos", value: s.critical, pct: s.total ? (s.critical / s.total) * 100 : 0, color: "bg-critical" },
            ].map(({ label, value, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-label mb-1">
                  <span className="text-text-secondary">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>
    </>
  );
}

function WorkloadTab({ cases }: { cases: GBVCase[] }) {
  const rows = computeWorkload(cases);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <GCRCard title="Distribuição de Casos">
        <div className="space-y-3">
          {rows.slice(0, 10).map(r => (
            <div key={r.name}>
              <div className="flex justify-between text-label mb-1">
                <span className="text-text-secondary truncate">{r.name}</span>
                <span className="font-semibold">{r.active}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(r.active / Math.max(rows[0]?.active, 1)) * 100}%`, backgroundColor: r.critical > 0 ? "#C65A5A" : "#256B5A" }} />
              </div>
            </div>
          ))}
        </div>
      </GCRCard>
      <GCRCard title="Casos por Gestor">
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Gestor</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Ativos</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Críticos</th>
                <th className="text-right px-4 py-3 text-label text-text-secondary">Sem Ref.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(r => (
                <tr key={r.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{r.active}</td>
                  <td className={`px-4 py-3 text-right ${r.critical > 0 ? "text-critical font-semibold" : ""}`}>{r.critical}</td>
                  <td className={`px-4 py-3 text-right ${r.noRef > 0 ? "text-warning font-semibold" : ""}`}>{r.noRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCRCard>
    </div>
  );
}

function RiskTab({ cases }: { cases: GBVCase[] }) {
  const s = computeRisk(cases);
  return (
    <>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: "Críticos", value: s.critical, color: "text-critical" },
          { label: "Não Seguras", value: s.unsafe, color: "text-critical" },
          { label: "Sem Plano Segurança", value: s.noSafety, color: "text-warning" },
          { label: "Menores Envolvidos", value: s.minor, color: "text-info" },
          { label: "Incidentes Anteriores", value: s.prev, color: "text-warning" },
          { label: "Perpetrador Familiar", value: s.familyPerp, color: "text-critical" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <GCRCard title="Gaps de Segurança">
        <div className="space-y-3">
          {[
            { label: "Sobreviventes não seguras", value: s.unsafe },
            { label: "Sem plano de segurança", value: s.noSafety },
            { label: "Perpetrador familiar/parceiro", value: s.familyPerp },
            { label: "Com histórico anterior", value: s.prev },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 px-3 rounded-lg bg-gray-50">
              <span className="text-body text-text-secondary">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </GCRCard>
    </>
  );
}

function ProgressTab({ cases }: { cases: GBVCase[] }) {
  const s = computeProgress(cases);
  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Identificados", value: s.total, color: "text-primary" },
          { label: "Entrevistados", value: s.interviewed, color: "text-info" },
          { label: "Referenciados", value: s.referred, color: "text-info" },
          { label: "Encerrados", value: s.closed, color: "text-success" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <GCRCard title="Progresso do Pipeline">
        <div className="flex gap-4">
          {[
            { label: "Pipeline", value: `${s.interviewed}/${s.total} entrevistados` },
            { label: "Taxa Referência", value: `${s.total ? ((s.referred / s.total) * 100).toFixed(0) : 0}%` },
            { label: "Taxa Encerramento", value: `${s.total ? ((s.closed / s.total) * 100).toFixed(0) : 0}%` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center flex-1 p-4 rounded-lg bg-gray-50">
              <p className="text-label text-text-secondary">{label}</p>
              <p className="text-subhead font-bold text-primary mt-1">{value}</p>
            </div>
          ))}
        </div>
      </GCRCard>
    </>
  );
}
