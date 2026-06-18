import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variantStyles: Record<string, string> = {
  primary: "bg-[var(--color-brand-900)] text-white hover:bg-[var(--color-brand-700)] focus-visible:ring-[var(--color-brand-500)]",
  secondary: "bg-white text-[var(--color-ink-900)] border border-[var(--color-ink-300)] hover:bg-[var(--color-ink-50)] focus-visible:ring-[var(--color-brand-500)]",
  danger: "bg-[var(--color-danger)] text-white hover:bg-red-700 focus-visible:ring-red-400",
  ghost: "bg-transparent text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)] focus-visible:ring-[var(--color-brand-500)]",
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
