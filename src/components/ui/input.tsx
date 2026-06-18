import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

const baseFieldStyles =
  "w-full rounded-lg border border-[var(--color-ink-300)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink-900)] " +
  "placeholder:text-[var(--color-ink-500)] transition-colors duration-150 " +
  "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-[var(--color-brand-500)] " +
  "disabled:bg-[var(--color-ink-50)] disabled:text-[var(--color-ink-500)] disabled:cursor-not-allowed";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={clsx(baseFieldStyles, error && "border-[var(--color-danger)] focus:ring-[var(--color-danger)]", className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="w-full">
      <select
        ref={ref}
        className={clsx(baseFieldStyles, "cursor-pointer", error && "border-[var(--color-danger)]", className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        className={clsx(baseFieldStyles, "min-h-[88px] resize-y", error && "border-[var(--color-danger)]", className)}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

export function Label({ children, required, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[var(--color-ink-700)]">
      {children}
      {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
    </label>
  );
}
