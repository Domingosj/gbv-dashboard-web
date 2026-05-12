"use client";

import dynamic from "next/dynamic";
import { GBVCase } from "@/lib/types";
import { fmtViolence } from "@/lib/risk-calculator";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CHART_COLORS = ["#3C50E0", "#80CAEE", "#219653", "#FFA70B", "#D34053", "#AEB7C0"];

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

  if (categories.length === 0) return <p className="text-body text-sm px-4">Sem dados</p>;

  return (
    <div className="-ml-3 mt-4">
      <ApexChart
        options={{
          chart: { fontFamily: "Inter, sans-serif", type: "area", toolbar: { show: false }, height: 350 },
          colors: [CHART_COLORS[0]],
          stroke: { curve: "smooth", width: 3 },
          fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 100] } },
          markers: { size: 0, hover: { size: 6 } },
          grid: { borderColor: "#E2E8F0", strokeDashArray: 5, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
          dataLabels: { enabled: false },
          xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontSize: "12px", colors: ["#64748B"] } } },
          yaxis: { labels: { style: { fontSize: "12px", colors: ["#64748B"] } } },
          tooltip: { enabled: true, theme: "light" },
        }}
        series={[{ name: "Casos", data }]}
        type="area"
        height={350}
      />
    </div>
  );
}

interface ViolencePieProps { cases: GBVCase[] }
export function ViolencePie({ cases }: ViolencePieProps) {
  const counts: Record<string, number> = {};
  for (const c of cases) {
    const v = fmtViolence(c.violence_type);
    counts[v] = (counts[v] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const labels = entries.map(([n]) => n.length > 20 ? n.slice(0, 20) + "..." : n);
  const data = entries.map(([, v]) => v);

  if (data.length === 0) return <p className="text-body text-sm px-4">Sem dados</p>;

  return (
    <div className="flex justify-center items-center py-6">
      <ApexChart
        options={{
          chart: { fontFamily: "Inter, sans-serif", type: "donut" },
          colors: CHART_COLORS,
          labels,
          dataLabels: { enabled: false },
          legend: { show: true, position: "bottom", fontSize: "13px", fontFamily: "Inter", labels: { colors: ["#1C2434"] } },
          plotOptions: { pie: { donut: { size: "75%", labels: { show: true, total: { show: true, label: "Total", fontSize: "14px", fontWeight: 600, color: "#1C2434" } } } } },
          stroke: { show: true, width: 2, colors: ["#FFFFFF"] },
          tooltip: { enabled: true, y: { formatter: (v: number) => `${v} casos` } },
        }}
        series={data}
        type="donut"
        height={350}
      />
    </div>
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

  if (data.length === 0) return <p className="text-body text-sm px-4">Sem dados</p>;

  return (
    <div className="-ml-3 mt-4">
      <ApexChart
        options={{
          chart: { fontFamily: "Inter, sans-serif", type: "bar", toolbar: { show: false }, height: 350 },
          colors: [CHART_COLORS[0]],
          plotOptions: { bar: { horizontal: false, columnWidth: "35%", borderRadius: 2, borderRadiusApplication: "end" } },
          grid: { borderColor: "#E2E8F0", strokeDashArray: 5, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
          dataLabels: { enabled: false },
          xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontSize: "12px", colors: ["#64748B"] } } },
          yaxis: { labels: { style: { fontSize: "12px", colors: ["#64748B"] } } },
          tooltip: { enabled: true, theme: "light" },
        }}
        series={[{ name: "Casos", data }]}
        type="bar"
        height={350}
      />
    </div>
  );
}
