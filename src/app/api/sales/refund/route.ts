import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const refundSchema = z.object({
  saleId: z.string().min(1),
  reason: z.string().min(1, "Буцаалтын шалтгаан оруулна уу"),
  items: z.array(z.object({
    saleItemId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const data = refundSchema.parse(body);

    const sale = await prisma.saleTransaction.findUnique({
      where: { id: data.saleId },
      include: { items: { include: { medicine: true, batch: true } } },
    });

    if (!sale) return NextResponse.json({ message: "Борлуулалт олдсонгүй" }, { status: 404 });

    const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      let refundAmount = 0;

      for (const refundItem of data.items) {
        const saleItem = sale.items.find((i: typeof sale.items[number]) => i.id === refundItem.saleItemId);
        if (!saleItem) throw new Error(`Борлуулалтын зүйл олдсонгүй`);
        if (refundItem.quantity > saleItem.quantity) throw new Error(`Буцаах тоо хэмжээ хэтэрсэн байна`);

        // Нөөцийг буцааж нэмэх
        if (saleItem.batchId) {
          await tx.batch.update({
            where: { id: saleItem.batchId },
            data: { quantity: { increment: refundItem.quantity } },
          });
        }

        // StockMovement бичих
        await tx.stockMovement.create({
          data: {
            medicineId: saleItem.medicineId,
            type: "IN",
            quantity: refundItem.quantity,
            reason: `Буцаалт: ${data.reason} (Борлуулалт #${sale.id.slice(-6)})`,
            movedById: session!.user.id,
          },
        });

        refundAmount += refundItem.quantity * Number(saleItem.unitPrice);
      }

      return { refundAmount, saleId: sale.id };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}