"use client";

import dynamic from "next/dynamic";
import { GBVCase } from "@/lib/types";
import { fmtViolence } from "@/lib/risk-calculator";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CHART_COLORS = ["#256B5A", "#5E9C8A", "#4B7BE5", "#D9A441", "#C65A5A", "#B8BEC6"];

interface MonthlyChartProps { cases: GBVCase[] }
export function MonthlyChart({ cases }: MonthlyChartProps) {
  const byMonth: Record<string, number> = {};
  for (const c of cases) {
    if (!c.identification_date) continue;
    const m = c.identification_date.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  }
  const entries = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
  const categories = entries.map(([m]) => {
    const [y, mo] = m.split("-");
    const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return `${months[parseInt(mo) - 1]} ${y}`;
  });
  const data = entries.map(([, v]) => v);

  if (categories.length === 0) return <p className="text-text-secondary text-sm">Sem dados</p>;

  return (
    <ApexChart
      options={{
        chart: { fontFamily: "Inter, sans-serif", type: "line", toolbar: { show: false }, height: 280 },
        colors: [CHART_COLORS[0]],
        stroke: { curve: "smooth", width: 2 },
        fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0 } },
        markers: { size: 0, hover: { size: 5 } },
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        dataLabels: { enabled: false },
        xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontSize: "11px", colors: ["#6B7280"] } } },
        yaxis: { labels: { style: { fontSize: "11px", colors: ["#6B7280"] } } },
        tooltip: { enabled: true, x: { format: "MMM yyyy" } },
      }}
      series={[{ name: "Casos", data }]}
      type="area"
      height={280}
    />
  );
}

interface ViolencePieProps { cases: GBVCase[] }
export function ViolencePie({ cases }: ViolencePieProps) {
  const counts: Record<string, number> = {};
  for (const c of cases) {
    const v = fmtViolence(c.violence_type);
    counts[v] = (counts[v] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const labels = entries.map(([n]) => n.length > 18 ? n.slice(0, 18) + "..." : n);
  const data = entries.map(([, v]) => v);

  if (data.length === 0) return <p className="text-text-secondary text-sm">Sem dados</p>;

  return (
    <ApexChart
      options={{
        chart: { fontFamily: "Inter, sans-serif", type: "donut", toolbar: { show: false } },
        colors: CHART_COLORS,
        labels,
        dataLabels: { enabled: false },
        legend: { position: "bottom", fontSize: "12px", fontFamily: "Inter", labels: { colors: ["#6B7280"] } },
        plotOptions: { pie: { donut: { size: "60%" } } },
        stroke: { show: false },
        tooltip: { enabled: true, y: { formatter: (v: number) => `${v} casos` } },
      }}
      series={data}
      type="donut"
      height={280}
    />
  );
}

interface BarChartProps { cases: GBVCase[]; field: keyof GBVCase; }
export function SimpleBarChart({ cases, field }: BarChartProps) {
  const counts: Record<string, number> = {};
  for (const c of cases) {
    const v = (c[field] as string) || "N/A";
    counts[v] = (counts[v] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const categories = entries.map(([n]) => n.length > 15 ? n.slice(0, 15) + "..." : n);
  const data = entries.map(([, v]) => v);

  if (data.length === 0) return <p className="text-text-secondary text-sm">Sem dados</p>;

  return (
    <ApexChart
      options={{
        chart: { fontFamily: "Inter, sans-serif", type: "bar", toolbar: { show: false }, height: 280 },
        colors: [CHART_COLORS[0]],
        plotOptions: { bar: { horizontal: false, columnWidth: "45%", borderRadius: 4, borderRadiusApplication: "end" } },
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        dataLabels: { enabled: false },
        xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontSize: "11px", colors: ["#6B7280"] } } },
        yaxis: { labels: { style: { fontSize: "11px", colors: ["#6B7280"] } } },
        tooltip: { enabled: true, y: { formatter: (v: number) => `${v} casos` } },
      }}
      series={[{ name: "Casos", data }]}
      type="bar"
      height={280}
    />
  );
}
