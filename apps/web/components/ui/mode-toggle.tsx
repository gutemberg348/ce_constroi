"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-label="Alternar tema"
      className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/18 bg-white text-[#061733] dark:bg-[#0b1f3d] dark:text-white"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
