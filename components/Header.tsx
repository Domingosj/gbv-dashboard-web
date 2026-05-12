"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, MessageSquare, ChevronRight, Sun } from "lucide-react";

const ROUTE_LABELS: Record<string, string[]> = {
  "/daily-operations": ["Operacional", "Operações Diárias"],
  "/workload": ["Operacional", "Carga de Trabalho"],
  "/risk-safety": ["Operacional", "Risco e Segurança"],
  "/case-progress": ["Operacional", "Progresso dos Casos"],
  "/priority-list": ["Casos", "Lista Prioritária"],
  "/cases": ["Casos", "Explorador de Casos"],
  "/referral-assistant": ["Casos", "Assistente de Referência"],
  "/data-quality": ["Análise", "Qualidade de Dados"],
  "/referral-pathways": ["Análise", "Vias de Referência"],
  "/map": ["Análise", "Mapa Geográfico"],
  "/trends": ["Análise", "Tendências"],
  "/partners": ["Análise", "Parceiros"],
  "/summary": ["Estratégia", "Resumo Executivo"],
  "/portfolio": ["Estratégia", "Portfólio"],
  "/strategic-analysis": ["Estratégia", "Análise Estratégica"],
};

export default function Header() {
  const pathname = usePathname();
  const crumbs = ROUTE_LABELS[pathname] || ["Painel"];

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-surface border-b border-stroke px-6 py-4">
      {/* Navegação */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-body font-medium">Painel</span>
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-bodydark2" />
            <span className={i === crumbs.length - 1 ? "text-primary font-semibold" : "text-body"}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Acções */}
      <div className="flex items-center gap-3">
        {/* Pesquisa */}
        <div className="hidden md:flex items-center gap-2 bg-background rounded-sm px-3 py-2 border border-stroke w-64">
          <Search className="w-4 h-4 text-bodydark2" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="bg-transparent text-sm text-text-primary placeholder:text-bodydark2 outline-none w-full"
          />
        </div>

        {/* Tema */}
        <button className="w-9 h-9 flex items-center justify-center rounded-full border border-stroke text-body hover:text-primary hover:border-primary transition-colors">
          <Sun className="w-4 h-4" />
        </button>

        {/* Notificações */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full border border-stroke text-body hover:text-primary hover:border-primary transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Mensagens */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full border border-stroke text-body hover:text-primary hover:border-primary transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            5
          </span>
        </button>

        {/* Separador */}
        <div className="h-8 w-px bg-stroke mx-1" />

        {/* Utilizador */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-semibold text-text-primary">Domingos J.</p>
            <p className="text-xs text-body">Coordenador</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">DJ</span>
          </div>
        </div>
      </div>
    </header>
  );
}
