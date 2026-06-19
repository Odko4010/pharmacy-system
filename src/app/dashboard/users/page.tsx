"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Shield, User, X } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "EMPLOYEE";
  isActive: boolean;
  phone?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", role: "EMPLOYEE", phone: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/users").then(r => r.json()).then(data => { setUsers(data); setIsLoading(false); });
  };

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.firstName || !form.email || !form.password) {
      setError("Заавал талбаруудыг бөглөнө үү"); return;
    }
    setIsSaving(true); setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setIsSaving(false);
    if (!res.ok) { setError("Хэрэглэгч үүсгэхэд алдаа гарлаа"); return; }
    setShowModal(false);
    setForm({ firstName: "", lastName: "", email: "", password: "", role: "EMPLOYEE", phone: "" });
    load();
  }

  const admins = users.filter(u => u.role === "ADMIN").length;
  const employees = users.filter(u => u.role === "EMPLOYEE").length;

  return (
    <div className="p-6 space-y-5" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>Хэрэглэгчид</h2>
          <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>Системийн хэрэглэгчдийн удирдлага</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "#1d4ed8" }}>
          <Plus className="size-4" />
          Шинэ хэрэглэгч
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Нийт хэрэглэгч", value: users.length, bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", icon: Users },
          { label: "Админ", value: admins, bg: "#fef2f2", border: "#fecaca", color: "#dc2626", icon: Shield },
          { label: "Ажилтан", value: employees, bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a", icon: User },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: "white", border: `1px solid ${s.border}` }}>
              <div className="flex items-center justify-center size-10 rounded-xl" style={{ background: s.bg }}>
                <Icon className="size-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "#94a3b8" }}>{s.label}</p>
                <p className="text-xl font-bold" style={{ color: "#0f172a" }}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #f1f5f9" }}>
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: "#f1f5f9" }} />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                {["Хэрэглэгч", "Имэйл", "Утас", "Үүрэг", "Төлөв"].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium" style={{ color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: "1px solid #f8fafc" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-8 rounded-full text-xs font-bold text-white"
                        style={{ background: user.role === "ADMIN" ? "#1d4ed8" : "#16a34a" }}>
                        {user.firstName[0]}{user.lastName?.[0] || ""}
                      </div>
                      <span className="font-medium" style={{ color: "#0f172a" }}>
                        {user.lastName} {user.firstName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "#64748b" }}>{user.email}</td>
                  <td className="px-5 py-3.5" style={{ color: "#64748b" }}>{user.phone || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={user.role === "ADMIN"
                        ? { background: "#eff6ff", color: "#1d4ed8" }
                        : { background: "#f0fdf4", color: "#16a34a" }}>
                      {user.role === "ADMIN" ? "Админ" : "Ажилтан"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: "#f0fdf4", color: "#16a34a" }}>
                      <span className="size-1.5 rounded-full" style={{ background: "#22c55e" }} />
                      Идэвхтэй
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "white" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: "#0f172a" }}>Шинэ хэрэглэгч нэмэх</h3>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}>
                <X className="size-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                    Овог <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Овог" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                    Нэр <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Нэр" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                  Имэйл <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="example@emsan.mn" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>
                  Нууц үг <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>Утас</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="99001122" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748b" }}>Үүрэг</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  <option value="EMPLOYEE">Ажилтан</option>
                  <option value="ADMIN">Админ</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "#f1f5f9", color: "#64748b" }}>
                Болих
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: isSaving ? "#93c5fd" : "#1d4ed8" }}>
                {isSaving ? "Хадгалж байна..." : "Хадгалах"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}