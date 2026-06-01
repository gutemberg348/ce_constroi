import type { Metadata } from "next";
import { TerrainBrowser } from "@/components/marketplace/terrain-browser";

export const metadata: Metadata = {
  title: "Terrenos"
};

export default function TerrainsPage() {
  return <TerrainBrowser />;
}
