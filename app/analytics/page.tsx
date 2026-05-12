"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { SimpleBarChart } from "@/components/Charts";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AnalyticsPage() {
  const { data: cases, error } = useSWR<GBVCase[]>("/api/cases", fetcher, { refreshInterval: 300000 });

  if (error) return <div className="text-error">Erro: {error.message}</div>;
  if (!cases) return <div className="text-text-secondary">Carregando...</div>;

  return (
    <div>
      <h1 className="font-display text-section-title text-text-primary mb-8">
        👥 Análise Demográfica
      </h1>

      <div className="grid grid-cols-3 gap-6">
        {[
          { title: "📊 Por Idade", field: "age_group" as const },
          { title: "⚥ Por Género", field: "sex" as const },
          { title: "💑 Estado Civil", field: "marital_status" as const },
        ].map(({ title, field }) => (
          <div key={field} className="genesis-card p-5">
            <h2 className="font-display text-subhead text-text-primary mb-5">{title}</h2>
            <SimpleBarChart cases={cases} field={field} title={title} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        {[
          { title: "📍 Por Província", field: "province" as const },
          { title: "📂 Por Projeto", field: "project" as const },
        ].map(({ title, field }) => (
          <div key={field} className="genesis-card p-5">
            <h2 className="font-display text-subhead text-text-primary mb-5">{title}</h2>
            <SimpleBarChart cases={cases} field={field} title={title} />
          </div>
        ))}
      </div>
    </div>
  );
}
