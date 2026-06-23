"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Minus, ShoppingBag, X, Printer } from "lucide-react";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";

interface Medicine {
  id: string;
  name: string;
  unit: string;
  sellingPrice: string;
  totalStock: number;
  strength: string | null;
  requiresPrescription: boolean;
  barcode?: string;
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
  createdAt: string;
  totalAmount: number;
  items: CartItem[];
  paymentMethod: string;
  customerName?: string;
  paidAmount: number;
  changeAmount: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("mn-MN").format(value) + "₮";
}

function printReceipt(sale: SaleResult) {
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;
  win.document.write(`
    <html>
    <head>
      <title>Баримт</title>
      <style>
        body { font-family: monospace; font-size: 13px; padding: 20px; max-width: 300px; margin: 0 auto; }
        h2 { text-align: center; margin-bottom: 4px; }
        p { text-align: center; margin: 2px 0; color: #555; }
        hr { border: none; border-top: 1px dashed #999; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 3px 0; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .total { font-size: 15px; font-weight: bold; }
      </style>
    </head>
    <body>
      <h2>ЭмСан</h2>
      <p>Эмийн сангийн систем</p>
      <p>${new Date(sale.createdAt).toLocaleString("mn-MN")}</p>
      <p>Баримт №: ${sale.id.slice(-8).toUpperCase()}</p>
      <hr/>
      <table>
        ${sale.items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td class="right">${item.quantity} x ${formatCurrency(item.unitPrice)}</td>
          </tr>
          <tr>
            <td></td>
            <td class="right bold">${formatCurrency(item.unitPrice * item.quantity)}</td>
          </tr>
        `).join("")}
      </table>
      <hr/>
      <table>
        <tr><td class="total">Нийт дүн</td><td class="right total">${formatCurrency(sale.totalAmount)}</td></tr>
        <tr><td>Төлсөн</td><td class="right">${formatCurrency(sale.paidAmount)}</td></tr>
        <tr><td>Хэлбэрэлт</td><td class="right">${formatCurrency(sale.changeAmount)}</td></tr>
        <tr><td>Төлбөр</td><td class="right">${sale.paymentMethod === "CASH" ? "Бэлэн" : sale.paymentMethod === "CARD" ? "Карт" : "Шилжүүлэг"}</td></tr>
      </table>
      <hr/>
      <p>Баярлалаа!</p>
    </body>
    </html>
  `);
  win.document.close();
  win.print();
}

export default function NewSalePage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [paidAmount, setPaidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState<SaleResult | null>(null);

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const paid = Number(paidAmount) || 0;
  const change = paid - total;

  const addToCart = useCallback((med: Medicine) => {
    if (med.totalStock <= 0) {
      showToast("Энэ эмийн нөөц дууссан байна", "error");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === med.id);
      if (existing) {
        if (existing.quantity >= med.totalStock) {
          showToast("Боломжтой нөөцөөс хэтэрсэн байна", "error");
          return prev;
        }
        return prev.map((item) =>
          item.medicineId === med.id ? { ...item, quantity: item.quantity + 1 } : item
        );
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
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!search) { setMedicines([]); return; }
      fetch(`/api/medicines?search=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((data: Medicine[]) => {
          setMedicines(data);
          if (data.length === 1 && data[0].barcode === search) {
            addToCart(data[0]);
            setSearch("");
            setMedicines([]);
          }
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, addToCart]);

  function updateQuantity(medicineId: string, delta: number) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.medicineId !== medicineId) return item;
        const newQty = item.quantity + delta;
        if (newQty > item.maxStock) {
          showToast("Боломжтой нөөцөөс хэтэрсэн байна", "error");
          return item;
        }
        return { ...item, quantity: newQty };
      }).filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(medicineId: string) {
    setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));
  }

  async function handleCheckout() {
    if (cart.length === 0) { showToast("Сагсанд бараа хоосон байна", "error"); return; }
    if (paymentMethod === "CASH" && paid < total) {
      showToast("Төлсөн мөнгө хүрэлцэхгүй байна", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          paymentMethod,
          items: cart.map((item) => ({ medicineId: item.medicineId, quantity: item.quantity })),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Гүйлгээ хийхэд алдаа гарлаа");
      }
      const saleData = await res.json();
      const sale: SaleResult = {
        ...saleData,
        items: cart,
        paidAmount: paid || total,
        changeAmount: Math.max(0, paid - total),
      };
      setLastSale(sale);
      showToast(`Борлуулалт амжилттай — ${formatCurrency(total)}`, "success");
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaidAmount("");
      setSearch("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Баримт хэвлэх modal */}
      {lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Гүйлгээ амжилттай! ✅</h2>
            <p className="text-sm text-gray-500 mb-4">Баримт хэвлэх үү?</p>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Нийт дүн</span>
                <span className="font-bold">{formatCurrency(lastSale.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Төлсөн</span>
                <span>{formatCurrency(lastSale.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Хэлбэрэлт</span>
                <span className="font-bold text-green-600">{formatCurrency(lastSale.changeAmount)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setLastSale(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm"
              >
                Хаах
              </button>
              <button
                onClick={() => { printReceipt(lastSale); setLastSale(null); }}
                className="flex-1 py-2 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2"
                style={{ background: "#1d4ed8" }}
              >
                <Printer className="size-4" /> Хэвлэх
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:col-span-2 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-ink-500)]" />
          <Input
            placeholder="Эм хайх (нэр эсвэл баркод)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <Card>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-[var(--color-ink-100)]">
            {medicines.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-ink-500)]">
                {search ? "Хайлтад тохирох эм олдсонгүй" : "Эм хайхын тулд дээрх талбарт бичиж эхэлнэ үү"}
              </div>
            ) : (
              medicines.map((med) => (
                <button
                  key={med.id}
                  onClick={() => addToCart(med)}
                  disabled={med.totalStock <= 0}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--color-brand-50)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-ink-900)]">{med.name}</p>
                    <p className="text-xs text-[var(--color-ink-500)]">
                      {med.strength && `${med.strength} · `}
                      Нөөц: {med.totalStock} {med.unit}
                      {med.requiresPrescription && " · Жорын эм"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[var(--color-brand-900)]">
                      {formatCurrency(Number(med.sellingPrice))}
                    </span>
                    <Plus className="size-4 text-[var(--color-brand-700)]" />
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="lg:sticky lg:top-20 self-start">
        <CardHeader>
          <h3 className="font-semibold text-[var(--color-ink-900)] flex items-center gap-2">
            <ShoppingBag className="size-[18px]" />
            Сагс
            {cart.length > 0 && <Badge variant="brand">{cart.length}</Badge>}
          </h3>
        </CardHeader>
        <CardBody className="space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-500)] text-center py-6">Сагс хоосон байна</p>
          ) : (
            <div className="space-y-2.5 max-h-[25vh] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.medicineId} className="flex items-start justify-between gap-2 pb-2.5 border-b border-[var(--color-ink-100)] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink-900)] truncate">{item.name}</p>
                    <p className="text-xs text-[var(--color-ink-500)]">{formatCurrency(item.unitPrice)} / {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateQuantity(item.medicineId, -1)}
                      className="size-6 flex items-center justify-center rounded bg-[var(--color-ink-100)] hover:bg-[var(--color-ink-300)]">
                      <Minus className="size-3" />
                    </button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.medicineId, 1)}
                      className="size-6 flex items-center justify-center rounded bg-[var(--color-ink-100)] hover:bg-[var(--color-ink-300)]">
                      <Plus className="size-3" />
                    </button>
                    <button onClick={() => removeFromCart(item.medicineId)}
                      className="ml-1 text-[var(--color-ink-500)] hover:text-[var(--color-danger)]">
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[var(--color-ink-100)] space-y-3">
            <Input placeholder="Хэрэглэгчийн нэр (заавал биш)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Input placeholder="Утасны дугаар (заавал биш)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "CARD" | "TRANSFER")}>
              <option value="CASH">Бэлэн мөнгө</option>
              <option value="CARD">Карт</option>
              <option value="TRANSFER">Шилжүүлэг</option>
            </Select>

            {paymentMethod === "CASH" && (
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Төлсөн мөнгө"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
                {paid > 0 && (
                  <div className="flex justify-between text-sm px-1">
                    <span className="text-gray-500">Хэлбэрэлт:</span>
                    <span className={`font-bold ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {formatCurrency(Math.max(0, change))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-ink-100)]">
            <span className="text-sm font-medium text-[var(--color-ink-700)]">Нийт дүн</span>
            <span className="text-xl font-bold text-[var(--color-ink-900)]">{formatCurrency(total)}</span>
          </div>

          <Button className="w-full" size="lg" onClick={handleCheckout} isLoading={isSubmitting} disabled={cart.length === 0}>
            Гүйлгээ баталгаажуулах
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
