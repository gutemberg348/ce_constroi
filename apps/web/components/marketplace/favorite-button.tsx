"use client";

import { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";
import { useAuthStore } from "@/stores/auth-store";

type FavoriteButtonProps = {
  targetId: string;
  targetType: "terrain" | "project";
  className?: string;
};

export function FavoriteButton({ targetId, targetType, className = "" }: FavoriteButtonProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const { data: favorites } = useFavorites();
  const input = targetType === "terrain" ? { terrainId: targetId } : { projectId: targetId };
  const toggleFavorite = useToggleFavorite(input);

  const favorite = favorites?.find((item) =>
    targetType === "terrain"
      ? item.terrainId === targetId || item.terrain?.id === targetId
      : item.projectId === targetId || item.project?.id === targetId
  );
  const isFavorite = Boolean(favorite);
  const label = isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos";

  function onClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!hasHydrated) {
      return;
    }

    if (!accessToken) {
      router.push("/login");
      return;
    }

    if (favorite) {
      toggleFavorite.removeFavorite(favorite.id);
      return;
    }

    toggleFavorite.addFavorite();
  }

  return (
    <button
      aria-label={label}
      className={`focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] text-[var(--foreground)] shadow-sm backdrop-blur transition hover:bg-[var(--panel)] ${
        isFavorite ? "text-red-600" : ""
      } ${className}`}
      disabled={!hasHydrated || toggleFavorite.isPending}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Heart fill={isFavorite ? "currentColor" : "none"} size={19} />
    </button>
  );
}
