"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Pill, ScanBarcode } from "lucide-react";
import { MedicineFormModal } from "./Medicineformmodal";
import { BarcodeScanner } from "@/components/ui/BarcodeScanner";

interface Medicine {
  id: string;
  name: string;
  genericName: string | null;
  barcode: string | null;
  unit: string;
  dosageForm: string | null;
  strength: string | null;
  purchasePrice: string;
  sellingPrice: string;
  minStockLevel: number;
  totalStock: number;
  requiresPrescription: boolean;
  category: { id: string; name: string } | null;
  manufacturer: { id: string; name: string } | null;
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("mn-MN").format(Number(value)) + "₮";
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Баркод scanner (хайлт эсвэл шинэ эм)
  const [showScanner, setShowScanner] = useState<"search" | "new" | null>(null);
  const [scanPrefill, setScanPrefill] = useState<string | undefined>();

  const loadMedicines = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/medicines?${params}`);
    const data = await res.json();
    setMedicines(data);
    setIsLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadMedicines, 300);
    return () => clearTimeout(timer);
  }, [loadMedicines]);

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/medicines/${id}`, { method: "DELETE" });
      loadMedicines();
    } finally {
      setDeleteConfirmId(null);
    }
  }

  // Хайлтын scanner
  const handleSearchScan = (code: string) => {
    setShowScanner(null);
    setSearch(code);
  };

  // Шинэ эм нэмэх scanner — баркодыг форм руу дамжуулна
  const handleNewScan = (code: string) => {
    setShowScanner(null);
    setScanPrefill(code);
    setEditingMedicine(null);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setScanPrefill(undefined);
    setEditingMedicine(null);
    setIsModalOpen(true);
  };

  return (
    <>
      {showScanner === "search" && (
        <BarcodeScanner onScan={handleSearchScan} onClose={() => setShowScanner(null)} />
      )}
      {showScanner === "new" && (
        <BarcodeScanner onScan={handleNewScan} onClose={() => setShowScanner(null)} />
      )}

      <div className="p-6 space-y-5" style={{ background: "#f8fafc", minHeight: "100vh" }}>
        {/* Гарчиг + хяналт */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>
              Эмийн жагсаалт
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>
              Нийт {medicines.length} эм бүртгэлтэй
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Хайлт */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                  style={{ color: "#94a3b8" }}
                />
                <input
                  placeholder="Эм хайх..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-52"
                  style={{
                    background: "white",
                    border: "1px solid #f1f5f9",
                    color: "#0f172a",
                  }}
                />
              </div>
              {/* Баркодоор хайх товч */}
              <button
                onClick={() => setShowScanner("search")}
                title="Баркодоор хайх"
                className="flex items-center justify-center size-9 rounded-xl transition-colors"
                style={{
                  background: "white",
                  border: "1px solid #f1f5f9",
                  color: "#64748b",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#eff6ff";
                  e.currentTarget.style.color = "#1d4ed8";
                  e.currentTarget.style.borderColor = "#bfdbfe";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#64748b";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }}
              >
                <ScanBarcode className="size-4" />
              </button>
            </div>

            {/* Шинэ эм — баркод уншаад нэмэх */}
            <button
              onClick={() => setShowScanner("new")}
              title="Баркод уншуулаад шинэ эм нэмэх"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#dbeafe";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#eff6ff";
              }}
            >
              <ScanBarcode className="size-4" />
              Скан & нэмэх
            </button>

            <button
              onClick={openNewModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "#1d4ed8" }}
            >
              <Plus className="size-4" />
              Шинэ эм
            </button>
          </div>
        </div>

        {/* Жагсаалт хүснэгт */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "white", border: "1px solid #f1f5f9" }}
        >
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl animate-pulse"
                  style={{ background: "#f1f5f9" }}
                />
              ))}
            </div>
          ) : medicines.length === 0 ? (
            <div className="p-16 text-center">
              <div
                className="flex items-center justify-center size-14 rounded-2xl mx-auto mb-4"
                style={{ background: "#f0fdf4" }}
              >
                <Pill className="size-7" style={{ color: "#16a34a" }} />
              </div>
              <p className="font-medium" style={{ color: "#0f172a" }}>
                {search ? "Хайлтад тохирох эм олдсонгүй" : "Эм бүртгэгдээгүй байна"}
              </p>
              <p className="text-sm mt-1 mb-5" style={{ color: "#94a3b8" }}>
                Анхны эмээ бүртгэнэ үү
              </p>
              {!search && (
                <button
                  onClick={openNewModal}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                  style={{ background: "#1d4ed8" }}
                >
                  Эм нэмэх
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                  {["Эмийн нэр", "Баркод", "Ангилал", "Зарах үнэ", "Нөөц", "Төлөв", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 font-medium"
                        style={{ color: "#64748b" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => {
                  const isLow = med.totalStock <= med.minStockLevel;
                  return (
                    <tr
                      key={med.id}
                      style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium" style={{ color: "#0f172a" }}>
                          {med.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                          {[med.strength, med.dosageForm].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        {med.barcode ? (
                          <span
                            className="font-mono text-xs px-2 py-0.5 rounded"
                            style={{ background: "#f1f5f9", color: "#475569" }}
                          >
                            {med.barcode}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "#64748b" }}>
                        {med.category?.name || "—"}
                      </td>
                      <td
                        className="px-5 py-3.5 font-medium"
                        style={{ color: "#1d4ed8" }}
                      >
                        {formatCurrency(med.sellingPrice)}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "#0f172a" }}>
                        {med.totalStock} {med.unit}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={
                            isLow
                              ? { background: "#fffbeb", color: "#d97706" }
                              : { background: "#f0fdf4", color: "#16a34a" }
                          }
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: isLow ? "#f59e0b" : "#22c55e" }}
                          />
                          {isLow ? "Бага нөөц" : "Хэвийн"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingMedicine(med);
                              setScanPrefill(undefined);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: "#94a3b8" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#eff6ff";
                              e.currentTarget.style.color = "#1d4ed8";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "#94a3b8";
                            }}
                          >
                            <Pencil className="size-4" />
                          </button>
                          {deleteConfirmId === med.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(med.id)}
                                className="text-xs px-2 py-1 rounded-lg text-white"
                                style={{ background: "#dc2626" }}
                              >
                                Устгах
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-xs px-2 py-1 rounded-lg"
                                style={{ background: "#f1f5f9", color: "#64748b" }}
                              >
                                Болих
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(med.id)}
                              className="p-1.5 rounded-lg transition-all"
                              style={{ color: "#94a3b8" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#fef2f2";
                                e.currentTarget.style.color = "#dc2626";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "#94a3b8";
                              }}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <MedicineFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setScanPrefill(undefined);
          }}
          onSuccess={loadMedicines}
          prefillBarcode={scanPrefill}
          initialData={
            editingMedicine
              ? {
                  id: editingMedicine.id,
                  name: editingMedicine.name,
                  genericName: editingMedicine.genericName || undefined,
                  barcode: editingMedicine.barcode || undefined,
                  unit: editingMedicine.unit,
                  dosageForm: editingMedicine.dosageForm || undefined,
                  strength: editingMedicine.strength || undefined,
                  purchasePrice: Number(editingMedicine.purchasePrice),
                  sellingPrice: Number(editingMedicine.sellingPrice),
                  minStockLevel: editingMedicine.minStockLevel,
                  requiresPrescription: editingMedicine.requiresPrescription,
                  categoryId: editingMedicine.category?.id,
                  manufacturerId: editingMedicine.manufacturer?.id,
                }
              : null
          }
        />
      </div>
    </>
  );
}