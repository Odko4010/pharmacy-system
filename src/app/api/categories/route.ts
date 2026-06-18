import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/medicine";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { medicines: true } } },
    });
    return NextResponse.json(categories);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const data = categorySchema.parse(body);
    const category = await prisma.category.create({ data });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
