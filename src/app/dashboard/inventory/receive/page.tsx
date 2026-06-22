"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, ScanBarcode, PackagePlus, CheckCircle2, Search } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

interface Medicine { id: string; name: string; unit: string; barcode: string | null; strength: string | null; }
interface ReceiveItem {
  medicineId: string;
  medicineName: string;
  unit: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
}

function today() { return new Date().toISOString().split("T")[0]; }
function nextYear() {
  const d = new Date(); d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

export default function ReceivePage() {
  const { showToast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Medicine[]>([]);
  const [items, setItems] = useState<ReceiveItem[]>([]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!search.trim()) { setResults([]); return; }
      fetch(`/api/medicines?search=${encodeURIComponent(search)}`)
        .then(r => r.json()).then(setResults);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  function addMed(med: Medicine) {
    if (items.find(i => i.medicineId === med.id)) {
      showToast(`"${med.name}" аль хэдийн нэмэгдсэн байна`, "error"); return;
    }
    setItems(prev => [...prev, {
      medicineId: med.id,
      medicineName: med.name,
      unit: med.unit,
      batchNumber: `LOT-${Date.now().toString().slice(-6)}`,
      quantity: 1,
      expiryDate: nextYear(),
    }]);
    setSearch("");
    setResults([]);
  }

  const handleBarcodeScan = useCallback(async (code: string) => {
    if (done) return;
    const res = await fetch(`/api/medicines/barcode?code=${encodeURIComponent(code)}`);
    if (res.ok) {
      const med = await res.json();
      addMed(med);
      showToast(`"${med.name}" нэмэгдлээ`, "success");
    } else {
      showToast(`Баркод ${code} — эм олдсонгүй`, "error");
    }
  }, [done, items]);

  useBarcodeScanner({ onScan: handleBarcodeScan, enabled: !done });

  function update(idx: number, field: keyof ReceiveItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function handleSubmit() {
    if (items.length === 0) { showToast("Эм нэмээгүй байна", "error"); return; }
    const invalid = items.find(i => !i.batchNumber || i.quantity < 1 || !i.expiryDate);
    if (invalid) { showToast("Бүх талбарыг бөглөнө үү", "error"); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/inventory/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, note }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      setDone(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── АМЖИЛТ ДЭЛГЭЦ ──
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6">
        <div className="flex items-center justify-center size-20 rounded-full" style={{ background: "#f0fdf4" }}>
          <CheckCircle2 className="size-10" style={{ color: "#16a34a" }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold" style={{ color: "#0f172a" }}>Орлогодолт амжилттай!</h2>
          <p className="text-sm mt-2" style={{ color: "#64748b" }}>
            {items.length} төрлийн эм,&nbsp;
            {items.reduce((s, i) => s + i.quantity, 0)} ширхэг нөөц нэмэгдлээ
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setItems([]); setNote(""); setDone(false); setTimeout(() => searchRef.current?.focus(), 100); }}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "#1d4ed8" }}
          >
            Дахин орлогодох
          </button>
          <a href="/dashboard/inventory"
            className="px-6 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#f1f5f9", color: "#475569" }}
          >
            Нөөц харах
          </a>
        </div>
      </div>
    );
  }

  const totalQty = items.reduce((s, i) => s + Number(i.quantity), 0);

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto" style={{ background: "#f8fafc", minHeight: "100vh" }}>

      {/* Гарчиг */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>Нөөц орлогодох</h2>
          <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>Эм хайх эсвэл баркод уншуулж нэмэх</p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
        >
          <ScanBarcode className="size-3.5" />
          Баркод уншигч бэлэн
        </div>
      </div>

      {/* Хайлт */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: "white", border: "1px solid #f1f5f9" }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "#94a3b8" }} />
          <input
            ref={searchRef}
            autoFocus
            placeholder="Эмийн нэр эсвэл баркод уншуулах..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#f8fafc", border: "1px solid #f1f5f9", color: "#0f172a" }}
          />
        </div>

        {results.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f1f5f9" }}>
            {results.map(med => (
              <button
                key={med.id}
                onClick={() => addMed(med)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{ borderBottom: "1px solid #f8fafc" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{med.name}</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>
                    {med.strength && `${med.strength} · `}{med.unit}
                    {med.barcode && ` · ${med.barcode}`}
                  </p>
                </div>
                <Plus className="size-4 shrink-0" style={{ color: "#1d4ed8" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Нэмэгдсэн эмүүд */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
              Орлогодох эмүүд — {items.length} төрөл, нийт {totalQty} ш
            </p>
          </div>

          {items.map((item, idx) => (
            <div
              key={item.medicineId}
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "white", border: "1px solid #f1f5f9" }}
            >
              {/* Гарчиг */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#0f172a" }}>{item.medicineName}</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>{item.unit}</p>
                </div>
                <button
                  onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                  className="flex items-center justify-center size-8 rounded-lg transition-colors"
                  style={{ color: "#94a3b8" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Талбарууд */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                    Лотын дугаар *
                  </label>
                  <input
                    value={item.batchNumber}
                    onChange={e => update(idx, "batchNumber", e.target.value)}
                    placeholder="LOT-001"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "#f8fafc", border: "1px solid #f1f5f9", color: "#0f172a" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                    Тоо хэмжээ *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={e => update(idx, "quantity", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "#f8fafc", border: "1px solid #f1f5f9", color: "#0f172a" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                    Дуусах огноо *
                  </label>
                  <input
                    type="date"
                    value={item.expiryDate}
                    min={today()}
                    onChange={e => update(idx, "expiryDate", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "#f8fafc", border: "1px solid #f1f5f9", color: "#0f172a" }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Тэмдэглэл */}
          <div className="rounded-2xl p-4" style={{ background: "white", border: "1px solid #f1f5f9" }}>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
              Тэмдэглэл (заавал биш)
            </label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Жнь: Нийлүүлэгч XYZ-ээс авлаа"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "#f8fafc", border: "1px solid #f1f5f9", color: "#0f172a" }}
            />
          </div>

          {/* Хадгалах */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "#16a34a" }}
          >
            <PackagePlus className="size-4" />
            {isSubmitting ? "Хадгалж байна..." : `${items.length} эм орлогодох (нийт ${totalQty} ш)`}
          </button>
        </div>
      )}

      {items.length === 0 && (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "white", border: "1px dashed #e2e8f0" }}
        >
          <div className="flex items-center justify-center size-14 rounded-2xl mx-auto mb-4" style={{ background: "#f0fdf4" }}>
            <PackagePlus className="size-7" style={{ color: "#16a34a" }} />
          </div>
          <p className="font-medium" style={{ color: "#0f172a" }}>Эм нэмээгүй байна</p>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Дээрх хайлтаас эм хайх эсвэл баркод уншигчаар уншуулна уу
          </p>
        </div>
      )}
    </div>
  );
}