"use client";

import { useMemo, useState, useEffect } from "react";
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

const COLORS = ["#3C50E0", "#80CAEE", "#219653", "#FFA70B", "#D34053", "#AEB7C0"];

/**
 * Monthly case chart with safe data aggregation
 */
export function MonthlyChart({ cases }: { cases: GBVCase[] }) {
  const [data, setData] = useState<any[]>([]);

  // Use effect to safely compute data and avoid ReferenceError
  useEffect(() => {
    const months: Record<string, number> = {};
    for (const c of cases) {
      if (!c.identification_date) continue;
      const m = c.identification_date.slice(0, 7); // YYYY-MM
      months[m] = (months[m] || 0) + 1;
    }

    const chartData = Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    setData(chartData);
  }, [cases]);

  if (!data || data.length === 0) {
    return <p className="text-text-secondary text-sm">Sem dados para exibir</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="count" stroke="#256B5A" name="Casos" />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Distribution pie chart with safe rendering
 */
export function DistributionChart({ data, title }: { data: Record<string, number>; title: string }) {
  const [chartData, setChartData] = useState<any[]>([]);
  const colors = ["#256B5A", "#D9A441", "#C65A5A", "#256B8A", "#6BA587"];

  useEffect(() => {
    const formatted = Object.entries(data).map(([name, value]) => ({
      name,
      value,
    }));
    setChartData(formatted);
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return <p className="text-text-secondary text-sm">Sem dados para exibir</p>;
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

/**
 * Bar chart for comparisons
 */
export function ComparisonChart({
  data,
  label,
}: {
  data: Array<{ name: string; value: number }>;
  label: string;
}) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    setChartData(data);
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return <p className="text-text-secondary text-sm">Sem dados para exibir</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#256B5A" name={label} />
      </BarChart>
    </ResponsiveContainer>
  );
}
