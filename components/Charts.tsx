"use client";

import { useMemo } from "react";
import { GBVCase } from "@/lib/types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#005243", "#90d4bf", "#166965", "#644119", "#D34053", "#6f7975"];

export function MonthlyChart({ cases }: { cases: GBVCase[] }) {
  const data = useMemo(() => {
    const months: Record<string, number> = {};
    for (const c of cases) {
      if (!c.identification_date) continue;
      const m = c.identification_date.slice(0, 7);
      months[m] = (months[m] || 0) + 1;
    }
    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));
  }, [cases]);

  if (!data || data.length === 0) {
    return <p className="text-on-surface-variant text-sm">Sem dados para exibir</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6f7975" }} />
        <YAxis tick={{ fontSize: 12, fill: "#6f7975" }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="count" stroke="#005243" strokeWidth={2} name="Casos" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart({ data, title }: { data: Record<string, number>; title: string }) {
  const colors = ["#005243", "#90d4bf", "#166965", "#644119", "#6f7975", "#D34053"];

  const chartData = useMemo(() =>
    Object.entries(data).map(([name, value]) => ({ name, value })),
    [data]
  );

  if (!chartData || chartData.length === 0) {
    return <p className="text-on-surface-variant text-sm">Sem dados para exibir</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ComparisonChart({
  data,
  label,
}: {
  data: Array<{ name: string; value: number }>;
  label: string;
}) {
  const chartData = data;

  if (!chartData || chartData.length === 0) {
    return <p className="text-on-surface-variant text-sm">Sem dados para exibir</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6f7975" }} />
        <YAxis tick={{ fontSize: 12, fill: "#6f7975" }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#005243" radius={[4, 4, 0, 0]} name={label} />
      </BarChart>
    </ResponsiveContainer>
  );
}
