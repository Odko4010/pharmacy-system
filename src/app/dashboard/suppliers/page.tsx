"use client";

import { useEffect, useState } from "react";
import { Plus, Truck, Phone, Mail, MapPin, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export default function SuppliersPage() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

  async function fetchSuppliers() {
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    setSuppliers(data);
    setLoading(false);
  }

  useEffect(() => { fetchSuppliers(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/suppliers/${editing.id}` : "/api/suppliers";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      showToast(editing ? "Нийлүүлэгч шинэчлэгдлээ" : "Нийлүүлэгч нэмэгдлээ", "success");
      setShowForm(false);
      setEditing(null);
      setForm({ name: "", phone: "", email: "", address: "" });
      fetchSuppliers();
    } else {
      showToast("Алдаа гарлаа", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Устгах уу?")) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Устгагдлаа", "success");
      fetchSuppliers();
    }
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone ?? "", email: s.email ?? "", address: s.address ?? "" });
    setShowForm(true);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Нийлүүлэгч</h1>
          <p className="text-sm text-gray-500">Эм нийлүүлэгч компаниудын жагсаалт</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", phone: "", email: "", address: "" }); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: "#1d4ed8" }}
        >
          <Plus className="size-4" /> Нийлүүлэгч нэмэх
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? "Засах" : "Шинэ нийлүүлэгч"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Нэр *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Утас</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имэйл</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Хаяг</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Болих</button>
              <button type="submit"
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: "#1d4ed8" }}>{editing ? "Хадгалах" : "Нэмэх"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-10">Уншиж байна...</p>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Truck className="size-12 mx-auto mb-3 opacity-30" />
          <p>Нийлүүлэгч байхгүй байна</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-blue-50">
                    <Truck className="size-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <Pencil className="size-4 text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 className="size-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {s.phone && <p className="text-sm text-gray-500 flex items-center gap-2"><Phone className="size-3.5" />{s.phone}</p>}
                {s.email && <p className="text-sm text-gray-500 flex items-center gap-2"><Mail className="size-3.5" />{s.email}</p>}
                {s.address && <p className="text-sm text-gray-500 flex items-center gap-2"><MapPin className="size-3.5" />{s.address}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
