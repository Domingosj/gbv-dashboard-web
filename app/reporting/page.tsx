"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import GCRCard from "@/components/ui/GCRCard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ReportingPage() {
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!allCases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const s = calcStats(allCases);

  const projects = Array.from(new Set(allCases.map(c => c.project).filter((d): d is string => !!d)));
  const provinces = Array.from(new Set(allCases.map(c => c.province).filter((d): d is string => !!d)));
  const districts = Array.from(new Set(allCases.map(c => c.district).filter((d): d is string => !!d)));

  const referrals = {
    medical: allCases.filter(c => /sim/i.test(c.referred_medical || "")).length,
    psychosocial: allCases.filter(c => /sim/i.test(c.referred_psychosocial || "")).length,
    police: allCases.filter(c => /sim/i.test(c.referred_police || "")).length,
    legal: allCases.filter(c => /sim/i.test(c.referred_legal || "")).length,
    shelter: allCases.filter(c => /sim/i.test(c.referred_safe_house || "")).length,
    childProtection: allCases.filter(c => /sim/i.test(c.referred_child_protection || "")).length,
  };

  const totalReferrals = Object.values(referrals).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Donor Reporting</h1>
      <p className="text-body text-text-secondary mb-6">Agregado seguro — sem dados identificáveis. Apto para partilha com doadores.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Casos Alcançados", value: s.total, color: "text-primary" },
          { label: "Casos Encerrados", value: s.closed, color: "text-success" },
          { label: "Taxa de Encerramento", value: s.total ? `${((s.closed / s.total) * 100).toFixed(1)}%` : "0%", color: "text-success" },
          { label: "Referências Realizadas", value: totalReferrals, color: "text-info" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Cobertura Geográfica">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Províncias", value: provinces.length },
              { label: "Distritos", value: districts.length },
              { label: "Projetos", value: projects.length },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-metric text-primary">{value}</p>
                <p className="text-label text-text-secondary">{label}</p>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Referências por Serviço">
          <div className="space-y-2">
            {[
              { label: "Serviços Médicos", value: referrals.medical },
              { label: "Apoio Psicossocial", value: referrals.psychosocial },
              { label: "Polícia/Segurança", value: referrals.police },
              { label: "Apoio Jurídico", value: referrals.legal },
              { label: "Abrigo Seguro", value: referrals.shelter },
              { label: "Proteção Infantil", value: referrals.childProtection },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-body text-text-secondary">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>

      <GCRCard title="Resumo para Relatório">
        <div className="prose prose-sm max-w-none text-text-secondary">
          <p className="mb-2">
            <strong>Período do relatório:</strong> Todo o histórico disponível no ActivityInfo.
          </p>
          <p className="mb-2">
            <strong>Abrangência:</strong> {provinces.length} províncias, {districts.length} distritos, {projects.length} projetos implementados por parceiros da GCR.
          </p>
          <p className="mb-2">
            <strong>Casos:</strong> {s.total} casos registados, dos quais {s.closed} encerrados (taxa de encerramento de {s.total ? ((s.closed / s.total) * 100).toFixed(1) : 0}%). Atualmente {s.open} casos ativos.
          </p>
          <p className="mb-2">
            <strong>Referências:</strong> {totalReferrals} referências realizadas para serviços médicos, psicossociais, policiais, jurídicos, abrigo e proteção infantil.
          </p>
          <p>
            <strong>Desafios:</strong> {s.critical} casos de alta prioridade requerem atenção imediata. {Math.round((s.no_ref / Math.max(s.open, 1)) * 100)}% dos casos abertos aguardam referência para serviços especializados.
          </p>
        </div>
      </GCRCard>
    </div>
  );
}
