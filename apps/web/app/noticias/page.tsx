import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { NewsCard } from "@/components/marketplace/news-card";
import { getNews } from "@/services/news";

export const metadata: Metadata = {
  title: "Noticias da construcao"
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await getNews({ limit: 12 });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase text-[var(--accent)]">Conteudo</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Noticias da construcao</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--muted)]">
          Informacoes sobre terrenos, projetos, construcao, documentacao e financiamento para ajudar voce a decidir melhor.
        </p>
      </div>

      {news.items.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {news.items.map((post) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-[var(--muted)]">
          <Newspaper className="mb-3 text-[var(--accent)]" size={28} />
          Nenhuma noticia publicada ainda.
        </div>
      )}
    </section>
  );
}
