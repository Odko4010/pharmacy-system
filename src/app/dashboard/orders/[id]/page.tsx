"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "RECEIVED" | "CANCELLED";
  totalAmount: string;
  notes: string | null;
  orderDate: string;
  supplier: { name: string };
  items: { id: string; quantity: number; unitPrice: string; medicine: { id: string; name: string; unit: string } }[];
}

interface ReceiveLine {
  medicineId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("mn-MN").format(Number(value)) + "₮";
}

const statusConfig: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "danger" | "brand" }> = {
  PENDING: { label: "Хүлээгдэж байна", variant: "warning" },
  CONFIRMED: { label: "Баталгаажсан", variant: "brand" },
  RECEIVED: { label: "Хүлээж авсан", variant: "success" },
  CANCELLED: { label: "Цуцлагдсан", variant: "danger" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [receiveLines, setReceiveLines] = useState<ReceiveLine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(async (r) => {
        if (!r.ok) {
          // Захиалгын жагсаалт endpoint-оор дамжуулж дэлгэрэнгүйг авна (тусдаа GET /api/orders/[id] байхгүй бол)
          const allOrders = await fetch("/api/orders").then((res) => res.json());
          return allOrders.find((o: OrderDetail) => o.id === params.id);
        }
        return r.json();
      })
      .then((data) => {
        setOrder(data);
        if (data) {
          setReceiveLines(
            data.items.map((item: OrderDetail["items"][0]) => ({
              medicineId: item.medicine.id,
              batchNumber: "",
              quantity: item.quantity,
              expiryDate: "",
            }))
          );
        }
        setIsLoading(false);
      });
  }, [params.id]);

  function updateReceiveLine(index: number, updates: Partial<ReceiveLine>) {
    setReceiveLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...updates } : line)));
  }

  async function handleReceive() {
    const incomplete = receiveLines.some((line) => !line.batchNumber || !line.expiryDate);
    if (incomplete) {
      showToast("Бүх бараанд лотын дугаар, дуусах хугацаа оруулна уу", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${params.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: receiveLines }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Хүлээж авахад алдаа гарлаа");
      }

      showToast("Захиалга амжилттай хүлээж авлаа, нөөц шинэчлэгдлээ", "success");
      router.push("/dashboard/orders");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-[var(--color-ink-500)]">Уншиж байна...</div>;
  }

  if (!order) {
    return <div className="text-sm text-[var(--color-ink-500)]">Захиалга олдсонгүй</div>;
  }

  const status = statusConfig[order.status];

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]">
        <ArrowLeft className="size-4" />
        Захиалгын жагсаалт руу буцах
      </Link>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="font-[var(--font-display)] font-semibold text-[var(--color-ink-900)]">{order.orderNumber}</h3>
            <p className="text-sm text-[var(--color-ink-500)] mt-0.5">{order.supplier.name}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </CardHeader>
        <CardBody>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-ink-100)]">
                <th className="text-left py-2 font-medium text-[var(--color-ink-700)]">Эм</th>
                <th className="text-right py-2 font-medium text-[var(--color-ink-700)]">Тоо</th>
                <th className="text-right py-2 font-medium text-[var(--color-ink-700)]">Нэгж үнэ</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--color-ink-100)] last:border-0">
                  <td className="py-2.5 text-[var(--color-ink-900)]">{item.medicine.name}</td>
                  <td className="py-2.5 text-right text-[var(--color-ink-700)]">{item.quantity} {item.medicine.unit}</td>
                  <td className="py-2.5 text-right text-[var(--color-ink-700)]">{formatCurrency(item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end pt-3 mt-1 border-t border-[var(--color-ink-100)]">
            <span className="font-semibold text-[var(--color-ink-900)]">Нийт: {formatCurrency(order.totalAmount)}</span>
          </div>
        </CardBody>
      </Card>

      {order.status !== "RECEIVED" && order.status !== "CANCELLED" && (
        <Card>
          <CardHeader>
            <h3 className="font-[var(--font-display)] font-semibold text-[var(--color-ink-900)] flex items-center gap-2">
              <PackageCheck className="size-[18px]" />
              Агуулахад хүлээж авах
            </h3>
            <p className="text-sm text-[var(--color-ink-500)] mt-1">
              Бараа бүрт лотын дугаар, хүчинтэй хугацааг оруулснаар нөөц автоматаар нэмэгдэнэ
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            {order.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-[var(--color-ink-100)] last:border-0 last:pb-0">
                <div className="sm:col-span-3">
                  <p className="text-sm font-medium text-[var(--color-ink-900)]">{item.medicine.name} ({item.quantity} {item.medicine.unit})</p>
                </div>
                <div>
                  <Label htmlFor={`batch-${index}`} required>Лотын дугаар</Label>
                  <Input
                    id={`batch-${index}`}
                    placeholder="LOT-001"
                    value={receiveLines[index]?.batchNumber || ""}
                    onChange={(e) => updateReceiveLine(index, { batchNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`qty-${index}`} required>Хүлээж авах тоо</Label>
                  <Input
                    id={`qty-${index}`}
                    type="number"
                    min={1}
                    value={receiveLines[index]?.quantity || item.quantity}
                    onChange={(e) => updateReceiveLine(index, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor={`expiry-${index}`} required>Дуусах хугацаа</Label>
                  <Input
                    id={`expiry-${index}`}
                    type="date"
                    value={receiveLines[index]?.expiryDate || ""}
                    onChange={(e) => updateReceiveLine(index, { expiryDate: e.target.value })}
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <Button onClick={handleReceive} isLoading={isSubmitting}>
                <PackageCheck className="size-4" />
                Хүлээж авах баталгаажуулах
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
