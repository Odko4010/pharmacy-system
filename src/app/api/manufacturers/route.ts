import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { manufacturerSchema } from "@/lib/validations/medicine";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const manufacturers = await prisma.manufacturer.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(manufacturers);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const data = manufacturerSchema.parse(body);
    const manufacturer = await prisma.manufacturer.create({ data });
    return NextResponse.json(manufacturer, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
