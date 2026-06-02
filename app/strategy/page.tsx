"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import ModuleTabs from "@/components/ModuleTabs";
import FilterBar from "@/components/FilterBar";
import GCRCard from "@/components/ui/GCRCard";
import { X } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TABS = [
  { key: "portfolio", label: "Resumo" },
  { key: "pivot", label: "Por Localização" },
  { key: "partners", label: "Entrada de Casos" },
  { key: "geo", label: "Por Território" },
];

export default function StrategyPage() {
  const [tab, setTab] = useState("portfolio");
  const [provFilter, setProvFilter] = useState("");
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });
  if (!cases) return <p className="text-on-surface-variant p-8">Carregando...</p>;

  const provinces = Array.from(new Set(cases.map(c => c.province).filter((d): d is string => !!d))).sort();
  const filtered = provFilter ? cases.filter(c => c.province === provFilter) : cases;

  return (
    <div>
      <h1 className="text-page-title text-on-surface mb-1">Desempenho dos Projectos</h1>
      <ModuleTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />
      <FilterBar>
        <select className="gcr-input w-56" value={provFilter} onChange={e => setProvFilter(e.target.value)}>
          <option value="">Todas as províncias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </FilterBar>
      {tab === "portfolio" && <PortfolioTab cases={filtered} />}
      {tab === "pivot" && <PivotTab cases={filtered} />}
      {tab === "partners" && <PartnersTab cases={filtered} />}
      {tab === "geo" && <GeoTab cases={filtered} />}
    </div>
  );
}

function PortfolioTab({ cases }: { cases: GBVCase[] }) {
  const projects: Record<string, { total: number; open: number; closed: number; critical: number; districts: Set<string> }> = {};
  for (const c of cases) {
    const p = c.project || "Linha Fala sem Medo";
    if (!projects[p]) projects[p] = { total: 0, open: 0, closed: 0, critical: 0, districts: new Set() };
    projects[p].total++;
    if (c.case_status === "Aberto") projects[p].open++;
    if (c.case_status === "Encerrado") projects[p].closed++;
    if (c.priority_level === "CRÍTICO") projects[p].critical++;
    if (c.district) projects[p].districts.add(c.district);
  }
  const rows = Object.entries(projects).map(([name, d]) => ({ name, ...d, districts: d.districts.size, closeRate: d.total ? ((d.closed / d.total) * 100).toFixed(1) : "0" })).sort((a, b) => b.total - a.total);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body">
        <thead className="bg-surface-container-low border-b border-outline-variant">
          <tr>
            <th className="text-left px-4 py-3 text-label text-on-surface-variant">Projeto</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Total</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Abertos</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Encerrados</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Tx Encerramento</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Críticos</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Distritos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(r => (
            <tr key={r.name} className="hover:bg-surface-container-low">
              <td className="px-4 py-3 font-medium">{r.name}</td>
              <td className="px-4 py-3 text-right">{r.total}</td>
              <td className="px-4 py-3 text-right">{r.open}</td>
              <td className="px-4 py-3 text-right">{r.closed}</td>
              <td className="px-4 py-3 text-right font-semibold">{r.closeRate}%</td>
              <td className={`px-4 py-3 text-right ${r.critical > 0 ? "text-critical font-semibold" : ""}`}>{r.critical}</td>
              <td className="px-4 py-3 text-right text-on-surface-variant">{r.districts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Pivot matrix helpers ──────────────────────────────────────────────────────

function isReferred(c: GBVCase): boolean {
  return ["referred_medical","referred_psychosocial","referred_police",
    "referred_legal","referred_safe_house","referred_child_protection"]
    .some(k => /sim/i.test((c as any)[k] || ""));
}

// ── Projetos heat matrix (moved from Analytics) ───────────────────────────────

const MONTH_LABELS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function heatBg(count: number, max: number): string {
  if (count === 0) return "";
  const t = count / max;
  return `rgba(0,82,67,${(0.12 + t * 0.78).toFixed(2)})`;
}
function heatFg(count: number, max: number): string {
  if (count === 0) return "#9aa5a0";
  return count / max > 0.55 ? "#ffffff" : "#003d32";
}

function HeatMatrix({
  rowLabel, rows, matrix, maxVal, year, onSelect,
}: {
  rowLabel: string;
  rows: string[];
  matrix: Record<string, Record<number, GBVCase[]>>;
  maxVal: number;
  year: number;
  onSelect: (label: string, cases: GBVCase[]) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 text-label text-on-surface-variant bg-surface-container-low border border-outline-variant/40 min-w-[160px] sticky left-0 z-10">{rowLabel}</th>
            {MONTH_LABELS.map((m, i) => (
              <th key={i} className="px-2 py-2 text-center text-label text-on-surface-variant bg-surface-container-low border border-outline-variant/40 min-w-[46px]">{m}</th>
            ))}
            <th className="px-3 py-2 text-center text-label text-on-surface-variant bg-surface-container-low border border-outline-variant/40 font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const rowTotal = Object.values(matrix[row]).reduce((s, arr) => s + arr.length, 0);
            return (
              <tr key={row}>
                <td className="px-3 py-2 text-label font-medium text-on-surface border border-outline-variant/40 bg-surface-container-lowest sticky left-0 z-10 max-w-[200px] truncate" title={row}>{row}</td>
                {Array.from({ length: 12 }, (_, i) => {
                  const cellCases = matrix[row][i] || [];
                  const count = cellCases.length;
                  return (
                    <td key={i}
                      className={`px-2 py-2 text-center border border-outline-variant/40 text-label font-semibold transition-all ${count > 0 ? "cursor-pointer hover:ring-2 hover:ring-inset hover:ring-primary/60" : ""}`}
                      style={{ backgroundColor: heatBg(count, maxVal), color: heatFg(count, maxVal) }}
                      onClick={() => count > 0 && onSelect(`${row} — ${MONTH_LABELS[i]} ${year}`, cellCases)}
                      title={count > 0 ? `${count} casos` : undefined}
                    >
                      {count > 0 ? count : ""}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center font-bold text-on-surface border border-outline-variant/40 bg-surface-container-low">{rowTotal}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function YearFilterBar({ availableYears, year, count, onYear }: { availableYears: number[]; year: number; count: number; onYear: (y: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-label text-on-surface-variant">Ano:</span>
      <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
        {availableYears.map(y => (
          <button key={y} onClick={() => onYear(y)}
            className={`px-3 py-1.5 text-label font-medium rounded-md transition-all ${year === y ? "bg-white text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
            {y}
          </button>
        ))}
      </div>
      <span className="text-caption text-on-surface-variant">{count} casos</span>
    </div>
  );
}

function CaseDrillDown({ selection, onClose }: { selection: { label: string; cases: GBVCase[] }; onClose: () => void }) {
  return (
    <GCRCard title={`${selection.label} — ${selection.cases.length} casos`}>
      <div className="flex justify-between items-center mb-3">
        <p className="text-caption text-on-surface-variant">Clique num caso para ver detalhes</p>
        <button onClick={onClose} className="text-caption text-on-surface-variant hover:text-on-surface flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> Fechar
        </button>
      </div>
      <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
        {selection.cases.map(c => (
          <a key={c.record_id || c.case_id}
            href={`/cases/${c.record_id || encodeURIComponent(c.case_id || "")}`}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
            <div className="min-w-0 flex-1">
              <span className="text-primary font-mono text-caption font-semibold">{c.case_id || c.record_id || "N/A"}</span>
              <div className="flex items-center gap-2 text-caption text-on-surface-variant mt-0.5">
                <span>{c.district || c.province || "N/A"}</span>
                <span>·</span>
                <span>{c.case_manager || "Sem gestor"}</span>
                <span>·</span>
                <span>{c.project || "—"}</span>
              </div>
            </div>
            <span className={`shrink-0 ml-3 text-caption px-2 py-0.5 rounded-full font-medium ${
              c.priority_level === "CRÍTICO" ? "bg-critical/10 text-critical" :
              c.priority_level === "ALTO" ? "bg-warning/10 text-warning" :
              "bg-primary/10 text-primary"
            }`}>{c.priority_level || c.case_status || "—"}</span>
          </a>
        ))}
      </div>
    </GCRCard>
  );
}

function PartnersTab({ cases }: { cases: GBVCase[] }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [selection, setSelection] = useState<{ label: string; cases: GBVCase[] } | null>(null);

  const availableYears = useMemo(() => {
    const ys = new Set<number>();
    for (const c of cases) { if (c.identification_date) ys.add(new Date(c.identification_date).getFullYear()); }
    return Array.from(ys).sort((a, b) => b - a);
  }, [cases]);

  const yearCases = useMemo(() =>
    cases.filter(c => c.identification_date && new Date(c.identification_date).getFullYear() === year),
    [cases, year]);

  const { projectRows, projectMatrix, projectMax } = useMemo(() => {
    const rows = Array.from(new Set(yearCases.map(c => c.project).filter(Boolean) as string[])).sort();
    const matrix: Record<string, Record<number, GBVCase[]>> = {};
    for (const r of rows) matrix[r] = {};
    for (const c of yearCases) {
      if (!c.project || !c.identification_date) continue;
      const m = new Date(c.identification_date).getMonth();
      if (!matrix[c.project][m]) matrix[c.project][m] = [];
      matrix[c.project][m].push(c);
    }
    const max = Math.max(1, ...rows.flatMap(r => Object.values(matrix[r]).map(a => a.length)));
    return { projectRows: rows, projectMatrix: matrix, projectMax: max };
  }, [yearCases]);

  function handleSelect(label: string, selected: GBVCase[]) {
    setSelection(prev => prev?.label === label ? null : { label, cases: selected });
  }

  return (
    <div className="space-y-5">
      <YearFilterBar availableYears={availableYears} year={year} count={yearCases.length} onYear={y => { setYear(y); setSelection(null); }} />
      <GCRCard title={`Projetos × Mês — ${year}`}>
        <p className="text-caption text-on-surface-variant mb-3">Clique numa célula para ver os casos desse projeto/mês</p>
        {projectRows.length > 0
          ? <HeatMatrix rowLabel="Projeto" rows={projectRows} matrix={projectMatrix} maxVal={projectMax} year={year} onSelect={handleSelect} />
          : <p className="text-on-surface-variant text-sm py-4 text-center">Sem dados para {year}</p>}
      </GCRCard>
      {selection && <CaseDrillDown selection={selection} onClose={() => setSelection(null)} />}
    </div>
  );
}

// ── Heat colour scales for each metric column ─────────────────────────────────

function heatBgBlue(count: number, max: number): string {
  if (count === 0) return "";
  const t = count / max;
  return `rgba(29,78,216,${(0.10 + t * 0.80).toFixed(2)})`;
}
function heatFgBlue(count: number, max: number): string {
  if (count === 0) return "#9aa5a0";
  return count / max > 0.50 ? "#ffffff" : "#1e3a8a";
}
function heatBgGreen(count: number, max: number): string {
  if (count === 0) return "";
  const t = count / max;
  return `rgba(21,128,61,${(0.10 + t * 0.80).toFixed(2)})`;
}
function heatFgGreen(count: number, max: number): string {
  if (count === 0) return "#9aa5a0";
  return count / max > 0.50 ? "#ffffff" : "#14532d";
}

// ── Pivot Matrix Tab ──────────────────────────────────────────────────────────

function PivotTab({ cases }: { cases: GBVCase[] }) {
  const [collapsedProvs, setCollapsedProvs] = useState<Set<string>>(new Set());
  const [collapsedProjs, setCollapsedProjs] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<{ label: string; cases: GBVCase[] } | null>(null);

  // hierarchy[province][project][district] = GBVCase[]
  const hierarchy = useMemo(() => {
    const h: Record<string, Record<string, Record<string, GBVCase[]>>> = {};
    for (const c of cases) {
      const prov = c.province || "Desconhecido";
      const proj = c.project || "Linha Fala sem Medo";
      const dist = c.district || "Desconhecido";
      if (!h[prov]) h[prov] = {};
      if (!h[prov][proj]) h[prov][proj] = {};
      if (!h[prov][proj][dist]) h[prov][proj][dist] = [];
      h[prov][proj][dist].push(c);
    }
    return h;
  }, [cases]);

  const { maxIdent, maxRef, maxClosed, grandTotal, sortedProvs } = useMemo(() => {
    let mI = 1, mR = 1, mC = 1, gI = 0, gR = 0, gC = 0;
    for (const provProjs of Object.values(hierarchy)) {
      for (const projDists of Object.values(provProjs)) {
        for (const dc of Object.values(projDists)) {
          const i = dc.length;
          const r = dc.filter(isReferred).length;
          const c = dc.filter(x => x.case_status === "Encerrado").length;
          if (i > mI) mI = i;
          if (r > mR) mR = r;
          if (c > mC) mC = c;
          gI += i; gR += r; gC += c;
        }
      }
    }
    const sp = Object.keys(hierarchy).sort((a, b) => {
      const ca = Object.values(hierarchy[a]).flatMap(Object.values).flat().length;
      const cb = Object.values(hierarchy[b]).flatMap(Object.values).flat().length;
      return cb - ca;
    });
    return { maxIdent: mI, maxRef: mR, maxClosed: mC, grandTotal: { identified: gI, referred: gR, closed: gC }, sortedProvs: sp };
  }, [hierarchy]);

  const pct = (n: number, d: number) => d > 0 ? `${((n / d) * 100).toFixed(0)}%` : "–";

  const toggleProv = (prov: string) => setCollapsedProvs(prev => {
    const next = new Set(prev); next.has(prov) ? next.delete(prov) : next.add(prov); return next;
  });
  const toggleProj = (key: string) => setCollapsedProjs(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });

  return (
    <div className="space-y-4">
      <p className="text-caption text-on-surface-variant">
        {cases.length} casos · {sortedProvs.length} províncias · Clique em ▼/▶ para expandir/recolher · Clique num número para ver os casos
      </p>

      {/* Legend */}
      <div className="flex items-center gap-6 text-caption text-on-surface-variant">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(0,82,67,0.6)" }} /> Identificados</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(29,78,216,0.6)" }} /> Referenciados</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(21,128,61,0.6)" }} /> Encerrados</span>
        <span className="text-outline-variant">Cor mais intensa = mais casos</span>
      </div>

      <GCRCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5 text-label text-on-surface-variant bg-surface-container-low border border-outline-variant/40 min-w-[260px] sticky left-0 z-10">
                  Localização
                </th>
                <th className="px-3 py-2.5 text-center text-label font-semibold bg-surface-container-low border border-outline-variant/40 min-w-[90px]" style={{ color: "#005243" }}>
                  Identificados
                </th>
                <th className="px-3 py-2.5 text-center text-label font-semibold bg-surface-container-low border border-outline-variant/40 min-w-[90px]" style={{ color: "#1d4ed8" }}>
                  Referenciados
                </th>
                <th className="px-3 py-2.5 text-center text-label font-semibold bg-surface-container-low border border-outline-variant/40 min-w-[90px]" style={{ color: "#15803d" }}>
                  Encerrados
                </th>
                <th className="px-3 py-2.5 text-center text-label text-on-surface-variant bg-surface-container-low border border-outline-variant/40 min-w-[54px]">
                  % Ref.
                </th>
                <th className="px-3 py-2.5 text-center text-label text-on-surface-variant bg-surface-container-low border border-outline-variant/40 min-w-[54px]">
                  % Enc.
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProvs.flatMap(prov => {
                const provProjects = hierarchy[prov];
                const isProvCollapsed = collapsedProvs.has(prov);
                const allProvCases = Object.values(provProjects).flatMap(Object.values).flat();
                const pI = allProvCases.length;
                const pR = allProvCases.filter(isReferred).length;
                const pC = allProvCases.filter(c => c.case_status === "Encerrado").length;
                const sortedProjs = Object.keys(provProjects).sort((a, b) =>
                  Object.values(provProjects[b]).flat().length - Object.values(provProjects[a]).flat().length
                );

                const rows: React.ReactElement[] = [
                  <tr key={`prov-${prov}`}
                    className="bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer select-none"
                    onClick={() => toggleProv(prov)}
                  >
                    <td className="px-3 py-2.5 sticky left-0 bg-surface-container border border-outline-variant/40 z-10">
                      <span className="flex items-center gap-2 font-bold text-on-surface text-[12px] uppercase tracking-wide">
                        <span className="text-[9px] text-on-surface-variant w-3 shrink-0">{isProvCollapsed ? "▶" : "▼"}</span>
                        {prov}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-on-surface border border-outline-variant/40 bg-surface-container">{pI}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-on-surface border border-outline-variant/40 bg-surface-container">{pR}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-on-surface border border-outline-variant/40 bg-surface-container">{pC}</td>
                    <td className="px-3 py-2.5 text-center text-caption text-on-surface-variant border border-outline-variant/40 bg-surface-container">{pct(pR, pI)}</td>
                    <td className="px-3 py-2.5 text-center text-caption text-on-surface-variant border border-outline-variant/40 bg-surface-container">{pct(pC, pI)}</td>
                  </tr>,
                ];

                if (!isProvCollapsed) {
                  for (const proj of sortedProjs) {
                    const projKey = `${prov}||${proj}`;
                    const isProjCollapsed = collapsedProjs.has(projKey);
                    const projDists = provProjects[proj];
                    const allProjCases = Object.values(projDists).flat();
                    const jI = allProjCases.length;
                    const jR = allProjCases.filter(isReferred).length;
                    const jC = allProjCases.filter(c => c.case_status === "Encerrado").length;
                    const sortedDists = Object.keys(projDists).sort((a, b) => projDists[b].length - projDists[a].length);

                    rows.push(
                      <tr key={`proj-${projKey}`}
                        className="bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer select-none"
                        onClick={e => { e.stopPropagation(); toggleProj(projKey); }}
                      >
                        <td className="px-3 py-2 sticky left-0 bg-surface-container-low border border-outline-variant/40 z-10">
                          <span className="flex items-center gap-2 pl-5 font-semibold text-on-surface text-[12px]">
                            <span className="text-[9px] text-on-surface-variant w-3 shrink-0">{isProjCollapsed ? "▶" : "▼"}</span>
                            {proj}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-on-surface border border-outline-variant/40 text-[12px]">{jI}</td>
                        <td className="px-3 py-2 text-center font-semibold text-on-surface border border-outline-variant/40 text-[12px]">{jR}</td>
                        <td className="px-3 py-2 text-center font-semibold text-on-surface border border-outline-variant/40 text-[12px]">{jC}</td>
                        <td className="px-3 py-2 text-center text-caption text-on-surface-variant border border-outline-variant/40">{pct(jR, jI)}</td>
                        <td className="px-3 py-2 text-center text-caption text-on-surface-variant border border-outline-variant/40">{pct(jC, jI)}</td>
                      </tr>
                    );

                    if (!isProjCollapsed) {
                      for (const dist of sortedDists) {
                        const dc = projDists[dist];
                        const dI = dc.length;
                        const dR = dc.filter(isReferred).length;
                        const dC = dc.filter(c => c.case_status === "Encerrado").length;
                        const rowLabel = `${prov} › ${proj} › ${dist}`;
                        const isSel = selection?.label.startsWith(rowLabel) ?? false;
                        const selLabel = (metric: string) => `${rowLabel} — ${metric}`;
                        const clickCell = (metric: string, subset: GBVCase[]) => (e: React.MouseEvent) => {
                          e.stopPropagation();
                          const label = selLabel(metric);
                          setSelection(prev => prev?.label === label ? null : { label, cases: subset });
                        };

                        rows.push(
                          <tr key={`dist-${prov}-${proj}-${dist}`}
                            className={`transition-colors ${isSel ? "ring-1 ring-inset ring-primary/40" : ""}`}
                          >
                            <td className={`px-3 py-1.5 sticky left-0 border border-outline-variant/40 z-10 ${isSel ? "bg-primary/5" : "bg-surface-container-lowest"}`}>
                              <span className="flex items-center gap-1 pl-11 text-[11px] text-on-surface-variant">
                                <span className={isSel ? "text-primary font-medium" : ""}>{dist}</span>
                                {isSel && <span className="text-primary/60 ml-1 text-[10px]">◀</span>}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-center text-label font-semibold border border-outline-variant/40 cursor-pointer hover:brightness-90 transition-all"
                              style={{ backgroundColor: heatBg(dI, maxIdent), color: heatFg(dI, maxIdent) }}
                              onClick={clickCell("Identificados", dc)}
                              title={dI > 0 ? `${dI} casos identificados — clique para ver` : undefined}>
                              {dI > 0 ? dI : <span className="opacity-25">–</span>}
                            </td>
                            <td className="px-3 py-1.5 text-center text-label font-semibold border border-outline-variant/40 cursor-pointer hover:brightness-90 transition-all"
                              style={{ backgroundColor: heatBgBlue(dR, maxRef), color: heatFgBlue(dR, maxRef) }}
                              onClick={clickCell("Referenciados", dc.filter(isReferred))}
                              title={dR > 0 ? `${dR} casos referenciados — clique para ver` : undefined}>
                              {dR > 0 ? dR : <span className="opacity-25">–</span>}
                            </td>
                            <td className="px-3 py-1.5 text-center text-label font-semibold border border-outline-variant/40 cursor-pointer hover:brightness-90 transition-all"
                              style={{ backgroundColor: heatBgGreen(dC, maxClosed), color: heatFgGreen(dC, maxClosed) }}
                              onClick={clickCell("Encerrados", dc.filter(c => c.case_status === "Encerrado"))}
                              title={dC > 0 ? `${dC} casos encerrados — clique para ver` : undefined}>
                              {dC > 0 ? dC : <span className="opacity-25">–</span>}
                            </td>
                            <td className="px-3 py-1.5 text-center text-caption text-on-surface-variant border border-outline-variant/40">{pct(dR, dI)}</td>
                            <td className="px-3 py-1.5 text-center text-caption text-on-surface-variant border border-outline-variant/40">{pct(dC, dI)}</td>
                          </tr>
                        );
                      }
                    }
                  }
                }

                return rows;
              })}
            </tbody>
            <tfoot className="border-t-2 border-outline-variant/60">
              <tr className="bg-surface-container-low">
                <td className="px-3 py-2.5 font-bold text-on-surface text-[12px] uppercase tracking-wide sticky left-0 bg-surface-container-low border border-outline-variant/40 z-10">
                  Total Geral
                </td>
                <td className="px-3 py-2.5 text-center font-bold text-on-surface border border-outline-variant/40">{grandTotal.identified}</td>
                <td className="px-3 py-2.5 text-center font-bold text-on-surface border border-outline-variant/40">{grandTotal.referred}</td>
                <td className="px-3 py-2.5 text-center font-bold text-on-surface border border-outline-variant/40">{grandTotal.closed}</td>
                <td className="px-3 py-2.5 text-center text-caption font-semibold text-on-surface border border-outline-variant/40">{pct(grandTotal.referred, grandTotal.identified)}</td>
                <td className="px-3 py-2.5 text-center text-caption font-semibold text-on-surface border border-outline-variant/40">{pct(grandTotal.closed, grandTotal.identified)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </GCRCard>

      {selection && <PivotDrillDown selection={selection} onClose={() => setSelection(null)} />}
    </div>
  );
}

function PivotDrillDown({ selection, onClose }: { selection: { label: string; cases: GBVCase[] }; onClose: () => void }) {
  const sorted = useMemo(
    () => [...selection.cases].sort((a, b) => {
      const da = a.identification_date ? new Date(a.identification_date).getTime() : 0;
      const db = b.identification_date ? new Date(b.identification_date).getTime() : 0;
      return db - da;
    }),
    [selection.cases]
  );

  return (
    <GCRCard title={`${selection.label} — ${selection.cases.length} caso${selection.cases.length !== 1 ? "s" : ""}`}>
      <div className="flex justify-between items-center mb-3">
        <p className="text-caption text-on-surface-variant">Ordenado do mais recente ao mais antigo</p>
        <button onClick={onClose} className="text-caption text-on-surface-variant hover:text-on-surface flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> Fechar
        </button>
      </div>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-caption">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-left">
              <th className="py-2 px-3 font-medium text-on-surface-variant">Código</th>
              <th className="py-2 px-3 font-medium text-on-surface-variant">Data Identificação</th>
              <th className="py-2 px-3 font-medium text-on-surface-variant">Distrito</th>
              <th className="py-2 px-3 font-medium text-on-surface-variant">Tipo de Violência</th>
              <th className="py-2 px-3 font-medium text-on-surface-variant">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {sorted.map(c => (
              <tr key={c.record_id || c.case_id} className="hover:bg-surface-container-low transition-colors">
                <td className="py-2 px-3">
                  <a href={`/cases/${c.record_id || encodeURIComponent(c.case_id || "")}`}
                    className="text-primary font-mono font-semibold hover:underline">
                    {c.case_id || c.record_id || "N/A"}
                  </a>
                </td>
                <td className="py-2 px-3 text-on-surface-variant">
                  {c.identification_date ? new Date(c.identification_date).toLocaleDateString("pt-MZ") : "—"}
                </td>
                <td className="py-2 px-3 text-on-surface-variant">{c.district || c.province || "—"}</td>
                <td className="py-2 px-3 text-on-surface-variant max-w-[200px] truncate" title={c.violence_type ?? undefined}>
                  {c.violence_type || "—"}
                </td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    c.case_status === "Encerrado" ? "bg-success/10 text-success" : "bg-info/10 text-info"
                  }`}>
                    {c.case_status || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GCRCard>
  );
}

function GeoTab({ cases }: { cases: GBVCase[] }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [geoLevel, setGeoLevel] = useState<"province" | "district">("province");
  const [selection, setSelection] = useState<{ label: string; cases: GBVCase[] } | null>(null);

  const availableYears = useMemo(() => {
    const ys = new Set<number>();
    for (const c of cases) { if (c.identification_date) ys.add(new Date(c.identification_date).getFullYear()); }
    return Array.from(ys).sort((a, b) => b - a);
  }, [cases]);

  const yearCases = useMemo(() =>
    cases.filter(c => c.identification_date && new Date(c.identification_date).getFullYear() === year),
    [cases, year]);

  const { geoRows, geoMatrix, geoMax } = useMemo(() => {
    const keyFn = (c: GBVCase) => geoLevel === "province" ? c.province : (c.district || c.province);
    const rows = Array.from(new Set(yearCases.map(keyFn).filter(Boolean) as string[])).sort();
    const matrix: Record<string, Record<number, GBVCase[]>> = {};
    for (const r of rows) matrix[r] = {};
    for (const c of yearCases) {
      const key = keyFn(c);
      if (!key || !c.identification_date) continue;
      const m = new Date(c.identification_date).getMonth();
      if (!matrix[key][m]) matrix[key][m] = [];
      matrix[key][m].push(c);
    }
    const max = Math.max(1, ...rows.flatMap(r => Object.values(matrix[r]).map(a => a.length)));
    return { geoRows: rows, geoMatrix: matrix, geoMax: max };
  }, [yearCases, geoLevel]);

  function handleSelect(label: string, selected: GBVCase[]) {
    setSelection(prev => prev?.label === label ? null : { label, cases: selected });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <YearFilterBar availableYears={availableYears} year={year} count={yearCases.length} onYear={y => { setYear(y); setSelection(null); }} />
        <div className="flex items-center gap-3">
          <span className="text-label text-on-surface-variant">Nível:</span>
          <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
            {([["province", "Província"], ["district", "Distrito"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => { setGeoLevel(k); setSelection(null); }}
                className={`px-3 py-1.5 text-label font-medium rounded-md transition-all ${geoLevel === k ? "bg-white text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <GCRCard title={`${geoLevel === "province" ? "Províncias" : "Distritos"} × Mês — ${year}`}>
        <p className="text-caption text-on-surface-variant mb-3">Clique numa célula para ver os casos</p>
        {geoRows.length > 0
          ? <HeatMatrix rowLabel={geoLevel === "province" ? "Província" : "Distrito"} rows={geoRows} matrix={geoMatrix} maxVal={geoMax} year={year} onSelect={handleSelect} />
          : <p className="text-on-surface-variant text-sm py-4 text-center">Sem dados para {year}</p>}
      </GCRCard>
      {selection && <CaseDrillDown selection={selection} onClose={() => setSelection(null)} />}
    </div>
  );
}

