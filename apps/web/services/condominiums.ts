import { api, unwrap } from "./api";
import { AssetImage, Condominium, Paginated } from "@/types/domain";

export type CondominiumInput = {
  name: string;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  developer?: string;
  builder?: string;
  description: string;
  leisureInfrastructure?: string;
  securityInfrastructure?: string;
  servicesInfrastructure?: string;
  condominiumValue?: number;
  constructionRules?: string;
  isActive?: boolean;
};

export type CondominiumImageInput = {
  url: string;
  storageKey?: string;
  altText?: string;
  sortOrder?: number;
  isCover?: boolean;
};

export async function getCondominiums(params?: Record<string, string | number | boolean | undefined>) {
  const response = await api.get<Paginated<Condominium>>("/condominiums", { params });
  return unwrap<Paginated<Condominium>>(response);
}

export async function getAdminCondominiums(params?: Record<string, string | number | boolean | undefined>) {
  const response = await api.get<Paginated<Condominium>>("/admin/condominiums", { params });
  return unwrap<Paginated<Condominium>>(response);
}

export async function getAllAdminCondominiums(params?: Record<string, string | number | boolean | undefined>) {
  const firstPage = await getAdminCondominiums({ ...params, page: 1, limit: 100 });

  if (firstPage.meta.totalPages <= 1) {
    return firstPage;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
      getAdminCondominiums({ ...params, page: index + 2, limit: 100 })
    )
  );

  return {
    ...firstPage,
    items: [firstPage, ...remainingPages].flatMap((page) => page.items)
  };
}

export async function createAdminCondominium(input: CondominiumInput) {
  const response = await api.post<Condominium>("/admin/condominiums", input);
  return unwrap<Condominium>(response);
}

export async function updateAdminCondominium(id: string, input: Partial<CondominiumInput>) {
  const response = await api.patch<Condominium>(`/admin/condominiums/${id}`, input);
  return unwrap<Condominium>(response);
}

export async function deleteAdminCondominium(id: string) {
  const response = await api.delete<Condominium>(`/admin/condominiums/${id}`);
  return unwrap<Condominium>(response);
}

export async function addAdminCondominiumImage(condominiumId: string, input: CondominiumImageInput) {
  const response = await api.post<AssetImage>(`/admin/condominiums/${condominiumId}/images`, {
    ...input,
    storageKey: input.storageKey || input.url
  });
  return unwrap<AssetImage>(response);
}

export async function removeAdminCondominiumImage(imageId: string) {
  const response = await api.delete<AssetImage>(`/admin/condominiums/images/${imageId}`);
  return unwrap<AssetImage>(response);
}
