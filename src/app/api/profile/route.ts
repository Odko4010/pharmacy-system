import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Нэвтрэх шаардлагатай" }, { status: 401 });

  try {
    const { firstName, lastName, phone, email, currentPassword, newPassword } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ message: "Хэрэглэгч олдсонгүй" }, { status: 404 });

    // Нууц үг өөрчлөх бол шалгах
    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ message: "Одоогийн нууц үгээ оруулна уу" }, { status: 400 });
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) return NextResponse.json({ message: "Одоогийн нууц үг буруу байна" }, { status: 400 });
      if (newPassword.length < 6) return NextResponse.json({ message: "Шинэ нууц үг дор хаяж 6 тэмдэгт байх ёстой" }, { status: 400 });
    }

    // Имэйл өөрчлөх бол шалгах
    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return NextResponse.json({ message: "Энэ имэйл аль хэдийн бүртгэлтэй байна" }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (email && email !== user.email) updateData.email = email;
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({ where: { id: session.user.id }, data: updateData });

    // Имэйл өөрчлөгдсөн бол мэдэгдэл илгээх
    if (email && email !== user.email) {
      await resend.emails.send({
        from: "ЭмСан <onboarding@resend.dev>",
        to: email,
        subject: "Имэйл хаяг өөрчлөгдлөө",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1d4ed8;">ЭмСан — Имэйл өөрчлөгдлөө</h2>
            <p>Таны имэйл хаяг амжилттай өөрчлөгдлөө.</p>
            <p>Шинэ имэйл: <strong>${email}</strong></p>
            <p style="color: #666; font-size: 14px;">Хэрэв та энэ өөрчлөлт хийгээгүй бол нэн даруй системийн админтай холбогдоно уу.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">ЭмСан — Эмийн сангийн систем</p>
          </div>
        `,
      });
    }

    // Нууц үг өөрчлөгдсөн бол мэдэгдэл илгээх
    if (newPassword) {
      await resend.emails.send({
        from: "ЭмСан <onboarding@resend.dev>",
        to: user.email,
        subject: "Нууц үг өөрчлөгдлөө",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1d4ed8;">ЭмСан — Нууц үг өөрчлөгдлөө</h2>
            <p>Таны нууц үг амжилттай өөрчлөгдлөө.</p>
            <p style="color: #666; font-size: 14px;">Хэрэв та энэ өөрчлөлт хийгээгүй бол нэн даруй системийн админтай холбогдоно уу.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">ЭмСан — Эмийн сангийн систем</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ message: "Мэдээлэл амжилттай шинэчлэгдлээ" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Алдаа гарлаа" }, { status: 500 });
  }
}