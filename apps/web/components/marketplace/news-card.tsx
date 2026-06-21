import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import type { NewsPost } from "@/types/domain";

function newsDate(post: NewsPost) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(post.publishedAt ?? post.createdAt));
}

export function NewsCard({ post }: { post: NewsPost }) {
  return (
    <article className="group min-w-0 overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)]">
      <Link className="block min-w-0" href={`/noticias/${post.slug}` as Route}>
        <div className="aspect-[16/9] overflow-hidden bg-[#e7eef8] dark:bg-[#0b1f3d]">
          {post.imageUrl ? (
            <PrivacyImage
              alt={post.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={post.imageUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--accent)]">
              <Newspaper size={48} strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="min-w-0 p-5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} />
              {newsDate(post)}
            </span>
            {post.author ? <span className="break-words [overflow-wrap:anywhere]">Por {post.author}</span> : null}
          </div>
          <h3 className="mt-3 break-words text-xl font-semibold leading-tight [overflow-wrap:anywhere]">{post.title}</h3>
          <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-[var(--muted)] [overflow-wrap:anywhere]">{post.excerpt}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            Ler noticia
            <ArrowRight size={16} />
          </span>
        </div>
      </Link>
    </article>
  );
}
