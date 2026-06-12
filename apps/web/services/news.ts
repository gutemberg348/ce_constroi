import { api, unwrap } from "./api";
import type { NewsPost, NewsStatus, Paginated } from "@/types/domain";

export type NewsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: NewsStatus;
};

export type NewsPostInput = {
  title: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  author?: string;
  status?: NewsStatus;
};

export async function getNews(params?: NewsListParams) {
  const response = await api.get<Paginated<NewsPost>>("/news", { params });
  return unwrap<Paginated<NewsPost>>(response);
}

export async function getNewsPost(slug: string) {
  const response = await api.get<NewsPost>(`/news/${slug}`);
  return unwrap<NewsPost>(response);
}

export async function getAdminNews(params?: NewsListParams) {
  const response = await api.get<Paginated<NewsPost>>("/news/admin", { params });
  return unwrap<Paginated<NewsPost>>(response);
}

export async function createNewsPost(input: NewsPostInput) {
  const response = await api.post<NewsPost>("/news", input);
  return unwrap<NewsPost>(response);
}

export async function updateNewsPost(id: string, input: Partial<NewsPostInput>) {
  const response = await api.patch<NewsPost>(`/news/${id}`, input);
  return unwrap<NewsPost>(response);
}

export async function deleteNewsPost(id: string) {
  const response = await api.delete<NewsPost>(`/news/${id}`);
  return unwrap<NewsPost>(response);
}
