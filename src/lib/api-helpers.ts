import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ZodError } from "zod";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ message: "Нэвтрэх шаардлагатай" }, { status: 401 }) };
  }
  return { session };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ message: "Нэвтрэх шаардлагатай" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ message: "Зөвхөн админ эрхтэй хэрэглэгч хийх боломжтой" }, { status: 403 }) };
  }
  return { session };
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: "Оруулсан мэдээлэл буруу байна", errors: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    // Prisma-ийн unique constraint алдаа
    if (error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Энэ мэдээлэл аль хэдийн бүртгэгдсэн байна" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: "Сервертэй холбогдоход алдаа гарлаа" }, { status: 500 });
  }

  console.error(error);
  return NextResponse.json({ message: "Тодорхойгүй алдаа гарлаа" }, { status: 500 });
}
