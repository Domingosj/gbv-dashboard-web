"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, AlertTriangle, BarChart3, Search,
  FolderKanban, Activity, Users, Shield,
  Map, TrendingUp, CheckCircle, FileText,
  Briefcase, Target, PieChart,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Operacional",
    items: [
      { href: "/daily-operations", label: "Operações Diárias", icon: LayoutDashboard },
      { href: "/workload", label: "Carga de Trabalho", icon: Activity },
      { href: "/risk-safety", label: "Risco e Segurança", icon: AlertTriangle },
      { href: "/case-progress", label: "Progresso dos Casos", icon: CheckCircle },
    ],
  },
  {
    label: "Casos",
    items: [
      { href: "/priority-list", label: "Lista Prioritária", icon: Target },
      { href: "/cases", label: "Explorador de Casos", icon: Search },
      { href: "/referral-assistant", label: "Assistente de Referência", icon: Users },
    ],
  },
  {
    label: "Análise",
    items: [
      { href: "/data-quality", label: "Qualidade de Dados", icon: BarChart3 },
      { href: "/referral-pathways", label: "Vias de Referência", icon: FolderKanban },
      { href: "/map", label: "Mapa Geográfico", icon: Map },
      { href: "/trends", label: "Tendências", icon: TrendingUp },
      { href: "/partners", label: "Parceiros", icon: Briefcase },
    ],
  },
  {
    label: "Estratégia",
    items: [
      { href: "/summary", label: "Resumo Executivo", icon: PieChart },
      { href: "/portfolio", label: "Portfólio", icon: FileText },
      { href: "/strategic-analysis", label: "Análise Estratégica", icon: TrendingUp },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 lg:w-72 bg-boxdark-2 text-bodydark1 min-h-screen flex flex-col shrink-0 z-50">
      <div className="px-6 py-8 flex items-center justify-between border-b border-[#2E3A47]">
        <Link href="/" className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold text-white tracking-tight">
            GCR <span className="text-primary">Dashboard</span>
          </h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[12px] font-semibold text-bodydark2 uppercase tracking-[1px] px-4 mb-3">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-sm text-[15px] font-medium transition-all duration-200 ${
                      active
                        ? "bg-[#333A48] text-white"
                        : "text-bodydark1 hover:bg-[#333A48] hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : "text-bodydark2 group-hover:text-primary"}`} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
