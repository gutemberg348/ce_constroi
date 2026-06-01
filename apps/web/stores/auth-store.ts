"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthTokens, AuthUser } from "@/types/domain";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: AuthTokens) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (session) => {
        window.localStorage.setItem("anselmo.accessToken", session.accessToken);
        set(session);
      },
      logout: () => {
        window.localStorage.removeItem("anselmo.accessToken");
        set({ user: null, accessToken: null, refreshToken: null });
      }
    }),
    {
      name: "anselmo.auth"
    }
  )
);
