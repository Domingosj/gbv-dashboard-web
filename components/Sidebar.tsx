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
    label: "Operational",
    items: [
      { href: "/daily-operations", label: "Daily Operations", icon: LayoutDashboard },
      { href: "/workload", label: "Workload", icon: Activity },
      { href: "/risk-safety", label: "Risk & Safety", icon: AlertTriangle },
      { href: "/case-progress", label: "Case Progress", icon: CheckCircle },
    ],
  },
  {
    label: "Cases",
    items: [
      { href: "/priority-list", label: "Priority List", icon: Target },
      { href: "/cases", label: "Case Explorer", icon: Search },
      { href: "/referral-assistant", label: "Referral Assistant", icon: Users },
    ],
  },
  {
    label: "Analysis",
    items: [
      { href: "/data-quality", label: "Data Quality", icon: BarChart3 },
      { href: "/referral-pathways", label: "Referral Pathways", icon: FolderKanban },
      { href: "/map", label: "Geographic Map", icon: Map },
      { href: "/trends", label: "Trends", icon: TrendingUp },
      { href: "/partners", label: "Partners", icon: Briefcase },
    ],
  },
  {
    label: "Strategy",
    items: [
      { href: "/summary", label: "Executive Summary", icon: PieChart },
      { href: "/portfolio", label: "Portfolio", icon: FileText },
      { href: "/strategic-analysis", label: "Strategic Analysis", icon: TrendingUp },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 lg:w-60 bg-surface border-r border-border min-h-screen flex flex-col shrink-0">
      <div className="px-5 pt-6 pb-8">
        <h1 className="text-lg font-bold text-primary flex items-center gap-2.5">
          <Shield className="w-5 h-5" />
          GCR Dashboard
        </h1>
        <p className="text-caption text-text-secondary mt-1.5">GBV Case Management</p>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-6 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-caption font-medium text-text-secondary uppercase tracking-wider px-2 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-button text-label transition-all duration-150 ${
                      active
                        ? "text-primary font-semibold"
                        : "text-text-secondary hover:text-text-primary hover:bg-gray-50"
                    }`}
                    style={active ? { backgroundColor: "rgba(37,107,90,0.08)" } : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border text-caption text-text-secondary">
        <p>NCS Moçambique</p>
      </div>
    </aside>
  );
}
