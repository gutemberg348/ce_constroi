"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFavorite, getFavorites, removeFavorite, type FavoriteInput } from "@/services/favorites";
import { useAuthStore } from "@/stores/auth-store";

export function useFavorites() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  return useQuery({
    queryKey: ["favorites"],
    queryFn: getFavorites,
    enabled: Boolean(hasHydrated && accessToken)
  });
}

export function useToggleFavorite(input: FavoriteInput) {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
  });

  return {
    addFavorite: () => addMutation.mutate(input),
    removeFavorite: (id: string) => removeMutation.mutate(id),
    isPending: addMutation.isPending || removeMutation.isPending
  };
}
