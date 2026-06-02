"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  PieChart, Map, Users, FolderOpen, ShieldAlert, Network,
  CheckCircle2, ClipboardCheck, Bot, Play, TrendingUp, Monitor,
  HeartHandshake, UsersRound, ChevronDown, ChevronRight,
  PanelLeftClose, PanelLeftOpen, AlertCircle,
} from "lucide-react";

const MAIN_NAV = [
  { href: "/summary", label: "Resumo Executivo", icon: PieChart, number: "1" },
  { href: "/map", label: "Cobertura Geográfica", icon: Map, number: "2" },
  { href: "/survivor-profile", label: "Perfil e Tipologia", icon: Users, number: "3" },
  { href: "/cases", label: "Gestão de Casos", icon: FolderOpen, number: "4" },
  { href: "/priority-list", label: "Risco e Prioridade", icon: ShieldAlert, number: "5" },
  { href: "/referral-pathways", label: "Serviços e Referências", icon: Network, number: "6" },
  { href: "/closure", label: "Encerramento e Resultados", icon: CheckCircle2, number: "7" },
  { href: "/quality", label: "Qualidade de Dados", icon: ClipboardCheck, number: "8" },
];

const TOOLS_NAV = [
  { href: "/ai", label: "Assistente IA", icon: Bot },
  { href: "/carousel", label: "Carrossel / TV", icon: Play },
];

const REVIEW_NAV = [
  { href: "/strategy", label: "Desempenho Projectos", icon: TrendingUp },
  { href: "/dashboard", label: "Painel Completo", icon: Monitor },
  { href: "/referral-assistant", label: "Assist. Referência", icon: HeartHandshake },
  { href: "/team", label: "Carga Equipa (Fase 2)", icon: UsersRound },
  { href: "/to-review", label: "Duplicados / Revisão", icon: AlertCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/summary") return pathname === "/summary";
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-label transition-all duration-150 ${collapsed ? "justify-center" : "justify-start"} ${
      isActive(href) ? "text-primary font-semibold bg-primary/10" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
    }`;

  return (
    <aside className={`${collapsed ? "w-16" : "w-60 lg:w-64"} bg-surface-container-lowest border-r border-outline-variant min-h-screen flex flex-col shrink-0 transition-all duration-200`}>
      {/* Logo */}
      <div className={`pt-5 pb-5 flex items-center ${collapsed ? "justify-center px-3" : "px-4"}`}>
        {collapsed ? (
          <Image src="/gcr-logo.png" alt="GCR" width={32} height={32} className="object-contain" />
        ) : (
          <Link href="/summary">
            <Image src="/gcr-logo.png" alt="GCR — Para Todas Raparigas" width={180} height={48} className="object-contain object-left" priority />
          </Link>
        )}
      </div>

      <nav className="flex-1 px-2 pb-6 space-y-0.5 overflow-y-auto">
        {/* Section label */}
        {!collapsed && (
          <p className="px-3 pt-1 pb-1.5 text-caption font-semibold uppercase tracking-wider text-on-surface-variant/60">
            Análise
          </p>
        )}

        {MAIN_NAV.map(({ href, label, icon: Icon, number }) => (
          <Link
            key={href}
            href={href}
            className={linkClass(href)}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <span className="truncate flex-1">{label}</span>
            )}
            {!collapsed && (
              <span className={`text-caption w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isActive(href) ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                {number}
              </span>
            )}
          </Link>
        ))}

        {/* Tools section */}
        {!collapsed && (
          <p className="px-3 pt-4 pb-1.5 text-caption font-semibold uppercase tracking-wider text-on-surface-variant/60">
            Ferramentas
          </p>
        )}
        {collapsed && <div className="h-3" />}

        {TOOLS_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={linkClass(href)}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        ))}

        {/* Para Revisão (collapsible) */}
        {!collapsed && (
          <>
            <button
              onClick={() => setReviewOpen(!reviewOpen)}
              className="w-full flex items-center justify-between px-3 pt-4 pb-1.5 text-caption font-semibold uppercase tracking-wider text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
            >
              <span>Para Revisão</span>
              {reviewOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {reviewOpen && REVIEW_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={linkClass(href)}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </>
        )}

        {/* Collapsed: just show review icons when open */}
        {collapsed && (
          <>
            <div className="h-3" />
            {REVIEW_NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)} title={label}>
                <Icon className="w-5 h-5 shrink-0" />
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={`px-3 py-4 border-t border-outline-variant text-body-sm text-on-surface-variant space-y-2 ${collapsed ? "text-center" : "px-4"}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 hover:text-on-surface transition-colors w-full"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed
            ? <PanelLeftOpen className="w-4 h-4 mx-auto" />
            : <><PanelLeftClose className="w-3.5 h-3.5 shrink-0" /> Recolher</>
          }
        </button>
      </div>
    </aside>
  );
}
