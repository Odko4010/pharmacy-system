"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";

interface Medicine {
  id: string;
  name: string;
  unit: string;
  purchasePrice: string;
}
interface Supplier {
  id: string;
  name: string;
}
interface OrderLine {
  medicineId: string;
  quantity: number;
  unitPrice: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("mn-MN").format(value) + "₮";
}

export default function NewOrderPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/medicines").then((r) => r.json()).then(setMedicines);
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
  }, []);

  function addLine() {
    if (medicines.length === 0) return;
    setLines((prev) => [
      ...prev,
      { medicineId: medicines[0].id, quantity: 1, unitPrice: Number(medicines[0].purchasePrice) },
    ]);
  }

  function updateLine(index: number, updates: Partial<OrderLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...updates } : line)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMedicineChange(index: number, medicineId: string) {
    const med = medicines.find((m) => m.id === medicineId);
    updateLine(index, { medicineId, unitPrice: med ? Number(med.purchasePrice) : 0 });
  }

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId) {
      showToast("Нийлүүлэгч сонгоно уу", "error");
      return;
    }
    if (lines.length === 0) {
      showToast("Дор хаяж нэг бараа нэмнэ үү", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, notes, items: lines }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Захиалга үүсгэхэд алдаа гарлаа");
      }

      showToast("Захиалга амжилттай үүсгэгдлээ", "success");
      router.push("/dashboard/orders");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]">
        <ArrowLeft className="size-4" />
        Захиалгын жагсаалт руу буцах
      </Link>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <h3 className="font-[var(--font-display)] font-semibold text-[var(--color-ink-900)]">Захиалгын мэдээлэл</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="supplier" required>Нийлүүлэгч</Label>
              <Select id="supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                <option value="">— Сонгоно уу —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
              {suppliers.length === 0 && (
                <p className="mt-1.5 text-xs text-[var(--color-warning)]">
                  Бүртгэлтэй нийлүүлэгч байхгүй байна. Эхлээд &quot;Нийлүүлэгч&quot; хэсэгт нийлүүлэгч нэмнэ үү.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Тэмдэглэл</Label>
              <Textarea id="notes" placeholder="Нэмэлт тэмдэглэл..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-[var(--font-display)] font-semibold text-[var(--color-ink-900)]">Захиалгын бараа</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addLine}>
              <Plus className="size-4" />
              Бараа нэмэх
            </Button>
          </CardHeader>
          <CardBody>
            {lines.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-500)] text-center py-6">
                Захиалгад орох бараагаа &quot;Бараа нэмэх&quot; товчоор нэмнэ үү
              </p>
            ) : (
              <div className="space-y-3">
                {lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_140px_40px] gap-2 items-start">
                    <Select value={line.medicineId} onChange={(e) => handleMedicineChange(index, e.target.value)}>
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                      placeholder="Тоо"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={line.unitPrice}
                      onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) })}
                      placeholder="Үнэ"
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="p-2.5 text-[var(--color-ink-500)] hover:text-[var(--color-danger)]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {lines.length > 0 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--color-ink-100)]">
                <span className="text-sm font-medium text-[var(--color-ink-700)]">Нийт дүн</span>
                <span className="font-[var(--font-display)] text-lg font-bold text-[var(--color-ink-900)]">
                  {formatCurrency(total)}
                </span>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3 mt-4">
          <Link href="/dashboard/orders">
            <Button type="button" variant="secondary">Болих</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>Захиалга үүсгэх</Button>
        </div>
      </form>
    </div>
  );
}
