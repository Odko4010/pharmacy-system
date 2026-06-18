import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

const supplierSchema = z.object({
  name: z.string().min(2, "Нийлүүлэгчийн нэр дор хаяж 2 тэмдэгт байх ёстой"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(suppliers);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const data = supplierSchema.parse(body);
    const supplier = await prisma.supplier.create({ data });
    return NextResponse.json(supplier, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
