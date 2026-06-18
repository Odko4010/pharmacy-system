import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const days = Number(request.nextUrl.searchParams.get("days")) || 30;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const batches = await prisma.batch.findMany({
      where: {
        expiryDate: { gte: today, lte: futureDate },
        quantity: { gt: 0 },
      },
      include: { medicine: { select: { name: true, unit: true } } },
      orderBy: { expiryDate: "asc" },
    });

    return NextResponse.json(batches);
  } catch (err) {
    return handleApiError(err);
  }
}
