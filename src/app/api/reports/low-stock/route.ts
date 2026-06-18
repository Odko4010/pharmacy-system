import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const medicines = await prisma.medicine.findMany({
      where: { isActive: true },
      include: { batches: true, category: true },
    });

    const lowStock = medicines
  .map((m: typeof medicines[number]) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    minStockLevel: m.minStockLevel,
    category: m.category?.name || null,
    totalStock: m.batches.reduce((sum: number, b: typeof m.batches[number]) => sum + b.quantity, 0),
  }))
  .sort((a: { totalStock: number }, b: { totalStock: number }) => a.totalStock - b.totalStock);

    return NextResponse.json(lowStock);
  } catch (err) {
    return handleApiError(err);
  }
}
