"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Menu, X, Bell } from "lucide-react";
import { MobileNav } from "./MobileNav";

interface HeaderProps {
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  pageTitle: string;
}

export function Header({ name, role, pageTitle }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3"
        style={{ background: "white", borderBottom: "1px solid #f1f5f9" }}>
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1.5 -ml-1.5 text-gray-500" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </button>
          <h1 className="text-base font-semibold" style={{ color: "#0f172a" }}>{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg transition-colors hover:bg-gray-50" style={{ color: "#94a3b8" }}>
            <Bell className="size-4" />
          </button>

          <div className="flex items-center gap-2.5 pl-2" style={{ borderLeft: "1px solid #f1f5f9" }}>
            <div className="flex items-center justify-center size-8 rounded-full text-xs font-semibold text-white"
              style={{ background: "#1d4ed8" }}>
              {initials || "А"}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-none" style={{ color: "#0f172a" }}>{name}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {role === "ADMIN" ? "Админ" : "Ажилтан"}
              </p>
            </div>
          </div>

          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded-lg transition-colors hover:bg-red-50"
            style={{ color: "#94a3b8" }}
            title="Гарах">
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 shadow-xl" style={{ background: "#0f1f3d" }}>
            <div className="flex justify-end px-3 py-3">
              <button onClick={() => setMobileOpen(false)} className="p-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                <X className="size-5" />
              </button>
            </div>
            <MobileNav role={role} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}