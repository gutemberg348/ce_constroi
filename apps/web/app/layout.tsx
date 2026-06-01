import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { AppShell } from "@/layouts/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Cê constroi",
    template: "%s | Cê constroi"
  },
  description: "Marketplace de terrenos, projetos arquitetonicos e simulacao financeira da Cê constroi.",
  metadataBase: new URL("http://localhost:3000")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
