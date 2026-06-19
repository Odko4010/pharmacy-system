"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "RECEIVED" | "CANCELLED";
  totalAmount: string;
  createdAt: string;
  supplier: { name: string } | null;
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("mn-MN").format(Number(value)) + "₮";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("mn-MN", { month: "2-digit", day: "2-digit", year: "numeric" });
}

const statusConfig = {
  PENDING:   { label: "Хүлээгдэж байна", bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
  CONFIRMED: { label: "Баталгаажсан",    bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  RECEIVED:  { label: "Хүлээж авсан",   bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
  CANCELLED: { label: "Цуцлагдсан",     bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/orders").then((r) => r.json()).then((data) => { setOrders(data); setIsLoading(false); });
  }, []);

  const filtered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="p-6 space-y-5" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>Захиалга</h2>
          <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>Нийт {orders.length} захиалга</p>
        </div>
        <Link href="/dashboard/orders/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "#1d4ed8" }}>
            <Plus className="size-4" />
            Шинэ захиалга
          </button>
        </Link>
      </div>

      <div className="flex gap-2">
        {[["ALL","Бүгд"], ["PENDING","Хүлээгдэж буй"], ["CONFIRMED","Баталгаажсан"], ["RECEIVED","Хүлээж авсан"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={filter === val
              ? { background: "#1d4ed8", color: "white" }
              : { background: "white", color: "#64748b", border: "1px solid #f1f5f9" }}>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #f1f5f9" }}>
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "#f1f5f9" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex items-center justify-center size-14 rounded-2xl mx-auto mb-4" style={{ background: "#eff6ff" }}>
              <ShoppingCart className="size-7" style={{ color: "#1d4ed8" }} />
            </div>
            <p className="font-medium" style={{ color: "#0f172a" }}>Захиалга байхгүй байна</p>
            <p className="text-sm mt-1 mb-5" style={{ color: "#94a3b8" }}>Анхны захиалгаа үүсгэнэ үү</p>
            <Link href="/dashboard/orders/new">
              <button className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "#1d4ed8" }}>
                Захиалга үүсгэх
              </button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                {["Дугаар", "Нийлүүлэгч", "Огноо", "Төлөв", "Дүн", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const s = statusConfig[order.status];
                return (
                  <tr key={order.id} style={{ borderBottom: "1px solid #f8fafc" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "#64748b" }}>{order.orderNumber}</td>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "#0f172a" }}>{order.supplier?.name || "—"}</td>
                    <td className="px-5 py-3.5" style={{ color: "#64748b" }}>{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: s.bg, color: s.color }}>
                        <span className="size-1.5 rounded-full" style={{ background: s.dot }} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: "#1d4ed8" }}>
                      {order.totalAmount ? formatCurrency(order.totalAmount) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/dashboard/orders/${order.id}`}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                        Дэлгэрэнгүй
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}