"use client";

import { useState } from "react";
import { Search, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  medicine: { name: string; unit: string };
}

interface Sale {
  id: string;
  totalAmount: number;
  createdAt: string;
  items: SaleItem[];
}

function fmt(v: number) { return new Intl.NumberFormat("mn-MN").format(v) + "₮"; }

export default function RefundPage() {
  const { showToast } = useToast();
  const [saleSearch, setSaleSearch] = useState("");
  const [sale, setSale] = useState<Sale | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState<{ refundAmount: number } | null>(null);

  async function searchSale() {
    if (!saleSearch.trim()) return;
    setIsSearching(true);
    setSale(null);
    setSelected({});
    try {
      const res = await fetch(`/api/sales?search=${encodeURIComponent(saleSearch)}`);
      const data = await res.json();
      const found = Array.isArray(data) ? data[0] : null;
      if (found) { setSale(found); }
      else showToast("Борлуулалт олдсонгүй", "error");
    } finally { setIsSearching(false); }
  }

  function toggleItem(itemId: string, maxQty: number) {
    setSelected(prev => {
      if (prev[itemId] !== undefined) {
        const { [itemId]: _, ...rest } = prev; return rest;
      }
      return { ...prev, [itemId]: maxQty };
    });
  }

  const refundTotal = sale?.items
    .filter(i => selected[i.id] !== undefined)
    .reduce((s, i) => s + selected[i.id] * Number(i.unitPrice), 0) || 0;

  async function handleRefund() {
    if (!sale) return;
    if (Object.keys(selected).length === 0) { showToast("Буцаах эм сонгоно уу", "error"); return; }
    if (!reason.trim()) { showToast("Буцаалтын шалтгаан оруулна уу", "error"); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: sale.id,
          reason,
          items: Object.entries(selected).map(([saleItemId, quantity]) => ({ saleItemId, quantity })),
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const result = await res.json();
      setDone(result);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    } finally { setIsSubmitting(false); }
  }

  // ── АМЖИЛТ ──
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6">
        <div className="flex items-center justify-center size-20 rounded-full" style={{ background: "#f0fdf4" }}>
          <CheckCircle2 className="size-10" style={{ color: "#16a34a" }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold" style={{ color: "#0f172a" }}>Буцаалт амжилттай!</h2>
          <p className="text-sm mt-2" style={{ color: "#64748b" }}>
            Буцаасан дүн: <span className="font-bold" style={{ color: "#dc2626" }}>{fmt(done.refundAmount)}</span>
          </p>
        </div>
        <button
          onClick={() => { setSale(null); setSaleSearch(""); setSelected({}); setReason(""); setDone(null); }}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: "#1d4ed8" }}
        >
          Дахин буцаалт хийх
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>Борлуулалтын буцаалт</h2>
        <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>Борлуулалтын дугаараар хайж буцаалт хийнэ</p>
      </div>

      {/* Хайлт */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: "white", border: "1px solid #f1f5f9" }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "#94a3b8" }} />
            <input
              autoFocus
              placeholder="Борлуулалтын дугаар (сүүлийн 6 тэмдэгт)..."
              value={saleSearch}
              onChange={e => setSaleSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchSale()}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#f8fafc", border: "1px solid #f1f5f9", color: "#0f172a" }}
            />
          </div>
          <button
            onClick={searchSale}
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "#1d4ed8" }}
          >
            {isSearching ? "Хайж байна..." : "Хайх"}
          </button>
        </div>
        <p className="text-xs flex items-center gap-1" style={{ color: "#94a3b8" }}>
          <AlertCircle className="size-3" />
          Борлуулалтын баримтан дээрх #XXXXXXXX дугаарыг оруулна уу
        </p>
      </div>

      {/* Борлуулалтын дэлгэрэнгүй */}
      {sale && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #f1f5f9" }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-semibold" style={{ color: "#0f172a" }}>Борлуулалт #{sale.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                  {new Date(sale.createdAt).toLocaleString("mn-MN")}
                </p>
              </div>
              <span className="text-sm font-bold" style={{ color: "#1d4ed8" }}>{fmt(Number(sale.totalAmount))}</span>
            </div>

            <div className="space-y-2">
              {sale.items.map(item => {
                const isSelected = selected[item.id] !== undefined;
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id, item.quantity)}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all"
                    style={{
                      background: isSelected ? "#eff6ff" : "#f8fafc",
                      border: isSelected ? "1px solid #bfdbfe" : "1px solid transparent",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="size-4 rounded flex items-center justify-center shrink-0"
                        style={{ background: isSelected ? "#1d4ed8" : "white", border: `1px solid ${isSelected ? "#1d4ed8" : "#e2e8f0"}` }}
                      >
                        {isSelected && <svg width="10" height="8" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{item.medicine.name}</p>
                        <p className="text-xs" style={{ color: "#94a3b8" }}>
                          {item.quantity} {item.medicine.unit} × {fmt(Number(item.unitPrice))}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold shrink-0" style={{ color: "#0f172a" }}>
                      {fmt(Number(item.subtotal))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {Object.keys(selected).length > 0 && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "white", border: "1px solid #f1f5f9" }}>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                  Буцаалтын шалтгаан *
                </label>
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Жнь: Эм тохирохгүй байсан, хугацаа дууссан..."
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "#f8fafc", border: "1px solid #f1f5f9", color: "#0f172a" }}
                />
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: "#fef2f2" }}>
                <span className="text-sm font-medium" style={{ color: "#dc2626" }}>Буцаах дүн</span>
                <span className="text-xl font-bold" style={{ color: "#dc2626" }}>{fmt(refundTotal)}</span>
              </div>

              <button
                onClick={handleRefund}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#dc2626" }}
              >
                <RotateCcw className="size-4" />
                {isSubmitting ? "Боловсруулж байна..." : `Буцаалт хийх — ${fmt(refundTotal)}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}