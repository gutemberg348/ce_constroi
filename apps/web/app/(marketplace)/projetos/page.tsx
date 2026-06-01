import type { Metadata } from "next";
import { ProjectBrowser } from "@/components/marketplace/project-browser";

export const metadata: Metadata = {
  title: "Projetos"
};

export default function ProjectsPage() {
  return <ProjectBrowser />;
}
