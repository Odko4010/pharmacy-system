import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validations/user";
import { requireAdmin, handleApiError } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/users/[id] - хэрэглэгчийн мэдээлэл шинэчлэх (зөвхөн ADMIN)
export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const data = userUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/users/[id] - хэрэглэгчийг идэвхгүй болгох (зөвхөн ADMIN)
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ message: "Хэрэглэгч амжилттай хаагдлаа" });
  } catch (err) {
    return handleApiError(err);
  }
}
