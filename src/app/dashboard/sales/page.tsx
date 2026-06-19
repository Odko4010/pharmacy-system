"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, TrendingUp } from "lucide-react";

interface SaleTransaction {
  id: string;
  totalAmount: string;
  createdAt: string;
  soldBy: { firstName: string; lastName: string };
  items: { quantity: number; medicine: { name: string; unit: string } }[];
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("mn-MN").format(Number(value)) + "₮";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("mn-MN", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sales").then((r) => r.json()).then((data) => { setSales(data); setIsLoading(false); });
  }, []);

  const totalToday = sales
    .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + Number(s.totalAmount), 0);

  return (
    <div className="p-6 space-y-5" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>Борлуулалт</h2>
          <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>Нийт {sales.length} бүртгэл</p>
        </div>
        <Link href="/dashboard/sales/new">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "#1d4ed8" }}>
            <Plus className="size-4" />
            Шинэ борлуулалт
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #bfdbfe" }}>
          <p className="text-xs" style={{ color: "#94a3b8" }}>Өнөөдрийн борлуулалт</p>
          <p className="text-xl font-bold mt-1" style={{ color: "#0f172a" }}>{formatCurrency(totalToday)}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #bbf7d0" }}>
          <p className="text-xs" style={{ color: "#94a3b8" }}>Нийт гүйлгээ</p>
          <p className="text-xl font-bold mt-1" style={{ color: "#0f172a" }}>{sales.length}</p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #f1f5f9" }}>
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "#f1f5f9" }} />
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="p-16 text-center">
            <div className="flex items-center justify-center size-14 rounded-2xl mx-auto mb-4" style={{ background: "#eff6ff" }}>
              <Receipt className="size-7" style={{ color: "#1d4ed8" }} />
            </div>
            <p className="font-medium" style={{ color: "#0f172a" }}>Борлуулалт байхгүй байна</p>
            <p className="text-sm mt-1 mb-5" style={{ color: "#94a3b8" }}>Анхны борлуулалтаа бүртгэнэ үү</p>
            <Link href="/dashboard/sales/new">
              <button className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "#1d4ed8" }}>
                Борлуулалт хийх
              </button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                {["Огноо", "Барааны тоо", "Борлуулсан", "Дүн"].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} style={{ borderBottom: "1px solid #f8fafc" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td className="px-5 py-3.5" style={{ color: "#64748b" }}>{formatDateTime(sale.createdAt)}</td>
                  <td className="px-5 py-3.5" style={{ color: "#0f172a" }}>
                    {sale.items.reduce((s, i) => s + i.quantity, 0)} нэгж
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "#64748b" }}>
                    {sale.soldBy.lastName} {sale.soldBy.firstName}
                  </td>
                  <td className="px-5 py-3.5 font-semibold" style={{ color: "#1d4ed8" }}>
                    {formatCurrency(sale.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}