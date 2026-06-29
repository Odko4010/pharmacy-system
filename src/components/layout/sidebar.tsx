"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Pill, ShoppingCart, Receipt, Boxes,
  Users, Tag, BarChart2, PackagePlus, RotateCcw, Truck, UserCircle
} from "lucide-react";
import clsx from "clsx";

const navGroups = [
  {
    label: "ҮНДСЭН",
    items: [
      { href: "/dashboard", label: "Нүүр хуудас", icon: LayoutDashboard },
      { href: "/dashboard/medicines", label: "Эмийн жагсаалт", icon: Pill },
    ],
  },
  {
    label: "БОРЛУУЛАЛТ",
    items: [
      { href: "/dashboard/sales/new", label: "Борлуулалт хийх", icon: ShoppingCart },
      { href: "/dashboard/sales", label: "Борлуулалтын жагсаалт", icon: Receipt },
      { href: "/dashboard/sales/refund", label: "Буцаалт", icon: RotateCcw },
    ],
  },
  {
    label: "НӨӨЦ",
    items: [
      { href: "/dashboard/inventory", label: "Нөөц орлогодох", icon: PackagePlus },
      { href: "/dashboard/stock", label: "Нөөцийн хяналт", icon: Boxes },
      { href: "/dashboard/orders", label: "Захиалга", icon: ShoppingCart },
      { href: "/dashboard/suppliers", label: "Нийлүүлэгч", icon: Truck },
    ],
  },
  {
    label: "ТАЙЛАН & ТОХИРГОО",
    items: [
      { href: "/dashboard/reports", label: "Тайлан", icon: BarChart2 },
      { href: "/dashboard/categories", label: "Ангилал", icon: Tag },
      { href: "/dashboard/users", label: "Хэрэглэгчид", icon: Users, adminOnly: true },
      { href: "/dashboard/profile", label: "Миний мэдээлэл", icon: UserCircle },
    ],
  },
];

export function Sidebar({ role }: { role: "ADMIN" | "EMPLOYEE" }) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex md:flex-col w-60 shrink-0 min-h-screen sticky top-0"
      style={{ background: "#0f1f3d", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="flex items-center justify-center size-8 rounded-lg"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <Pill className="size-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">ЭмСан</p>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Эмийн сангийн систем
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => !("adminOnly" in item && item.adminOnly && role !== "ADMIN"));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-1.5"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150")}
                      style={
                        isActive
                          ? { background: "rgba(255,255,255,0.12)", color: "white" }
                          : { color: "rgba(255,255,255,0.55)" }
                      }
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.color = "white";
                          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <Icon className="size-[17px] shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Хувилбар 1.1</p>
      </div>
    </aside>
  );
}