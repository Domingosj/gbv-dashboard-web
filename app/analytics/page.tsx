"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { SimpleBarChart } from "@/components/Charts";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AnalyticsPage() {
  const { data: cases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });

  if (error) return <div className="text-red-500">Erro: {error.message}</div>;
  if (!cases) return <div className="text-gray-400">Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-600 pb-2 mb-6">
        👥 Análise Demográfica
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">📊 Por Idade</h2>
          <SimpleBarChart cases={cases} field="age_group" title="Idade" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">⚥ Por Género</h2>
          <SimpleBarChart cases={cases} field="sex" title="Género" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">💑 Estado Civil</h2>
          <SimpleBarChart cases={cases} field="marital_status" title="Estado Civil" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">📍 Por Província</h2>
          <SimpleBarChart cases={cases} field="province" title="Província" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">📂 Por Projeto</h2>
          <SimpleBarChart cases={cases} field="project" title="Projeto" />
        </div>
      </div>
    </div>
  );
}
