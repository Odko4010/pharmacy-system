import clsx from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("rounded-xl bg-white", className)}
      style={{ border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("px-5 py-4", className)} style={{ borderBottom: "1px solid #f8fafc" }}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("px-5 py-4", className)}>{children}</div>;
}

type BadgeVariant = "success" | "danger" | "warning" | "neutral" | "brand";

const badgeStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: "#f0fdf4", color: "#16a34a" },
  danger: { bg: "#fef2f2", color: "#dc2626" },
  warning: { bg: "#fffbeb", color: "#d97706" },
  neutral: { bg: "#f8fafc", color: "#64748b" },
  brand: { bg: "#eff6ff", color: "#1d4ed8" },
};

export function Badge({ variant = "neutral", children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  const s = badgeStyles[variant];
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}>
      {children}
    </span>
  );
}