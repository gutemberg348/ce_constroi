"use client";

import { Eye, EyeOff } from "lucide-react";
import { InputHTMLAttributes, useState } from "react";
import { Input } from "./input";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative w-full">
      <Input {...props} className={`pr-12 ${className}`} type={isVisible ? "text" : "password"} />
      <button
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        className="focus-ring absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[8px] text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/10"
        onClick={() => setIsVisible((current) => !current)}
        title={isVisible ? "Ocultar senha" : "Mostrar senha"}
        type="button"
      >
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
