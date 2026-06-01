"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import FilterBar from "@/components/FilterBar";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function QualityPage() {
  const [provFilter, setProvFilter] = useState("");
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!allCases) return <p className="text-on-surface-variant p-8">Carregando...</p>;

  const provinces = Array.from(new Set(allCases.map(c => c.province).filter((d): d is string => !!d))).sort();
  const cases = provFilter ? allCases.filter(c => c.province === provFilter) : allCases;

  return (
    <div>
      <h1 className="text-page-title text-on-surface mb-1">Qualidade de Dados</h1>
      <FilterBar>
        <select className="gcr-input w-56" value={provFilter} onChange={e => setProvFilter(e.target.value)}>
          <option value="">Todas as províncias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </FilterBar>
      <QualityContent cases={cases} />
    </div>
  );
}

function QualityContent({ cases }: { cases: GBVCase[] }) {
  const total = cases.length;
  const open = cases.filter(c => c.case_status === "Aberto");
  const closed = cases.filter(c => c.case_status === "Encerrado");
  const [focusField, setFocusField] = useState<string | null>(null);

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

  const checkResults = useMemo(() => checks.map(ch => {
    const affected = cases.filter(ch.filter);
    return { ...ch, count: affected.length, pct: total > 0 ? (affected.length / total) * 100 : 0, cases: affected };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [cases]);

  const topIssues = checkResults.filter(r => r.count > 0).sort((a, b) => b.count - a.count);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases]);

  const focusedCheck = focusField ? checkResults.find(r => r.id === focusField) : null;
  void focusedCheck;

  return (
    <div className="space-y-5">
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
                      {focusField === r.id ? "▲" : "▼"}
                    </span>
                  </div>
                </button>
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
