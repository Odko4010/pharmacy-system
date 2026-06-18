"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Pill,
  AlertTriangle,
  Clock,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setIsLoading(false);
      });
  }, []);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-[var(--color-ink-100)] animate-pulse" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Өнөөдрийн борлуулалт",
      value: formatCurrency(data.todaySalesAmount),
      sub: `${data.todaySalesCount} гүйлгэл`,
      icon: TrendingUp,
      color: "var(--color-success)",
      bg: "var(--color-success-light)",
    },
    {
      label: "Нийт эмийн төрөл",
      value: String(data.totalMedicines),
      sub: "идэвхтэй бүртгэлтэй",
      icon: Pill,
      color: "var(--color-brand-700)",
      bg: "var(--color-brand-100)",
    },
    {
      label: "Бага нөөцтэй",
      value: String(data.lowStockCount),
      sub: "анхаарал шаардлагатай",
      icon: AlertTriangle,
      color: "var(--color-warning)",
      bg: "var(--color-warning-light)",
      href: "/dashboard/inventory?filter=low-stock",
    },
    {
      label: "Хугацаа дуусах гэж буй",
      value: String(data.expiringSoonCount),
      sub: "дараагийн 30 хоногт",
      icon: Clock,
      color: "var(--color-danger)",
      bg: "var(--color-danger-light)",
      href: "/dashboard/inventory?filter=expiring",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Статистик картууд */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <Card className="hover:shadow-md transition-shadow duration-150">
              <CardBody className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--color-ink-500)]">{stat.label}</p>
                  <p className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink-900)] mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--color-ink-500)] mt-1">{stat.sub}</p>
                </div>
                <div
                  className="flex items-center justify-center size-10 rounded-lg shrink-0"
                  style={{ backgroundColor: stat.bg }}
                >
                  <Icon className="size-5" style={{ color: stat.color }} />
                </div>
              </CardBody>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>
              {content}
            </Link>
          ) : (
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Борлуулалтын график */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-[var(--font-display)] font-semibold text-[var(--color-ink-900)]">
              Сүүлийн 7 хоногийн борлуулалт
            </h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.salesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fontSize: 12, fill: "var(--color-ink-500)" }}
                  axisLine={{ stroke: "var(--color-ink-100)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--color-ink-500)" }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), "Борлуулалт"]}
                  labelFormatter={(label) => formatChartDate(label)}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--color-ink-100)", fontSize: 13 }}
                />
                <Bar dataKey="amount" fill="var(--color-brand-700)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Хурдан холбоосууд */}
        <Card>
          <CardHeader>
            <h3 className="font-[var(--font-display)] font-semibold text-[var(--color-ink-900)]">Шуурхай үйлдэл</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            <Link
              href="/dashboard/sales/new"
              className="flex items-center justify-between rounded-lg border border-[var(--color-ink-100)] px-3.5 py-3 hover:bg-[var(--color-brand-50)] hover:border-[var(--color-brand-100)] transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-ink-900)]">
                <ShoppingCart className="size-4 text-[var(--color-brand-700)]" />
                Шинэ борлуулалт хийх
              </span>
              <ArrowRight className="size-4 text-[var(--color-ink-300)] group-hover:text-[var(--color-brand-700)] transition-colors" />
            </Link>
            <Link
              href="/dashboard/medicines/new"
              className="flex items-center justify-between rounded-lg border border-[var(--color-ink-100)] px-3.5 py-3 hover:bg-[var(--color-brand-50)] hover:border-[var(--color-brand-100)] transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-ink-900)]">
                <Pill className="size-4 text-[var(--color-brand-700)]" />
                Шинэ эм бүртгэх
              </span>
              <ArrowRight className="size-4 text-[var(--color-ink-300)] group-hover:text-[var(--color-brand-700)] transition-colors" />
            </Link>
            <Link
              href="/dashboard/orders/new"
              className="flex items-center justify-between rounded-lg border border-[var(--color-ink-100)] px-3.5 py-3 hover:bg-[var(--color-brand-50)] hover:border-[var(--color-brand-100)] transition-colors group"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-ink-900)]">
                <TrendingUp className="size-4 text-[var(--color-brand-700)]" />
                Захиалга үүсгэх
              </span>
              <ArrowRight className="size-4 text-[var(--color-ink-300)] group-hover:text-[var(--color-brand-700)] transition-colors" />
            </Link>

            {data.pendingOrdersCount > 0 && (
              <div className="mt-2 pt-2 border-t border-[var(--color-ink-100)]">
                <Link href="/dashboard/orders?status=PENDING" className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-ink-700)]">Хүлээгдэж буй захиалга</span>
                  <Badge variant="warning">{data.pendingOrdersCount}</Badge>
                </Link>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
