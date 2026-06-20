import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { medicineSchema } from "@/lib/validations/medicine";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || undefined;
    const lowStock = searchParams.get("lowStock") === "true";
    const medicines = await prisma.medicine.findMany({
      where: {
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { genericName: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
        manufacturer: true,
        batches: {
          orderBy: { expiryDate: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    const medicinesWithStock = medicines.map((med: typeof medicines[number]) => {
      const totalStock = med.batches.reduce((sum: number, b: typeof med.batches[number]) => sum + b.quantity, 0);
      return { ...med, totalStock };
    });
    const filtered = lowStock
      ? medicinesWithStock.filter((m: (typeof medicinesWithStock)[number]) => m.totalStock <= m.minStockLevel)
      : medicinesWithStock;
    return NextResponse.json(filtered);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  try {
    const body = await request.json();
    if (body.categoryId === "") body.categoryId = undefined;
    if (body.manufacturerId === "") body.manufacturerId = undefined;
    if (body.barcode === "") body.barcode = undefined;
    const data = medicineSchema.parse(body);
    const medicine = await prisma.medicine.create({
      data,
      include: { category: true, manufacturer: true },
    });
    return NextResponse.json(medicine, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
