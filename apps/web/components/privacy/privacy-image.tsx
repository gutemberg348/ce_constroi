"use client";

import { ImageOff, ShieldCheck } from "lucide-react";
import { useConsentStore } from "@/stores/consent-store";

type PrivacyImageProps = {
  src?: string;
  alt: string;
  className?: string;
  requiresConsent?: boolean;
};

export function PrivacyImage({ src, alt, className = "", requiresConsent = false }: PrivacyImageProps) {
  const hasHydrated = useConsentStore((state) => state.hasHydrated);
  const canLoadMedia = useConsentStore((state) => state.settings.media);
  const openConsent = useConsentStore((state) => state.open);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-black/5 text-[var(--muted)] dark:bg-white/10 ${className}`}>
        <ImageOff size={24} />
      </div>
    );
  }

  if (requiresConsent && (!hasHydrated || !canLoadMedia)) {
    return (
      <div
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,rgba(15,118,110,0.14),rgba(39,70,144,0.12))] p-4 text-center ${className}`}
        role="img"
      >
        <ShieldCheck className="text-[var(--accent)]" size={26} />
        <span className="max-w-xs text-sm font-semibold">Midia externa bloqueada pela LGPD</span>
        <button
          className="focus-ring rounded-[8px] bg-[#11150f] px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-[#11150f]"
          onClick={openConsent}
          type="button"
        >
          Gerenciar cookies
        </button>
      </div>
    );
  }

  return <img alt={alt} className={className} src={src} />;
}
