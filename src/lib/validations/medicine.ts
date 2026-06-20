import { z } from "zod";

export const medicineSchema = z.object({
  name: z.string().min(2, "Эмийн нэр дор хаяж 2 тэмдэгт байх ёстой"),
  genericName: z.string().optional(),
  barcode: z.string().optional().transform(v => v === "" ? undefined : v),
  description: z.string().optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  unit: z.string().default("ширхэг"),
  purchasePrice: z.coerce.number().positive("Авах үнэ эерэг тоо байх ёстой"),
  sellingPrice: z.coerce.number().positive("Зарах үнэ эерэг тоо байх ёстой"),
  minStockLevel: z.coerce.number().int().min(0).default(10),
  requiresPrescription: z.boolean().default(false),
  categoryId: z.string().optional().transform(v => v === "" ? undefined : v),
  manufacturerId: z.string().optional().transform(v => v === "" ? undefined : v),
});

export type MedicineInput = z.infer<typeof medicineSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Ангиллын нэр дор хаяж 2 тэмдэгт байх ёстой"),
  description: z.string().optional(),
});

export const manufacturerSchema = z.object({
  name: z.string().min(2, "Үйлдвэрлэгчийн нэр дор хаяж 2 тэмдэгт байх ёстой"),
  country: z.string().optional(),
});

export const batchSchema = z.object({
  medicineId: z.string().min(1, "Эм сонгоно уу"),
  batchNumber: z.string().min(1, "Лотын дугаар оруулна уу"),
  quantity: z.coerce.number().int().positive("Тоо хэмжээ эерэг тоо байх ёстой"),
  expiryDate: z.coerce.date(),
  receivedDate: z.coerce.date().optional(),
});
