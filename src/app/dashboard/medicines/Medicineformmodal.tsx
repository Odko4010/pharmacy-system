"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { medicineSchema, type MedicineInput } from "@/lib/validations/medicine";


interface Category {
  id: string;
  name: string;
}
interface Manufacturer {
  id: string;
  name: string;
}

interface MedicineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: (MedicineInput & { id: string }) | null;
}

export function MedicineFormModal({ isOpen, onClose, onSuccess, initialData }: MedicineFormModalProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  const {
  register,
  handleSubmit,
  reset,
  formState: { errors, isSubmitting },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} = useForm<MedicineInput>({
  resolver: zodResolver(medicineSchema) as any,
  defaultValues: {
    unit: "ширхэг",
    minStockLevel: 10,
    requiresPrescription: false,
  },
});

  useEffect(() => {
    if (isOpen) {
      fetch("/api/categories").then((r) => r.json()).then(setCategories);
      fetch("/api/manufacturers").then((r) => r.json()).then(setManufacturers);
      if (initialData) {
        reset(initialData);
      } else {
        reset({ unit: "ширхэг", minStockLevel: 10, requiresPrescription: false });
      }
    }
  }, [isOpen, initialData, reset]);

  async function onSubmit(data: MedicineInput) {
    try {
      const url = initialData ? `/api/medicines/${initialData.id}` : "/api/medicines";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Алдаа гарлаа");
      }

      showToast(initialData ? "Эм амжилттай шинэчлэгдлээ" : "Шинэ эм амжилттай нэмэгдлээ", "success");
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Эм засах" : "Шинэ эм нэмэх"} maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" required>Эмийн нэр</Label>
            <Input id="name" placeholder="Жнь: Парацетамол" {...register("name")} error={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="genericName">Олон улсын нэр (INN)</Label>
            <Input id="genericName" placeholder="Жнь: Paracetamol" {...register("genericName")} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="dosageForm">Хэлбэр</Label>
            <Input id="dosageForm" placeholder="Шахмал, шингэн..." {...register("dosageForm")} />
          </div>
          <div>
            <Label htmlFor="strength">Тун хэмжээ</Label>
            <Input id="strength" placeholder="500mg" {...register("strength")} />
          </div>
          <div>
            <Label htmlFor="unit" required>Нэгж</Label>
            <Input id="unit" placeholder="ширхэг" {...register("unit")} error={errors.unit?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="categoryId">Ангилал</Label>
            <Select id="categoryId" {...register("categoryId")}>
              <option value="">— Сонгох —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="manufacturerId">Үйлдвэрлэгч</Label>
            <Select id="manufacturerId" {...register("manufacturerId")}>
              <option value="">— Сонгох —</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="purchasePrice" required>Авах үнэ (₮)</Label>
            <Input id="purchasePrice" type="number" step="0.01" {...register("purchasePrice")} error={errors.purchasePrice?.message} />
          </div>
          <div>
            <Label htmlFor="sellingPrice" required>Зарах үнэ (₮)</Label>
            <Input id="sellingPrice" type="number" step="0.01" {...register("sellingPrice")} error={errors.sellingPrice?.message} />
          </div>
          <div>
            <Label htmlFor="minStockLevel">Доод нөөц</Label>
            <Input id="minStockLevel" type="number" {...register("minStockLevel")} />
          </div>
        </div>

        <div>
          <Label htmlFor="barcode">Баркод</Label>
          <Input id="barcode" placeholder="Заавал биш" {...register("barcode")} />
        </div>

        <div>
          <Label htmlFor="description">Тайлбар</Label>
          <Textarea id="description" placeholder="Нэмэлт мэдээлэл..." {...register("description")} />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" className="size-4 rounded accent-[var(--color-brand-700)]" {...register("requiresPrescription")} />
          <span className="text-sm text-[var(--color-ink-700)]">Жорын эм (зөвхөн жороор олгох)</span>
        </label>

        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--color-ink-100)]">
          <Button type="button" variant="secondary" onClick={onClose}>Болих</Button>
          <Button type="submit" isLoading={isSubmitting}>{initialData ? "Хадгалах" : "Нэмэх"}</Button>
        </div>
      </form>
    </Modal>
  );
}
