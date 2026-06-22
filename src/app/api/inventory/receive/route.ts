import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const receiveSchema = z.object({
  items: z.array(z.object({
    medicineId: z.string().min(1),
    batchNumber: z.string().min(1, "Лотын дугаар оруулна уу"),
    quantity: z.coerce.number().int().positive("Тоо хэмжээ эерэг байх ёстой"),
    expiryDate: z.coerce.date(),
    purchasePrice: z.coerce.number().positive().optional(),
  })).min(1),
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const data = receiveSchema.parse(body);

    const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      const batches = [];
      for (const item of data.items) {
        const med = await tx.medicine.findUnique({ where: { id: item.medicineId } });
        if (!med) throw new Error(`Эм олдсонгүй: ${item.medicineId}`);

        const batch = await tx.batch.create({
          data: {
            medicineId: item.medicineId,
            batchNumber: item.batchNumber,
            quantity: item.quantity,
            expiryDate: item.expiryDate,
          },
        });

        await tx.stockMovement.create({
          data: {
            medicineId: item.medicineId,
            type: "IN",
            quantity: item.quantity,
            reason: data.note || "Шууд орлогодолт",
            movedById: session!.user.id,
          },
        });

        batches.push(batch);
      }
      return batches;
    });

    return NextResponse.json({ success: true, batches: result }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}