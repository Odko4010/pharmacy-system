import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    const sales = await prisma.saleTransaction.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      include: {
        soldBy: { select: { firstName: true, lastName: true } },
        items: {
          include: { medicine: { select: { name: true, unit: true } } }
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalAmount = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalItems = sales.reduce((sum, s) => sum + s.items.reduce((a, i) => a + i.quantity, 0), 0);

    const byDay: Record<string, number> = {};
    sales.forEach(s => {
      const key = s.createdAt.toISOString().split("T")[0];
      byDay[key] = (byDay[key] || 0) + Number(s.totalAmount);
    });

    const topMedicines: Record<string, { name: string; quantity: number; revenue: number }> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        if (!topMedicines[item.medicineId]) {
          topMedicines[item.medicineId] = { name: item.medicine.name, quantity: 0, revenue: 0 };
        }
        topMedicines[item.medicineId].quantity += item.quantity;
        topMedicines[item.medicineId].revenue += Number(item.unitPrice) * item.quantity;
      });
    });

    const topList = Object.values(topMedicines)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      totalAmount,
      totalSales: sales.length,
      totalItems,
      byDay: Object.entries(byDay).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)),
      topMedicines: topList,
      sales,
    });
  } catch (err) {
    return handleApiError(err);
  }
}