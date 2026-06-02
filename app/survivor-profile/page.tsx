"use client";

import { useState } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import GCRCard from "@/components/ui/GCRCard";
import GCRBadge from "@/components/ui/GCRBadge";
import FilterBar from "@/components/FilterBar";
import { User, Accessibility } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SurvivorProfilePage() {
  const [provFilter, setProvFilter] = useState("");
  const { data: allCases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!allCases) return <p className="text-on-surface-variant p-8">Carregando...</p>;

  const provinces = Array.from(new Set(allCases.map(c => c.province).filter((d): d is string => !!d))).sort();
  const cases = provFilter ? allCases.filter(c => c.province === provFilter) : allCases;

  return (
    <div>
      <h1 className="text-page-title text-on-surface mb-1">Perfil da Sobrevivente e Tipologia</h1>
      <p className="text-body text-on-surface-variant mb-4">Quem é apoiado e que tipos de incidentes são reportados</p>
      <FilterBar>
        <select className="gcr-input w-56" value={provFilter} onChange={e => setProvFilter(e.target.value)}>
          <option value="">Todas as províncias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </FilterBar>
      <ProfileContent cases={cases} />
    </div>
  );
}

function ProfileContent({ cases }: { cases: GBVCase[] }) {
  const total = cases.length;

  // Sex distribution
  const sexCounts: Record<string, number> = { Feminino: 0, Masculino: 0 };
  for (const c of cases) {
    if (!c.sex) continue;
    if (/femenino|feminino/i.test(c.sex)) sexCounts.Feminino++;
    else if (/masculino/i.test(c.sex)) sexCounts.Masculino++;
  }
  const sexData = Object.entries(sexCounts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  // Age-gender butterfly
  const ageGender: Record<string, { f: number; m: number }> = {};
  for (const c of cases) {
    if (!c.age_group) continue;
    const a = c.age_group;
    const isF = /femenino|feminino/i.test(c.sex || "");
    if (!ageGender[a]) ageGender[a] = { f: 0, m: 0 };
    if (isF) ageGender[a].f++;
    else if (/masculino/i.test(c.sex || "")) ageGender[a].m++;
  }
  const ageSorted = Object.entries(ageGender).sort((a, b) => (a[1].f + a[1].m) - (b[1].f + b[1].m));
  const maxF = Math.max(...ageSorted.map(([, v]) => v.f), 1);
  const maxM = Math.max(...ageSorted.map(([, v]) => v.m), 1);

  // Disability
  const disabilitySim = cases.filter(c => { const d = (c.disability || "").trim().toLowerCase(); return d !== "" && d !== "nao" && d !== "não"; }).length;
  const disabilityFisica = cases.filter(c => (c.disability || "").includes("Física")).length;
  const disabilityMental = cases.filter(c => (c.disability || "").includes("Mental")).length;

  // Violence type
  const violCounts: Record<string, number> = {};
  for (const c of cases) { const v = c.violence_type_short || c.violence_type; if (v) violCounts[v] = (violCounts[v] || 0) + 1; }
  const violData = Object.entries(violCounts).sort((a, b) => b[1] - a[1]);

  // Perpetrator relationship
  const perpCounts: Record<string, number> = {};
  for (const c of cases) { if (c.perpetrator_relationship) perpCounts[c.perpetrator_relationship] = (perpCounts[c.perpetrator_relationship] || 0) + 1; }
  const perpData = Object.entries(perpCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Violence × Sex cross-tab
  const violBySex: Record<string, { Feminino: number; Masculino: number }> = {};
  for (const c of cases) {
    const v = c.violence_type_short || c.violence_type;
    if (!v) continue;
    if (!violBySex[v]) violBySex[v] = { Feminino: 0, Masculino: 0 };
    if (/femenino|feminino/i.test(c.sex || "")) violBySex[v].Feminino++;
    else if (/masculino/i.test(c.sex || "")) violBySex[v].Masculino++;
  }
  const violBySexSorted = Object.entries(violBySex).sort((a, b) => (b[1].Feminino + b[1].Masculino) - (a[1].Feminino + a[1].Masculino)).slice(0, 8);

  // Violence × Age group cross-tab (top 6 violence types × age groups)
  const topViol = violData.slice(0, 6).map(([v]) => v);
  const allAges = Object.keys(ageGender).sort();
  const violByAge: Record<string, Record<string, number>> = {};
  for (const v of topViol) violByAge[v] = {};
  for (const c of cases) {
    const v = c.violence_type_short || c.violence_type;
    if (!v || !topViol.includes(v) || !c.age_group) continue;
    violByAge[v][c.age_group] = (violByAge[v][c.age_group] || 0) + 1;
  }
  const violByAgeMax = Math.max(...topViol.flatMap(v => allAges.map(a => violByAge[v][a] || 0)), 1);

  // Age groups with children/adolescents/adults count
  const children = cases.filter(c => (c.age_group || "").includes("0-11") || (c.age_group || "").includes("0-5") || (c.age_group || "").includes("6-11")).length;
  const adolescents = cases.filter(c => (c.age_group || "").includes("12-17")).length;
  const adults = cases.filter(c => {
    const a = c.age_group || "";
    return a.includes("18-") || a.includes("25-") || a.includes("30-") || a.includes("40-") || a.includes("50-") || a.includes("60");
  }).length;

  return (
    <div className="space-y-6">
      {/* Demographic summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Crianças (0–11)", value: children, color: "text-info", desc: `${total > 0 ? ((children / total) * 100).toFixed(1) : 0}% do total` },
          { label: "Adolescentes (12–17)", value: adolescents, color: "text-warning", desc: `${total > 0 ? ((adolescents / total) * 100).toFixed(1) : 0}% do total` },
          { label: "Adultos (18+)", value: adults, color: "text-on-surface", desc: `${total > 0 ? ((adults / total) * 100).toFixed(1) : 0}% do total` },
          { label: "Com Deficiência", value: disabilitySim, color: "text-secondary", desc: `${total > 0 ? ((disabilitySim / total) * 100).toFixed(1) : 0}% do total` },
        ].map(({ label, value, color, desc }) => (
          <div key={label} className="gcr-card p-4 text-center">
            <p className="text-label text-on-surface-variant mb-1">{label}</p>
            <p className={`text-metric ${color}`}>{value}</p>
            <p className="text-caption text-on-surface-variant mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* Sex distribution + Age butterfly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GCRCard title="Distribuição por Sexo">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {sexData.map(([l, c]) => {
              const pct = total > 0 ? (c / total) * 100 : 0;
              const isF = /femenino|feminino/i.test(l);
              return (
                <div key={l} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 text-center">
                  <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2 ${isF ? "bg-[#E91E8C]/10 text-[#E91E8C]" : "bg-[#2563EB]/10 text-[#2563EB]"}`}>
                    <User className="w-7 h-7" />
                  </div>
                  <p className="text-metric font-bold" style={{ color: isF ? "#D34053" : "#005243" }}>{c}</p>
                  <p className="text-label text-on-surface-variant mt-1">{isF ? "Feminino" : "Masculino"}</p>
                  <div className="mt-3 h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isF ? "#D34053" : "#005243" }} />
                  </div>
                  <p className="text-caption text-on-surface-variant mt-1">{pct.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
          {/* Disability breakdown */}
          <div className="border-t border-outline-variant pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label text-on-surface-variant flex items-center gap-1.5"><Accessibility className="w-3.5 h-3.5" /> Deficiência</span>
              <span className="text-label font-semibold text-secondary">{disabilitySim} ({total > 0 ? ((disabilitySim / total) * 100).toFixed(1) : 0}%)</span>
            </div>
            <div className="space-y-1.5">
              {[{ label: "Física", count: disabilityFisica }, { label: "Mental", count: disabilityMental }].map(({ label, count }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-caption text-on-surface-variant w-12 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-secondary/50" style={{ width: `${disabilitySim > 0 ? (count / disabilitySim) * 100 : 0}%` }} />
                  </div>
                  <span className="text-caption font-semibold text-on-surface w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </GCRCard>

        <GCRCard title="Faixa Etária por Sexo">
          {ageSorted.length > 0 ? (
            <div className="space-y-2.5">
              {ageSorted.map(([age, { f, m }]) => {
                const tot = f + m;
                const pctF = (f / maxF) * 100;
                const pctM = (m / maxM) * 100;
                const pctFofTot = tot > 0 ? (f / tot) * 100 : 0;
                const pctMofTot = tot > 0 ? (m / tot) * 100 : 0;
                return (
                  <div key={age} className="flex items-center gap-1.5">
                    <div className="flex-1 flex items-center justify-end gap-1">
                      <span className="text-caption text-blue-600 font-medium tabular-nums">{m} ({pctMofTot.toFixed(0)}%)</span>
                      <div className="h-4 w-full max-w-[120px] rounded-l-full bg-blue-100" style={{ width: `${pctM}%` }}>
                        <div className="h-full rounded-l-full bg-blue-400" style={{ width: `${pctMofTot}%` }} />
                      </div>
                    </div>
                    <div className="w-20 text-center shrink-0">
                      <span className="text-caption font-medium text-on-surface">{age}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-start gap-1">
                      <div className="h-4 w-full max-w-[120px] rounded-r-full bg-pink-100" style={{ width: `${pctF}%` }}>
                        <div className="h-full rounded-r-full bg-pink-400" style={{ width: `${pctFofTot}%` }} />
                      </div>
                      <span className="text-caption text-pink-600 font-medium tabular-nums">{f} ({pctFofTot.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-center gap-6 pt-2 text-caption text-on-surface-variant">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-200" /> Masculino</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-pink-200" /> Feminino</span>
              </div>
            </div>
          ) : <p className="text-on-surface-variant text-sm">Nenhum dado</p>}
        </GCRCard>
      </div>

      {/* Incident typology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GCRCard title="Tipo de Incidente">
          <div className="space-y-2">
            {violData.map(([label, count]) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={label} className="py-1.5 border-b border-outline-variant last:border-0">
                  <div className="flex items-center justify-between text-label mb-1">
                    <span className="text-on-surface-variant truncate mr-2 text-[13px]">{label}</span>
                    <span className="font-semibold text-on-surface text-sm whitespace-nowrap">{count} <span className="text-caption text-on-surface-variant font-normal">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden bg-surface-container">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GCRCard>

        <GCRCard title="Relação com Perpetrador">
          <div className="space-y-2">
            {perpData.map(([label, count]) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-outline-variant last:border-0">
                  <span className="text-body text-on-surface-variant truncate mr-2">{label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-caption text-on-surface-variant">{pct.toFixed(1)}%</span>
                    <GCRBadge color="blue">{count}</GCRBadge>
                  </div>
                </div>
              );
            })}
          </div>
        </GCRCard>
      </div>

      {/* Cross-analysis: Violence × Sex */}
      <GCRCard title="Tipo de Incidente por Sexo">
        <div className="overflow-x-auto">
          <table className="w-full text-caption">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left py-2 pr-4 text-on-surface-variant font-medium">Tipo de Incidente</th>
                <th className="text-right py-2 px-3 text-pink-600 font-medium">Feminino</th>
                <th className="text-right py-2 px-3 text-blue-600 font-medium">Masculino</th>
                <th className="text-right py-2 pl-3 text-on-surface-variant font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {violBySexSorted.map(([v, { Feminino: f, Masculino: m }]) => (
                <tr key={v} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                  <td className="py-2 pr-4 text-on-surface truncate max-w-[200px]">{v}</td>
                  <td className="text-right py-2 px-3 text-pink-700 font-semibold">{f}</td>
                  <td className="text-right py-2 px-3 text-blue-700 font-semibold">{m}</td>
                  <td className="text-right py-2 pl-3 text-on-surface font-medium">{f + m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GCRCard>

      {/* Cross-analysis: Violence × Age (heatmap) */}
      {topViol.length > 0 && allAges.length > 0 && (
        <GCRCard title="Tipo de Incidente por Faixa Etária">
          <div className="overflow-x-auto">
            <table className="w-full text-caption">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-2 pr-4 text-on-surface-variant font-medium min-w-[160px]">Tipo</th>
                  {allAges.map(a => (
                    <th key={a} className="text-center py-2 px-2 text-on-surface-variant font-medium whitespace-nowrap">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topViol.map(v => (
                  <tr key={v} className="border-b border-outline-variant/50">
                    <td className="py-2 pr-4 text-on-surface truncate max-w-[160px]">{v}</td>
                    {allAges.map(a => {
                      const val = violByAge[v][a] || 0;
                      const intensity = val / violByAgeMax;
                      const bg = intensity > 0.6 ? "bg-primary text-white" : intensity > 0.3 ? "bg-primary/40 text-primary" : intensity > 0 ? "bg-primary/15 text-primary" : "bg-surface-container text-on-surface-variant";
                      return (
                        <td key={a} className={`text-center py-2 px-2 rounded font-semibold ${bg}`}>
                          {val > 0 ? val : "–"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GCRCard>
      )}
    </div>
  );
}
