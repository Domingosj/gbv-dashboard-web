"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { fmtViolence } from "@/lib/risk-calculator";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function StrategicAnalysisPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-text-secondary p-8">Carregando...</p>;

  const open = cases.filter(c => c.case_status === "Aberto");

  const violenceDist: Record<string, number> = {};
  const ageViolence: Record<string, Record<string, number>> = {};
  const perpetratorRel: Record<string, number> = {};
  const displacement: Record<string, number> = {};

  for (const c of open) {
    const v = fmtViolence(c.violence_type);
    violenceDist[v] = (violenceDist[v] || 0) + 1;

    const a = c.age_group || "N/A";
    if (!ageViolence[a]) ageViolence[a] = {};
    ageViolence[a][v] = (ageViolence[a][v] || 0) + 1;

    const rel = c.perpetrator_relationship || "N/A";
    perpetratorRel[rel] = (perpetratorRel[rel] || 0) + 1;
  }

  const topViolence = Object.entries(violenceDist).sort((a, b) => b[1] - a[1]);
  const topPerps = Object.entries(perpetratorRel).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const minorCases = open.filter(c => (c.age_group || "").includes("0-11") || (c.age_group || "").includes("12-17"));
  const prevIncidents = open.filter(c => (c.previous_incident || "").toLowerCase() === "sim");
  const unsafe = open.filter(c => (c.is_safe || "").toLowerCase() === "não" || (c.is_safe || "").toLowerCase() === "nao");

  return (
    <div>
      <h1 className="text-page-title text-text-primary mb-6">Análise Estratégica de Proteção</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Menores Envolvidos", value: minorCases.length, color: "text-critical" },
          { label: "Violência Grave", value: open.filter(c => (c.violence_type || "").toLowerCase().includes("violação") || (c.violence_type || "").toLowerCase().includes("agressão sexual")).length, color: "text-critical" },
          { label: "Incidentes Anteriores", value: prevIncidents.length, color: "text-warning" },
          { label: "Não Seguras", value: unsafe.length, color: "text-critical" },
        ].map(({ label, value, color }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-text-secondary mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <GCRCard title="Padrões de Violência">
          <div className="space-y-2">
            {topViolence.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-body text-text-secondary">{label}</span>
                <GCRBadge color={count > 10 ? "red" : "amber"}>{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>

        <GCRCard title="Relação com o Perpetrador">
          <div className="space-y-2">
            {topPerps.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-body text-text-secondary truncate mr-2">{label}</span>
                <GCRBadge color="blue">{count}</GCRBadge>
              </div>
            ))}
          </div>
        </GCRCard>
      </div>

      <GCRCard title="Violência por Faixa Etária">
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-label text-text-secondary">Faixa Etária</th>
                {topViolence.slice(0, 5).map(([v]) => (
                  <th key={v} className="text-right px-4 py-3 text-label text-text-secondary">{v}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(ageViolence).sort().map(([age, vio]) => (
                <tr key={age} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{age}</td>
                  {topViolence.slice(0, 5).map(([v]) => (
                    <td key={v} className="px-4 py-3 text-right">{vio[v] || 0}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCRCard>
    </div>
  );
}
