"use client";

import { useState, useMemo } from "react";
import { GBVCase } from "@/lib/types";
import { fmtViolence, calculateDaysSinceReferral } from "@/lib/risk-calculator";

interface Props {
  cases: GBVCase[];
}

export default function CaseTable({ cases }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof GBVCase>("final_priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = [...cases];

    if (statusFilter !== "all") {
      result = result.filter(c => c.case_status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.case_id || "").toLowerCase().includes(q) ||
        (c.district || "").toLowerCase().includes(q) ||
        (c.case_manager || "").toLowerCase().includes(q) ||
        (c.project || "").toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "desc" ? bv - av : av - bv;
      }
      return sortDir === "desc"
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv));
    });

    return result;
  }, [cases, search, statusFilter, sortField, sortDir]);

  const toggleSort = (field: keyof GBVCase) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortHeader = ({ field, children }: { field: keyof GBVCase; children: React.ReactNode }) => (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
        onClick={() => toggleSort(field)}>
      {children} {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por ID, distrito, gestor, projeto..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="Aberto">Abertos</option>
          <option value="Encerrado">Encerrados</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <SortHeader field="priority_icon">Prior.</SortHeader>
              <SortHeader field="case_id">ID</SortHeader>
              <SortHeader field="district">Distrito</SortHeader>
              <SortHeader field="violence_type">Violência</SortHeader>
              <SortHeader field="age_group">Idade</SortHeader>
              <SortHeader field="project">Projeto</SortHeader>
              <SortHeader field="case_manager">Gestor</SortHeader>
              <SortHeader field="case_status">Status</SortHeader>
              <SortHeader field="risk_score">Score</SortHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.slice(0, 100).map((c, i) => (
              <tr key={c.case_id || i} className="hover:bg-gray-50">
                <td className="px-3 py-2">{c.priority_icon || "⚪"}</td>
                <td className="px-3 py-2 font-mono text-xs">{c.case_id?.slice(0, 20)}</td>
                <td className="px-3 py-2">{c.district || "N/A"}</td>
                <td className="px-3 py-2">{fmtViolence(c.violence_type)}</td>
                <td className="px-3 py-2">{c.age_group || "N/A"}</td>
                <td className="px-3 py-2">{c.project || "N/A"}</td>
                <td className="px-3 py-2">{c.case_manager || "N/A"}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.case_status === "Aberto" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {c.case_status || "N/A"}
                  </span>
                </td>
                <td className="px-3 py-2">{c.risk_score || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 100 && (
        <p className="text-xs text-gray-400 mt-2">Mostrando 100 de {filtered.length} casos</p>
      )}
      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">Nenhum caso encontrado</p>
      )}
    </div>
  );
}
