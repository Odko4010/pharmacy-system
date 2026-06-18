"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingBag, X } from "lucide-react";
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
}

interface CartItem {
  medicineId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("mn-MN").format(value) + "₮";
}

export default function NewSalePage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/medicines?search=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then(setMedicines);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function addToCart(med: Medicine) {
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
      return [
        ...prev,
        {
          medicineId: med.id,
          name: med.name,
          unit: med.unit,
          unitPrice: Number(med.sellingPrice),
          quantity: 1,
          maxStock: med.totalStock,
        },
      ];
    });
  }

  function updateQuantity(medicineId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicineId !== medicineId) return item;
          const newQty = item.quantity + delta;
          if (newQty > item.maxStock) {
            showToast("Боломжтой нөөцөөс хэтэрсэн байна", "error");
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(medicineId: string) {
    setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));
  }

  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  async function handleCheckout() {
    if (cart.length === 0) {
      showToast("Сагсанд бараа хоосон байна", "error");
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

      showToast(`Борлуулалт амжилттай хийгдлээ — ${formatCurrency(total)}`, "success");
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setSearch("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Зүүн тал — эм хайх жагсаалт */}
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

      {/* Баруун тал — сагс */}
      <Card className="lg:sticky lg:top-20 self-start">
        <CardHeader>
          <h3 className="font-[var(--font-display)] font-semibold text-[var(--color-ink-900)] flex items-center gap-2">
            <ShoppingBag className="size-[18px]" />
            Сагс
            {cart.length > 0 && <Badge variant="brand">{cart.length}</Badge>}
          </h3>
        </CardHeader>
        <CardBody className="space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-500)] text-center py-6">Сагс хоосон байна</p>
          ) : (
            <div className="space-y-2.5 max-h-[30vh] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.medicineId} className="flex items-start justify-between gap-2 pb-2.5 border-b border-[var(--color-ink-100)] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink-900)] truncate">{item.name}</p>
                    <p className="text-xs text-[var(--color-ink-500)]">{formatCurrency(item.unitPrice)} / {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.medicineId, -1)}
                      className="size-6 flex items-center justify-center rounded bg-[var(--color-ink-100)] text-[var(--color-ink-700)] hover:bg-[var(--color-ink-300)]"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.medicineId, 1)}
                      className="size-6 flex items-center justify-center rounded bg-[var(--color-ink-100)] text-[var(--color-ink-700)] hover:bg-[var(--color-ink-300)]"
                    >
                      <Plus className="size-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.medicineId)}
                      className="ml-1 text-[var(--color-ink-500)] hover:text-[var(--color-danger)]"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-[var(--color-ink-100)] space-y-3">
            <Input
              placeholder="Хэрэглэгчийн нэр (заавал биш)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <Input
              placeholder="Утасны дугаар (заавал биш)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "CARD" | "TRANSFER")}>
              <option value="CASH">Бэлэн мөнгө</option>
              <option value="CARD">Карт</option>
              <option value="TRANSFER">Шилжүүлэг</option>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-ink-100)]">
            <span className="text-sm font-medium text-[var(--color-ink-700)]">Нийт дүн</span>
            <span className="font-[var(--font-display)] text-xl font-bold text-[var(--color-ink-900)]">
              {formatCurrency(total)}
            </span>
          </div>

          <Button className="w-full" size="lg" onClick={handleCheckout} isLoading={isSubmitting} disabled={cart.length === 0}>
            Гүйлгээ баталгаажуулах
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
