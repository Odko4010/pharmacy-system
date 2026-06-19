"use client";

import { useEffect, useState } from "react";
import { TrendingUp, ShoppingCart, Package, Download } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip as ChartTooltip,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ChartTooltip, Filler);

interface ReportData {
  totalAmount: number;
  totalSales: number;
  totalItems: number;
  byDay: { date: string; amount: number }[];
  topMedicines: { name: string; quantity: number; revenue: number }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("mn-MN").format(Math.round(value)) + "₮";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const TOP_COLORS = ["#1d4ed8","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#0d9488","#9333ea","#ea580c","#65a30d"];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  const load = () => {
    setIsLoading(true);
    fetch(`/api/reports/sales?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(d => { setData(d); setIsLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const chartData = {
    labels: data?.byDay.map(d => formatDate(d.date)) || [],
    datasets: [{
      label: "Борлуулалт",
      data: data?.byDay.map(d => d.amount) || [],
      backgroundColor: chartType === "bar" ? "#1d4ed8" : "rgba(29,78,216,0.1)",
      borderColor: "#1d4ed8",
      borderWidth: chartType === "line" ? 2 : 0,
      borderRadius: chartType === "bar" ? 6 : 0,
      borderSkipped: false as const,
      fill: chartType === "line",
      tension: 0.4,
      pointBackgroundColor: "#1d4ed8",
      pointRadius: chartType === "line" ? 4 : 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx: any) => "₮" + Number(ctx.raw).toLocaleString() },
        backgroundColor: "white",
        titleColor: "#0f172a",
        bodyColor: "#64748b",
        borderColor: "#f1f5f9",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 }, maxTicksLimit: 10 }
      },
      y: {
        grid: { color: "#f1f5f9" },
        border: { display: false },
        beginAtZero: true,
        ticks: {
          color: "#94a3b8",
          font: { size: 11 },
          maxTicksLimit: 5,
          callback: (v: any) => Number(v) === 0 ? "₮0" : "₮" + (Number(v)/1000).toFixed(0) + "K"
        }
      }
    }
  };

  return (
    <div className="p-6 space-y-5" style={{ background: "#f8fafc", minHeight: "100vh" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>Тайлан</h2>
          <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>Борлуулалтын дэлгэрэнгүй тайлан</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: "white", border: "1px solid #e2e8f0", color: "#64748b" }}>
          <Download className="size-4" />
          Татаж авах
        </button>
      </div>

      {/* Filter */}
      <div className="rounded-2xl p-4 flex flex-wrap items-center gap-3"
        style={{ background: "white", border: "1px solid #f1f5f9" }}>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium" style={{ color: "#64748b" }}>Эхлэх огноо</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a" }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium" style={{ color: "#64748b" }}>Дуусах огноо</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a" }} />
        </div>
        <div className="flex gap-1 ml-auto">
          {[["7", "7 хоног"], ["30", "30 хоног"], ["90", "90 хоног"]].map(([days, label]) => (
            <button key={days} onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - Number(days));
              setFrom(d.toISOString().split("T")[0]);
              setTo(new Date().toISOString().split("T")[0]);
            }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#f1f5f9", color: "#64748b" }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={load}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "#1d4ed8" }}>
          Хайх
        </button>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "#e2e8f0" }} />
          ))}
        </div>
      ) : data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Нийт орлого", value: formatCurrency(data.totalAmount), icon: TrendingUp, bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
              { label: "Нийт гүйлгээ", value: String(data.totalSales), icon: ShoppingCart, bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
              { label: "Нийт зарагдсан эм", value: String(data.totalItems) + " ш", icon: Package, bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl p-5"
                  style={{ background: "white", border: `1px solid ${s.border}` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: "#94a3b8" }}>{s.label}</p>
                      <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>{s.value}</p>
                    </div>
                    <div className="flex items-center justify-center size-10 rounded-xl" style={{ background: s.bg }}>
                      <Icon className="size-5" style={{ color: s.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #f1f5f9" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>Борлуулалтын график</h3>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Өдөр тутмын орлого</p>
              </div>
              <div className="flex gap-1">
                {(["bar", "line"] as const).map(t => (
                  <button key={t} onClick={() => setChartType(t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={chartType === t
                      ? { background: "#1d4ed8", color: "white" }
                      : { background: "#f1f5f9", color: "#64748b" }}>
                    {t === "bar" ? "Баганан" : "Шугаман"}
                  </button>
                ))}
              </div>
            </div>
            {data.byDay.length === 0 ? (
              <div className="flex items-center justify-center h-48" style={{ background: "#f8fafc", borderRadius: 12 }}>
                <p className="text-sm" style={{ color: "#94a3b8" }}>Сонгосон хугацаанд борлуулалт байхгүй</p>
              </div>
            ) : (
              <div style={{ position: "relative", width: "100%", height: 260 }}>
                {chartType === "bar"
                  ? <Bar data={chartData} options={chartOptions} />
                  : <Line data={chartData} options={chartOptions} />
                }
              </div>
            )}
          </div>

          {/* Top medicines table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #f1f5f9" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>Хамгийн их зарагдсан эмүүд</h3>
            </div>
            {data.topMedicines.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm" style={{ color: "#94a3b8" }}>Мэдээлэл байхгүй байна</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                    {["#", "Эмийн нэр", "Тоо хэмжээ", "Орлого", "Хувь"].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "#64748b" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topMedicines.map((med, i) => {
                    const pct = data.totalAmount > 0 ? Math.round((med.revenue / data.totalAmount) * 100) : 0;
                    return (
                      <tr key={med.name} style={{ borderBottom: "1px solid #f8fafc" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center justify-center size-6 rounded-full text-xs font-bold text-white"
                            style={{ background: TOP_COLORS[i] || "#94a3b8" }}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium" style={{ color: "#0f172a" }}>{med.name}</td>
                        <td className="px-5 py-3.5" style={{ color: "#64748b" }}>{med.quantity} ш</td>
                        <td className="px-5 py-3.5 font-semibold" style={{ color: "#1d4ed8" }}>
                          {formatCurrency(med.revenue)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                              <div className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: TOP_COLORS[i] || "#94a3b8" }} />
                            </div>
                            <span className="text-xs" style={{ color: "#64748b" }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}