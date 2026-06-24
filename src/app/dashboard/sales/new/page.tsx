"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Plus, Minus, ShoppingBag, X, Printer, AlertTriangle, Package } from "lucide-react";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  unit: string;
  sellingPrice: string;
  purchasePrice: string;
  totalStock: number;
  strength: string | null;
  dosageForm: string | null;
  requiresPrescription: boolean;
  barcode?: string;
  category?: { name: string };
}

interface CartItem {
  medicineId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
  strength?: string | null;
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

const QUICK_AMOUNTS = [1000, 5000, 10000, 20000, 50000, 100000];

function printReceipt(sale: SaleResult, storeName: string = "ЭмСан") {
  const win = window.open("", "_blank", "width=380,height=700");
  if (!win) return;
  win.document.write(`
    <html>
    <head>
      <title>Баримт</title>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; max-width: 280px; margin: 0 auto; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .large { font-size: 16px; }
        .small { font-size: 10px; color: #666; }
        hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; vertical-align: top; }
        .item-name { max-width: 160px; }
        .highlight { font-size: 14px; font-weight: bold; }
        .change { font-size: 16px; font-weight: bold; color: #16a34a; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="bold large">${storeName}</div>
        <div class="small">Эмийн сангийн систем</div>
        <div class="small">${new Date(sale.createdAt).toLocaleString("mn-MN")}</div>
        <div class="small">Баримт №: ${sale.id.slice(-8).toUpperCase()}</div>
      </div>
      <hr/>
      <table>
        <tr>
          <td class="bold">Бараа</td>
          <td class="bold right">Тоо</td>
          <td class="bold right">Үнэ</td>
          <td class="bold right">Дүн</td>
        </tr>
        <tr><td colspan="4"><hr/></td></tr>
        ${sale.items.map(item => `
          <tr>
            <td class="item-name">${item.name}${item.strength ? ` ${item.strength}` : ""}</td>
            <td class="right">${item.quantity}</td>
            <td class="right">${formatCurrency(item.unitPrice)}</td>
            <td class="right bold">${formatCurrency(item.unitPrice * item.quantity)}</td>
          </tr>
        `).join("")}
      </table>
      <hr/>
      <table>
        <tr>
          <td class="highlight">НИЙТ ДҮН</td>
          <td class="right highlight">${formatCurrency(sale.totalAmount)}</td>
        </tr>
        <tr>
          <td>Төлбөрийн хэлбэр</td>
          <td class="right">${sale.paymentMethod === "CASH" ? "Бэлэн мөнгө" : sale.paymentMethod === "CARD" ? "Карт" : "Шилжүүлэг"}</td>
        </tr>
        ${sale.paymentMethod === "CASH" ? `
        <tr>
          <td>Төлсөн мөнгө</td>
          <td class="right">${formatCurrency(sale.paidAmount)}</td>
        </tr>
        <tr>
          <td class="bold">Хэлбэрэлт</td>
          <td class="right change">${formatCurrency(sale.changeAmount)}</td>
        </tr>
        ` : ""}
      </table>
      <hr/>
      <div class="center small">
        <div>Манай эмийн санд үйлчлүүлсэнд баярлалаа!</div>
        <div>Эрүүл энх байгаарай 🙏</div>
      </div>
    </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

export default function NewSalePage() {
  const { showToast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
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
        strength: med.strength,
      }];
    });
    setSearch("");
    setMedicines([]);
    searchRef.current?.focus();
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!search) { setMedicines([]); setSelectedIndex(0); return; }
      fetch(`/api/medicines?search=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((data: Medicine[]) => {
          setMedicines(data);
          setSelectedIndex(0);
          if (data.length === 1 && data[0].barcode === search) {
            addToCart(data[0]);
          }
        });
    }, 200);
    return () => clearTimeout(timer);
  }, [search, addToCart]);

  // Гарын товчлуур
  function handleKeyDown(e: React.KeyboardEvent) {
    if (medicines.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, medicines.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (medicines[selectedIndex]) addToCart(medicines[selectedIndex]);
    } else if (e.key === "Escape") {
      setSearch("");
      setMedicines([]);
    }
  }

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
    if (paymentMethod === "CASH" && paid > 0 && paid < total) {
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
        changeAmount: Math.max(0, (paid || total) - total),
      };
      setLastSale(sale);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaidAmount("");
      setSearch("");
      searchRef.current?.focus();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-1">
      {/* Баримт modal */}
      {lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-3xl mb-1">✅</div>
              <h2 className="text-lg font-bold text-gray-900">Гүйлгээ амжилттай!</h2>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Нийт дүн</span>
                <span className="font-bold text-base">{formatCurrency(lastSale.totalAmount)}</span>
              </div>
              {lastSale.paymentMethod === "CASH" && <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Төлсөн</span>
                  <span>{formatCurrency(lastSale.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Хэлбэрэлт</span>
                  <span className="font-bold text-green-600 text-base">{formatCurrency(lastSale.changeAmount)}</span>
                </div>
              </>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setLastSale(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium">
                Хаах
              </button>
              <button onClick={() => { printReceipt(lastSale); setLastSale(null); }}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2"
                style={{ background: "#1d4ed8" }}>
                <Printer className="size-4" /> Баримт хэвлэх
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Зүүн тал — эм хайх */}
      <div className="lg:col-span-2 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-ink-500)]" />
          <Input
            ref={searchRef}
            placeholder="Эм хайх — нэр, баркод, INN... (↑↓ сонгох, Enter нэмэх)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
            autoFocus
          />
        </div>

        {medicines.length > 0 && (
          <Card>
            <div className="max-h-[65vh] overflow-y-auto divide-y divide-[var(--color-ink-100)]">
              {medicines.map((med, i) => (
                <button
                  key={med.id}
                  onClick={() => addToCart(med)}
                  disabled={med.totalStock <= 0}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: i === selectedIndex ? "var(--color-brand-50)" : "transparent" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--color-ink-900)]">{med.name}</p>
                      {med.requiresPrescription && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-600">Жорын</span>
                      )}
                      {med.totalStock <= 5 && med.totalStock > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600 flex items-center gap-1">
                          <AlertTriangle className="size-2.5" /> Дутагдалтай
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {med.genericName && <span className="text-xs text-gray-400">{med.genericName}</span>}
                      {med.strength && <span className="text-xs text-[var(--color-ink-500)]">{med.strength}</span>}
                      {med.dosageForm && <span className="text-xs text-[var(--color-ink-400)]">· {med.dosageForm}</span>}
                      {med.category && <span className="text-xs text-blue-400">· {med.category.name}</span>}
                      <span className="text-xs flex items-center gap-1" style={{ color: med.totalStock <= 0 ? "#dc2626" : med.totalStock <= 5 ? "#ea580c" : "#16a34a" }}>
                        <Package className="size-3" /> {med.totalStock} {med.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--color-ink-900)]">{formatCurrency(Number(med.sellingPrice))}</p>
                    </div>
                    <div className="size-7 flex items-center justify-center rounded-lg" style={{ background: "var(--color-brand-100)" }}>
                      <Plus className="size-4 text-[var(--color-brand-700)]" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {medicines.length === 0 && !search && (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <div className="text-center">
              <Search className="size-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Эм хайхын тулд нэр эсвэл баркод оруулна уу</p>
              <p className="text-xs mt-1 opacity-60">Баркод уншигч ашиглаж болно</p>
            </div>
          </div>
        )}
      </div>

      {/* Баруун тал — сагс */}
      <Card className="lg:sticky lg:top-4 self-start">
        <CardHeader>
          <h3 className="font-semibold text-[var(--color-ink-900)] flex items-center gap-2">
            <ShoppingBag className="size-[18px]" />
            Сагс
            {cart.length > 0 && <Badge variant="brand">{cart.length}</Badge>}
          </h3>
        </CardHeader>
        <CardBody className="space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="size-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm text-[var(--color-ink-500)]">Сагс хоосон байна</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[30vh] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.medicineId} className="flex items-start justify-between gap-2 pb-2 border-b border-[var(--color-ink-100)] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink-900)] truncate">{item.name}</p>
                    <p className="text-xs text-[var(--color-ink-500)]">
                      {item.strength && `${item.strength} · `}
                      {formatCurrency(item.unitPrice)} / {item.unit}
                    </p>
                    <p className="text-xs font-semibold text-[var(--color-ink-700)]">
                      = {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateQuantity(item.medicineId, -1)}
                      className="size-6 flex items-center justify-center rounded bg-[var(--color-ink-100)] hover:bg-[var(--color-ink-200)]">
                      <Minus className="size-3" />
                    </button>
                    <span className="text-sm w-7 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.medicineId, 1)}
                      className="size-6 flex items-center justify-center rounded bg-[var(--color-ink-100)] hover:bg-[var(--color-ink-200)]">
                      <Plus className="size-3" />
                    </button>
                    <button onClick={() => removeFromCart(item.medicineId)}
                      className="ml-0.5 size-6 flex items-center justify-center rounded hover:bg-red-50">
                      <X className="size-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[var(--color-ink-100)] space-y-2">
            <Input placeholder="Хэрэглэгчийн нэр (заавал биш)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value as "CASH" | "CARD" | "TRANSFER"); setPaidAmount(""); }}>
              <option value="CASH">💵 Бэлэн мөнгө</option>
              <option value="CARD">💳 Карт</option>
              <option value="TRANSFER">📱 Шилжүүлэг</option>
            </Select>

            {paymentMethod === "CASH" && (
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Төлсөн мөнгө оруулна уу"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
                {/* Хурдан сонголт */}
                <div className="grid grid-cols-3 gap-1">
                  {QUICK_AMOUNTS.filter(a => a >= total).slice(0, 3).map(amount => (
                    <button key={amount} onClick={() => setPaidAmount(String(amount))}
                      className="py-1 px-2 rounded-lg text-xs font-medium border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      {amount >= 1000 ? `${amount/1000}K` : amount}
                    </button>
                  ))}
                  <button onClick={() => setPaidAmount(String(total))}
                    className="py-1 px-2 rounded-lg text-xs font-medium border border-blue-300 text-blue-600 hover:bg-blue-50 col-span-3">
                    Яг {formatCurrency(total)}
                  </button>
                </div>
                {paid > 0 && (
                  <div className="flex justify-between items-center px-2 py-1.5 rounded-lg" style={{ background: change >= 0 ? "#f0fdf4" : "#fef2f2" }}>
                    <span className="text-sm font-medium">Хэлбэрэлт:</span>
                    <span className={`text-base font-bold ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {change >= 0 ? formatCurrency(change) : `-${formatCurrency(Math.abs(change))}`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-ink-100)]">
            <span className="text-sm font-medium text-[var(--color-ink-700)]">Нийт дүн</span>
            <span className="text-2xl font-bold text-[var(--color-ink-900)]">{formatCurrency(total)}</span>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            isLoading={isSubmitting}
            disabled={cart.length === 0}
          >
            ✓ Гүйлгээ баталгаажуулах
          </Button>

          {cart.length > 0 && (
            <button onClick={() => setCart([])}
              className="w-full py-2 text-sm text-red-400 hover:text-red-600 transition-colors">
              Сагс цэвэрлэх
            </button>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
