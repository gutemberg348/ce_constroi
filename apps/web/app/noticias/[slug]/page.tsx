import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, CalendarDays, Newspaper } from "lucide-react";
import { PrivacyImage } from "@/components/privacy/privacy-image";
import { getNewsPost } from "@/services/news";

function articleDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getNewsPost(slug);

  return (
    <article>
      <header className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]" href={"/noticias" as Route}>
            <ArrowLeft size={16} />
            Todas as noticias
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase text-[var(--accent)]">Construcao e moradia</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} />
              {articleDate(post.publishedAt ?? post.createdAt)}
            </span>
            {post.author ? <span>Por {post.author}</span> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[#e7eef8] dark:bg-[#0b1f3d]">
          {post.imageUrl ? (
            <PrivacyImage alt={post.title} className="max-h-[560px] w-full object-cover" src={post.imageUrl} />
          ) : (
            <div className="flex aspect-[16/7] items-center justify-center text-[var(--accent)]">
              <Newspaper size={64} strokeWidth={1.4} />
            </div>
          )}
        </div>
        <div className="mx-auto max-w-3xl whitespace-pre-line py-10 text-base leading-8 text-[var(--foreground)] sm:text-lg">
          {post.content}
        </div>
      </div>
    </article>
  );
}
