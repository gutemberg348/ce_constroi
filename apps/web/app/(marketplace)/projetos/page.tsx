import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectBrowser } from "@/components/marketplace/project-browser";

export const metadata: Metadata = {
  title: "Projetos"
};

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">Carregando projetos...</div>}>
      <ProjectBrowser />
    </Suspense>
  );
}
