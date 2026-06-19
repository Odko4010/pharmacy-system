"use client";

import { useEffect, useState } from "react";
import { Plus, Tag, Pencil, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: { medicines: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = () => {
    fetch("/api/categories").then(r => r.json()).then(data => { setCategories(data); setIsLoading(false); });
  };

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!name.trim()) return;
    setIsSaving(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setName(""); setDescription(""); setShowForm(false); setIsSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-6 space-y-5" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>Ангилал</h2>
          <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>Нийт {categories.length} ангилал</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "#1d4ed8" }}>
          <Plus className="size-4" />
          Шинэ ангилал
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid #bfdbfe" }}>
          <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>Шинэ ангилал нэмэх</h3>
          <input placeholder="Ангиллын нэр *" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }} />
          <input placeholder="Тайлбар (заавал биш)" value={description} onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }} />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={isSaving}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "#1d4ed8" }}>
              {isSaving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "#f1f5f9", color: "#64748b" }}>
              Болих
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "#f1f5f9" }} />
          ))
        ) : categories.length === 0 ? (
          <div className="col-span-3 p-16 text-center rounded-2xl" style={{ background: "white" }}>
            <div className="flex items-center justify-center size-14 rounded-2xl mx-auto mb-4" style={{ background: "#eff6ff" }}>
              <Tag className="size-7" style={{ color: "#1d4ed8" }} />
            </div>
            <p className="font-medium" style={{ color: "#0f172a" }}>Ангилал байхгүй байна</p>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Шинэ ангилал нэмнэ үү</p>
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="rounded-2xl p-4 group"
              style={{ background: "white", border: "1px solid #f1f5f9" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-9 rounded-xl" style={{ background: "#eff6ff" }}>
                    <Tag className="size-4" style={{ color: "#1d4ed8" }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: "#0f172a" }}>{cat.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                      {cat._count?.medicines || 0} эм
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#1d4ed8"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                    <Pencil className="size-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              {cat.description && (
                <p className="text-xs mt-3 pl-12" style={{ color: "#94a3b8" }}>{cat.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}