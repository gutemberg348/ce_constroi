import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "light" | "ghost";
  children: ReactNode;
};

const variants = {
  primary: "bg-[#061733] text-white hover:bg-[#0b2a5b] dark:bg-white dark:text-[#061733] dark:hover:bg-white/90",
  secondary: "bg-[#0d6efd] text-white hover:bg-[#0b5ed7] dark:bg-[#60a5fa] dark:text-[#061733] dark:hover:bg-[#93c5fd]",
  light: "bg-white text-[#061733] hover:bg-white/90",
  ghost: "bg-transparent text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10"
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
