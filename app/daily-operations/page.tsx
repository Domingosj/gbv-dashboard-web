"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { AlertTriangle, Clock, Users, ShieldAlert, ArrowRight, FileX } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function compute(cases: GBVCase[]) {
  const open = cases.filter(c => c.case_status === "Aberto");
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const new7d = open.filter(c => {
    if (!c.identification_date) return false;
    return now - new Date(c.identification_date).getTime() < sevenDays;
  }).length;

  const noRef = open.filter(c => !c.has_referral).length;
  const referredOpen = open.filter(c => c.has_referral).length;
  const critical = open.filter(c => c.priority_level === "CRÍTICO").length;
  const high = open.filter(c => c.priority_level === "ALTO").length;

  const stale = open.filter(c => {
    if (!c.identification_date) return false;
    return now - new Date(c.identification_date).getTime() > 14 * 24 * 60 * 60 * 1000;
  }).length;

  const open30 = open.filter(c => {
    if (!c.identification_date) return false;
    return now - new Date(c.identification_date).getTime() > 30 * 24 * 60 * 60 * 1000;
  }).length;

  return { total: open.length, new7d, noRef, referredOpen, critical, high, stale, open30 };
}

export default function DailyOperationsPage() {
  const { data: cases, error } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });

  if (error) return <p className="text-critical p-8">Erro ao carregar dados</p>;
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const s = compute(cases);

  const kpis = [
    { label: "Casos Ativos", value: s.total, icon: Users, color: "text-primary" },
    { label: "Novos (7d)", value: s.new7d, icon: Clock, color: "text-info" },
    { label: "Sem Referência", value: s.noRef, icon: FileX, color: "text-warning" },
    { label: "Críticos", value: s.critical, icon: ShieldAlert, color: "text-critical" },
    { label: "Abertos >30d", value: s.open30, icon: AlertTriangle, color: "text-warning" },
    { label: "Alta Prioridade", value: s.high, icon: AlertTriangle, color: "text-warning" },
  ];

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Daily Operations</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="gcr-card p-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-label text-text-secondary">{label}</span>
            </div>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="gcr-card p-card">
          <h2 className="text-section-title mb-4">⚡ Precisa de Atenção</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-button bg-warning/10">
              <span className="text-body font-medium text-warning">Casos sem referência</span>
              <span className="text-metric text-warning">{s.noRef}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-button bg-critical/10">
              <span className="text-body font-medium text-critical">Casos críticos</span>
              <span className="text-metric text-critical">{s.critical}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-button bg-gray-50">
              <span className="text-body font-medium text-text-secondary">Sem atualização &gt;14d</span>
              <span className="text-metric text-text-primary">{s.stale}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-button bg-gray-50">
              <span className="text-body font-medium text-text-secondary">Abertos &gt;30 dias</span>
              <span className="text-metric text-text-primary">{s.open30}</span>
            </div>
          </div>
        </div>

        <div className="gcr-card p-card">
          <h2 className="text-section-title mb-4">📊 Referral Pipeline</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-label mb-1">
                <span className="text-text-secondary">Identificados</span>
                <span className="font-semibold">{s.total}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-label mb-1">
                <span className="text-text-secondary">Referenciados</span>
                <span className="font-semibold">{s.referredOpen}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-info rounded-full" style={{ width: `${(s.referredOpen / s.total) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-label mb-1">
                <span className="text-text-secondary">Aguardando referência</span>
                <span className="font-semibold">{s.noRef}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: `${(s.noRef / s.total) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-label mb-1">
                <span className="text-text-secondary">Críticos / Alta prioridade</span>
                <span className="font-semibold">{s.critical + s.high}</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-critical rounded-full" style={{ width: `${((s.critical + s.high) / s.total) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
