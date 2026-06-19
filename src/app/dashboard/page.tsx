"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Pill, AlertTriangle, Clock, ShoppingCart, ArrowRight, Package } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip);

interface DashboardData {
  todaySalesAmount: number;
  todaySalesCount: number;
  totalMedicines: number;
  lowStockCount: number;
  expiringSoonCount: number;
  pendingOrdersCount: number;
  salesChart: { date: string; amount: number }[];
  topMedicines: { name: string; quantity: number }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("mn-MN").format(value) + "₮";
}

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const TOP_COLORS = ["#1d4ed8", "#7c3aed", "#0891b2", "#059669", "#d97706"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((res) => res.json())
      .then((json) => { setData(json); setIsLoading(false); });
  }, []);

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4" style={{ background: "#f8fafc", minHeight: "100vh" }}>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "#e2e8f0" }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-72 rounded-2xl animate-pulse" style={{ background: "#e2e8f0" }} />
          <div className="h-72 rounded-2xl animate-pulse" style={{ background: "#e2e8f0" }} />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Өнөөдрийн борлуулалт",
      value: formatCurrency(data.todaySalesAmount),
      sub: `${data.todaySalesCount} гүйлгээ`,
      icon: TrendingUp,
      iconBg: "#eff6ff", iconColor: "#1d4ed8", border: "#bfdbfe",
    },
    {
      label: "Нийт эмийн төрөл",
      value: String(data.totalMedicines),
      sub: "идэвхтэй бүртгэлтэй",
      icon: Pill,
      iconBg: "#f0fdf4", iconColor: "#16a34a", border: "#bbf7d0",
    },
    {
      label: "Бага нөөцтэй",
      value: String(data.lowStockCount),
      sub: "анхаарал шаардлагатай",
      icon: AlertTriangle,
      iconBg: "#fffbeb", iconColor: "#d97706", border: "#fde68a",
      href: "/dashboard/inventory",
    },
    {
      label: "Хугацаа дуусах гэж буй",
      value: String(data.expiringSoonCount),
      sub: "дараагийн 30 хоногт",
      icon: Clock,
      iconBg: "#fef2f2", iconColor: "#dc2626", border: "#fecaca",
      href: "/dashboard/inventory",
    },
  ];

  const hasData = data.salesChart.some(d => d.amount > 0);

  const chartData = {
    labels: data.salesChart.map(d => formatChartDate(d.date)),
    datasets: [{
      label: "Борлуулалт",
      data: data.salesChart.map(d => d.amount),
      backgroundColor: "#1d4ed8",
      borderRadius: 6,
      borderSkipped: false as const,
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
        ticks: { color: "#94a3b8", font: { size: 11 } }
      },
      y: {
        grid: { color: "#f1f5f9" },
        border: { display: false },
        beginAtZero: true,
        min: 0,
        max: hasData ? undefined : 100,
        ticks: {
          color: "#94a3b8",
          font: { size: 11 },
          maxTicksLimit: 5,
          callback: (v: any) => {
            if (!hasData) return "";
            if (Number(v) === 0) return "₮0";
            return "₮" + (Number(v) / 1000).toFixed(0) + "K";
          }
        }
      }
    }
  };

  return (
    <div className="p-6 space-y-4" style={{ background: "#f8fafc", minHeight: "100vh" }}>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const card = (
            <div className="rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5"
              style={{ background: "white", border: `1px solid ${stat.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: "#94a3b8" }}>{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>{stat.value}</p>
                  <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{stat.sub}</p>
                </div>
                <div className="flex items-center justify-center size-10 rounded-xl shrink-0"
                  style={{ background: stat.iconBg }}>
                  <Icon className="size-5" style={{ color: stat.iconColor }} />
                </div>
              </div>
            </div>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>{card}</Link>
          ) : (
            <div key={stat.label}>{card}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>Сүүлийн 7 хоногийн борлуулалт</h3>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Өдөр тутмын орлого</p>
          </div>
          {!hasData ? (
            <div className="flex flex-col items-center justify-center h-48"
              style={{ background: "#f8fafc", borderRadius: 12 }}>
              <TrendingUp className="size-8 mb-2" style={{ color: "#cbd5e1" }} />
              <p className="text-sm" style={{ color: "#94a3b8" }}>Борлуулалтын мэдээлэл байхгүй байна</p>
              <p className="text-xs mt-1" style={{ color: "#cbd5e1" }}>Борлуулалт хийснээр график харагдана</p>
            </div>
          ) : (
            <div style={{ position: "relative", width: "100%", height: 220 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Top medicines */}
          <div className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#0f172a" }}>
              🏆 Хамгийн их зарагдсан
            </h3>
            {data.topMedicines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6"
                style={{ background: "#f8fafc", borderRadius: 10 }}>
                <Pill className="size-6 mb-2" style={{ color: "#cbd5e1" }} />
                <p className="text-xs" style={{ color: "#94a3b8" }}>7 хоногт борлуулалт байхгүй</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.topMedicines.map((med, i) => {
                  const max = data.topMedicines[0].quantity;
                  const pct = Math.round((med.quantity / max) * 100);
                  return (
                    <div key={med.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex items-center justify-center size-5 rounded-full text-[10px] font-bold text-white shrink-0"
                            style={{ background: TOP_COLORS[i] }}>
                            {i + 1}
                          </span>
                          <span className="text-xs font-medium truncate" style={{ color: "#0f172a" }}>
                            {med.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold shrink-0 ml-2" style={{ color: TOP_COLORS[i] }}>
                          {med.quantity}ш
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: TOP_COLORS[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#0f172a" }}>Шуурхай үйлдэл</h3>
            <div className="space-y-2">
              {[
                { href: "/dashboard/sales/new", label: "Шинэ борлуулалт хийх", icon: ShoppingCart, color: "#1d4ed8", bg: "#eff6ff" },
                { href: "/dashboard/medicines", label: "Шинэ эм бүртгэх", icon: Pill, color: "#16a34a", bg: "#f0fdf4" },
                { href: "/dashboard/orders/new", label: "Захиалга үүсгэх", icon: Package, color: "#d97706", bg: "#fffbeb" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-150"
                    style={{ border: "1px solid #f1f5f9" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center size-7 rounded-lg"
                        style={{ background: action.bg }}>
                        <Icon className="size-3.5" style={{ color: action.color }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: "#0f172a" }}>{action.label}</span>
                    </div>
                    <ArrowRight className="size-3.5" style={{ color: "#cbd5e1" }} />
                  </Link>
                );
              })}
            </div>

            {data.pendingOrdersCount > 0 && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                <Link href="/dashboard/orders?status=PENDING"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                  <span className="text-xs font-medium" style={{ color: "#92400e" }}>
                    Хүлээгдэж буй захиалга
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#d97706", color: "white" }}>
                    {data.pendingOrdersCount}
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}