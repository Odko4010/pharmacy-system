import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderCreateSchema } from "@/lib/validations/order";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

// GET /api/orders - захиалгын жагсаалт
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const status = request.nextUrl.searchParams.get("status") || undefined;

    const orders = await prisma.order.findMany({
      where: status ? { status: status as "PENDING" | "CONFIRMED" | "RECEIVED" | "CANCELLED" } : undefined,
      include: {
        supplier: true,
        createdBy: { select: { firstName: true, lastName: true } },
        items: { include: { medicine: { select: { name: true, unit: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/orders - шинэ захиалга үүсгэх (нийлүүлэгчээс эм авах хүсэлт)
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const data = orderCreateSchema.parse(body);

    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const orderNumber = `ORD-${Date.now()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        notes: data.notes,
        totalAmount,
        createdById: session!.user.id,
        items: {
          create: data.items.map((item) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { medicine: true } },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
