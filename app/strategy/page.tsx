"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import ModuleTabs from "@/components/ModuleTabs";
import FilterBar from "@/components/FilterBar";
import GCRCard from "@/components/ui/GCRCard";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const TABS = [
  { key: "portfolio", label: "Portfólio" },
  { key: "matrix", label: "Matrix Mensal" },
  { key: "partners", label: "Projetos" },
  { key: "geo", label: "Análise Geográfica" },
];

export default function StrategyPage() {
  const [tab, setTab] = useState("portfolio");
  const [provFilter, setProvFilter] = useState("");
  const [timeRange, setTimeRange] = useState("all");
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
      {tab === "matrix" && <MatrixTab cases={filtered} timeRange={timeRange} setTimeRange={setTimeRange} />}
      {tab === "partners" && <PartnersTab cases={filtered} />}
      {tab === "geo" && <GeoTab cases={filtered} />}
    </div>
  );
}

function MatrixTab({ cases, timeRange, setTimeRange }: { cases: GBVCase[]; timeRange: string; setTimeRange: (v: string) => void }) {
  // Build project × month matrix
  const { projects, months, matrix, maxInCol } = useMemo(() => {
    const byProject: Record<string, Record<string, number>> = {};
    let minDate: Date | null = null;
    for (const c of cases) {
      if (!c.identification_date) continue;
      const m = c.identification_date.slice(0, 7);
      const p = c.project || "Sem projeto";
      if (!byProject[p]) byProject[p] = {};
      byProject[p][m] = (byProject[p][m] || 0) + 1;
      const d = new Date(c.identification_date);
      if (!minDate || d < minDate) minDate = d;
    }

    // Collect all months
    const allMonths = new Set<string>();
    for (const p of Object.keys(byProject)) {
      for (const m of Object.keys(byProject[p])) allMonths.add(m);
    }

    // Filter by time range
    let cutoff: Date | null = null;
    if (timeRange !== "all") {
      const now = new Date();
      const ref = new Date(now.getFullYear(), now.getMonth(), 1);
      cutoff = new Date(ref);
      const monthsBack = parseInt(timeRange);
      if (!isNaN(monthsBack)) cutoff.setMonth(cutoff.getMonth() - monthsBack);
    }

    let sortedMonths = Array.from(allMonths).sort();
    if (cutoff) sortedMonths = sortedMonths.filter(m => new Date(m + "-01") >= cutoff!);

    const projects = Object.keys(byProject).sort();
    const matrix = projects.map(p => ({
      project: p,
      cells: sortedMonths.map(m => byProject[p][m] || 0),
      total: sortedMonths.reduce((s, m) => s + (byProject[p][m] || 0), 0),
    })).sort((a, b) => b.total - a.total);

    // Max per column for color scaling
    const maxInCol = sortedMonths.map((_, ci) => Math.max(...matrix.map(r => r.cells[ci]), 1));

    return { projects, months: sortedMonths, matrix, maxInCol };
  }, [cases, timeRange]);

  // Group months by year
  const yearGroups = useMemo(() => {
    const groups: { year: string; cols: string[] }[] = [];
    for (const m of months) {
      const y = m.slice(0, 4);
      const last = groups[groups.length - 1];
      if (last && last.year === y) last.cols.push(m);
      else groups.push({ year: y, cols: [m] });
    }
    return groups;
  }, [months]);

  const totalRow = useMemo(() => {
    if (matrix.length === 0) return null;
    return {
      project: "Total",
      cells: months.map((_, ci) => matrix.reduce((s, r) => s + r.cells[ci], 0)),
      total: matrix.reduce((s, r) => s + r.total, 0),
    };
  }, [matrix, months]);

  const maxTotal = Math.max(...matrix.map(r => r.total), 1);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-section-title text-on-surface">Casos por Projeto por Mês</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 rounded-lg bg-surface border border-stroke" aria-label="Período">
            <SelectValue placeholder="Todos os períodos" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">Todos os períodos</SelectItem>
            <SelectItem value="0" className="rounded-lg">Este mês</SelectItem>
            <SelectItem value="2" className="rounded-lg">Este trimestre</SelectItem>
            <SelectItem value="5" className="rounded-lg">Este semestre</SelectItem>
            <SelectItem value="11" className="rounded-lg">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {matrix.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-stroke bg-surface shadow-card">
          <table className="w-full text-caption">
            {/* Year header row */}
            <thead>
              <tr className="border-b border-stroke">
                <th className="sticky left-0 bg-surface z-10 px-3 py-2 text-left text-label text-on-surface-variant min-w-[160px]">Projeto</th>
                {yearGroups.map(g => (
                  <th key={g.year} colSpan={g.cols.length} className={`px-2 py-2 text-center text-label border-l border-stroke transition-colors ${hoveredCell && g.cols.some((_, ci) => {
                    const globalIdx = yearGroups.slice(0, yearGroups.indexOf(g)).reduce((s, g2) => s + g2.cols.length, 0) + ci;
                    return hoveredCell.col === globalIdx;
                  }) ? "bg-primary/10 text-primary" : "text-on-surface-variant"}`}>{g.year}</th>
                ))}
                <th className="px-3 py-2 text-right text-label text-on-surface-variant border-l border-stroke min-w-[60px]">Total</th>
              </tr>
              {/* Month header row */}
              <tr className="border-b border-stroke bg-surface-container-low">
                <th className="sticky left-0 bg-surface-container-low z-10 px-3 py-2 text-left text-caption text-on-surface-variant font-medium"></th>
                {months.map((m, ci) => (
                  <th key={m} className={`px-2 py-2 text-center text-caption font-medium border-l border-stroke w-14 transition-colors ${hoveredCell?.col === ci ? "bg-primary/10 text-primary" : "text-on-surface-variant"}`}
                    onMouseEnter={() => setHoveredCell(prev => prev ? { ...prev, col: ci } : { row: 0, col: ci })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {{ "01":"Jan","02":"Fev","03":"Mar","04":"Abr","05":"Mai","06":"Jun","07":"Jul","08":"Ago","09":"Set","10":"Out","11":"Nov","12":"Dez" }[m.slice(5, 7)] || m.slice(5, 7)}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-caption text-on-surface-variant font-medium border-l border-stroke"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke">
              {matrix.map((r, ri) => {
                const isRowHovered = hoveredCell?.row === ri;
                const cellLink = (project: string, month: string, count: number) =>
                  count > 0 ? `/cases?project=${encodeURIComponent(project)}&month=${month}` : undefined;
                return (
                  <tr key={r.project} className={`transition-colors ${isRowHovered ? "bg-primary/5" : "hover:bg-surface-container-low"}`}>
                    <td className={`sticky left-0 px-3 py-2 font-medium text-on-surface text-body truncate max-w-[160px] transition-colors ${isRowHovered ? "bg-primary/10" : "bg-surface"}`} title={r.project}>{r.project}</td>
                    {r.cells.map((v, ci) => {
                      const isHovered = hoveredCell?.row === ri && hoveredCell?.col === ci;
                      const isColHovered = hoveredCell?.col === ci;
                      const intensity = maxInCol[ci] > 0 ? v / maxInCol[ci] : 0;
                      const hue = 145 - intensity * 40;
                      const sat = 30 + intensity * 40;
                      const light = isHovered ? 92 - intensity * 30 : 95 - intensity * 35;
                      const link = cellLink(r.project, months[ci], v);
                      return (
                        <td key={ci}
                          className={`px-2 py-2 text-center font-semibold border-l border-stroke cursor-pointer transition-all duration-150 ${isColHovered && !isHovered ? "ring-2 ring-inset ring-primary/20" : ""}`}
                          style={{ backgroundColor: v > 0 ? `hsl(${hue}, ${sat}%, ${light}%)` : undefined }}
                          onMouseEnter={() => setHoveredCell({ row: ri, col: ci })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => link && (window.location.href = link)}
                          title={link ? `${v} casos - ${r.project} (${months[ci]}) - Clique para filtrar` : undefined}
                        >
                          {v > 0 ? v : ""}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2 text-right font-bold border-l border-stroke transition-colors ${isRowHovered ? "bg-primary/5 text-primary" : "text-on-surface"}`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{r.total}</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${145 - (r.total / maxTotal) * 40}, ${30 + (r.total / maxTotal) * 40}%, ${60 - (r.total / maxTotal) * 20}%)` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Total row */}
            {totalRow && (
              <tfoot className="border-t-2 border-stroke bg-surface-container-low">
                <tr>
                  <td className="sticky left-0 bg-surface-container-low z-10 px-3 py-2 font-bold text-on-surface text-body">Total</td>
                  {totalRow.cells.map((v, ci) => {
                    const intensity = maxInCol[ci] > 0 ? v / maxInCol[ci] : 0;
                    return (
                      <td key={ci} className="px-2 py-2 text-center font-bold border-l border-stroke"
                        style={{ backgroundColor: intensity > 0.3 ? `hsl(145, ${30 + intensity * 40}%, ${92 - intensity * 25}%)` : undefined }}>
                        {v}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-bold text-on-surface border-l border-stroke">{totalRow.total}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <p className="text-on-surface-variant text-sm py-8 text-center">Sem dados para o período selecionado</p>
      )}

      <p className="text-caption text-on-surface-variant">
        {matrix.length} projetos · {months.length} meses · {matrix.reduce((s, r) => s + r.total, 0)} casos no total
      </p>
    </div>
  );
}

function PortfolioTab({ cases }: { cases: GBVCase[] }) {
  const projects: Record<string, { total: number; open: number; closed: number; critical: number; districts: Set<string> }> = {};
  for (const c of cases) {
    const p = c.project || "Sem projeto";
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

