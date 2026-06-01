"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import ModuleTabs from "@/components/ModuleTabs";
import FilterBar from "@/components/FilterBar";
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
  { key: "location", label: "Análise Geográfica" },
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
      {tab === "location" && <LocationTab cases={filtered} />}
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

function LocationTab({ cases }: { cases: GBVCase[] }) {
  const rows = useMemo(() => {
    const groups: Record<string, { project: string; province: string; district: string; total: number; open: number; closed: number; critical: number }> = {};
    for (const c of cases) {
      if (!c.province && !c.district) continue;
      const key = `${c.project || "Sem projeto"}||${c.province || "Sem província"}||${c.district || "Sem distrito"}`;
      if (!groups[key]) groups[key] = { project: c.project || "Sem projeto", province: c.province || "Sem província", district: c.district || "Sem distrito", total: 0, open: 0, closed: 0, critical: 0 };
      groups[key].total++;
      if (c.case_status === "Aberto") groups[key].open++;
      if (c.case_status === "Encerrado") groups[key].closed++;
      if (c.priority_level === "CRÍTICO") groups[key].critical++;
    }
    return Object.values(groups)
      .map(g => ({ ...g, closeRate: g.total ? ((g.closed / g.total) * 100).toFixed(1) : "0" }))
      .sort((a, b) => b.total - a.total);
  }, [cases]);

  if (rows.length === 0) return <p className="text-on-surface-variant text-sm py-8 text-center">Sem dados de localização</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body">
        <thead className="bg-surface-container-low border-b border-outline-variant">
          <tr>
            <th className="text-left px-4 py-3 text-label text-on-surface-variant">Projeto</th>
            <th className="text-left px-4 py-3 text-label text-on-surface-variant">Província</th>
            <th className="text-left px-4 py-3 text-label text-on-surface-variant">Distrito</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Total</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Abertos</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Encerrados</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Tx Encerramento</th>
            <th className="text-right px-4 py-3 text-label text-on-surface-variant">Críticos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-surface-container-low">
              <td className="px-4 py-3 font-medium">{r.project}</td>
              <td className="px-4 py-3 text-on-surface-variant">{r.province}</td>
              <td className="px-4 py-3 text-on-surface-variant">{r.district}</td>
              <td className="px-4 py-3 text-right">{r.total}</td>
              <td className="px-4 py-3 text-right">{r.open}</td>
              <td className="px-4 py-3 text-right">{r.closed}</td>
              <td className="px-4 py-3 text-right font-semibold">{r.closeRate}%</td>
              <td className={`px-4 py-3 text-right ${r.critical > 0 ? "text-critical font-semibold" : ""}`}>{r.critical}</td>
            </tr>
          ))}
        </tbody>
      </table>
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


