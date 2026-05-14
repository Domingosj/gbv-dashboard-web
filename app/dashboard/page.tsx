"use client";

import useSWR from "swr";
import { GBVCase } from "@/lib/types";
import { DashboardCarousel } from "@/components/ui/DashboardCarousel";
import { DailyOperationsPanel } from "@/components/DashboardPanels/DailyOperationsPanel";
import { RiskAssessmentPanel } from "@/components/DashboardPanels/RiskAssessmentPanel";
import { DistributionPanel } from "@/components/DashboardPanels/DistributionPanel";
import { GeographicPanel } from "@/components/DashboardPanels/GeographicPanel";
import { ReferralPanel } from "@/components/DashboardPanels/ReferralPanel";
import { CaseProgressPanel } from "@/components/DashboardPanels/CaseProgressPanel";
import { AnalysisPanel } from "@/components/DashboardPanels/AnalysisPanel";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DashboardPage() {
  const { data: cases } = useSWR<GBVCase[]>("/api/cases", fetcher, {
    refreshInterval: 300000,
  });

  if (!cases) {
    return <p className="text-text-secondary p-8">Carregando...</p>;
  }

  const dashboardPanels = [
    <DailyOperationsPanel key="daily" cases={cases} />,
    <RiskAssessmentPanel key="risk" cases={cases} />,
    <DistributionPanel key="distribution" cases={cases} />,
    <GeographicPanel key="geographic" cases={cases} />,
    <ReferralPanel key="referral" cases={cases} />,
    <CaseProgressPanel key="progress" cases={cases} />,
    <AnalysisPanel key="analysis" cases={cases} />,
  ];

  const panelTitles = [
    "📊 Operações Diárias",
    "🚨 Avaliação de Risco",
    "📈 Distribuição de Casos",
    "🗺️ Cobertura Geográfica",
    "📤 Vias de Referência",
    "✅ Progresso dos Casos",
    "📊 Todas as Análises",
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Painel de Controle GBV</h1>
          <p className="text-text-secondary mt-2">
            Navegue pelos indicadores de risco e progresso dos casos
          </p>
        </div>

        <DashboardCarousel
          titles={panelTitles}
          autoplay={false}
          interval={8000}
        >
          {dashboardPanels}
        </DashboardCarousel>
      </div>
    </div>
  );
}
