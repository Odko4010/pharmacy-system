"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Pill, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Нууц үг таарахгүй байна"); return; }
    if (password.length < 6) { setError("Нууц үг дор хаяж 6 тэмдэгт байх ёстой"); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center size-14 rounded-2xl mb-4"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <Pill className="size-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ЭмСан</h1>
        </div>

        <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.97)" }}>
          {success ? (
            <div className="text-center">
              <CheckCircle className="size-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Амжилттай!</h2>
              <p className="text-sm text-gray-500 mb-2">Нууц үг амжилттай солигдлоо.</p>
              <p className="text-sm text-gray-400">Нэвтрэх хуудас руу шилжиж байна...</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Нууц үг сэргээх</h2>
              <p className="text-sm text-gray-500 mb-6">Шинэ нууц үгээ оруулна уу.</p>

              {!token && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
                  Token олдсонгүй. Дахин нууц үг сэргээх хүсэлт илгээнэ үү.
                </div>
              )}

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Шинэ нууц үг</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      placeholder="Дор хаяж 6 тэмдэгт"
                      className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none border border-gray-200 bg-gray-50 focus:border-blue-500"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Нууц үг давтах</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Нууц үгийг дахин оруулна уу"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border border-gray-200 bg-gray-50 focus:border-blue-500"
                  />
                </div>

                <button type="submit" disabled={isLoading || !token}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2"
                  style={{ background: isLoading ? "#93c5fd" : "#1d4ed8" }}>
                  {isLoading ? <><Loader2 className="size-4 animate-spin" /> Хадгалж байна...</> : "Нууц үг солих"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                  Нэвтрэх хуудас руу буцах
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 100%)" }} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
