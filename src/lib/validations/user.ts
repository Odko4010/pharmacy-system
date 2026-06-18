import { z } from "zod";

export const userCreateSchema = z.object({
  email: z.string().email("Зөв имэйл хаяг оруулна уу"),
  password: z.string().min(6, "Нууц үг дор хаяж 6 тэмдэгт байх ёстой"),
  firstName: z.string().min(1, "Нэр оруулна уу"),
  lastName: z.string().min(1, "Овог оруулна уу"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
});

export const userUpdateSchema = z.object({
  email: z.string().email("Зөв имэйл хаяг оруулна уу").optional(),
  password: z.string().min(6, "Нууц үг дор хаяж 6 тэмдэгт байх ёстой").optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
  isActive: z.boolean().optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
