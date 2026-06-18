"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Pill, AlertTriangle, Clock, ShoppingCart, ArrowRight, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface DashboardData {
  todaySalesAmount: number;
  todaySalesCount: number;
  totalMedicines: number;
  lowStockCount: number;
  expiringSoonCount: number;
  pendingOrdersCount: number;
  salesChart: { date: string; amount: number }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("mn-MN").format(value) + "₮";
}

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const stats = (data: DashboardData) => [
  {
    label: "Өнөөдрийн борлуулалт",
    value: formatCurrency(data.todaySalesAmount),
    sub: `${data.todaySalesCount} гүйлгээ`,
    icon: TrendingUp,
    iconBg: "#eff6ff",
    iconColor: "#1d4ed8",
    border: "#bfdbfe",
  },
  {
    label: "Нийт эмийн төрөл",
    value: String(data.totalMedicines),
    sub: "идэвхтэй бүртгэлтэй",
    icon: Pill,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
    border: "#bbf7d0",
  },
  {
    label: "Бага нөөцтэй",
    value: String(data.lowStockCount),
    sub: "анхаарал шаардлагатай",
    icon: AlertTriangle,
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    border: "#fde68a",
    href: "/dashboard/inventory?filter=low-stock",
  },
  {
    label: "Хугацаа дуусах гэж буй",
    value: String(data.expiringSoonCount),
    sub: "дараагийн 30 хоногт",
    icon: Clock,
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
    border: "#fecaca",
    href: "/dashboard/inventory?filter=expiring",
  },
];

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
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "#f1f5f9" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ background: "#f8fafc", minHeight: "100vh" }}>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats(data).map((stat) => {
          const Icon = stat.icon;
          const card = (
            <div className="rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5"
              style={{ background: "white", border: `1px solid ${stat.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium mb-3" style={{ color: "#94a3b8" }}>{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>{stat.value}</p>
                  <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{stat.sub}</p>
                </div>
                <div className="flex items-center justify-center size-10 rounded-xl"
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

      {/* Chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>Сүүлийн 7 хоногийн борлуулалт</h3>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Өдөр тутмын орлого</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.salesChart} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatChartDate}
                tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value ?? 0)), "Борлуулалт"]}
                labelFormatter={(label) => formatChartDate(label)}
                contentStyle={{ borderRadius: 10, border: "1px solid #f1f5f9", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Bar dataKey="amount" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl p-5"
          style={{ background: "white", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#0f172a" }}>Шуурхай үйлдэл</h3>
          <p className="text-xs mb-4" style={{ color: "#94a3b8" }}>Түгээмэл үйлдлүүд</p>

          <div className="space-y-2">
            {[
              { href: "/dashboard/sales/new", label: "Шинэ борлуулалт хийх", icon: ShoppingCart, color: "#1d4ed8", bg: "#eff6ff" },
              { href: "/dashboard/medicines/new", label: "Шинэ эм бүртгэх", icon: Pill, color: "#16a34a", bg: "#f0fdf4" },
              { href: "/dashboard/orders/new", label: "Захиалга үүсгэх", icon: Package, color: "#d97706", bg: "#fffbeb" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}
                  className="flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-150 group"
                  style={{ border: "1px solid #f1f5f9" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-lg"
                      style={{ background: action.bg }}>
                      <Icon className="size-4" style={{ color: action.color }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#0f172a" }}>{action.label}</span>
                  </div>
                  <ArrowRight className="size-4" style={{ color: "#cbd5e1" }} />
                </Link>
              );
            })}
          </div>

          {data.pendingOrdersCount > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #f1f5f9" }}>
              <Link href="/dashboard/orders?status=PENDING"
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <span className="text-sm font-medium" style={{ color: "#92400e" }}>
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
  );
}