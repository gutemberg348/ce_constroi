"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthTokens, AuthUser } from "@/types/domain";

export const AUTH_LOGOUT_EVENT = "ce-constroi.auth.logout";

const logoutStorageKeys = [
  "anselmo.accessToken",
  "anselmo.auth",
  "ce-constroi.simulation-form.v1",
  "ceconstroi.simulation.requests.v1"
];

function clearAppCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();

    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });
}

function clearBrowserSessionArtifacts() {
  if (typeof window === "undefined") {
    return;
  }

  logoutStorageKeys.forEach((key) => window.localStorage.removeItem(key));
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith("ce-constroi.simulation-form.v1."))
    .forEach((key) => window.localStorage.removeItem(key));
  window.sessionStorage.clear();
  clearAppCookies();

  if ("caches" in window) {
    void window.caches.keys().then((keys) => keys.forEach((key) => void window.caches.delete(key)));
  }

  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}

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
        clearBrowserSessionArtifacts();
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
