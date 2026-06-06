"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthTokens, AuthUser } from "@/types/domain";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  setSession: (session: AuthTokens) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      setSession: (session) => {
        window.localStorage.setItem("anselmo.accessToken", session.accessToken);
        set(session);
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => {
        window.localStorage.removeItem("anselmo.accessToken");
        set({ user: null, accessToken: null, refreshToken: null });
      }
    }),
    {
      name: "anselmo.auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
