"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "RECEIVED" | "CANCELLED";
  totalAmount: string;
  orderDate: string;
  supplier: { name: string };
  createdBy: { firstName: string; lastName: string };
  items: { quantity: number; medicine: { name: string; unit: string } }[];
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("mn-MN").format(Number(value)) + "₮";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

const statusConfig: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "danger" }> = {
  PENDING: { label: "Хүлээгдэж байна", variant: "warning" },
  CONFIRMED: { label: "Баталгаажсан", variant: "brand" as "neutral" },
  RECEIVED: { label: "Хүлээж авсан", variant: "success" },
  CANCELLED: { label: "Цуцлагдсан", variant: "danger" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-500)]">Нийт {orders.length} захиалга</p>
        <Link href="/dashboard/orders/new">
          <Button>
            <Plus className="size-4" />
            Шинэ захиалга
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--color-ink-100)] animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <ShoppingCart className="size-10 text-[var(--color-ink-300)] mx-auto mb-3" />
            <p className="text-[var(--color-ink-500)] mb-4">Одоогоор захиалга үүсгэгдээгүй байна</p>
            <Link href="/dashboard/orders/new">
              <Button>Анхны захиалга үүсгэх</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-ink-100)] bg-[var(--color-ink-50)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-700)]">Дугаар</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-700)]">Нийлүүлэгч</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-700)]">Огноо</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-700)]">Төлөв</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--color-ink-700)]">Дүн</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const status = statusConfig[order.status];
                  return (
                    <tr key={order.id} className="border-b border-[var(--color-ink-100)] last:border-0 hover:bg-[var(--color-ink-50)]/50">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-700)]">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-900)] font-medium">{order.supplier.name}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-700)]">{formatDate(order.orderDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[var(--color-ink-900)]">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/dashboard/orders/${order.id}`} className="text-[var(--color-brand-700)] text-xs font-medium hover:underline">
                          Дэлгэрэнгүй
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
