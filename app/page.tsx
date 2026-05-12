"use client";

import useSWR from "swr";
import { GBVCase, CaseStats } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import KPICards from "@/components/KPICards";
import { MonthlyChart, ViolencePie } from "@/components/Charts";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function OverviewPage() {
  const { data: allCases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });

  if (error) return <div className="text-red-500">Erro ao carregar dados: {error.message}</div>;
  if (!allCases) return <div className="text-gray-400">Carregando...</div>;

  const stats = calcStats(allCases);
  const openCases = allCases.filter(c => c.case_status === "Aberto");
  const openStats = calcStats(openCases);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-2 mb-6">
        🏠 Visão Geral do Sistema
      </h1>

      <KPICards stats={stats} label="" />

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">📈 Casos por Mês</h2>
          <MonthlyChart cases={allCases} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">🥧 Tipos de Violência</h2>
          <ViolencePie cases={allCases} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">🔴 Alertas Críticos</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className={openStats.critical > 0 ? "bg-red-50 text-red-700 p-4 rounded-lg" : "bg-green-50 text-green-700 p-4 rounded-lg"}>
            {openStats.critical > 0 ? `⚠️ ${openStats.critical} casos críticos` : "✅ Nenhum caso crítico"}
          </div>
          <div className={openStats.no_ref > 0 ? "bg-yellow-50 text-yellow-700 p-4 rounded-lg" : "bg-green-50 text-green-700 p-4 rounded-lg"}>
            {openStats.no_ref > 0 ? `⚠️ ${openStats.no_ref} sem referência` : "✅ Todos têm referências"}
          </div>
          <div className={openStats.delayed > 0 ? "bg-red-50 text-red-700 p-4 rounded-lg" : "bg-green-50 text-green-700 p-4 rounded-lg"}>
            {openStats.delayed > 0 ? `🕐 ${openStats.delayed} atrasados >30d` : "✅ Sem atrasos"}
          </div>
        </div>
      </div>
    </div>
  );
}
