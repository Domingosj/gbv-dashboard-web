"use client";

import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import { TrendingUp, AlertCircle, Users, Clock } from "lucide-react";

export function DailyOperationsPanel({ cases }: { cases: GBVCase[] }) {
  const now = Date.now();
  const d7 = 7 * 86400000,
    d14 = 14 * 86400000,
    d30 = 30 * 86400000;
  const open = cases.filter(c => c.case_status === "Aberto");

  const stats = {
    total: open.length,
    new7d: open.filter(
      c => c.identification_date && now - new Date(c.identification_date).getTime() < d7
    ).length,
    noRef: open.filter(c => !c.has_referral).length,
    referred: open.filter(c => c.has_referral).length,
    critical: open.filter(c => c.priority_level === "CRÍTICO").length,
    stale: open.filter(
      c => c.identification_date && now - new Date(c.identification_date).getTime() > d14
    ).length,
    open30: open.filter(
      c => c.identification_date && now - new Date(c.identification_date).getTime() > d30
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Key metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Casos Ativos", value: stats.total, icon: Users, style: { border: "2px solid rgba(60, 80, 224, 0.2)", background: "rgba(60, 80, 224, 0.05)", color: "#3C50E0" } },
          { label: "Novos (7d)", value: stats.new7d, icon: TrendingUp, style: { border: "2px solid rgba(33, 150, 83, 0.2)", background: "rgba(33, 150, 83, 0.05)", color: "#219653" } },
          { label: "Críticos", value: stats.critical, icon: AlertCircle, style: { border: "2px solid rgba(211, 64, 83, 0.2)", background: "rgba(211, 64, 83, 0.05)", color: "#D34053" } },
          { label: "Sem Referência", value: stats.noRef, icon: Clock, style: { border: "2px solid rgba(255, 167, 11, 0.2)", background: "rgba(255, 167, 11, 0.05)", color: "#FFA70B" } },
        ].map(({ label, value, icon: Icon, style }) => (
          <div
            key={label}
            className="p-4 rounded-xl text-center hover:shadow-md transition-shadow"
            style={style}
          >
            <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: style.color }} />
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="text-2xl font-bold" style={{ color: style.color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Detailed stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Open Cases by Source */}
        <GCRCard title="Fontes de Casos Abertos" className="col-span-1 md:col-span-2">
          {/* Chart or detailed view component can be placed here */}
          <p className="text-center text-text-secondary text-sm py-4">
            Gráfico de fontes de casos abertos será exibido aqui.
          </p>
        </GCRCard>

        {/* Case Status Distribution */}
        <GCRCard title="Distribuição de Status dos Casos">
          {/* Chart or detailed view component can be placed here */}
          <p className="text-center text-text-secondary text-sm py-4">
            Gráfico de distribuição de status dos casos será exibido aqui.
          </p>
        </GCRCard>

        {/* Critical Cases Overview */}
        <GCRCard title="Visão Geral dos Casos Críticos">
          {/* Chart or detailed view component can be placed here */}
          <p className="text-center text-text-secondary text-sm py-4">
            Gráfico de visão geral dos casos críticos será exibido aqui.
          </p>
        </GCRCard>

        {/* Referrals Overview */}
        <GCRCard title="Visão Geral dos Encaminhamentos">
          {/* Chart or detailed view component can be placed here */}
          <p className="text-center text-text-secondary text-sm py-4">
            Gráfico de visão geral dos encaminhamentos será exibido aqui.
          </p>
        </GCRCard>
      </div>

      {/* Actionable insights section */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3">Insights Ação</h3>
        <ul className="list-disc list-inside space-y-2">
          <li className="text-sm">
            Considere revisar os casos críticos destacados para ação imediata.
          </li>
          <li className="text-sm">
            Verifique os casos sem referência para possível encaminhamento.
          </li>
          <li className="text-sm">
            Acompanhe os novos casos abertos nos últimos 7 dias.
          </li>
        </ul>
      </div>
    </div>
  );
}