import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "light" | "ghost";
  children: ReactNode;
};

const variants = {
  primary: "bg-[#11150f] text-white hover:bg-[#273022] dark:bg-white dark:text-[#11150f] dark:hover:bg-white/90",
  secondary: "bg-[#0f766e] text-white hover:bg-[#0d655f] dark:bg-[#2dd4bf] dark:text-[#062522] dark:hover:bg-[#5eead4]",
  light: "bg-white text-[#11150f] hover:bg-white/90",
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
