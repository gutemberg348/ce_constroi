CREATE TYPE "NewsStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "news_posts" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "imageUrl" TEXT,
  "author" TEXT,
  "status" "NewsStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "news_posts_slug_key" ON "news_posts"("slug");
CREATE INDEX "news_posts_status_publishedAt_idx" ON "news_posts"("status", "publishedAt");
CREATE INDEX "news_posts_createdAt_idx" ON "news_posts"("createdAt");
CREATE INDEX "news_posts_deletedAt_idx" ON "news_posts"("deletedAt");
