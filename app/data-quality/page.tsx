"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Check {
  label: string;
  condition: (c: GBVCase) => boolean;
  severity: "error" | "warning" | "info";
}

const CHECKS: Check[] = [
  { label: "Sem consentimento", condition: c => !c.consent, severity: "error" },
  { label: "Sem data de incidente", condition: c => !c.incident_date, severity: "error" },
  { label: "Sem data de identificação", condition: c => !c.identification_date, severity: "error" },
  { label: "Sem data de entrevista", condition: c => !c.interview_date, severity: "warning" },
  { label: "Sem tipo de violência", condition: c => !c.violence_type, severity: "error" },
  { label: "Sem distrito", condition: c => !c.district, severity: "error" },
  { label: "Sem gestor de caso", condition: c => !c.case_manager, severity: "warning" },
  { label: "Sem estado de segurança", condition: c => !c.is_safe, severity: "warning" },
  { label: "Encerrado sem motivo", condition: c => c.case_status === "Encerrado" && !c.closure_reason, severity: "error" },
  { label: "Não validado", condition: c => c.validated !== "Sim", severity: "warning" },
  { label: "Data inconsistente (encerramento antes de identificação)", condition: c => {
    if (!c.identification_date || !c.closure_date) return false;
    return new Date(c.closure_date) < new Date(c.identification_date);
  }, severity: "error" },
  { label: "Sem referências registadas", condition: c => {
    const refs = ["referred_medical","referred_psychosocial","referred_police","referred_legal","referred_safe_house","referred_child_protection"];
    return c.case_status === "Aberto" && refs.every(r => !(c as any)[r]);
  }, severity: "warning" },
];

export default function DataQualityPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const results = CHECKS.map(check => {
    const affected = cases.filter(check.condition);
    return { ...check, count: affected.length, pct: ((affected.length / cases.length) * 100).toFixed(1) };
  });

  const totalIssues = results.reduce((s, r) => s + r.count, 0);
  const errorCount = results.filter(r => r.severity === "error").reduce((s, r) => s + r.count, 0);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Monitor de Qualidade de Dados</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total de Casos", value: cases.length, color: "text-primary" },
          { label: "Problemas Encontrados", value: totalIssues, color: errorCount > 0 ? "text-critical" : "text-success" },
          { label: "Erros", value: errorCount, color: "text-critical" },
          { label: "Taxa de Problemas", value: `${((totalIssues / (cases.length * CHECKS.length)) * 100).toFixed(1)}%`, color: "text-text-primary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <GCRCard title="Verificações de Qualidade">
        <div className="space-y-3">
          {results.sort((a, b) => b.count - a.count).map(r => (
            <div key={r.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${r.severity === "error" ? "bg-critical" : r.severity === "warning" ? "bg-warning" : "bg-info"}`} />
                <span className="text-body">{r.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-label text-text-secondary">{r.pct}%</span>
                <GCRBadge color={r.count > 10 ? "red" : r.count > 0 ? "amber" : "green"}>{r.count}</GCRBadge>
              </div>
            </div>
          ))}
        </div>
      </GCRCard>
    </div>
  );
}
