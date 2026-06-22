"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { medicineSchema, type MedicineInput } from "@/lib/validations/medicine";
import { BarcodeScanner } from "@/components/ui/BarcodeScanner";
import { ScanBarcode, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface Category { id: string; name: string; }
interface Manufacturer { id: string; name: string; }

interface MedicineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: (MedicineInput & { id: string }) | null;
  // Барcode уншуулаад шууд нээх бол
  prefillBarcode?: string;
}

type BarcodeState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "new"; barcode: string }         // шинэ эм — бүртгэж болно
  | { status: "exists"; barcode: string; name: string; id: string }; // аль хэдийн бүртгэлтэй

export function MedicineFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  prefillBarcode,
}: MedicineFormModalProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeState, setBarcodeState] = useState<BarcodeState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<MedicineInput>({
    resolver: zodResolver(medicineSchema) as any,
    defaultValues: { unit: "ширхэг", minStockLevel: 10, requiresPrescription: false },
  });

  const barcodeValue = watch("barcode");

  // Баркодоор API-д шалгах
  const checkBarcode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setBarcodeState({ status: "idle" });
      return;
    }
    setBarcodeState({ status: "checking" });
    try {
      const res = await fetch(`/api/medicines/barcode?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const med = await res.json();
        setBarcodeState({ status: "exists", barcode: code, name: med.name, id: med.id });
      } else if (res.status === 404) {
        setBarcodeState({ status: "new", barcode: code });
      } else {
        setBarcodeState({ status: "idle" });
      }
    } catch {
      setBarcodeState({ status: "idle" });
    }
  }, []);

  // Барcode оруулаад 600ms хүлэх
  useEffect(() => {
    if (initialData) return; // засах үед шалгахгүй
    if (!barcodeValue) { setBarcodeState({ status: "idle" }); return; }
    const t = setTimeout(() => checkBarcode(barcodeValue), 600);
    return () => clearTimeout(t);
  }, [barcodeValue, checkBarcode, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/manufacturers").then((r) => r.json()).then(setManufacturers);

    if (initialData) {
      reset(initialData);
    } else {
      reset({ unit: "ширхэг", minStockLevel: 10, requiresPrescription: false });
      if (prefillBarcode) {
        setValue("barcode", prefillBarcode);
        checkBarcode(prefillBarcode);
      }
    }
    setBarcodeState({ status: "idle" });
  }, [isOpen, initialData, reset, prefillBarcode, setValue, checkBarcode]);

  // Камераас барcode уншсан
  const handleScan = useCallback(async (code: string) => {
    setShowScanner(false);
    setValue("barcode", code, { shouldValidate: true });
    await checkBarcode(code);
  }, [setValue, checkBarcode]);

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
      showToast(
        initialData ? "Эм амжилттай шинэчлэгдлээ" : "Шинэ эм амжилттай нэмэгдлээ",
        "success"
      );
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    }
  }

  // Баркодын төлөвийн UI
  const renderBarcodeStatus = () => {
    if (initialData) return null;
    switch (barcodeState.status) {
      case "checking":
        return (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
            <span className="size-3 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin inline-block" />
            Шалгаж байна...
          </div>
        );
      case "new":
        return (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            Шинэ эм — бүртгэж болно
          </div>
        );
      case "exists":
        return (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600">
            <AlertCircle className="size-3.5" />
            &quot;{barcodeState.name}&quot; эм аль хэдийн бүртгэлтэй байна
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initialData ? "Эм засах" : "Шинэ эм бүртгэх"}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── БАРКОД (хамгийн дээр, том) ── */}
          {!initialData && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <Label htmlFor="barcode">
                <span className="flex items-center gap-1.5">
                  <ScanBarcode className="size-4 text-blue-500" />
                  Баркод
                </span>
              </Label>
              <div className="flex gap-2 mt-1.5">
                <div className="flex-1">
                  <Input
                    id="barcode"
                    placeholder="Баркод уншуулах эсвэл гараар оруулах"
                    autoComplete="off"
                    {...register("barcode")}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  title="Камераар баркод уншуулах"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ background: "#1d4ed8" }}
                >
                  <ScanBarcode className="size-4" />
                  <span className="hidden sm:inline">Скан</span>
                </button>
              </div>
              {renderBarcodeStatus()}
              {barcodeState.status === "idle" && (
                <p className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                  <Info className="size-3" />
                  Баркодоор эм хайж, байхгүй бол шинээр бүртгэнэ
                </p>
              )}
            </div>
          )}

          {/* ── ҮНДСЭН МЭДЭЭЛЭЛ ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Үндсэн мэдээлэл
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" required>Эмийн нэр</Label>
                <Input
                  id="name"
                  placeholder="Жнь: Парацетамол"
                  {...register("name")}
                  error={errors.name?.message}
                />
              </div>
              <div>
                <Label htmlFor="genericName">Олон улсын нэр (INN)</Label>
                <Input
                  id="genericName"
                  placeholder="Жнь: Paracetamol"
                  {...register("genericName")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="dosageForm">Хэлбэр</Label>
                <Input
                  id="dosageForm"
                  placeholder="Шахмал, шингэн..."
                  {...register("dosageForm")}
                />
              </div>
              <div>
                <Label htmlFor="strength">Тун хэмжээ</Label>
                <Input id="strength" placeholder="500mg" {...register("strength")} />
              </div>
              <div>
                <Label htmlFor="unit" required>Нэгж</Label>
                <Input
                  id="unit"
                  placeholder="ширхэг"
                  {...register("unit")}
                  error={errors.unit?.message}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
          </div>

          {/* ── ҮНЭ & НӨӨЦ ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Үнэ & нөөц
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="purchasePrice" required>Авах үнэ (₮)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("purchasePrice")}
                  error={errors.purchasePrice?.message}
                />
              </div>
              <div>
                <Label htmlFor="sellingPrice" required>Зарах үнэ (₮)</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("sellingPrice")}
                  error={errors.sellingPrice?.message}
                />
              </div>
              <div>
                <Label htmlFor="minStockLevel">Доод нөөцийн хязгаар</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  {...register("minStockLevel")}
                />
              </div>
            </div>
          </div>

          {/* ── НЭМЭЛТ ── */}
          <div>
            <Label htmlFor="description">Тайлбар</Label>
            <Textarea
              id="description"
              placeholder="Нэмэлт мэдээлэл..."
              {...register("description")}
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              className="size-4 rounded accent-blue-600"
              {...register("requiresPrescription")}
            />
            <span className="text-sm text-slate-700">Жорын эм (зөвхөн жороор олгох)</span>
          </label>

          {/* ── ТОВЧЛУУРУУД ── */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>
              Болих
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {initialData ? "Хадгалах" : "Бүртгэх"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}