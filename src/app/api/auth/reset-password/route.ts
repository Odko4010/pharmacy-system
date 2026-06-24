import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ message: "Token болон нууц үг шаардлагатай" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: "Нууц үг дор хаяж 6 тэмдэгт байх ёстой" }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken) {
      return NextResponse.json({ message: "Token олдсонгүй" }, { status: 400 });
    }
    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ message: "Token хугацаа дууссан байна" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ message: "Нууц үг амжилттай солигдлоо" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Алдаа гарлаа" }, { status: 500 });
  }
}
