"use client";

import { ReactNode } from "react";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <CookieConsent />
      </QueryProvider>
    </ThemeProvider>
  );
}
