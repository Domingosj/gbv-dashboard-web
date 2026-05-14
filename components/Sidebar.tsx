"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, BarChart3, Shield, Bot, Monitor, Play, TrendingUp, Activity, Map, PieChart, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const NAV = [
  { href: "/summary", label: "Resumo Executivo", icon: PieChart },
  { href: "/operations", label: "Operações", icon: Activity },
  { href: "/strategy", label: "Desempenho", icon: TrendingUp },
  { href: "/cases", label: "Casos", icon: Search },
  { href: "/analytics", label: "Análises", icon: BarChart3 },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/carousel", label: "Carrossel", icon: Play },
  { href: "/ai", label: "Assistente IA", icon: Bot },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const active = (href: string) => {
    if (href === "/summary") return pathname === "/summary";
    return pathname.startsWith(href);
  };

  return (
    <aside className={`${collapsed ? "w-16" : "w-56 lg:w-60"} bg-surface border-r border-border min-h-screen flex flex-col shrink-0 transition-all duration-200`}>
      <div className={`px-3 pt-6 pb-8 ${collapsed ? "text-center" : "px-5"}`}>
        {collapsed ? (
          <Shield className="w-6 h-6 text-primary mx-auto" />
        ) : (
          <>
            <h1 className="text-lg font-bold text-primary flex items-center gap-2.5">
              <Shield className="w-5 h-5" />
              GCR Dashboard
            </h1>
            <p className="text-caption text-text-secondary mt-1.5">Gestão de Casos VBG</p>
          </>
        )}
      </div>

      <nav className="flex-1 px-2 pb-6 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = active(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-button text-label transition-all duration-150 ${collapsed ? "justify-center" : "justify-start"} ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-gray-50"
              }`}
              style={isActive ? { backgroundColor: "rgba(37,107,90,0.08)" } : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`px-3 py-4 border-t border-border text-caption text-text-secondary space-y-2 ${collapsed ? "text-center" : "px-5"}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 hover:text-primary transition-colors w-full"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4 mx-auto" /> : <><PanelLeftClose className="w-3.5 h-3.5 shrink-0" /> Recolher</>}
        </button>
        {!collapsed && (
          <>
            <a href="/tv" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Monitor className="w-3.5 h-3.5" />
              Modo TV
            </a>
          </>
        )}
      </div>
    </aside>
  );
}
