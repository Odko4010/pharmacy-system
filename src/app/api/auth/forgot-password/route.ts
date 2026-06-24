import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: "Имэйл оруулна уу" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Хэрэглэгч байхгүй ч амжилттай гэж хариулна (аюулгүй байдлын үүднээс)
    if (!user) {
      return NextResponse.json({ message: "Хэрэв тус имэйл бүртгэлтэй бол сэргээх холбоос илгээгдэх болно" });
    }

    // Хуучин token устгах
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // Шинэ token үүсгэх
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 цаг

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ message: "Нууц үг сэргээх холбоос илгээгдлээ" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Алдаа гарлаа" }, { status: 500 });
  }
}
