"use client";

import { GBVCase } from "@/lib/types";
import { fmtViolence } from "@/lib/risk-calculator";
import {
  LineChart, Line, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface MonthlyChartProps { cases: GBVCase[] }
interface PieChartProps { cases: GBVCase[] }
interface BarChartProps { cases: GBVCase[]; field: keyof GBVCase; title: string }

const COLORS = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"];

export function MonthlyChart({ cases }: MonthlyChartProps) {
  const byMonth: Record<string, number> = {};
  for (const c of cases) {
    if (!c.identification_date) continue;
    const m = c.identification_date.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  }
  const data = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));

  if (data.length === 0) return <p className="text-gray-400 text-sm">Sem dados</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#1f77b4" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ViolencePie({ cases }: PieChartProps) {
  const counts: Record<string, number> = {};
  for (const c of cases) {
    const v = fmtViolence(c.violence_type);
    counts[v] = (counts[v] || 0) + 1;
  }
  const data = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  if (data.length === 0) return <p className="text-gray-400 text-sm">Sem dados</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name }) => name.length > 15 ? name.slice(0, 15) + "..." : name}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ cases, field, title }: BarChartProps) {
  const counts: Record<string, number> = {};
  for (const c of cases) {
    const v = (c[field] as string) || "N/A";
    counts[v] = (counts[v] || 0) + 1;
  }
  const data = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

  if (data.length === 0) return <p className="text-gray-400 text-sm">Sem dados</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#1f77b4" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
