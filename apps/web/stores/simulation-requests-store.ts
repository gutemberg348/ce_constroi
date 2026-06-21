"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SimulationRequest = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  desiredPropertyValue: number;
  terrainPrice: number;
  projectPrice: number;
  buildCost: number;
  totalIncome: number;
  maxCredit: number;
  maxPropertyValue: number;
  maxInstallment: number;
  availableEntry: number;
  requestedOptionLabel?: string;
  requestedOptionValue?: number;
  selectedOptionLabel?: string;
  selectedOptionValue?: number;
  entryGap?: number;
  financingGap?: number;
  score: number;
  status: string;
  fitMessage: string;
  stage: "Novo" | "Em atendimento" | "Convertido" | "Finalizado";
};

type SimulationRequestsState = {
  requests: SimulationRequest[];
  addRequest: (request: Omit<SimulationRequest, "id" | "createdAt" | "stage">) => SimulationRequest;
  updateStage: (id: string, stage: SimulationRequest["stage"]) => void;
};

export const useSimulationRequestsStore = create<SimulationRequestsState>()(
  persist(
    (set) => ({
      requests: [],
      addRequest: (request) => {
        const saved: SimulationRequest = {
          ...request,
          id: `SIM-${Date.now()}`,
          createdAt: new Date().toISOString(),
          stage: "Novo"
        };

        set((state) => ({ requests: [saved, ...state.requests].slice(0, 30) }));
        return saved;
      },
      updateStage: (id, stage) =>
        set((state) => ({
          requests: state.requests.map((request) => (request.id === id ? { ...request, stage } : request))
        }))
    }),
    {
      name: "ceconstroi.simulation.requests.v1"
    }
  )
);
