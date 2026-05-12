"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import CaseTable from "@/components/CaseTable";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CasesPage() {
  const { data: allCases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });

  if (error) return <div className="text-error">Erro: {error.message}</div>;
  if (!allCases) return <div className="text-text-secondary">Carregando...</div>;

  return (
    <div>
      <h1 className="font-display text-section-title text-text-primary mb-8">
        🔍 Explorador de Casos
      </h1>

      <p className="text-small text-text-secondary mb-5">📊 {allCases.length} casos no total</p>

      <div className="genesis-card p-5">
        <CaseTable cases={allCases} />
      </div>
    </div>
  );
}
