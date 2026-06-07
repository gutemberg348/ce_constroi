import type { Metadata } from "next";
import { Suspense } from "react";
import { TerrainBrowser } from "@/components/marketplace/terrain-browser";

export const metadata: Metadata = {
  title: "Terrenos"
};

export default function TerrainsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">Carregando terrenos...</div>}>
      <TerrainBrowser />
    </Suspense>
  );
}
