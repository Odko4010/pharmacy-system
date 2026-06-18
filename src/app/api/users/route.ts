import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validations/user";
import { requireAdmin, handleApiError } from "@/lib/api-helpers";

// GET /api/users - бүх хэрэглэгчийн жагсаалт (зөвхөн ADMIN)
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/users - шинэ хэрэглэгч (ажилтан/админ) бүртгэх (зөвхөн ADMIN)
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const data = userCreateSchema.parse(body);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
