"use client";

import { useState, useMemo } from "react";
import { GBVCase } from "@/lib/types";
import { fmtViolence, calculateDaysSinceReferral } from "@/lib/risk-calculator";
import { GCRTable, GCRTHead, GCRTBody, GCRTRow, GCRTCell } from "@/components/ui/GCRTable";
import GCRBadge from "@/components/ui/GCRBadge";

interface Props { cases: GBVCase[] }

export default function CaseTable({ cases }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof GBVCase>("final_priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let r = [...cases];
    if (statusFilter !== "all") r = r.filter(c => c.case_status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(c => [c.case_id, c.district, c.case_manager, c.project].some(v => (v || "").toLowerCase().includes(q)));
    }
    r.sort((a, b) => {
      const av = a[sortField] ?? "", bv = b[sortField] ?? "";
      if (typeof av === "number" && typeof bv === "number") return sortDir === "desc" ? bv - av : av - bv;
      return sortDir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
    return r;
  }, [cases, search, statusFilter, sortField, sortDir]);

  const toggleSort = (f: keyof GBVCase) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
  };

  const SH = ({ field, children }: { field: keyof GBVCase; children: React.ReactNode }) => (
    <GCRTCell isHeader className="cursor-pointer hover:text-text-primary" onClick={() => toggleSort(field)}>
      {children} {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </GCRTCell>
  );

  return (
    <div>
      <div className="flex gap-4 mb-5">
        <input
          type="text"
          placeholder="Buscar por ID, distrito, gestor, projeto..."
          className="genesis-input flex-1"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="genesis-input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="Aberto">Abertos</option>
          <option value="Encerrado">Encerrados</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-card border border-border">
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
              <SH field="case_status">Status</SH>
              <SH field="risk_score">Score</SH>
            </GCRTRow>
          </GCRTHead>
          <GCRTBody>
            {filtered.slice(0, 100).map((c, i) => (
              <GCRTRow key={c.case_id || i}>
                <GCRTCell>{c.priority_icon || "⚪"}</GCRTCell>
                <GCRTCell className="font-mono text-caption">
                  <a href={`/cases/${encodeURIComponent(c.case_id || "")}`} className="text-primary hover:underline">
                    {c.case_id?.slice(0, 20)}
                  </a>
                </GCRTCell>
                <GCRTCell>{c.district || "N/A"}</GCRTCell>
                <GCRTCell>{fmtViolence(c.violence_type)}</GCRTCell>
                <GCRTCell>{c.age_group || "N/A"}</GCRTCell>
                <GCRTCell>{c.project || "N/A"}</GCRTCell>
                <GCRTCell>{c.case_manager || "N/A"}</GCRTCell>
                <GCRTCell>
                  <GCRBadge color={c.case_status === "Aberto" ? "green" : "grey"}>{c.case_status || "N/A"}</GCRBadge>
                </GCRTCell>
                <GCRTCell className="font-semibold">{c.risk_score || 0}</GCRTCell>
              </GCRTRow>
            ))}
          </GCRTBody>
        </GCRTable>
      </div>

      {filtered.length > 100 && (
        <p className="text-caption text-text-secondary mt-3">Mostrando 100 de {filtered.length} casos</p>
      )}
      {filtered.length === 0 && (
        <p className="text-center text-text-secondary py-12">Nenhum caso encontrado</p>
      )}
    </div>
  );
}
