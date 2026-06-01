"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CONSENT_STORAGE_KEY = "anselmo.lgpd.consent.v1";

export type ConsentSettings = {
  necessary: true;
  preferences: boolean;
  media: boolean;
  analytics: boolean;
  marketing: boolean;
};

const defaultSettings: ConsentSettings = {
  necessary: true,
  preferences: false,
  media: false,
  analytics: false,
  marketing: false
};

type ConsentState = {
  hasHydrated: boolean;
  hasDecided: boolean;
  isOpen: boolean;
  settings: ConsentSettings;
  updatedAt?: string;
  setHasHydrated: (value: boolean) => void;
  open: () => void;
  close: () => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  saveSettings: (settings: ConsentSettings) => void;
};

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      hasDecided: false,
      isOpen: false,
      settings: defaultSettings,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      acceptAll: () =>
        set({
          hasDecided: true,
          isOpen: false,
          updatedAt: new Date().toISOString(),
          settings: {
            necessary: true,
            preferences: true,
            media: true,
            analytics: true,
            marketing: true
          }
        }),
      rejectOptional: () =>
        set({
          hasDecided: true,
          isOpen: false,
          updatedAt: new Date().toISOString(),
          settings: defaultSettings
        }),
      saveSettings: (settings) =>
        set({
          hasDecided: true,
          isOpen: false,
          updatedAt: new Date().toISOString(),
          settings: {
            ...settings,
            necessary: true
          }
        })
    }),
    {
      name: CONSENT_STORAGE_KEY,
      partialize: (state) => ({
        hasDecided: state.hasDecided,
        settings: state.settings,
        updatedAt: state.updatedAt
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
