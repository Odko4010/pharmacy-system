"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SaleTransaction {
  id: string;
  transactionNumber: string;
  totalAmount: string;
  customerName: string | null;
  paymentMethod: string;
  createdAt: string;
  soldBy: { firstName: string; lastName: string };
  items: { quantity: number; medicine: { name: string; unit: string } }[];
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("mn-MN").format(Number(value)) + "₮";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const paymentLabels: Record<string, string> = {
  CASH: "Бэлэн мөнгө",
  CARD: "Карт",
  TRANSFER: "Шилжүүлэг",
};

export default function SalesPage() {
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sales")
      .then((r) => r.json())
      .then((data) => {
        setSales(data);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-500)]">Нийт {sales.length} гүйлгээ бүртгэгдсэн</p>
        <Link href="/dashboard/sales/new">
          <Button>
            <Plus className="size-4" />
            Шинэ борлуулалт
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--color-ink-100)] animate-pulse" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Receipt className="size-10 text-[var(--color-ink-300)] mx-auto mb-3" />
            <p className="text-[var(--color-ink-500)] mb-4">Одоогоор борлуулалт бүртгэгдээгүй байна</p>
            <Link href="/dashboard/sales/new">
              <Button>Анхны борлуулалт хийх</Button>
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
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-700)]">Огноо</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-700)]">Бараа</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-700)]">Худалдан авагч</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-ink-700)]">Төлбөр</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--color-ink-700)]">Дүн</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-[var(--color-ink-100)] last:border-0 hover:bg-[var(--color-ink-50)]/50">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-700)]">{sale.transactionNumber}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-700)]">{formatDateTime(sale.createdAt)}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-700)]">
                      {sale.items.length} төрөл ({sale.items.reduce((s, i) => s + i.quantity, 0)} нэгж)
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-700)]">{sale.customerName || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{paymentLabels[sale.paymentMethod] || sale.paymentMethod}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--color-ink-900)]">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
