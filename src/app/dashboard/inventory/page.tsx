"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Package, TrendingDown } from "lucide-react";

interface LowStockItem {
  id: string;
  name: string;
  unit: string;
  minStockLevel: number;
  totalStock: number;
  category: string | null;
}

interface ExpiringItem {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  medicine: { name: string; unit: string };
}

export default function InventoryPage() {
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [expiring, setExpiring] = useState<ExpiringItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"low" | "expiring">("low");

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/low-stock").then(r => r.json()),
      fetch("/api/reports/expiring").then(r => r.json()),
    ]).then(([low, exp]) => {
      setLowStock(low);
      setExpiring(exp);
      setIsLoading(false);
    });
  }, []);

  function daysLeft(date: string) {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="p-6 space-y-5" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>Нөөцийн удирдлага</h2>
        <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>Бага нөөц болон хугацаа дуусах эмүүд</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: "white", border: "1px solid #fde68a" }}>
          <div className="flex items-center justify-center size-10 rounded-xl" style={{ background: "#fffbeb" }}>
            <TrendingDown className="size-5" style={{ color: "#d97706" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "#94a3b8" }}>Бага нөөцтэй эм</p>
            <p className="text-xl font-bold" style={{ color: "#0f172a" }}>{lowStock.length}</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: "white", border: "1px solid #fecaca" }}>
          <div className="flex items-center justify-center size-10 rounded-xl" style={{ background: "#fef2f2" }}>
            <Clock className="size-5" style={{ color: "#dc2626" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "#94a3b8" }}>Хугацаа дуусах гэж буй</p>
            <p className="text-xl font-bold" style={{ color: "#0f172a" }}>{expiring.length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {([["low", "Бага нөөц", AlertTriangle], ["expiring", "Хугацаа дуусах", Clock]] as const).map(([val, label, Icon]) => (
          <button key={val} onClick={() => setTab(val)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={tab === val
              ? { background: "#1d4ed8", color: "white" }
              : { background: "white", color: "#64748b", border: "1px solid #f1f5f9" }}>
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #f1f5f9" }}>
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "#f1f5f9" }} />
            ))}
          </div>
        ) : tab === "low" ? (
          lowStock.length === 0 ? (
            <div className="p-16 text-center">
              <div className="flex items-center justify-center size-14 rounded-2xl mx-auto mb-4" style={{ background: "#f0fdf4" }}>
                <Package className="size-7" style={{ color: "#16a34a" }} />
              </div>
              <p className="font-medium" style={{ color: "#0f172a" }}>Бүх эмийн нөөц хэвийн байна</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                  {["Эмийн нэр", "Ангилал", "Одоогийн нөөц", "Доод хэмжээ", "Дутагдал"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "#64748b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStock.map(item => {
                  const shortage = item.minStockLevel - item.totalStock;
                  const pct = Math.round((item.totalStock / item.minStockLevel) * 100);
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: "#0f172a" }}>{item.name}</td>
                      <td className="px-5 py-3.5" style={{ color: "#64748b" }}>{item.category || "—"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${Math.min(pct, 100)}%`, background: pct < 50 ? "#ef4444" : "#f59e0b" }} />
                          </div>
                          <span style={{ color: "#0f172a" }}>{item.totalStock} {item.unit}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "#64748b" }}>{item.minStockLevel} {item.unit}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: "#fef2f2", color: "#dc2626" }}>
                          -{shortage} {item.unit}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          expiring.length === 0 ? (
            <div className="p-16 text-center">
              <div className="flex items-center justify-center size-14 rounded-2xl mx-auto mb-4" style={{ background: "#f0fdf4" }}>
                <Clock className="size-7" style={{ color: "#16a34a" }} />
              </div>
              <p className="font-medium" style={{ color: "#0f172a" }}>Хугацаа дуусах эм байхгүй байна</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                  {["Эмийн нэр", "Лот дугаар", "Тоо хэмжээ", "Дуусах огноо", "Үлдсэн хоног"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "#64748b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expiring.map(item => {
                  const days = daysLeft(item.expiryDate);
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-5 py-3.5 font-medium" style={{ color: "#0f172a" }}>{item.medicine.name}</td>
                      <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "#64748b" }}>{item.batchNumber}</td>
                      <td className="px-5 py-3.5" style={{ color: "#0f172a" }}>{item.quantity} {item.medicine.unit}</td>
                      <td className="px-5 py-3.5" style={{ color: "#64748b" }}>
                        {new Date(item.expiryDate).toLocaleDateString("mn-MN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                          style={days <= 7
                            ? { background: "#fef2f2", color: "#dc2626" }
                            : days <= 14
                              ? { background: "#fffbeb", color: "#d97706" }
                              : { background: "#eff6ff", color: "#1d4ed8" }}>
                          {days} хоног
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}