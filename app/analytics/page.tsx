"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import ModuleTabs from "@/components/ModuleTabs";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import FilterBar from "@/components/FilterBar";
import { MonthlyChart } from "@/components/Charts";
import { X } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TABS = [
  { key: "trends", label: "Tendências" },
  { key: "quality", label: "Qualidade de Dados" },
  { key: "pathways", label: "Vias de Referência" },
  { key: "partners", label: "Projetos" },
];

export default function AnalyticsPage() {
  const [tab, setTab] = useState("trends");
  const [provFilter, setProvFilter] = useState("");
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!allCases) return <p className="text-on-surface-variant p-8">Carregando...</p>;

  const provinces = Array.from(new Set(allCases.map(c => c.province).filter((d): d is string => !!d))).sort();
  const filtered = provFilter ? allCases.filter(c => c.province === provFilter) : allCases;

  return (
    <div>
      <h1 className="text-page-title text-on-surface mb-1">Análises</h1>
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
        <span className="text-label text-on-surface-variant">Agrupar por:</span>
        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-caption font-medium rounded-md transition-all ${period === p.key ? "bg-white text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
            >{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title={`Casos por ${periods.find(p => p.key === period)?.label}`}>
          <div className="max-h-80 overflow-y-auto space-y-1 pr-2">
            {entries.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 py-1">
                <span className="text-caption text-on-surface-variant w-24 shrink-0">{k}</span>
                <div className="flex-1 h-5 bg-surface-container rounded-full overflow-hidden">
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
            <div key={l} className="flex items-center justify-between py-1.5 border-b border-outline-variant last:border-0">
              <span className="text-body text-on-surface-variant truncate mr-2">{l}</span>
              <GCRBadge color="blue">{c}</GCRBadge>
            </div>
          ))}</div>
        </GCRCard>
        <GCRCard title="Distribuição por Projeto">
          <div className="space-y-2">
            {Object.entries(open.reduce((acc: Record<string, number>, c) => { const p = c.project || "N/A"; acc[p] = (acc[p] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([l, c]) => (
              <div key={l} className="flex items-center justify-between py-1.5 border-b border-outline-variant last:border-0">
                <span className="text-body text-on-surface-variant truncate mr-2">{l}</span>
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
  const total = cases.length;
  const open = cases.filter(c => c.case_status === "Aberto");
  const closed = cases.filter(c => c.case_status === "Encerrado");
  const [focusField, setFocusField] = useState<string | null>(null);

  // Define ALL quality checks with their label, key, and filter function
  const checks = [
    { id: "no_consent", label: "Consentimento", desc: "Casos sem consentimento registado", filter: (c: GBVCase) => !c.consent },
    { id: "no_incident_date", label: "Data do Incidente", desc: "Casos sem data do incidente", filter: (c: GBVCase) => !c.incident_date },
    { id: "no_ident_date", label: "Data de Identificação", desc: "Casos sem data de identificação", filter: (c: GBVCase) => !c.identification_date },
    { id: "no_violence", label: "Tipo de Violência", desc: "Casos sem tipo de violência", filter: (c: GBVCase) => !c.violence_type },
    { id: "no_district", label: "Distrito", desc: "Casos sem distrito", filter: (c: GBVCase) => !c.district },
    { id: "no_province", label: "Província", desc: "Casos sem província", filter: (c: GBVCase) => !c.province },
    { id: "no_manager", label: "Gestor de Caso", desc: "Casos sem gestor atribuído", filter: (c: GBVCase) => !c.case_manager },
    { id: "no_age", label: "Faixa Etária", desc: "Casos sem faixa etária da sobrevivente", filter: (c: GBVCase) => !c.age_group },
    { id: "no_sex", label: "Sexo", desc: "Casos sem informação de sexo", filter: (c: GBVCase) => !c.sex },
    { id: "no_emotional", label: "Estado Emocional", desc: "Casos sem avaliação emocional", filter: (c: GBVCase) => !c.emotional_state },
    { id: "no_safety", label: "Avaliação de Segurança", desc: "Casos sem estado de segurança (is_safe)", filter: (c: GBVCase) => !c.is_safe },
    { id: "no_safety_plan", label: "Medidas de Segurança", desc: "Casos sem medidas de segurança registadas", filter: (c: GBVCase) => !c.safety_measures || c.safety_measures.trim() === "" },
    { id: "no_perpetrator_rel", label: "Relação com Perpetrador", desc: "Casos sem relação com perpetrador", filter: (c: GBVCase) => !c.perpetrator_relationship },
    { id: "no_perpetrator_sex", label: "Sexo do Perpetrador", desc: "Casos sem sexo do perpetrador", filter: (c: GBVCase) => !c.perpetrator_sex },
    { id: "no_perpetrator_age", label: "Idade do Perpetrador", desc: "Casos sem idade do perpetrador", filter: (c: GBVCase) => !c.perpetrator_age },
    { id: "no_description", label: "Descrição do Incidente", desc: "Casos sem descrição do incidente", filter: (c: GBVCase) => !c.incident_description },
    { id: "no_referral", label: "Sem Nenhuma Referência", desc: "Casos abertos sem qualquer referência", filter: (c: GBVCase) => c.case_status === "Aberto" && !["referred_medical","referred_psychosocial","referred_police","referred_legal","referred_safe_house","referred_child_protection"].some(k => /sim/i.test((c as any)[k] || "")) },
    { id: "no_ref_medical", label: "Referência Médica", desc: "Casos abertos sem referência médica", filter: (c: GBVCase) => c.case_status === "Aberto" && !/sim/i.test((c as any)["referred_medical"] || "") },
    { id: "no_ref_psycho", label: "Referência Psicossocial", desc: "Casos abertos sem referência psicossocial", filter: (c: GBVCase) => c.case_status === "Aberto" && !/sim/i.test((c as any)["referred_psychosocial"] || "") },
    { id: "no_ref_legal", label: "Referência Jurídica", desc: "Casos abertos sem referência jurídica", filter: (c: GBVCase) => c.case_status === "Aberto" && !/sim/i.test((c as any)["referred_legal"] || "") },
    { id: "no_ref_police", label: "Referência Policial", desc: "Casos abertos sem referência policial", filter: (c: GBVCase) => c.case_status === "Aberto" && !/sim/i.test((c as any)["referred_police"] || "") },
    { id: "no_ref_shelter", label: "Referência Abrigo", desc: "Casos abertos sem referência a abrigo", filter: (c: GBVCase) => c.case_status === "Aberto" && !/sim/i.test((c as any)["referred_safe_house"] || "") },
    { id: "no_ref_child", label: "Referência Prot. Infantil", desc: "Casos abertos sem referência à proteção infantil", filter: (c: GBVCase) => c.case_status === "Aberto" && !/sim/i.test((c as any)["referred_child_protection"] || "") },
    { id: "no_referral_date", label: "Referência sem Data", desc: "Casos referenciados mas sem data de referência", filter: (c: GBVCase) => { const pairs = [{ f: "referred_medical", d: "date_referred_medical" }, { f: "referred_psychosocial", d: "date_referred_psychosocial" }, { f: "referred_police", d: "date_referred_police" }, { f: "referred_safe_house", d: "date_referred_safe_house" }]; return pairs.some(p => /sim/i.test((c as any)[p.f] || "") && !(c as any)[p.d]); } },
    { id: "closure_no_reason", label: "Encerrado sem Motivo", desc: "Casos encerrados sem motivo de encerramento", filter: (c: GBVCase) => c.case_status === "Encerrado" && !c.closure_reason },
    { id: "not_validated", label: "Não Validado", desc: "Casos que não foram validados", filter: (c: GBVCase) => c.validated !== "Sim" },
    { id: "date_closure_before_id", label: "Data Inconsistente", desc: "Encerramento antes da identificação", filter: (c: GBVCase) => c.identification_date && c.closure_date && new Date(c.closure_date) < new Date(c.identification_date) },
    { id: "date_id_before_incident", label: "Data Inconsistente", desc: "Identificação antes do incidente", filter: (c: GBVCase) => c.incident_date && c.identification_date && new Date(c.identification_date) < new Date(c.incident_date) },
    { id: "open_overdue", label: "Aberto >30d sem Referência", desc: "Casos abertos há mais de 30 dias sem referência", filter: (c: GBVCase) => c.case_status === "Aberto" && c.identification_date && !c.has_referral && (Date.now() - new Date(c.identification_date).getTime() > 30 * 86400000) },
  ];

  // Compute counts and build case lists for each check
  const checkResults = useMemo(() => checks.map(ch => {
    const affected = cases.filter(ch.filter);
    return { ...ch, count: affected.length, pct: total > 0 ? (affected.length / total) * 100 : 0, cases: affected };
  }), [cases, checks]);

  // Find the top issues (most impactful)
  const topIssues = checkResults.filter(r => r.count > 0).sort((a, b) => b.count - a.count);

  // Cases with most problems (high error count)
  const caseProblemScore = useMemo(() => {
    const scores: { case: GBVCase; errors: { id: string; label: string }[]; score: number }[] = [];
    for (const c of cases) {
      const errors: { id: string; label: string }[] = [];
      for (const ch of checks) {
        if (ch.id.startsWith("no_ref_") || ch.id.startsWith("open_") || ch.id.startsWith("date_")) continue;
        if (ch.filter(c)) errors.push({ id: ch.id, label: ch.label });
      }
      if (errors.length > 0) scores.push({ case: c, errors, score: errors.length });
    }
    return scores.sort((a, b) => b.score - a.score).slice(0, 30);
  }, [cases]);

  // Per-manager problem count
  const managerIssues = useMemo(() => {
    const byMgr: Record<string, { total: number; errorCases: number; errors: number }> = {};
    for (const c of cases) {
      const mgr = c.case_manager || "Sem gestor";
      if (!byMgr[mgr]) byMgr[mgr] = { total: 0, errorCases: 0, errors: 0 };
      byMgr[mgr].total++;
      let hasError = false;
      for (const ch of checks) {
        if (ch.id.startsWith("no_ref_") || ch.id.startsWith("open_") || ch.id.startsWith("date_")) continue;
        if (ch.filter(c)) { byMgr[mgr].errors++; hasError = true; }
      }
      if (hasError) byMgr[mgr].errorCases++;
    }
    return Object.entries(byMgr).map(([mgr, d]) => ({ manager: mgr, ...d })).sort((a, b) => b.errors - a.errors);
  }, [cases]);

  const focusedCheck = focusField ? checkResults.find(r => r.id === focusField) : null;

  return (
    <div className="space-y-5">
      {/* Summary header */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total de Registos", value: total, color: "text-on-surface", desc: `${open.length} abertos · ${closed.length} encerrados` },
          { label: "Problemas Encontrados", value: checkResults.reduce((s, r) => s + r.count, 0), color: "text-critical", desc: `${checkResults.filter(r => r.count > 0).length} tipos de falhas` },
          { label: "Casos com Erros", value: caseProblemScore.length, color: "text-warning", desc: `${total > 0 ? ((caseProblemScore.length / total) * 100).toFixed(0) : 0}% dos registos` },
          { label: "Campos Críticos", value: checkResults.filter(r => r.count > total * 0.1).length, color: "text-critical", desc: "com >10% de falhas" },
          { label: "Gestores com Falhas", value: managerIssues.filter(m => m.errors > 0).length, color: "text-info", desc: "precisam corrigir dados" },
        ].map(({ label, value, color, desc }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-on-surface-variant mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
            <p className="text-caption text-on-surface-variant mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* Accordion: per-field issue list with drill-down */}
      <GCRCard title="Lista de Problemas por Campo">
        <div className="space-y-1">
          {topIssues.slice(0, 30).map(r => {
            const severity = r.count > total * 0.15 ? "critical" : r.count > total * 0.05 ? "warning" : "info";
            const sevDot = severity === "critical" ? "bg-critical" : severity === "warning" ? "bg-warning" : "bg-info";
            return (
              <div key={r.id}>
                <button
                  onClick={() => setFocusField(focusField === r.id ? null : r.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${sevDot}`} />
                    <div className="min-w-0">
                      <p className="text-body font-medium text-on-surface">{r.desc}</p>
                      <p className="text-caption text-on-surface-variant truncate">{r.count} casos ({r.pct.toFixed(1)}%)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${sevDot}`} style={{ width: `${Math.min(r.pct, 100)}%` }} />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-caption font-medium ${focusField === r.id ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"}`}>
                      {focusField === r.id ? "\u25B2" : "\u25BC"}
                    </span>
                  </div>
                </button>
                {/* Expanded: list of affected cases */}
                {focusField === r.id && (
                  <div className="pl-6 pr-3 pb-3">
                    <div className="max-h-48 overflow-y-auto space-y-1 border-l-2 border-primary/20 pl-3">
                      {r.cases.length > 0 ? r.cases.slice(0, 50).map(c => (
                        <div key={c.case_id || c.record_id} className="flex items-center justify-between py-1.5 text-caption">
                          <a href={`/cases/${c.record_id || encodeURIComponent(c.case_id || "")}`} className="text-primary hover:underline font-mono truncate mr-2">
                            {c.case_id || c.record_id || "N/A"}
                          </a>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-on-surface-variant">{c.district || "N/A"}</span>
                            <span className="text-on-surface-variant">{c.project}</span>
                          </div>
                        </div>
                      )) : <p className="text-on-surface-variant text-sm py-2">Nenhum caso encontrado</p>}
                      {r.cases.length > 50 && <p className="text-caption text-on-surface-variant">+ {r.cases.length - 50} casos não listados</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GCRCard>

      {/* Two columns: Problematic cases + Manager issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GCRCard title="Casos com Mais Falhas de Preenchimento">
          <p className="text-caption text-on-surface-variant mb-3">Estes casos precisam de correção prioritária no ActivityInfo</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {caseProblemScore.slice(0, 20).map(({ case: c, errors, score }, i) => (
              <div key={c.case_id || i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                <div className="min-w-0 flex-1">
                  <a href={`/cases/${c.record_id || encodeURIComponent(c.case_id || "")}`} className="text-primary hover:underline font-mono text-caption font-semibold">
                    {c.case_id || c.record_id || "N/A"}
                  </a>
                  <div className="flex items-center gap-2 text-caption text-on-surface-variant mt-0.5">
                    <span>{c.district || "N/A"}</span>
                    <span>·</span>
                    <span>{c.project}</span>
                    <span>·</span>
                    <span>{c.case_manager || "Sem gestor"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {errors.slice(0, 4).map(e => (
                      <span key={e.id} className="px-1.5 py-0.5 rounded bg-critical/10 text-caption text-critical">{e.label}</span>
                    ))}
                    {errors.length > 4 && <span className="text-caption text-on-surface-variant">+{errors.length - 4}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className={`text-lg font-bold ${score >= 5 ? "text-critical" : score >= 3 ? "text-warning" : "text-on-surface-variant"}`}>{score}</span>
                  <p className="text-caption text-on-surface-variant">falhas</p>
                </div>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Gestores com Dados Incompletos">
          <p className="text-caption text-on-surface-variant mb-3">Gestores que precisam atualizar registos no ActivityInfo</p>
          <div className="space-y-3">
            {managerIssues.filter(m => m.errors > 0).slice(0, 15).map(m => (
              <div key={m.manager}>
                <div className="flex justify-between text-label mb-1">
                  <span className="text-on-surface-variant truncate mr-2">{m.manager}</span>
                  <span className={`font-semibold ${m.errorCases > m.total * 0.5 ? "text-critical" : "text-warning"}`}>{m.errorCases}/{m.total} casos</span>
                </div>
                <div className="h-3 bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.errorCases > m.total * 0.5 ? "bg-critical" : "bg-warning"}`}
                    style={{ width: `${m.total > 0 ? (m.errorCases / m.total) * 100 : 0}%` }} />
                </div>
                <p className="text-caption text-on-surface-variant mt-0.5">{m.errors} campos em falta no total</p>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>

      {/* Cases needing urgent attention */}
      <GCRCard title="Casos Abertos sem Referência há +30 Dias">
        {(() => {
          const overdue = cases.filter(c => c.case_status === "Aberto" && c.identification_date && !c.has_referral &&
            (Date.now() - new Date(c.identification_date).getTime() > 30 * 86400000));
          return overdue.length > 0 ? (
            <div className="space-y-2">
              {overdue.slice(0, 20).map(c => (
                <div key={c.case_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-critical/5 border border-critical/10">
                  <div className="min-w-0 flex-1">
                    <a href={`/cases/${c.record_id || encodeURIComponent(c.case_id || "")}`} className="text-primary hover:underline font-mono text-caption font-semibold">
                      {c.case_id || c.record_id || "N/A"}
                    </a>
                    <div className="flex items-center gap-2 text-caption text-on-surface-variant mt-0.5">
                      <span>{c.district || "N/A"}</span>
                      <span>·</span>
                      <span>{c.case_manager || "Sem gestor"}</span>
                      <span>·</span>
                      <span>{c.project}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-caption text-critical font-semibold">
                      {Math.floor((Date.now() - new Date(c.identification_date!).getTime()) / 86400000)}d
                    </p>
                    <p className="text-caption text-on-surface-variant">sem ref.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-on-surface-variant text-sm">Nenhum caso aberto sem referência há mais de 30 dias</p>;
        })()}
      </GCRCard>
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
              <span className="text-on-surface-variant">{label}</span>
              <span className="font-semibold">{sim}/{open.length}</span>
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(sim / open.length) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const MONTH_LABELS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function heatBg(count: number, max: number): string {
  if (count === 0) return "";
  const t = count / max;
  return `rgba(0,82,67,${(0.12 + t * 0.78).toFixed(2)})`;
}
function heatFg(count: number, max: number): string {
  if (count === 0) return "#9aa5a0";
  return count / max > 0.55 ? "#ffffff" : "#003d32";
}

function HeatMatrix({
  rowLabel, rows, matrix, maxVal, year,
  onSelect,
}: {
  rowLabel: string;
  rows: string[];
  matrix: Record<string, Record<number, GBVCase[]>>;
  maxVal: number;
  year: number;
  onSelect: (label: string, cases: GBVCase[]) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 text-label text-on-surface-variant bg-surface-container-low border border-outline-variant/40 min-w-[160px] sticky left-0 z-10">
              {rowLabel}
            </th>
            {MONTH_LABELS.map((m, i) => (
              <th key={i} className="px-2 py-2 text-center text-label text-on-surface-variant bg-surface-container-low border border-outline-variant/40 min-w-[46px]">{m}</th>
            ))}
            <th className="px-3 py-2 text-center text-label text-on-surface-variant bg-surface-container-low border border-outline-variant/40 font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const rowTotal = Object.values(matrix[row]).reduce((s, arr) => s + arr.length, 0);
            return (
              <tr key={row}>
                <td className="px-3 py-2 text-label font-medium text-on-surface border border-outline-variant/40 bg-surface-container-lowest sticky left-0 z-10 max-w-[200px] truncate" title={row}>
                  {row}
                </td>
                {Array.from({ length: 12 }, (_, i) => {
                  const cellCases = matrix[row][i] || [];
                  const count = cellCases.length;
                  return (
                    <td key={i}
                      className={`px-2 py-2 text-center border border-outline-variant/40 text-label font-semibold transition-all ${count > 0 ? "cursor-pointer hover:ring-2 hover:ring-inset hover:ring-primary/60" : ""}`}
                      style={{ backgroundColor: heatBg(count, maxVal), color: heatFg(count, maxVal) }}
                      onClick={() => count > 0 && onSelect(`${row} — ${MONTH_LABELS[i]} ${year}`, cellCases)}
                      title={count > 0 ? `${count} casos` : undefined}
                    >
                      {count > 0 ? count : ""}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center font-bold text-on-surface border border-outline-variant/40 bg-surface-container-low">
                  {rowTotal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PartnersTab({ cases }: { cases: GBVCase[] }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [subTab, setSubTab] = useState<"projects" | "geo">("projects");
  const [selection, setSelection] = useState<{ label: string; cases: GBVCase[] } | null>(null);

  const availableYears = useMemo(() => {
    const ys = new Set<number>();
    for (const c of cases) {
      if (c.identification_date) ys.add(new Date(c.identification_date).getFullYear());
    }
    return Array.from(ys).sort((a, b) => b - a);
  }, [cases]);

  const yearCases = useMemo(() =>
    cases.filter(c => c.identification_date && new Date(c.identification_date).getFullYear() === year),
    [cases, year]
  );

  const { projectRows, projectMatrix, projectMax } = useMemo(() => {
    const rows = Array.from(new Set(yearCases.map(c => c.project).filter(Boolean) as string[])).sort();
    const matrix: Record<string, Record<number, GBVCase[]>> = {};
    for (const r of rows) matrix[r] = {};
    for (const c of yearCases) {
      if (!c.project || !c.identification_date) continue;
      const m = new Date(c.identification_date).getMonth();
      if (!matrix[c.project][m]) matrix[c.project][m] = [];
      matrix[c.project][m].push(c);
    }
    const max = Math.max(1, ...rows.flatMap(r => Object.values(matrix[r]).map(a => a.length)));
    return { projectRows: rows, projectMatrix: matrix, projectMax: max };
  }, [yearCases]);

  const { geoRows, geoMatrix, geoMax } = useMemo(() => {
    const rows = Array.from(new Set(yearCases.map(c => c.province).filter(Boolean) as string[])).sort();
    const matrix: Record<string, Record<number, GBVCase[]>> = {};
    for (const r of rows) matrix[r] = {};
    for (const c of yearCases) {
      if (!c.province || !c.identification_date) continue;
      const m = new Date(c.identification_date).getMonth();
      if (!matrix[c.province][m]) matrix[c.province][m] = [];
      matrix[c.province][m].push(c);
    }
    const max = Math.max(1, ...rows.flatMap(r => Object.values(matrix[r]).map(a => a.length)));
    return { geoRows: rows, geoMatrix: matrix, geoMax: max };
  }, [yearCases]);

  function handleSelect(label: string, selected: GBVCase[]) {
    setSelection(prev => prev?.label === label ? null : { label, cases: selected });
  }

  return (
    <div className="space-y-5">
      {/* Year filter */}
      <div className="flex items-center gap-3">
        <span className="text-label text-on-surface-variant">Ano:</span>
        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
          {availableYears.map(y => (
            <button key={y} onClick={() => { setYear(y); setSelection(null); }}
              className={`px-3 py-1.5 text-label font-medium rounded-md transition-all ${year === y ? "bg-white text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
              {y}
            </button>
          ))}
        </div>
        <span className="text-caption text-on-surface-variant">{yearCases.length} casos</span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0 border-b border-outline-variant">
        {[{ key: "projects", label: "Desempenho dos Projetos" }, { key: "geo", label: "Análise Geográfica" }].map(t => (
          <button key={t.key}
            onClick={() => { setSubTab(t.key as "projects" | "geo"); setSelection(null); }}
            className={`px-5 py-2.5 text-label font-medium border-b-2 -mb-px transition-all ${subTab === t.key ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Matrix */}
      {subTab === "projects" ? (
        <GCRCard title={`Projetos × Mês — ${year}`}>
          <p className="text-caption text-on-surface-variant mb-3">Clique numa célula para ver os casos desse projeto/mês</p>
          {projectRows.length > 0
            ? <HeatMatrix rowLabel="Projeto" rows={projectRows} matrix={projectMatrix} maxVal={projectMax} year={year} onSelect={handleSelect} />
            : <p className="text-on-surface-variant text-sm py-4 text-center">Sem dados para {year}</p>}
        </GCRCard>
      ) : (
        <GCRCard title={`Províncias × Mês — ${year}`}>
          <p className="text-caption text-on-surface-variant mb-3">Clique numa célula para ver os casos dessa província/mês</p>
          {geoRows.length > 0
            ? <HeatMatrix rowLabel="Província" rows={geoRows} matrix={geoMatrix} maxVal={geoMax} year={year} onSelect={handleSelect} />
            : <p className="text-on-surface-variant text-sm py-4 text-center">Sem dados para {year}</p>}
        </GCRCard>
      )}

      {/* Selected cases panel */}
      {selection && (
        <GCRCard title={`${selection.label} — ${selection.cases.length} casos`}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-caption text-on-surface-variant">Clique num caso para ver detalhes</p>
            <button onClick={() => setSelection(null)} className="text-caption text-on-surface-variant hover:text-on-surface flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Fechar
            </button>
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {selection.cases.map(c => (
              <a key={c.record_id || c.case_id}
                href={`/cases/${c.record_id || encodeURIComponent(c.case_id || "")}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                <div className="min-w-0 flex-1">
                  <span className="text-primary font-mono text-caption font-semibold">{c.case_id || c.record_id || "N/A"}</span>
                  <div className="flex items-center gap-2 text-caption text-on-surface-variant mt-0.5">
                    <span>{c.district || "N/A"}</span>
                    <span>·</span>
                    <span>{c.case_manager || "Sem gestor"}</span>
                    <span>·</span>
                    <span>{c.project || "—"}</span>
                  </div>
                </div>
                <span className={`shrink-0 ml-3 text-caption px-2 py-0.5 rounded-full font-medium ${
                  c.priority_level === "CRÍTICO" ? "bg-critical/10 text-critical" :
                  c.priority_level === "ALTO" ? "bg-warning/10 text-warning" :
                  "bg-primary/10 text-primary"
                }`}>
                  {c.priority_level || c.case_status || "—"}
                </span>
              </a>
            ))}
          </div>
        </GCRCard>
      )}
    </div>
  );
}
