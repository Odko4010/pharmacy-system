import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

// GET /api/medicines/barcode?code=XXX
// Баркодоор эм хайх — бүртгэлтэй бол эмийн мэдээлэл буцаана
export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ message: "Баркод оруулна уу" }, { status: 400 });
    }

    const medicine = await prisma.medicine.findFirst({
      where: { barcode: code, isActive: true },
      include: {
        category: true,
        manufacturer: true,
        batches: { orderBy: { expiryDate: "asc" } },
      },
    });

    if (!medicine) {
      // 404 = бүртгэлгүй, шинээр нэмж болно
      return NextResponse.json({ message: "Эм бүртгэлгүй байна" }, { status: 404 });
    }

    const totalStock = medicine.batches.reduce((sum: number, b: { quantity: number }) => sum + b.quantity, 0);
    return NextResponse.json({ ...medicine, totalStock });
  } catch (err) {
    return handleApiError(err);
  }
}