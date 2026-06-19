import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Өнөөдрийн борлуулалт
    const todaySales = await prisma.saleTransaction.aggregate({
      where: { createdAt: { gte: today, lt: tomorrow } },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Нийт эмийн төрөл
    const totalMedicines = await prisma.medicine.count({ where: { isActive: true } });

    // Бага нөөцтэй эмийн тоо (доод хэмжээнээс бага)
    const allMedicines = await prisma.medicine.findMany({
      where: { isActive: true },
      include: { batches: true },
    });
   const lowStockCount = allMedicines.filter((m: typeof allMedicines[number]) => {
  const total = m.batches.reduce((sum: number, b: typeof m.batches[number]) => sum + b.quantity, 0);
      return total <= m.minStockLevel;
    }).length;

    // Хугацаа дуусах гэж буй батчуудын тоо (30 хоногийн дотор)
    const expiringSoonCount = await prisma.batch.count({
      where: {
        expiryDate: { gte: today, lte: thirtyDaysFromNow },
        quantity: { gt: 0 },
      },
    });

    // Хүлээгдэж буй захиалгын тоо
    const pendingOrdersCount = await prisma.order.count({
      where: { status: { in: ["PENDING", "CONFIRMED"] } },
    });
    
    // Сарын борлуулалтын график (сүүлийн 7 хоног)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentSales = await prisma.saleTransaction.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, totalAmount: true },
    });

    const salesByDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      salesByDay[key] = 0;
    }
    recentSales.forEach((sale: typeof recentSales[number]) => {
      const key = sale.createdAt.toISOString().split("T")[0];
      if (salesByDay[key] !== undefined) {
        salesByDay[key] += Number(sale.totalAmount);
      }
    });
    // Сүүлийн 7 хоногт хамгийн их зарагдсан эмүүд
const topMedicinesRaw = await prisma.saleItem.groupBy({
  by: ["medicineId"],
  where: { sale: { createdAt: { gte: sevenDaysAgo } } },
  _sum: { quantity: true },
  orderBy: { _sum: { quantity: "desc" } },
  take: 5,
});

const topMedicines = await Promise.all(
  topMedicinesRaw.map(async (item: typeof topMedicinesRaw[number]) => {
    const med = await prisma.medicine.findUnique({
      where: { id: item.medicineId },
      select: { name: true },
    });
    return { name: med?.name || "—", quantity: item._sum.quantity || 0 };
  })
);
    return NextResponse.json({
      todaySalesAmount: Number(todaySales._sum.totalAmount || 0),
      todaySalesCount: todaySales._count,
      totalMedicines,
      lowStockCount,
      expiringSoonCount,
      pendingOrdersCount,
      salesChart: Object.entries(salesByDay).map(([date, amount]) => ({ date, amount })),
      topMedicines,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
