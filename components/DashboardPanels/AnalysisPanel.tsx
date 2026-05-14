"use client";

import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import { MonthlyChart } from "@/components/Charts";
import { groupByField, sortedEntries } from "@/lib/utils";

function PipelineRow({ label, count, pct }: { label: string; count: number; pct: number }) {
  return (
    <div className="py-1.5 border-b border-border last:border-0">
      <div className="flex items-center justify-between text-label mb-1">
        <span className="text-text-secondary truncate mr-2 text-[13px]">{label}</span>
        <span className="font-semibold text-text-primary text-sm whitespace-nowrap ml-2">{count} <span className="text-caption text-text-secondary font-normal">({pct.toFixed(1)}%)</span></span>
      </div>
      <div className="h-3 rounded-full overflow-hidden bg-gray-100">
        <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export function AnalysisPanel({ cases }: { cases: GBVCase[] }) {
  const open = cases.filter(c => c.case_status === "Aberto");
  const closed = cases.filter(c => c.case_status === "Encerrado");
  const total = cases.length;

  // Gender
  const sexCounts: Record<string, number> = {};
  for (const c of cases) { const x = c.sex || "N/E"; sexCounts[x] = (sexCounts[x] || 0) + 1; }
  const sexData = Object.entries(sexCounts).sort((a, b) => b[1] - a[1]);

  // Province
  const byProvince = groupByField(open, c => c.province);
  const provData = sortedEntries(byProvince);

  // Violence
  const byViolence = groupByField(cases, c => c.violence_type_short || c.violence_type);
  const violData = sortedEntries(byViolence).slice(0, 8);

  // Perpetrator
  const byPerp = groupByField(cases, c => c.perpetrator_relationship);
  const perpData = sortedEntries(byPerp).slice(0, 8);

  // Pipeline - registered by violence type
  const violPipe = sortedEntries(byViolence).slice(0, 6);

  // Pipeline - referred by service type
  const refTypes = [
    { label: "Médico", key: "referred_medical" },
    { label: "Psicossocial", key: "referred_psychosocial" },
    { label: "Polícia", key: "referred_police" },
    { label: "Jurídico", key: "referred_legal" },
    { label: "Abrigo", key: "referred_safe_house" },
    { label: "Prot. Infantil", key: "referred_child_protection" },
  ];

  // Pipeline - closed by reason
  const reasons: Record<string, number> = {};
  for (const c of closed) { const r = c.closure_reason || "Não especificado"; reasons[r] = (reasons[r] || 0) + 1; }
  const closedData = sortedEntries(reasons);

  return (
    <div className="space-y-6 p-6">
      <h3 className="text-lg font-semibold text-text-primary">Todas as Análises</h3>

      {/* Gender cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sexData.length > 0 ? sexData.map(([l, c]) => {
          const pct = total > 0 ? (c / total) * 100 : 0;
          const isF = /femenino|feminino|f/i.test(l);
          return (
            <div key={l} className="rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-4xl mb-2">{isF ? "♀" : "♂"}</p>
              <p className="text-metric font-bold" style={{ color: isF ? "#E91E8C" : "#2563EB" }}>{c}</p>
              <p className="text-label text-text-secondary mt-1">{isF ? "Feminino" : "Masculino"}</p>
              <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isF ? "#E91E8C" : "#2563EB" }} />
              </div>
              <p className="text-caption text-text-secondary mt-2">{pct.toFixed(1)}% do total</p>
            </div>
          );
        }) : <p className="text-text-secondary col-span-3 text-center">Nenhum dado</p>}
        {sexData.length >= 2 && (() => {
          const isFFirst = /femenino|feminino|f/i.test(sexData[0][0]);
          const fCount = isFFirst ? sexData[0][1] : (sexData[1]?.[1] || 0);
          const mCount = isFFirst ? (sexData[1]?.[1] || 0) : sexData[0][1];
          const ratio = mCount > 0 ? (fCount / mCount).toFixed(1) : "—";
          return (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-4xl mb-2">⚖️</p>
              <p className="text-metric font-bold text-primary">{ratio}</p>
              <p className="text-label text-text-secondary mt-1">Proporção F/M</p>
              <p className="text-caption text-text-secondary mt-2">{fCount} feminino : {mCount} masculino</p>
            </div>
          );
        })()}
      </div>

      {/* Monthly chart + Violence + Perpetrator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GCRCard title="Casos por Mês/Ano">
          <MonthlyChart cases={cases} />
        </GCRCard>
        <GCRCard title="Tipos de Violência">
          {violData.length > 0 ? <div className="space-y-3">{violData.map(([l, c]) => {
            const pct = total > 0 ? (c / total) * 100 : 0;
            return (
              <div key={l}>
                <div className="flex justify-between text-label mb-1"><span className="text-text-secondary truncate mr-2">{l}</span><span className="font-semibold">{c} <span className="text-caption font-normal text-text-secondary">({pct.toFixed(1)}%)</span></span></div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-critical/60" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}</div> : <p className="text-text-secondary">Nenhum dado</p>}
        </GCRCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GCRCard title="Relação com Perpetrador">
          {perpData.length > 0 ? <div className="space-y-3">{perpData.map(([l, c]) => (
            <div key={l} className="flex items-center justify-between py-1.5 border-b border-border last:border-0"><span className="text-body text-text-secondary truncate mr-2">{l}</span><GCRBadge color="blue">{c}</GCRBadge></div>
          ))}</div> : <p className="text-text-secondary">Nenhum dado</p>}
        </GCRCard>
        <GCRCard title="Casos Abertos por Província">
          {provData.length > 0 ? <div className="space-y-3">{provData.map(([l, c]) => (
            <div key={l}>
              <div className="flex justify-between text-label mb-1"><span className="text-text-secondary">{l}</span><span className="font-semibold">{c}</span></div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${(c / Math.max(provData[0][1], 1)) * 100}%` }} /></div>
            </div>
          ))}</div> : <p className="text-text-secondary">Nenhum dado</p>}
        </GCRCard>
      </div>

      {/* Pipeline tables */}
      <h4 className="text-section-title text-text-primary">Pipeline de Casos</h4>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GCRCard title="Registados por Tipo">
          {violPipe.map(([l, c]) => <PipelineRow key={l} label={l} count={c} pct={total > 0 ? (c / total) * 100 : 0} />)}
        </GCRCard>
        <GCRCard title="Referenciados por Tipo">
          {refTypes.map(({ label, key }) => {
            const count = cases.filter(c => /sim/i.test((c as any)[key] || "")).length;
            return <PipelineRow key={key} label={label} count={count} pct={total > 0 ? (count / total) * 100 : 0} />;
          })}
        </GCRCard>
        <GCRCard title="Encerrados por Motivo">
          {closedData.length > 0 ? closedData.map(([l, c]) => <PipelineRow key={l} label={l} count={c} pct={closed.length > 0 ? (c / closed.length) * 100 : 0} />) : <p className="text-text-secondary text-sm">Nenhum caso encerrado</p>}
        </GCRCard>
      </div>
    </div>
  );
}
