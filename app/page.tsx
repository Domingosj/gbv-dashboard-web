"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import KPICards from "@/components/KPICards";
import { MonthlyChart, ViolencePie } from "@/components/Charts";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function OverviewPage() {
  const { data: allCases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });

  if (error) return <div className="text-error">Erro ao carregar dados: {error.message}</div>;
  if (!allCases) return <div className="text-text-secondary">Carregando...</div>;

  const stats = calcStats(allCases);
  const openCases = allCases.filter(c => c.case_status === "Aberto");
  const openStats = calcStats(openCases);

  return (
    <div>
      <h1 className="font-display text-section-title text-text-primary mb-8">
        🏠 Visão Geral do Sistema
      </h1>

      <KPICards stats={stats} />

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="genesis-card p-5">
          <h2 className="font-display text-subhead text-text-primary mb-5">📈 Casos por Mês</h2>
          <MonthlyChart cases={allCases} />
        </div>
        <div className="genesis-card p-5">
          <h2 className="font-display text-subhead text-text-primary mb-5">🥧 Tipos de Violência</h2>
          <ViolencePie cases={allCases} />
        </div>
      </div>

      <div className="genesis-card p-5 mt-6">
        <h2 className="font-display text-subhead text-text-primary mb-5">🔴 Alertas Críticos</h2>
        <div className="grid grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-button font-medium ${
              openStats.critical > 0
                ? "bg-red-50 text-critical"
                : "bg-green-50 text-success"
            }`}
          >
            {openStats.critical > 0
              ? `⚠️ ${openStats.critical} casos críticos`
              : "✅ Nenhum caso crítico"}
          </div>
          <div
            className={`p-4 rounded-button font-medium ${
              openStats.no_ref > 0
                ? "bg-yellow-50 text-warning"
                : "bg-green-50 text-success"
            }`}
          >
            {openStats.no_ref > 0
              ? `⚠️ ${openStats.no_ref} sem referência`
              : "✅ Todos têm referências"}
          </div>
          <div
            className={`p-4 rounded-button font-medium ${
              openStats.delayed > 0
                ? "bg-red-50 text-critical"
                : "bg-green-50 text-success"
            }`}
          >
            {openStats.delayed > 0
              ? `🕐 ${openStats.delayed} atrasados >30d`
              : "✅ Sem atrasos"}
          </div>
        </div>
      </div>
    </div>
  );
}
