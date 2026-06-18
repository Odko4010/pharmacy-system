import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardShell } from "./Dashboardshell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar role={session.user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardShell name={session.user.name ?? ""} role={session.user.role}>
          {children}
        </DashboardShell>
      </div>
    </div>
  );
}