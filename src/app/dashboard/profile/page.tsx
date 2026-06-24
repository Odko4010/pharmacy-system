"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (session?.user) {
      const nameParts = (session.user.name || "").split(" ");
      setForm(prev => ({
        ...prev,
        email: session.user?.email || "",
        lastName: nameParts[0] || "",
        firstName: nameParts[1] || "",
      }));
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      showToast("Шинэ нууц үг таарахгүй байна", "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message, "success");
      await update();
      setForm(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Алдаа гарлаа", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Миний мэдээлэл</h1>
        <p className="text-sm text-gray-500">Хувийн мэдээлэл болон нууц үгээ өөрчлөх</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Хувийн мэдээлэл */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="size-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Хувийн мэдээлэл</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Овог</label>
              <input
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 outline-none focus:border-blue-500"
                placeholder="Овог"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Нэр</label>
              <input
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 outline-none focus:border-blue-500"
                placeholder="Нэр"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Phone className="size-3.5" /> Утас
              </label>
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 outline-none focus:border-blue-500"
                placeholder="Утасны дугаар"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Mail className="size-3.5" /> Имэйл
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 outline-none focus:border-blue-500"
                placeholder="Имэйл хаяг"
              />
              <p className="text-xs text-gray-400 mt-1">Имэйл өөрчлөгдвөл баталгаажуулах код илгээгдэнэ</p>
            </div>
          </div>
        </div>

        {/* Нууц үг */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="size-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Нууц үг өөрчлөх</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Одоогийн нууц үг</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={form.currentPassword}
                  onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm border border-gray-200 bg-gray-50 outline-none focus:border-blue-500"
                  placeholder="Одоогийн нууц үг"
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Шинэ нууц үг</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={form.newPassword}
                    onChange={e => setForm({ ...form, newPassword: e.target.value })}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm border border-gray-200 bg-gray-50 outline-none focus:border-blue-500"
                    placeholder="Дор хаяж 6 тэмдэгт"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Нууц үг давтах</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 bg-gray-50 outline-none focus:border-blue-500"
                  placeholder="Нууц үгийг давтана уу"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
          style={{ background: isLoading ? "#93c5fd" : "#1d4ed8" }}
        >
          {isLoading ? (
            <><span className="animate-spin">⟳</span> Хадгалж байна...</>
          ) : (
            <><Save className="size-4" /> Өөрчлөлт хадгалах</>
          )}
        </button>
      </form>
    </div>
  );
}