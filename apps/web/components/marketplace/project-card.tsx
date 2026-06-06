"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Bath, BedDouble, Ruler } from "lucide-react";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { area, money } from "@/lib/format";
import { Project } from "@/types/domain";
import { FavoriteButton } from "./favorite-button";

export function ProjectCard({ project }: { project: Project }) {
  const image = project.images?.[0]?.url ?? project.renderUrl;

  return (
    <article className="group overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)] transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative">
        <Link className="block aspect-[16/10] overflow-hidden bg-[#dfe4dc]" href={`/projetos/${project.id}` as Route}>
          {image ? (
            <PrivacyImage
              alt={project.images?.[0]?.altText ?? project.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={image}
            />
          ) : null}
        </Link>
        <FavoriteButton className="absolute right-3 top-3" targetId={project.id} targetType="project" />
      </div>
      <Link className="block space-y-4 p-4" href={`/projetos/${project.id}` as Route}>
        <div>
          <div className="text-xs uppercase text-[var(--muted)]">
            {project.style ?? "Arquitetura"} - {project.architect?.user?.name ?? "Studio parceiro"}
          </div>
          <h3 className="mt-2 text-lg font-semibold">{project.title}</h3>
        </div>
        <p className="line-clamp-2 text-sm text-[var(--muted)]">{project.description}</p>
        <div className="grid grid-cols-3 gap-2 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <BedDouble size={15} />
            {project.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath size={15} />
            {project.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1">
            <Ruler size={15} />
            {area(project.areaM2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{money(project.price)}</span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            Ver projeto <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </article>
  );
}
