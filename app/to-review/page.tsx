"use client";

export default function ToReviewPage() {
  const sections = [
    {
      title: "Conteúdo para Revisão",
      color: "border-warning/40 bg-warning/5",
      badge: "bg-warning/10 text-warning",
      items: [
        {
          href: "/strategy",
          label: "Desempenho dos Projectos",
          desc: "Portfólio, Matrix Mensal, Projetos, Análise Geográfica — conteúdo sobrepõe-se com Resumo Executivo (Página 1) e Cobertura Geográfica (Página 2). Necessita revisão para eliminar redundâncias.",
        },
        {
          href: "/dashboard",
          label: "Painel Completo (Carrossel Interno)",
          desc: "Vista em carrossel com todos os painéis: Operações Diárias, Risco, Distribuição, Geográfico, Referências, Progresso. Conteúdo duplicado em múltiplas páginas do novo sistema. Preservado como vista de referência.",
        },
        {
          href: "/referral-assistant",
          label: "Assistente de Referência",
          desc: "Necessidades de serviço por distrito e cobertura de serviços. Sobrepõe-se com a página Serviços e Referências (Página 6). Rever se deve ser integrado ou mantido separado.",
        },
      ],
    },
    {
      title: "Possíveis Duplicações Identificadas",
      color: "border-info/40 bg-info/5",
      badge: "bg-info/10 text-info",
      items: [
        {
          href: null,
          label: "Distribuição por Sexo",
          desc: "Aparece em: Resumo Executivo (KPI card), Perfil e Tipologia (detalhado), AnalysisPanel no Painel Completo.",
        },
        {
          href: null,
          label: "Casos por Província",
          desc: "Aparece em: Resumo Executivo (gráfico de barras + tabela de distritos), Cobertura Geográfica (mapa + lista), Desempenho (Análise Geográfica), GeographicPanel no Painel Completo.",
        },
        {
          href: null,
          label: "Tipo de Violência",
          desc: "Aparece em: Resumo Executivo (Registados por Tipo), Perfil e Tipologia (detalhado + cross-tabs), DistributionPanel, Desempenho (Portfólio).",
        },
        {
          href: null,
          label: "Cobertura de Referências",
          desc: "Aparece em: Resumo Executivo (Referenciados por Tipo), Serviços e Referências (detalhado), Assistente de Referência, ReferralPanel no Painel Completo.",
        },
        {
          href: null,
          label: "Casos Críticos / Prioritários",
          desc: "Aparece em: Resumo Executivo (alertas), Risco e Prioridade (página dedicada), Casos (tab Prioritários), RiskAssessmentPanel no Painel Completo.",
        },
        {
          href: null,
          label: "Motivos de Encerramento",
          desc: "Aparece em: Resumo Executivo (Encerrados por Motivo), Encerramento e Resultados (página dedicada), AnalysisPanel no Painel Completo.",
        },
      ],
    },
    {
      title: "Conteúdo Sensível — Rever Acesso",
      color: "border-critical/40 bg-critical/5",
      badge: "bg-critical/10 text-critical",
      items: [
        {
          href: "/dashboard",
          label: "RiskAssessmentPanel — Lista de Casos Abertos",
          desc: "O painel exibe case_id e detalhes individuais de casos abertos na tabela 'Detalhes dos Casos Abertos'. Considerar remover da vista geral ou restringir acesso.",
        },
        {
          href: "/dashboard",
          label: "CaseProgressPanel — Cartões de Casos",
          desc: "Exibe case_id, distrito e tipo de violência em cartões individuais. Não deve aparecer em páginas de acesso geral.",
        },
        {
          href: "/cases",
          label: "Explorador de Casos — Tabela Completa",
          desc: "A tab Explorador mostra todos os campos de cada caso incluindo case_id. Manter apenas em secções de uso operacional restrito.",
        },
        {
          href: "/priority-list",
          label: "Lista Prioritária — Tabela Detalhada",
          desc: "Mostra case_id, gestor, distrito e nível de risco em formato de lista paginada. Confirmar se esta vista deve ser restrita.",
        },
      ],
    },
    {
      title: "Análises em Falta — Adicionar na Próxima Fase",
      color: "border-outline-variant bg-surface-container-low",
      badge: "bg-surface-container text-on-surface-variant",
      items: [
        {
          href: null,
          label: "Fonte de Identificação dos Casos",
          desc: "Não existe actualmente uma visualização dedicada à fonte/origem de identificação dos casos (ex: comunidade, serviço de saúde, polícia). Seria útil na Página 1 e Página 2.",
        },
        {
          href: null,
          label: "Tempo Médio desde Identificação (abertos)",
          desc: "Falta indicador de tempo médio que um caso aberto está sem encerramento. Útil na Página 4 (Gestão de Casos) e Página 5 (Risco).",
        },
        {
          href: null,
          label: "Tendência: Abertos vs Encerrados por Mês",
          desc: "Existe na Página 7 (Encerramento) mas poderia também constar na Página 1 como indicador de desempenho macro.",
        },
        {
          href: null,
          label: "Serviços por Tipo de Incidente",
          desc: "Cross-tab entre serviço recebido e tipo de incidente (ex: violência sexual → referência médica/psicossocial). Falta na Página 6.",
        },
        {
          href: null,
          label: "Cobertura Geográfica de Serviços vs Casos",
          desc: "Mapa sobreposto de casos e serviços disponíveis por distrito. Falta na Página 2 para identificar gaps de cobertura.",
        },
      ],
    },
  ];

  return (
    <div>
      <h1 className="text-page-title text-on-surface mb-1">Para Revisão</h1>
      <p className="text-body text-on-surface-variant mb-6">
        Inventário de conteúdo duplicado, sensível ou em falta. Nenhum conteúdo foi eliminado — use esta página para orientar a revisão e consolidação na próxima fase.
      </p>

      <div className="space-y-6">
        {sections.map(({ title, color, badge, items }) => (
          <div key={title} className={`rounded-xl border p-5 ${color}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-caption font-semibold px-2.5 py-1 rounded-full ${badge}`}>{title}</span>
            </div>
            <div className="space-y-3">
              {items.map(({ href, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-white/60 border border-outline-variant/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {href ? (
                        <a href={href} className="text-body font-semibold text-primary hover:underline">{label}</a>
                      ) : (
                        <span className="text-body font-semibold text-on-surface">{label}</span>
                      )}
                    </div>
                    <p className="text-caption text-on-surface-variant">{desc}</p>
                  </div>
                  {href && (
                    <a href={href} className="shrink-0 text-caption text-primary hover:underline whitespace-nowrap">Ver página →</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
