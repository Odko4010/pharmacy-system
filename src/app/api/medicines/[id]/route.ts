import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { medicineSchema } from "@/lib/validations/medicine";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/medicines/[id] - нэг эмийн дэлгэрэнгүй
export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: {
        category: true,
        manufacturer: true,
        batches: { orderBy: { expiryDate: "asc" } },
      },
    });

    if (!medicine) {
      return NextResponse.json({ message: "Эм олдсонгүй" }, { status: 404 });
    }

    return NextResponse.json(medicine);
  } catch (err) {
    return handleApiError(err);
  }
}

// PUT /api/medicines/[id] - эм шинэчлэх
export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const data = medicineSchema.partial().parse(body);

    const medicine = await prisma.medicine.update({
      where: { id },
      data,
      include: { category: true, manufacturer: true },
    });

    return NextResponse.json(medicine);
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/medicines/[id] - эм устгах (зөвхөн идэвхгүй болгоно, бодитоор устгахгүй)
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.medicine.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Эм амжилттай устгагдлаа" });
  } catch (err) {
    return handleApiError(err);
  }
}
