"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, AlertTriangle, BarChart3, Search,
  FolderKanban, Users, Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/urgent", label: "Urgentes", icon: AlertTriangle },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/cases", label: "Casos", icon: Search },
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  { href: "/managers", label: "Gestores", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-surface border-r border-border min-h-screen p-6base flex flex-col">
      <div className="mb-10base">
        <h1 className="font-display text-subhead text-text-primary flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          GBV Dashboard
        </h1>
        <p className="text-caption text-neutral mt-2">Sistema de Gestão de Casos</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-button text-small font-medium transition-all duration-200 ${
                active
                  ? "text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-gray-50"
              }`}
              style={active ? { backgroundColor: "rgba(99,102,241,0.12)" } : undefined}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6base border-t border-border text-caption text-neutral">
        <p>NCS Moçambique</p>
      </div>
    </aside>
  );
}
