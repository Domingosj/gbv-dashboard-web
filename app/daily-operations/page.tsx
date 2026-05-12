"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { MonthlyChart } from "@/components/Charts";
import GCRCard from "@/components/ui/GCRCard";
import {
  Users, Calendar, AlertCircle, Clock, RefreshCcw, ArrowUpRight, ArrowDownRight
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function compute(cases: GBVCase[]) {
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

export default function DailyOperationsPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });

  if (!cases) return (
    <div className="flex items-center justify-center h-[400px]">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-body text-sm">A carregar painel operacional...</p>
      </div>
    </div>
  );

  const s = compute(cases);

  const stats = [
    { label: "Casos Activos", value: s.total, icon: Users, color: "text-primary", bg: "bg-primary/10", trend: "+4.5%", up: true },
    { label: "Novos (7 dias)", value: s.new7d, icon: Calendar, color: "text-info", bg: "bg-info/10", trend: "+12%", up: true },
    { label: "Casos Críticos", value: s.critical, icon: AlertCircle, color: "text-danger", bg: "bg-danger/10", trend: "-2%", up: false },
    { label: "Abertos >30 dias", value: s.open30, icon: Clock, color: "text-warning", bg: "bg-warning/10", trend: "+1.2%", up: true },
  ];

  return (
    <div className="mx-auto max-w-screen-2xl">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary">Operações Diárias</h1>
          <p className="text-sm text-body mt-1">Visão geral do desempenho e gestão de casos em tempo real.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-sm text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm">
          <RefreshCcw className="w-4 h-4" />
          Actualizar Dados
        </button>
      </div>

      {/* Cartões de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg, trend, up }) => (
          <div key={label} className="gcr-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-body">{label}</span>
                <h4 className="text-[28px] font-bold text-text-primary mt-1">{value}</h4>
              </div>
              <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-0.5 text-sm font-semibold ${up ? "text-success" : "text-danger"}`}>
                {up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {trend}
              </span>
              <span className="text-xs text-body">vs mês anterior</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GCRCard title="Tendência Mensal de Casos" className="lg:col-span-8">
          <MonthlyChart cases={cases} />
        </GCRCard>

        <GCRCard title="Pipeline de Referência" className="lg:col-span-4">
          <div className="space-y-5 mt-1">
            {[
              { label: "Identificados", value: s.total, pct: 100, color: "bg-primary" },
              { label: "Referenciados", value: s.referred, pct: s.total ? (s.referred / s.total) * 100 : 0, color: "bg-secondary" },
              { label: "Aguardando Referência", value: s.noRef, pct: s.total ? (s.noRef / s.total) * 100 : 0, color: "bg-warning" },
              { label: "Críticos", value: s.critical, pct: s.total ? (s.critical / s.total) * 100 : 0, color: "bg-danger" },
            ].map(({ label, value, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-text-primary">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-stroke">
            <p className="text-sm text-body leading-relaxed">
              Priorize casos <span className="font-bold text-danger">Críticos</span> sem referência activa para acção imediata.
            </p>
          </div>
        </GCRCard>
      </div>
    </div>
  );
}
