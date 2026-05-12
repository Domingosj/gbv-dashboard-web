"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import CaseTable from "@/components/CaseTable";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CasesPage() {
  const { data: allCases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });

  if (error) return <div className="text-red-500">Erro: {error.message}</div>;
  if (!allCases) return <div className="text-gray-400">Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-2 mb-6">
        🔍 Explorador de Casos
      </h1>

      <p className="text-sm text-gray-500 mb-4">📊 {allCases.length} casos no total</p>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <CaseTable cases={allCases} />
      </div>
    </div>
  );
}
