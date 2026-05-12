"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { calcStats } from "@/lib/risk-calculator";
import CaseCard from "@/components/CaseCard";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function UrgentPage() {
  const { data: cases, error } = useSWR<GBVCase[]>("/api/cases?filter=open", fetcher, { refreshInterval: 300000 });

  if (error) return <div className="text-red-500">Erro: {error.message}</div>;
  if (!cases) return <div className="text-gray-400">Carregando...</div>;

  const stats = calcStats(cases);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-red-500 pb-2 mb-6">
        🚨 Casos Urgentes — Ação Imediata
      </h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          <p className="text-sm text-red-700">🔴 Crítico</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
          <p className="text-sm text-orange-700">🟠 Alto</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.no_ref}</p>
          <p className="text-sm text-yellow-700">⚠️ Sem Ref</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.delayed}</p>
          <p className="text-sm text-red-700">⏰ &gt;30d</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cases.slice(0, 10).map((c, i) => (
          <CaseCard key={c.case_id || i} case={c} index={i + 1} />
        ))}
      </div>

      {cases.length === 0 && (
        <div className="bg-green-50 text-green-700 p-8 rounded-xl text-center text-lg">
          ✅ Nenhum caso urgente!
        </div>
      )}
    </div>
  );
}
