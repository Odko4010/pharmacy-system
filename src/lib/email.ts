import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;
  
  await resend.emails.send({
    from: "ЭмСан <onboarding@resend.dev>",
    to: email,
    subject: "Нууц үг сэргээх",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1d4ed8;">ЭмСан — Нууц үг сэргээх</h2>
        <p>Та нууц үгээ сэргээхийг хүссэн байна.</p>
        <p>Доорх товчийг дарж нууц үгээ сэргээнэ үү:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Нууц үг сэргээх
        </a>
        <p style="color: #666; font-size: 14px;">Энэ холбоос 1 цагийн дараа хүчингүй болно.</p>
        <p style="color: #666; font-size: 14px;">Хэрэв та энэ хүсэлт илгээгээгүй бол санаа зовох хэрэггүй — таны бүртгэлд ямар нэгэн өөрчлөлт орохгүй.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">ЭмСан — Эмийн сангийн систем</p>
      </div>
    `,
  });
}
