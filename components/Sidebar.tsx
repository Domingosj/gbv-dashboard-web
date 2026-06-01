"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, ClipboardCheck, Bot, Play, TrendingUp, Map, PieChart, PanelLeftClose, PanelLeftOpen, Network, MessageSquareText, Monitor } from "lucide-react";

const NAV = [
  { href: "/summary", label: "Resumo Executivo", icon: PieChart },
  { href: "/strategy", label: "Desempenho", icon: TrendingUp },
  { href: "/cases", label: "Casos", icon: Search },
  { href: "/quality", label: "Qualidade de Dados", icon: ClipboardCheck },
  { href: "/referral-pathways", label: "Vias de Referência", icon: Network },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/carousel", label: "Carrossel", icon: Play },
  { href: "/ai", label: "Assistente IA", icon: Bot },
  { href: "/ai-assistant", label: "Ana (assistant-ui)", icon: MessageSquareText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const active = (href: string) => {
    if (href === "/summary") return pathname === "/summary";
    return pathname.startsWith(href);
  };

  return (
    <aside className={`${collapsed ? "w-16" : "w-56 lg:w-60"} bg-surface-container-lowest border-r border-outline-variant min-h-screen flex flex-col shrink-0 transition-all duration-200`}>
      <div className={`pt-5 pb-6 flex items-center ${collapsed ? "justify-center px-3" : "px-4"}`}>
        {collapsed ? (
          <Image
            src="/gcr-logo.png"
            alt="GCR"
            width={32}
            height={32}
            className="object-contain"
            style={{ objectPosition: "left center" }}
          />
        ) : (
          <Link href="/summary">
            <Image
              src="/gcr-logo.png"
              alt="GCR — Para Todas Raparigas"
              width={180}
              height={48}
              className="object-contain object-left"
              priority
            />
          </Link>
        )}
      </div>

      <nav className="flex-1 px-2 pb-6 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = active(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-label transition-all duration-150 ${collapsed ? "justify-center" : "justify-start"} ${
                isActive ? "text-primary font-semibold bg-primary/10" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`px-3 py-4 border-t border-outline-variant text-body-sm text-on-surface-variant space-y-2 ${collapsed ? "text-center" : "px-5"}`}>
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 hover:text-on-surface transition-colors w-full" title={collapsed ? "Expandir menu" : "Recolher menu"}>
          {collapsed ? <PanelLeftOpen className="w-4 h-4 mx-auto" /> : <><PanelLeftClose className="w-3.5 h-3.5 shrink-0" /> Recolher</>}
        </button>
        {!collapsed && (
          <a href="/tv" className="flex items-center gap-2 hover:text-on-surface transition-colors">
            <Monitor className="w-3.5 h-3.5" /> Modo TV
          </a>
        )}
      </div>
    </aside>
  );
}
