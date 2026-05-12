"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { GCRTable, GCRTHead, GCRTBody, GCRTRow, GCRTCell } from "@/components/ui/GCRTable";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import {
  Users, UserCheck, AlertTriangle, BarChart3
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Row { name: string; active: number; critical: number; noRef: number; open30: number; }

function compute(cases: GBVCase[]): Row[] {
  const now = Date.now();
  const d30 = 30 * 86400000;
  const open = cases.filter(c => c.case_status === "Aberto");
  const map = new Map<string, Row>();
  for (const c of open) {
    const n = c.case_manager || "Sem gestor";
    if (!map.has(n)) map.set(n, { name: n, active: 0, critical: 0, noRef: 0, open30: 0 });
    const r = map.get(n)!;
    r.active++;
    if (c.priority_level === "CRÍTICO") r.critical++;
    if (!c.has_referral) r.noRef++;
    if (c.identification_date && now - new Date(c.identification_date).getTime() > d30) r.open30++;
  }
  return Array.from(map.values()).sort((a, b) => b.active - a.active);
}

export default function WorkloadPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });

  if (!cases) return (
    <div className="flex items-center justify-center h-[400px]">
      <div className="animate-pulse flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-body text-sm">A carregar distribuição de carga...</p>
      </div>
    </div>
  );

  const rows = compute(cases);
  const total = rows.reduce((s, r) => s + r.active, 0);
  const avg = rows.length ? (total / rows.length).toFixed(1) : "0";
  const totalCritical = rows.reduce((s, r) => s + r.critical, 0);
  const alerted = rows.filter(r => r.critical > 0 || r.noRef > 3);

  const stats = [
    { label: "Total Activos", value: total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Gestores de Caso", value: rows.length, icon: UserCheck, color: "text-info", bg: "bg-info/10" },
    { label: "Média por Gestor", value: avg, icon: BarChart3, color: "text-text-primary", bg: "bg-background" },
    { label: "Casos Críticos", value: totalCritical, icon: AlertTriangle, color: "text-danger", bg: "bg-danger/10" },
  ];

  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-text-primary">Carga de Trabalho</h1>
        <p className="text-sm text-body mt-1">Distribuição de casos por gestor e indicadores de sobrecarga.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
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
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GCRCard title="Distribuição de Casos por Gestor" className="lg:col-span-5">
          <div className="space-y-4 mt-1">
            {rows.slice(0, 10).map((r) => {
              const pct = total ? (r.active / total) * 100 : 0;
              const overloaded = r.active > (total / rows.length) * 1.3;
              return (
                <div key={r.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-text-primary truncate max-w-[200px]">{r.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{r.active}</span>
                      {overloaded && <GCRBadge color="amber" dot>Carga alta</GCRBadge>}
                    </div>
                  </div>
                  <div className="h-2.5 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${r.critical > 0 ? "bg-danger" : overloaded ? "bg-warning" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GCRCard>

        <GCRCard title="Detalhe por Gestor" className="lg:col-span-7">
          <div className="overflow-x-auto -mx-7">
            <GCRTable>
              <GCRTHead>
                <GCRTRow>
                  <GCRTCell isHeader>Gestor de Caso</GCRTCell>
                  <GCRTCell isHeader className="text-center">Activos</GCRTCell>
                  <GCRTCell isHeader className="text-center">Críticos</GCRTCell>
                  <GCRTCell isHeader className="text-center">Sem Ref.</GCRTCell>
                  <GCRTCell isHeader className="text-center">&gt;30 Dias</GCRTCell>
                  <GCRTCell isHeader className="text-center">Estado</GCRTCell>
                </GCRTRow>
              </GCRTHead>
              <GCRTBody>
                {rows.map(r => {
                  const overloaded = r.active > (total / rows.length) * 1.3;
                  return (
                    <GCRTRow key={r.name}>
                      <GCRTCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {r.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium">{r.name}</span>
                        </div>
                      </GCRTCell>
                      <GCRTCell className="text-center font-bold">{r.active}</GCRTCell>
                      <GCRTCell className="text-center">
                        {r.critical > 0
                          ? <GCRBadge color="red" dot>{r.critical}</GCRBadge>
                          : <span className="text-body">0</span>
                        }
                      </GCRTCell>
                      <GCRTCell className="text-center">
                        {r.noRef > 0
                          ? <span className="text-warning font-semibold">{r.noRef}</span>
                          : <span className="text-body">0</span>
                        }
                      </GCRTCell>
                      <GCRTCell className="text-center">
                        {r.open30 > 0
                          ? <span className="text-warning font-semibold">{r.open30}</span>
                          : <span className="text-body">0</span>
                        }
                      </GCRTCell>
                      <GCRTCell className="text-center">
                        {r.critical > 0
                          ? <GCRBadge color="red" dot>Atenção</GCRBadge>
                          : overloaded
                            ? <GCRBadge color="amber" dot>Sobrecarregado</GCRBadge>
                            : <GCRBadge color="green" dot>Normal</GCRBadge>
                        }
                      </GCRTCell>
                    </GCRTRow>
                  );
                })}
              </GCRTBody>
            </GCRTable>
          </div>
        </GCRCard>
      </div>

      {alerted.length > 0 && (
        <div className="mt-6">
          <GCRCard title="⚠ Alertas de Supervisão" desc="Gestores que necessitam de atenção imediata">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerted.map(r => (
                <div key={r.name} className="flex items-start gap-4 p-4 rounded-sm border border-warning/30 bg-warning/5">
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{r.name}</p>
                    <p className="text-xs text-body mt-1">
                      {r.critical > 0 && <span className="text-danger font-semibold">{r.critical} caso(s) crítico(s)</span>}
                      {r.critical > 0 && r.noRef > 3 ? " · " : ""}
                      {r.noRef > 3 && <span className="text-warning font-semibold">{r.noRef} sem referência</span>}
                    </p>
                    <p className="text-xs text-body mt-0.5">{r.active} casos activos · {r.open30} abertos &gt;30 dias</p>
                  </div>
                </div>
              ))}
            </div>
          </GCRCard>
        </div>
      )}
    </div>
  );
}
