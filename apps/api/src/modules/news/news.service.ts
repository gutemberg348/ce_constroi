import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@/generated/prisma/client";
import { NewsStatus } from "@/generated/prisma/enums";
import { PrismaService } from "@/database/prisma/prisma.service";
import { getPagination } from "@/common/pagination/pagination.dto";
import { CreateNewsPostDto } from "./dto/create-news-post.dto";
import { ListNewsPostsDto } from "./dto/list-news-posts.dto";
import { UpdateNewsPostDto } from "./dto/update-news-post.dto";

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(query: ListNewsPostsDto) {
    return this.list(query, NewsStatus.PUBLISHED);
  }

  async listAdmin(query: ListNewsPostsDto) {
    return this.list(query, query.status);
  }

  async findPublished(slug: string) {
    const post = await this.prisma.newsPost.findFirst({
      where: {
        slug,
        status: NewsStatus.PUBLISHED,
        deletedAt: null
      }
    });

    if (!post) {
      throw new NotFoundException("Noticia nao encontrada");
    }

    return post;
  }

  async create(dto: CreateNewsPostDto) {
    const status = dto.status ?? NewsStatus.DRAFT;

    return this.prisma.newsPost.create({
      data: {
        title: dto.title.trim(),
        slug: await this.uniqueSlug(dto.title),
        excerpt: dto.excerpt.trim(),
        content: dto.content.trim(),
        imageUrl: dto.imageUrl?.trim() || null,
        author: dto.author?.trim() || null,
        status,
        publishedAt: status === NewsStatus.PUBLISHED ? new Date() : null
      }
    });
  }

  async update(id: string, dto: UpdateNewsPostDto) {
    const current = await this.findAdminPost(id);
    const nextStatus = dto.status ?? current.status;
    const publishedAt =
      nextStatus === NewsStatus.PUBLISHED
        ? current.publishedAt ?? new Date()
        : null;

    return this.prisma.newsPost.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl.trim() || null } : {}),
        ...(dto.author !== undefined ? { author: dto.author.trim() || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status, publishedAt } : {})
      }
    });
  }

  async remove(id: string) {
    await this.findAdminPost(id);

    return this.prisma.newsPost.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  private async list(query: ListNewsPostsDto, status?: NewsStatus) {
    const pagination = getPagination(query);
    const where: Prisma.NewsPostWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { excerpt: { contains: query.search, mode: "insensitive" } },
              { content: { contains: query.search, mode: "insensitive" } },
              { author: { contains: query.search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.newsPost.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
      }),
      this.prisma.newsPost.count({ where })
    ]);

    return {
      items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  }

  private async findAdminPost(id: string) {
    const post = await this.prisma.newsPost.findFirst({
      where: { id, deletedAt: null }
    });

    if (!post) {
      throw new NotFoundException("Noticia nao encontrada");
    }

    return post;
  }

  private async uniqueSlug(title: string) {
    const base =
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || "noticia";

    let slug = base;
    let suffix = 2;

    while (await this.prisma.newsPost.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }
}
