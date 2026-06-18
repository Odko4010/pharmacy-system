import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderReceiveSchema } from "@/lib/validations/order";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/orders/[id]/receive - захиалгыг агуулахад хүлээж авах
// Лот (Batch) үүсгэж, эмийн нөөцийг нэмэгдүүлж, StockMovement бичлэг хийнэ
export async function POST(request: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const data = orderReceiveSchema.parse(body);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ message: "Захиалга олдсонгүй" }, { status: 404 });
    }
    if (order.status === "RECEIVED") {
      return NextResponse.json({ message: "Энэ захиалга аль хэдийн хүлээж авсан байна" }, { status: 400 });
    }

    // Бүх өөрчлөлтийг нэг transaction-д хийнэ — алдаа гарвал бүгд буцна
    const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      for (const item of data.items) {
        // Шинэ лот үүсгэх
        await tx.batch.create({
          data: {
            medicineId: item.medicineId,
            batchNumber: item.batchNumber,
            quantity: item.quantity,
            expiryDate: item.expiryDate,
          },
        });

        // Нөөцийн хөдөлгөөн бичих (аудит трэйл)
        await tx.stockMovement.create({
          data: {
            medicineId: item.medicineId,
            type: "IN",
            quantity: item.quantity,
            reason: `Захиалга #${order.orderNumber} хүлээж авлаа`,
            movedById: session!.user.id,
          },
        });
      }

      // Захиалгын статусыг шинэчлэх
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: "RECEIVED", receivedDate: new Date() },
        include: { supplier: true, items: { include: { medicine: true } } },
      });

      return updatedOrder;
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
