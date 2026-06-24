"use client";

import { useState } from "react";
import Link from "next/link";
import { Pill, Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSent(true);
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
          {sent ? (
            <div className="text-center">
              <div className="flex items-center justify-center size-14 rounded-full bg-green-100 mx-auto mb-4">
                <Mail className="size-7 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Имэйл илгээгдлээ!</h2>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-medium">{email}</span> хаяг руу нууц үг сэргээх холбоос илгээгдлээ. Имэйлээ шалгана уу.
              </p>
              <Link href="/login" className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="size-4" /> Нэвтрэх хуудас руу буцах
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Нууц үг мартсан</h2>
              <p className="text-sm text-gray-500 mb-6">Имэйл хаягаа оруулна уу. Нууц үг сэргээх холбоос илгээнэ.</p>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Имэйл хаяг</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="example@email.com"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border border-gray-200 bg-gray-50 focus:border-blue-500"
                  />
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2"
                  style={{ background: isLoading ? "#93c5fd" : "#1d4ed8" }}>
                  {isLoading ? <><Loader2 className="size-4 animate-spin" /> Илгээж байна...</> : "Холбоос илгээх"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                  <ArrowLeft className="size-4" /> Нэвтрэх хуудас руу буцах
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
