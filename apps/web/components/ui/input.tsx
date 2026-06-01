import { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none transition placeholder:text-[var(--muted)] ${className}`}
      {...props}
    />
  );
}
