import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saleCreateSchema } from "@/lib/validations/order";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const sales = await prisma.saleTransaction.findMany({
      where: {
        ...(from || to ? {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        } : {}),
      },
      include: {
        soldBy: { select: { firstName: true, lastName: true } },
        items: { include: { medicine: { select: { name: true, unit: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sales);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const data = saleCreateSchema.parse(body);

    const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      let totalAmount = 0;
      const saleItemsData: {
        medicineId: string;
        batchId: string | null;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }[] = [];

      for (const item of data.items) {
        const medicine = await tx.medicine.findUnique({
          where: { id: item.medicineId },
          include: { batches: { where: { quantity: { gt: 0 } }, orderBy: { expiryDate: "asc" } } },
        });

        if (!medicine) throw new Error(`MEDICINE_NOT_FOUND:${item.medicineId}`);

        const totalAvailable = medicine.batches.reduce((sum: number, b: typeof medicine.batches[number]) => sum + b.quantity, 0);
        if (totalAvailable < item.quantity) throw new Error(`INSUFFICIENT_STOCK:${medicine.name}:${totalAvailable}`);

        let remainingQty = item.quantity;
        for (const batch of medicine.batches) {
          if (remainingQty <= 0) break;
          const deductQty = Math.min(batch.quantity, remainingQty);
          await tx.batch.update({ where: { id: batch.id }, data: { quantity: { decrement: deductQty } } });
          saleItemsData.push({
            medicineId: medicine.id,
            batchId: batch.id,
            quantity: deductQty,
            unitPrice: Number(medicine.sellingPrice),
            subtotal: deductQty * Number(medicine.sellingPrice),
          });
          remainingQty -= deductQty;
        }
        totalAmount += item.quantity * Number(medicine.sellingPrice);
      }

      return await tx.saleTransaction.create({
        data: {
          totalAmount,
          soldById: session!.user.id,
          items: { create: saleItemsData },
        },
        include: { items: true },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}