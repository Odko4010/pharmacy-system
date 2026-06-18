import { z } from "zod";

export const orderItemSchema = z.object({
  medicineId: z.string().min(1),
  quantity: z.coerce.number().int().positive("Тоо хэмжээ эерэг тоо байх ёстой"),
  unitPrice: z.coerce.number().positive("Нэгж үнэ эерэг тоо байх ёстой"),
});

export const orderCreateSchema = z.object({
  supplierId: z.string().min(1, "Нийлүүлэгч сонгоно уу"),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Дор хаяж нэг бараа нэмнэ үү"),
});

export const orderReceiveItemSchema = z.object({
  medicineId: z.string().min(1),
  batchNumber: z.string().min(1, "Лотын дугаар оруулна уу"),
  quantity: z.coerce.number().int().positive(),
  expiryDate: z.coerce.date(),
});

export const orderReceiveSchema = z.object({
  items: z.array(orderReceiveItemSchema).min(1),
});

export const saleItemSchema = z.object({
  medicineId: z.string().min(1),
  quantity: z.coerce.number().int().positive("Тоо хэмжээ эерэг тоо байх ёстой"),
});

export const saleCreateSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]).default("CASH"),
  items: z.array(saleItemSchema).min(1, "Дор хаяж нэг бараа нэмнэ үү"),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
