"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Receipt,
  Boxes,
  Users,
  Pin,
  Truck,
} from "lucide-react";
import clsx from "clsx";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Нүүр хуудас", icon: LayoutDashboard },
  { href: "/dashboard/medicines", label: "Эмийн жагсаалт", icon: Pill },
  { href: "/dashboard/sales", label: "Борлуулалт", icon: Receipt },
  { href: "/dashboard/orders", label: "Захиалга", icon: ShoppingCart },
  { href: "/dashboard/inventory", label: "Нөөц", icon: Boxes },
  { href: "/dashboard/suppliers", label: "Нийлүүлэгч", icon: Truck },
  { href: "/dashboard/categories", label: "Ангилал", icon: Pin },
  { href: "/dashboard/users", label: "Хэрэглэгчид", icon: Users, adminOnly: true },
];

export function MobileNav({ role, onNavigate }: { role: "ADMIN" | "EMPLOYEE"; onNavigate: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="px-3 pb-4 space-y-0.5">
      {navItems
        .filter((item) => !item.adminOnly || role === "ADMIN")
        .map((item) => {
          const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/90"
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
