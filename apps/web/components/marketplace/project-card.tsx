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
    <article className="group min-w-0 overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)] transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative">
        <Link className="block aspect-[16/10] w-full overflow-hidden bg-[#dfe4dc]" href={`/projetos/${project.id}` as Route}>
          {image ? (
            <PrivacyImage
              alt={project.images?.[0]?.altText ?? project.title}
              className="block h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={image}
            />
          ) : null}
        </Link>
        <FavoriteButton className="absolute right-3 top-3" targetId={project.id} targetType="project" />
      </div>
      <Link className="block min-w-0 space-y-4 p-4" href={`/projetos/${project.id}` as Route}>
        <div className="min-w-0">
          <div className="line-clamp-1 break-words text-xs uppercase text-[var(--muted)]">
            {project.style ?? "Arquitetura"} - {project.architect?.user?.name ?? "Studio parceiro"}
          </div>
          <h3 className="mt-2 line-clamp-2 break-words text-lg font-semibold leading-snug">{project.title}</h3>
        </div>
        <p className="line-clamp-2 break-words text-sm leading-6 text-[var(--muted)]">{project.description}</p>
        <div className="grid min-w-0 grid-cols-3 gap-2 text-sm text-[var(--muted)]">
          <span className="inline-flex min-w-0 items-center gap-1">
            <BedDouble className="shrink-0" size={15} />
            {project.bedrooms}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <Bath className="shrink-0" size={15} />
            {project.bathrooms}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <Ruler className="shrink-0" size={15} />
            <span className="min-w-0 truncate">{area(project.areaM2)}</span>
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <span className="min-w-0 break-words font-semibold">{money(project.price)}</span>
          <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            Ver projeto <ArrowRight className="shrink-0" size={16} />
          </span>
        </div>
      </Link>
    </article>
  );
}
