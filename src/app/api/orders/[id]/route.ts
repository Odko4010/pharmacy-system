import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { firstName: true, lastName: true } },
        items: { include: { medicine: { select: { id: true, name: true, unit: true } } } },
      },
    });

    if (!order) {
      return NextResponse.json({ message: "Захиалга олдсонгүй" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err) {
    return handleApiError(err);
  }
}
