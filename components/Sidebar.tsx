"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, AlertTriangle, BarChart3, Search,
  FolderKanban, Users, Shield
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
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-blue-700 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          GBV Dashboard
        </h1>
        <p className="text-xs text-gray-500 mt-1">Sistema de Gestão de Casos</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-gray-200 text-xs text-gray-400">
        <p>NCS Moçambique</p>
      </div>
    </aside>
  );
}
