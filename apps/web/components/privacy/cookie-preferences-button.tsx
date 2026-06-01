"use client";

import { SlidersHorizontal } from "lucide-react";
import { useConsentStore } from "@/stores/consent-store";

export function CookiePreferencesButton({ className = "" }: { className?: string }) {
  const open = useConsentStore((state) => state.open);

  return (
    <button
      className={`focus-ring inline-flex items-center gap-2 rounded-[8px] text-sm font-semibold text-[var(--accent)] ${className}`}
      onClick={open}
      type="button"
    >
      <SlidersHorizontal size={16} />
      Gerenciar cookies
    </button>
  );
}
