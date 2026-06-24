"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Pill, Loader2, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setIsLoading(false);
    if (result?.error) {
      setError("Ð˜Ð¼ÑÐ¹Ð» ÑÑÐ²ÑÐ» Ð½ÑƒÑƒÑ† Ò¯Ð³ Ð±ÑƒÑ€ÑƒÑƒ Ð±Ð°Ð¹Ð½Ð°");
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center size-14 rounded-2xl mb-4"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <Pill className="size-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Ð­Ð¼Ð¡Ð°Ð½</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Ð­Ð¼Ð¸Ð¹Ð½ ÑÐ°Ð½Ð³Ð¸Ð¹Ð½ Ð±Ò¯Ñ€Ñ‚Ð³ÑÐ»Ð¸Ð¹Ð½ ÑÐ¸ÑÑ‚ÐµÐ¼
          </p>
        </div>

        <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.97)" }}>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Ð¢Ð°Ð²Ñ‚Ð°Ð¹ Ð¼Ð¾Ñ€Ð¸Ð»Ð½Ð¾ ÑƒÑƒ</h2>
          <p className="text-sm text-gray-500 mb-6">Ð¡Ð¸ÑÑ‚ÐµÐ¼Ð´ Ð½ÑÐ²Ñ‚Ñ€ÑÑ…Ð¸Ð¹Ð½ Ñ‚ÑƒÐ»Ð´ Ð¼ÑÐ´ÑÑÐ»Ð»ÑÑ Ð¾Ñ€ÑƒÑƒÐ»Ð½Ð° ÑƒÑƒ</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ð˜Ð¼ÑÐ¹Ð» Ñ…Ð°ÑÐ³ <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ÐÑƒÑƒÑ† Ò¯Ð³ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all"
                  style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{ background: isLoading ? "#93c5fd" : "#1d4ed8" }}>
              {isLoading ? (
                <><Loader2 className="size-4 animate-spin" /> ÐÑÐ²Ñ‚ÑÑ€Ñ‡ Ð±Ð°Ð¹Ð½Ð°...</>
              ) : "ÐÑÐ²Ñ‚Ñ€ÑÑ…"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
          ÐÑÐ²Ñ‚Ñ€ÑÑ… ÑÑ€Ñ…Ð¸Ð¹Ð½ Ñ‚Ð°Ð»Ð°Ð°Ñ€ Ð°ÑÑƒÑƒÐ´Ð°Ð» Ð³Ð°Ñ€ÑÐ°Ð½ Ñ‚Ð¾Ñ…Ð¸Ð¾Ð»Ð´Ð¾Ð»Ð´ ÑÐ¸ÑÑ‚ÐµÐ¼Ð¸Ð¹Ð½ Ð°Ð´Ð¼Ð¸Ð½Ñ‚Ð°Ð¹ Ñ…Ð¾Ð»Ð±Ð¾Ð³Ð´Ð¾Ð½Ð¾ ÑƒÑƒ
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 100%)" }}>
        <Loader2 className="size-8 text-white animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
