import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "Admin1@gmail.com";

export async function GET(req: NextRequest) {
  // Cron job secret шалгах
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    // 1. Хугацаа дууссан эмүүд
    const expiredBatches = await prisma.batch.findMany({
      where: { expiryDate: { lte: today }, quantity: { gt: 0 } },
      include: { medicine: true },
    });

    // 2. Хугацаа дуусах гэж байгаа эмүүд (30 хоногийн дотор)
    const expiringBatches = await prisma.batch.findMany({
      where: {
        expiryDate: { gt: today, lte: thirtyDaysLater },
        quantity: { gt: 0 },
      },
      include: { medicine: true },
    });

    // 3. Нөөц дутагдалтай эмүүд
    const medicines = await prisma.medicine.findMany({
      where: { isActive: true },
      include: { batches: true },
    });
    const lowStockMedicines = medicines.filter(med => {
      const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
      return totalStock <= med.minStockLevel;
    });

    // 4. Өдрийн борлуулалтын тайлан
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todaySales = await prisma.saleTransaction.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      include: { items: { include: { medicine: true } } },
    });

    const totalRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalItems = todaySales.reduce((sum, sale) =>
      sum + sale.items.reduce((s, item) => s + item.quantity, 0), 0);

    // Имэйл илгээх
    await resend.emails.send({
      from: "ЭмСан <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `ЭмСан — Өдрийн тайлан ${today.toLocaleDateString("mn-MN")}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1d4ed8;">ЭмСан — Өдрийн тайлан</h2>
          <p style="color: #666;">${today.toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" })}</p>

          <!-- Борлуулалт -->
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #16a34a; margin: 0 0 8px;">📊 Өдрийн борлуулалт</h3>
            <p style="margin: 4px 0;">Нийт гүйлгээ: <strong>${todaySales.length}</strong></p>
            <p style="margin: 4px 0;">Нийт борлуулсан эм: <strong>${totalItems} ширхэг</strong></p>
            <p style="margin: 4px 0; font-size: 18px;">Нийт орлого: <strong style="color: #16a34a;">${new Intl.NumberFormat("mn-MN").format(totalRevenue)}₮</strong></p>
          </div>

          ${expiredBatches.length > 0 ? `
          <!-- Хугацаа дууссан -->
          <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #dc2626; margin: 0 0 8px;">⛔ Хугацаа дууссан эм (${expiredBatches.length})</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #fee2e2;">
                <th style="padding: 8px; text-align: left; font-size: 13px;">Эмийн нэр</th>
                <th style="padding: 8px; text-align: center; font-size: 13px;">Тоо</th>
                <th style="padding: 8px; text-align: center; font-size: 13px;">Дууссан огноо</th>
              </tr>
              ${expiredBatches.map(b => `
                <tr style="border-top: 1px solid #fecaca;">
                  <td style="padding: 8px; font-size: 13px;">${b.medicine.name}</td>
                  <td style="padding: 8px; text-align: center; font-size: 13px;">${b.quantity}</td>
                  <td style="padding: 8px; text-align: center; font-size: 13px; color: #dc2626;">${new Date(b.expiryDate).toLocaleDateString("mn-MN")}</td>
                </tr>
              `).join("")}
            </table>
          </div>
          ` : ""}

          ${expiringBatches.length > 0 ? `
          <!-- Хугацаа дуусах гэж байна -->
          <div style="background: #fffbeb; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #d97706; margin: 0 0 8px;">⚠️ 30 хоногт хугацаа дуусах эм (${expiringBatches.length})</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #fef3c7;">
                <th style="padding: 8px; text-align: left; font-size: 13px;">Эмийн нэр</th>
                <th style="padding: 8px; text-align: center; font-size: 13px;">Тоо</th>
                <th style="padding: 8px; text-align: center; font-size: 13px;">Дуусах огноо</th>
              </tr>
              ${expiringBatches.map(b => `
                <tr style="border-top: 1px solid #fde68a;">
                  <td style="padding: 8px; font-size: 13px;">${b.medicine.name}</td>
                  <td style="padding: 8px; text-align: center; font-size: 13px;">${b.quantity}</td>
                  <td style="padding: 8px; text-align: center; font-size: 13px; color: #d97706;">${new Date(b.expiryDate).toLocaleDateString("mn-MN")}</td>
                </tr>
              `).join("")}
            </table>
          </div>
          ` : ""}

          ${lowStockMedicines.length > 0 ? `
          <!-- Нөөц дутагдалтай -->
          <div style="background: #fff7ed; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #ea580c; margin: 0 0 8px;">📦 Нөөц дутагдалтай эм (${lowStockMedicines.length})</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #ffedd5;">
                <th style="padding: 8px; text-align: left; font-size: 13px;">Эмийн нэр</th>
                <th style="padding: 8px; text-align: center; font-size: 13px;">Одоогийн нөөц</th>
                <th style="padding: 8px; text-align: center; font-size: 13px;">Доод хэмжээ</th>
              </tr>
              ${lowStockMedicines.map(med => {
                const stock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
                return `
                  <tr style="border-top: 1px solid #fed7aa;">
                    <td style="padding: 8px; font-size: 13px;">${med.name}</td>
                    <td style="padding: 8px; text-align: center; font-size: 13px; color: ${stock === 0 ? "#dc2626" : "#ea580c"}; font-weight: bold;">${stock}</td>
                    <td style="padding: 8px; text-align: center; font-size: 13px;">${med.minStockLevel}</td>
                  </tr>
                `;
              }).join("")}
            </table>
          </div>
          ` : ""}

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">ЭмСан — Эмийн сангийн систем</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      summary: {
        todaySales: todaySales.length,
        totalRevenue,
        expiredBatches: expiredBatches.length,
        expiringBatches: expiringBatches.length,
        lowStockMedicines: lowStockMedicines.length,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Алдаа гарлаа" }, { status: 500 });
  }
}