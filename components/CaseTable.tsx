"use client";

import { useState, useMemo } from "react";
import { GBVCase } from "@/lib/types";
import { fmtViolence } from "@/lib/risk-calculator";
import { GCRTable, GCRTHead, GCRTBody, GCRTRow, GCRTCell } from "@/components/ui/GCRTable";
import GCRBadge from "@/components/ui/GCRBadge";

interface Props { cases: GBVCase[] }

export default function CaseTable({ cases }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof GBVCase>("final_priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const perPage = 25;

  const filtered = useMemo(() => {
    let r = [...cases];
    if (statusFilter !== "all") r = r.filter(c => c.case_status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(c => [c.case_id, c.district, c.case_manager, c.project, c.violence_type].some(v => (v || "").toLowerCase().includes(q)));
    }
    r.sort((a, b) => {
      const av = a[sortField] ?? "", bv = b[sortField] ?? "";
      if (typeof av === "number" && typeof bv === "number") return sortDir === "desc" ? bv - av : av - bv;
      return sortDir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
    return r;
  }, [cases, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const toggleSort = (f: keyof GBVCase) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
    setPage(0);
  };

  const SH = ({ field, children }: { field: keyof GBVCase; children: React.ReactNode }) => (
    <GCRTCell isHeader className="cursor-pointer hover:text-on-surface" onClick={() => toggleSort(field)}>
      {children} {sortField === field ? (sortDir === "asc" ? "\u2191" : "\u2193") : ""}
    </GCRTCell>
  );

  return (
    <div>
      <div className="flex gap-4 mb-5">
        <input type="text" placeholder="Buscar por ID, distrito, gestor, projeto, tipo..." className="gcr-input flex-1" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <select className="gcr-input w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="all">Todos os estados</option>
          <option value="Aberto">Abertos</option>
          <option value="Encerrado">Encerrados</option>
        </select>
        <span className="text-label text-on-surface-variant self-center whitespace-nowrap">{filtered.length} casos</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-outline-variant">
        <GCRTable>
          <GCRTHead>
            <GCRTRow>
              <SH field="priority_icon">Prior.</SH>
              <SH field="case_id">ID</SH>
              <SH field="district">Distrito</SH>
              <SH field="violence_type">Violência</SH>
              <SH field="age_group">Idade</SH>
              <SH field="project">Projeto</SH>
              <SH field="case_manager">Gestor</SH>
              <SH field="case_status">Estado</SH>
              <SH field="risk_score">Risco</SH>
            </GCRTRow>
          </GCRTHead>
          <GCRTBody>
            {paged.map((c, i) => (
              <GCRTRow key={c.case_id || i}>
                <GCRTCell>{c.priority_icon || "\u2013"}</GCRTCell>
                <GCRTCell className="font-mono text-caption">
                  <a href={`/cases/${c.record_id || encodeURIComponent(c.case_id || "")}`} className="text-primary hover:underline font-semibold">{c.case_id?.slice(0, 22)}</a>
                </GCRTCell>
                <GCRTCell>{c.district || "N/A"}</GCRTCell>
                <GCRTCell className="max-w-[160px] truncate">{fmtViolence(c.violence_type)}</GCRTCell>
                <GCRTCell>{c.age_group || "N/A"}</GCRTCell>
                <GCRTCell className="max-w-[120px] truncate">{c.project || "N/A"}</GCRTCell>
                <GCRTCell className="max-w-[120px] truncate">{c.case_manager || "N/A"}</GCRTCell>
                <GCRTCell><GCRBadge color={c.case_status === "Aberto" ? "green" : "grey"}>{c.case_status || "N/A"}</GCRBadge></GCRTCell>
                <GCRTCell className="font-semibold">{c.risk_score || 0}</GCRTCell>
              </GCRTRow>
            ))}
          </GCRTBody>
        </GCRTable>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-caption text-on-surface-variant">Mostrando {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} de {filtered.length}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 rounded-md text-sm bg-surface-container text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40">Anterior</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 3, totalPages - 7));
              const p = start + i;
              if (p >= totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-md text-sm ${p === page ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>{p + 1}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 rounded-md text-sm bg-surface-container text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40">Seguinte</button>
          </div>
        </div>
      )}
    </div>
  );
}
