"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";

const pageTitles: Record<string, string> = {
  "/dashboard": "Нүүр хуудас",
  "/dashboard/medicines": "Эмийн жагсаалт",
  "/dashboard/sales": "Борлуулалт",
  "/dashboard/orders": "Захиалга",
  "/dashboard/inventory": "Нөөцийн удирдлага",
  "/dashboard/suppliers": "Нийлүүлэгчид",
  "/dashboard/categories": "Ангилал",
  "/dashboard/users": "Хэрэглэгчийн удирдлага",
};

function resolveTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const matched = Object.keys(pageTitles)
    .filter((key) => key !== "/dashboard" && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return matched ? pageTitles[matched] : "ЭмСан";
}

export function DashboardShell({
  name,
  role,
  children,
}: {
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <>
      <Header name={name} role={role} pageTitle={title} />
      <main className="flex-1 px-4 md:px-6 py-6 max-w-[1400px]">{children}</main>
    </>
  );
}
