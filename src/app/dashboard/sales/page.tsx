"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Plus, Minus, X, ShoppingBag, ScanBarcode, Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

interface Medicine {
  id: string;
  name: string;
  genericName: string | null;
  barcode: string | null;
  unit: string;
  sellingPrice: string;
  totalStock: number;
  strength: string | null;
  requiresPrescription: boolean;
}

interface CartItem {
  medicineId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

interface SaleResult {
  id: string;
  totalAmount: number;
  createdAt: string;
  items: { medicine: { name: string; unit: string }; quantity: number; unitPrice: number; subtotal: number }[];
}

function fmt(v: number) {
  return new Intl.NumberFormat("mn-MN").format(v) + "₮";
}

export default function NewSalePage() {
  const { showToast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SaleResult | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!search.trim()) { setMedicines([]); return; }
      fetch(`/api/medicines?search=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then(setMedicines);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const addToCartById = useCallback(async (id: string) => {
    const found = medicines.find((m) => m.id === id);
    if (found) {
      addMed(found);
      return;
    }
    const res = await fetch(`/api/medicines/${id}`);
    if (res.ok) {
      const med = await res.json();
      addMed(med);
    }
  }, [medicines]);

  function addMed(med: Medicine) {
    if (med.totalStock <= 0) {
      showToast(`"${med.name}" нөөц дууссан байна`, "error");
      return;
    }
    setCart((prev) => {
      const ex = prev.find((i) => i.medicineId === med.id);
      if (ex) {
        if (ex.quantity >= med.totalStock) {
          showToast("Нөөцөөс хэтэрсэн байна", "error");
          return prev;
        }
        return prev.map((i) => i.medicineId === med.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        medicineId: med.id,
        name: med.name,
        unit: med.unit,
        unitPrice: Number(med.sellingPrice),
        quantity: 1,
        maxStock: med.totalStock,
      }];
    });
  }

  // POS баркод уншигч — баркодоор хайж сагсанд нэмнэ
  const handleBarcodeScan = useCallback(async (code: string) => {
    if (receipt) return;
    setLastScanned(code);
    setTimeout(() => setLastScanned(null), 2000);

    // Эхлээд одоогийн жагсаалтаас хай
    const found = medicines.find((m) => m.barcode === code);
    if (found) {
      addMed(found);
      return;
    }
    // Жагсаалтад байхгүй бол API-аас хай
    const res = await fetch(`/api/medicines/barcode?code=${encodeURIComponent(code)}`);
    if (res.ok) {
      const med = await res.json();
      addMed(med);
      showToast(`"${med.name}" сагсанд нэмэгдлээ`, "success");
    } else {
      showToast(`Баркод ${code} — эм олдсонгүй`, "error");
    }
  }, [medicines, receipt]);

  useBarcodeScanner({ onScan: handleBarcodeScan, enabled: !receipt });

  function updateQty(medicineId: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.medicineId !== medicineId) return i;
        const nq = i.quantity + delta;
        if (nq > i.maxStock) { showToast("Нөөцөөс хэтэрсэн байна", "error"); return i; }
        return { ...i, quantity: nq };
      }).filter((i) => i.quantity > 0)
    );
  }

  const total = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const cashNum = Number(cashReceived.replace(/[^0-9]/g, "")) || 0;
  const change = cashNum - total;

  async function handleCheckout() {
    if (cart.length === 0) { showToast("Сагс хоосон байна", "error"); return; }
    if (paymentMethod === "CASH" && cashNum < total) {
      showToast("Авсан мөнгө хүрэхгүй байна", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          items: cart.map((i) => ({ medicineId: i.medicineId, quantity: i.quantity })),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || "Алдаа гарлаа");
      }
      const data = await res.json();
      setReceipt({ ...data, items: cart.map((i) => ({ medicine: { name: i.name, unit: i.unit }, quantity: i.quantity, unitPrice: i.unitPrice, subtotal: i.unitPrice * i.quantity })) });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNewSale() {
    setCart([]);
    setReceipt(null);
    setCashReceived("");
    setSearch("");
    setMedicines([]);
    setTimeout(() => searchRef.current?.focus(), 100);
  }

  function handlePrint() {
    window.print();
  }

  // ── БАРИМТ ДЭЛГЭЦ ──
  if (receipt) {
    return (
      <div className="max-w-sm mx-auto pt-6 print:pt-0">
        <div
          id="receipt"
          className="rounded-2xl p-6 print:rounded-none print:shadow-none"
          style={{ background: "white", border: "1px solid #f1f5f9" }}
        >
          {/* Гарчиг */}
          <div className="text-center mb-5 pb-4" style={{ borderBottom: "1px dashed #e2e8f0" }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Receipt className="size-5" style={{ color: "#1d4ed8" }} />
              <p className="font-bold text-lg" style={{ color: "#0f172a" }}>Баримт</p>
            </div>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              {new Date(receipt.createdAt).toLocaleString("mn-MN")}
            </p>
            <p className="text-xs font-mono mt-1" style={{ color: "#cbd5e1" }}>
              #{receipt.id.slice(-8).toUpperCase()}
            </p>
          </div>

          {/* Эмүүд */}
          <div className="space-y-2.5 mb-5">
            {receipt.items.map((item, i) => (
              <div key={i} className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{item.medicine.name}</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>
                    {item.quantity} {item.medicine.unit} × {fmt(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold shrink-0" style={{ color: "#0f172a" }}>{fmt(item.subtotal)}</p>
              </div>
            ))}
          </div>

          {/* Нийт */}
          <div className="pt-4 space-y-2" style={{ borderTop: "1px dashed #e2e8f0" }}>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "#64748b" }}>Нийт дүн</span>
              <span className="text-xl font-bold" style={{ color: "#0f172a" }}>{fmt(total)}</span>
            </div>
            {paymentMethod === "CASH" && cashNum > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#64748b" }}>Авсан мөнгө</span>
                  <span className="text-sm font-medium" style={{ color: "#0f172a" }}>{fmt(cashNum)}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 rounded-lg" style={{ background: "#f0fdf4" }}>
                  <span className="text-sm font-medium" style={{ color: "#15803d" }}>Хариу мөнгө</span>
                  <span className="text-lg font-bold" style={{ color: "#15803d" }}>{fmt(change)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "#94a3b8" }}>Төлбөрийн хэрэгсэл</span>
              <span className="text-xs font-medium" style={{ color: "#64748b" }}>
                {{ CASH: "Бэлэн мөнгө", CARD: "Карт", TRANSFER: "Шилжүүлэг" }[paymentMethod]}
              </span>
            </div>
          </div>

          {/* Баярлалаа */}
          <p className="text-center text-xs mt-5" style={{ color: "#cbd5e1" }}>
            Үйлчлүүлсэнд баярлалаа 🙏
          </p>
        </div>

        {/* Товчлуурууд */}
        <div className="flex gap-3 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}
          >
            <Printer className="size-4" />
            Хэвлэх
          </button>
          <button
            onClick={handleNewSale}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: "#1d4ed8" }}
          >
            <Plus className="size-4" />
            Шинэ борлуулалт
          </button>
        </div>
      </div>
    );
  }

  // ── POS ДЭЛГЭЦ ──
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-80px)]">

      {/* ── ЗҮҮН: Эм хайх ── */}
      <div className="lg:col-span-3 flex flex-col gap-3 overflow-hidden">

        {/* Хайлт */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "#94a3b8" }} />
            <input
              ref={searchRef}
              autoFocus
              placeholder="Эм хайх (нэр, баркод)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1px solid #f1f5f9", color: "#0f172a" }}
            />
          </div>
          {/* Баркод төлөв */}
          <div
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium shrink-0"
            style={lastScanned
              ? { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }
              : { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }
            }
          >
            <ScanBarcode className="size-3.5" />
            {lastScanned ? lastScanned.slice(0, 12) : "Уншигч бэлэн"}
          </div>
        </div>

        {/* Эмийн жагсаалт */}
        <div
          className="flex-1 overflow-y-auto rounded-2xl"
          style={{ background: "white", border: "1px solid #f1f5f9" }}
        >
          {medicines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
              <div className="flex items-center justify-center size-14 rounded-2xl" style={{ background: "#f8fafc" }}>
                <ScanBarcode className="size-7" style={{ color: "#cbd5e1" }} />
              </div>
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                {search ? "Хайлтад тохирох эм олдсонгүй" : "Эм хайх эсвэл баркод уншуулна уу"}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f8fafc" }}>
              {medicines.map((med) => (
                <button
                  key={med.id}
                  onClick={() => addMed(med)}
                  disabled={med.totalStock <= 0}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{med.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                      {med.strength && `${med.strength} · `}
                      Нөөц: {med.totalStock} {med.unit}
                      {med.requiresPrescription && " · 🔒 Жор"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold" style={{ color: "#1d4ed8" }}>
                      {fmt(Number(med.sellingPrice))}
                    </span>
                    <div
                      className="flex items-center justify-center size-7 rounded-lg"
                      style={{ background: "#eff6ff" }}
                    >
                      <Plus className="size-3.5" style={{ color: "#1d4ed8" }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── БАРУУН: Сагс ── */}
      <div
        className="lg:col-span-2 flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "white", border: "1px solid #f1f5f9" }}
      >
        {/* Сагсны гарчиг */}
        <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid #f8fafc" }}>
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-4" style={{ color: "#64748b" }} />
            <span className="font-semibold text-sm" style={{ color: "#0f172a" }}>Сагс</span>
            {cart.length > 0 && (
              <span className="flex items-center justify-center size-5 rounded-full text-xs font-bold text-white" style={{ background: "#1d4ed8" }}>
                {cart.length}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs px-2.5 py-1 rounded-lg transition-colors"
              style={{ color: "#ef4444", background: "#fef2f2" }}
            >
              Цэвэрлэх
            </button>
          )}
        </div>

        {/* Сагсны эмүүд */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "#cbd5e1" }}>
              Эм нэмээгүй байна
            </p>
          ) : (
            cart.map((item) => (
              <div
                key={item.medicineId}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl"
                style={{ background: "#f8fafc" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{item.name}</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>{fmt(item.unitPrice)} / {item.unit}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => updateQty(item.medicineId, -1)}
                    className="flex items-center justify-center size-6 rounded-lg text-sm font-bold transition-colors"
                    style={{ background: "#f1f5f9", color: "#64748b" }}
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold" style={{ color: "#0f172a" }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.medicineId, 1)}
                    className="flex items-center justify-center size-6 rounded-lg text-sm font-bold transition-colors"
                    style={{ background: "#eff6ff", color: "#1d4ed8" }}
                  >
                    <Plus className="size-3" />
                  </button>
                  <button
                    onClick={() => setCart((p) => p.filter((i) => i.medicineId !== item.medicineId))}
                    className="ml-1 flex items-center justify-center size-6 rounded-lg transition-colors"
                    style={{ color: "#94a3b8" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <span className="text-sm font-bold w-20 text-right shrink-0" style={{ color: "#0f172a" }}>
                  {fmt(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Доод хэсэг */}
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid #f1f5f9" }}>

          {/* Төлбөрийн хэрэгсэл */}
          <div className="flex gap-2">
            {(["CASH", "CARD", "TRANSFER"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-colors"
                style={paymentMethod === m
                  ? { background: "#1d4ed8", color: "white" }
                  : { background: "#f8fafc", color: "#64748b", border: "1px solid #f1f5f9" }
                }
              >
                {{ CASH: "💵 Бэлэн", CARD: "💳 Карт", TRANSFER: "🏦 Шилжүүлэг" }[m]}
              </button>
            ))}
          </div>

          {/* Бэлэн мөнгө авсан */}
          {paymentMethod === "CASH" && (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  placeholder="Авсан мөнгө оруулах..."
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-right font-mono"
                  style={{ background: "#f8fafc", border: "1px solid #f1f5f9", color: "#0f172a" }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#94a3b8" }}>₮</span>
              </div>

              {/* Хариу мөнгө */}
              {cashNum > 0 && (
                <div
                  className="flex justify-between items-center px-3 py-2.5 rounded-xl"
                  style={change >= 0
                    ? { background: "#f0fdf4", border: "1px solid #bbf7d0" }
                    : { background: "#fef2f2", border: "1px solid #fecaca" }
                  }
                >
                  <span className="text-sm font-medium" style={{ color: change >= 0 ? "#15803d" : "#dc2626" }}>
                    {change >= 0 ? "Хариу мөнгө" : "Дутуу мөнгө"}
                  </span>
                  <span className="text-lg font-bold" style={{ color: change >= 0 ? "#15803d" : "#dc2626" }}>
                    {fmt(Math.abs(change))}
                  </span>
                </div>
              )}

              {/* Хурдан мөнгөний товч */}
              {total > 0 && (
                <div className="flex gap-1.5">
                  {[total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000]
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 4)
                    .map((v) => (
                      <button
                        key={v}
                        onClick={() => setCashReceived(String(v))}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: "#f1f5f9", color: "#475569" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                      >
                        {fmt(v)}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Нийт дүн */}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm" style={{ color: "#64748b" }}>Нийт дүн</span>
            <span className="text-2xl font-bold" style={{ color: "#0f172a" }}>{fmt(total)}</span>
          </div>

          {/* Баталгаажуулах */}
          <button
            onClick={handleCheckout}
            disabled={isSubmitting || cart.length === 0 || (paymentMethod === "CASH" && cashNum > 0 && change < 0)}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#1d4ed8" }}
          >
            {isSubmitting ? "Боловсруулж байна..." : `Баталгаажуулах — ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}