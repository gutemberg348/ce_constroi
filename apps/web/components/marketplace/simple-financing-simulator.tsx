"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCheck2,
  Home,
  KeyRound,
  Loader2,
  Lock,
  MessageCircle,
  Rocket,
  SlidersHorizontal,
  TrendingUp,
  UserRound,
  WalletCards,
  X,
  type LucideIcon
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { money, toNumber as parseMoney } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";
import { createSimulation, type SimulationInput } from "@/services/simulations";
import { useAuthStore } from "@/stores/auth-store";

type YesNo = "yes" | "no";
type IncomeType = "CLT" | "MEI" | "AUTONOMO" | "EMPRESARIO" | "INFORMAL";
type CreditScore = "EXCELLENT" | "GOOD" | "MEDIUM" | "LOW";
type PropertyType = "HOUSE" | "APARTMENT" | "LAND_BUILD" | "PLANT";
type PropertyCondition = "NEW" | "USED";
type PackageMode = "TERRAIN" | "TERRAIN_PROJECT" | "FULL" | "CUSTOM";

type QuickForm = {
  name: string;
  cpf: string;
  birthDate: string;
  maritalStatus: string;
  dependents: YesNo;
  city: string;
  state: string;
  zipCode: string;
  street: string;
  neighborhood: string;
  phone: string;
  email: string;
  monthlyIncome: string;
  hasInformalIncome: YesNo;
  otherIncome: string;
  incomeType: IncomeType;
  workTimeMonths: number;
  hasIncomeProof: YesNo;
  composeIncome: YesNo;
  coBuyerIncome: string;
  coBuyerScore: CreditScore;
  hasRestriction: YesNo;
  delayedFinancing: YesNo;
  activeLoans: string;
  monthlySpending: string;
  hasCurrentFinancing: YesNo;
  desiredPropertyValue: string;
  packageMode: PackageMode;
  propertyType: PropertyType;
  propertyCondition: PropertyCondition;
  useFgts: YesNo;
  fgtsValue: string;
  downPayment: string;
  creditScore: CreditScore;
};

type BaseOption = {
  key: PackageMode;
  label: string;
  amount: number;
  installment: number;
  isAvailable: boolean;
  description: string;
};

type Result = {
  totalIncome: number;
  maxInstallment: number;
  maxCredit: number;
  maxCreditByIncome: number;
  maxCreditByQuota: number;
  maxPropertyValue: number;
  minimumRequiredEntry: number;
  entryShortfall: number;
  desiredPackageValue: number;
  availableEntry: number;
  financedNeeded: number;
  estimatedInstallment: number;
  nominalAnnualRate: number;
  effectiveAnnualRate: number;
  monthlyRate: number;
  termMonths: number;
  ageAtEnd: number;
  hasBirthDate: boolean;
  isAgeEligible: boolean;
  financingSystem: "PRICE" | "SAC";
  productBand: string;
  requestedOption?: BaseOption;
  selectedOption?: BaseOption;
  options: BaseOption[];
  score: number;
  status: string;
  fitMessage: string;
  fgtsMessage: string;
  notes: string[];
};

const defaultForm: QuickForm = {
  name: "",
  cpf: "",
  birthDate: "",
  maritalStatus: "Solteiro(a)",
  dependents: "no",
  city: "",
  state: "",
  zipCode: "",
  street: "",
  neighborhood: "",
  phone: "",
  email: "",
  monthlyIncome: "",
  hasInformalIncome: "no",
  otherIncome: "",
  incomeType: "CLT",
  workTimeMonths: 0,
  hasIncomeProof: "yes",
  composeIncome: "no",
  coBuyerIncome: "",
  coBuyerScore: "GOOD",
  hasRestriction: "no",
  delayedFinancing: "no",
  activeLoans: "",
  monthlySpending: "",
  hasCurrentFinancing: "no",
  desiredPropertyValue: "",
  packageMode: "CUSTOM",
  propertyType: "LAND_BUILD",
  propertyCondition: "NEW",
  useFgts: "no",
  fgtsValue: "",
  downPayment: "",
  creditScore: "GOOD"
};

const INCOME_COMMITMENT_RATE = 0.3;
const MAX_FINANCING_QUOTA = 0.8;
const MINIMUM_ENTRY_RATE = 1 - MAX_FINANCING_QUOTA;
const MAX_TERM_MONTHS = 420;
const MAX_AGE_MONTHS_AT_END = 80 * 12 + 6;
const PAYMENT_FEE_RATE = 0.05;
const MONEY_TOLERANCE = 1;
const SIMULATION_FORM_STORAGE_KEY = "ce-constroi.simulation-form.v1";

const brazilStates = [
  ["AC", "Acre"],
  ["AL", "Alagoas"],
  ["AP", "Amapa"],
  ["AM", "Amazonas"],
  ["BA", "Bahia"],
  ["CE", "Ceara"],
  ["DF", "Distrito Federal"],
  ["ES", "Espirito Santo"],
  ["GO", "Goias"],
  ["MA", "Maranhao"],
  ["MT", "Mato Grosso"],
  ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"],
  ["PA", "Para"],
  ["PB", "Paraiba"],
  ["PR", "Parana"],
  ["PE", "Pernambuco"],
  ["PI", "Piaui"],
  ["RJ", "Rio de Janeiro"],
  ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"],
  ["RO", "Rondonia"],
  ["RR", "Roraima"],
  ["SC", "Santa Catarina"],
  ["SP", "Sao Paulo"],
  ["SE", "Sergipe"],
  ["TO", "Tocantins"]
] as const;

const northNortheastStates = new Set(["AC", "AL", "AP", "AM", "BA", "CE", "MA", "PA", "PB", "PE", "PI", "RN", "RO", "RR", "SE", "TO"]);

const selectClass =
  "focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none transition";

const panelClass = "rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5";
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999";

function loadSavedSimulationForm(): Partial<QuickForm> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(SIMULATION_FORM_STORAGE_KEY) ?? "{}") as Partial<QuickForm>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveSimulationForm(form: QuickForm) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SIMULATION_FORM_STORAGE_KEY, JSON.stringify(form));
}

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getSearchNumber(searchParams: URLSearchParams, key: string, fallback: number) {
  const parsed = Number(searchParams.get(key));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function getPackageAmount(mode: PackageMode, terrainPrice: number, projectPrice: number, buildCost: number, customValue: number) {
  if (mode === "TERRAIN") {
    return terrainPrice;
  }

  if (mode === "TERRAIN_PROJECT") {
    return terrainPrice + projectPrice;
  }

  if (mode === "FULL") {
    return terrainPrice + projectPrice + buildCost;
  }

  return customValue;
}

function isAvailablePackageMode(mode: PackageMode, terrainPrice: number, projectPrice: number, buildCost: number) {
  if (mode === "TERRAIN") {
    return terrainPrice > 0;
  }

  if (mode === "TERRAIN_PROJECT") {
    return terrainPrice > 0 && projectPrice > 0;
  }

  if (mode === "FULL") {
    return terrainPrice > 0 && projectPrice > 0 && buildCost > 0;
  }

  return true;
}

function getInitialPackageMode(searchParams: URLSearchParams, terrainPrice: number, projectPrice: number, buildCost: number): PackageMode {
  const requestedMode = (searchParams.get("mode") || searchParams.get("packageMode")) as PackageMode | null;

  if (requestedMode && ["TERRAIN", "TERRAIN_PROJECT", "FULL", "CUSTOM"].includes(requestedMode) && isAvailablePackageMode(requestedMode, terrainPrice, projectPrice, buildCost)) {
    return requestedMode;
  }

  if (terrainPrice > 0 && projectPrice > 0 && buildCost > 0) {
    return "FULL";
  }

  if (terrainPrice > 0 && projectPrice > 0) {
    return "TERRAIN_PROJECT";
  }

  if (terrainPrice > 0) {
    return "TERRAIN";
  }

  return "CUSTOM";
}

function getInitialForm(searchParams: URLSearchParams): QuickForm {
  const terrainPrice = getSearchNumber(searchParams, "terrainPrice", 0);
  const projectPrice = getSearchNumber(searchParams, "projectPrice", 0);
  const buildCost = getSearchNumber(searchParams, "buildCost", 0);
  const packageMode = getInitialPackageMode(searchParams, terrainPrice, projectPrice, buildCost);
  const desiredPropertyValue = getPackageAmount(packageMode, terrainPrice, projectPrice, buildCost, 0);

  return {
    ...defaultForm,
    packageMode,
    desiredPropertyValue: desiredPropertyValue > 0 ? String(desiredPropertyValue) : "",
    propertyType: packageMode === "FULL" || packageMode === "TERRAIN_PROJECT" ? "LAND_BUILD" : defaultForm.propertyType
  };
}

function getAge(birthDate: string) {
  if (!birthDate) {
    return 35;
  }

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) {
    return 35;
  }

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

function getAgeMonths(birthDate: string) {
  if (!birthDate) {
    return 35 * 12;
  }

  const birth = new Date(birthDate);

  if (Number.isNaN(birth.getTime())) {
    return 35 * 12;
  }

  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
}

function scoreValue(score: CreditScore) {
  const points = {
    EXCELLENT: 30,
    GOOD: 20,
    MEDIUM: 10,
    LOW: -20
  };

  return points[score];
}

function propertyTypeLabel(type: PropertyType) {
  const labels = {
    HOUSE: "Casa",
    APARTMENT: "Apartamento",
    LAND_BUILD: "Terreno + construcao",
    PLANT: "Imovel na planta"
  };

  return labels[type];
}

function getMinimumRequiredEntry(amount: number, maxCreditByIncome: number) {
  if (amount <= 0) {
    return 0;
  }

  const minimumEntryByQuota = amount * MINIMUM_ENTRY_RATE;
  const minimumEntryByIncome = Math.max(amount - maxCreditByIncome, 0);

  return Math.max(minimumEntryByQuota, minimumEntryByIncome);
}

function getEstimatedFinancedAmount(amount: number, availableEntry: number) {
  if (amount <= 0) {
    return 0;
  }

  const entryForScenario = Math.max(availableEntry, amount * MINIMUM_ENTRY_RATE);
  return Math.max(amount - entryForScenario, 0);
}

function getMaxPropertyValue(maxCreditByIncome: number, availableEntry: number) {
  if (maxCreditByIncome <= 0 || availableEntry <= 0) {
    return maxCreditByIncome > 0 ? maxCreditByIncome / MAX_FINANCING_QUOTA : 0;
  }

  const capacityByIncome = maxCreditByIncome / MAX_FINANCING_QUOTA;
  const capacityByEntry = availableEntry / MINIMUM_ENTRY_RATE;

  return Math.min(capacityByIncome, capacityByEntry);
}

function getTermMonthsByAge(birthDate: string) {
  const ageMonths = getAgeMonths(birthDate);
  const monthsByAge = Math.max(MAX_AGE_MONTHS_AT_END - ageMonths, 0);

  return Math.min(MAX_TERM_MONTHS, monthsByAge);
}

function getCaixaRateByIncome(income: number, state: string, usesFgts: boolean) {
  const isNorthNortheast = northNortheastStates.has(state.toUpperCase());

  if (income <= 2160) {
    return {
      nominalAnnualRate: usesFgts ? (isNorthNortheast ? 4 : 4.25) : isNorthNortheast ? 4.5 : 4.75,
      productBand: "MCMV Faixa 1"
    };
  }

  if (income <= 2850) {
    return {
      nominalAnnualRate: usesFgts ? (isNorthNortheast ? 4.25 : 4.5) : isNorthNortheast ? 4.75 : 5,
      productBand: "MCMV Faixa 1"
    };
  }

  if (income <= 3200) {
    return {
      nominalAnnualRate: usesFgts ? (isNorthNortheast ? 4.5 : 4.75) : isNorthNortheast ? 5 : 5.25,
      productBand: "MCMV Faixa 1"
    };
  }

  if (income <= 3500) {
    return {
      nominalAnnualRate: usesFgts ? (isNorthNortheast ? 4.75 : 5) : isNorthNortheast ? 5.25 : 5.5,
      productBand: "MCMV Faixa 2"
    };
  }

  if (income <= 4000) {
    return { nominalAnnualRate: usesFgts ? 5.5 : 6, productBand: "MCMV Faixa 2" };
  }

  if (income <= 5000) {
    return { nominalAnnualRate: usesFgts ? 6.5 : 7, productBand: "MCMV Faixa 2" };
  }

  if (income <= 9600) {
    return { nominalAnnualRate: usesFgts ? 7.66 : 8.16, productBand: "MCMV Faixa 3" };
  }

  if (income <= 13000) {
    return { nominalAnnualRate: 10, productBand: "MCMV Faixa 4 - Classe Media" };
  }

  return { nominalAnnualRate: usesFgts ? 9.99 : 11.19, productBand: usesFgts ? "Pro-Cotista/SFH estimado" : "SBPE/SFH estimado" };
}

function nominalAnnualToMonthlyRate(nominalAnnualRate: number) {
  return nominalAnnualRate / 100 / 12;
}

function nominalAnnualToEffectiveAnnualRate(nominalAnnualRate: number) {
  return (Math.pow(1 + nominalAnnualToMonthlyRate(nominalAnnualRate), 12) - 1) * 100;
}

function pricePayment(principal: number, monthlyRate: number, months: number) {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  if (monthlyRate <= 0) {
    return principal / months;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

function firstPaymentForPrincipal(principal: number, monthlyRate: number, months: number, system: "PRICE" | "SAC") {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  const basePayment =
    system === "PRICE" ? pricePayment(principal, monthlyRate, months) : principal / months + principal * monthlyRate;

  return basePayment * (1 + PAYMENT_FEE_RATE);
}

function principalByPaymentCapacity(paymentCapacity: number, monthlyRate: number, months: number, system: "PRICE" | "SAC") {
  if (paymentCapacity <= 0 || months <= 0) {
    return 0;
  }

  const basePaymentCapacity = paymentCapacity / (1 + PAYMENT_FEE_RATE);

  if (system === "SAC") {
    return basePaymentCapacity / (1 / months + monthlyRate);
  }

  if (monthlyRate <= 0) {
    return basePaymentCapacity * months;
  }

  return (basePaymentCapacity * (1 - Math.pow(1 + monthlyRate, -months))) / monthlyRate;
}

function buildBaseOptions(
  terrainPrice: number,
  projectPrice: number,
  buildCost: number,
  maxCreditByIncome: number,
  availableEntry: number,
  maxInstallment: number,
  monthlyRate: number,
  termMonths: number,
  financingSystem: "PRICE" | "SAC",
  isAgeEligible: boolean
) {
  const rawOptions: Array<Omit<BaseOption, "installment" | "isAvailable">> = [
    {
      key: "FULL",
      label: "Terreno + projeto + obra",
      amount: terrainPrice + projectPrice + buildCost,
      description: "Cliente quer lote, projeto e obra no mesmo pacote."
    },
    {
      key: "TERRAIN_PROJECT",
      label: "Terreno + projeto",
      amount: terrainPrice + projectPrice,
      description: "Cliente quer lote e projeto, mas vai construir por fora."
    },
    {
      key: "TERRAIN",
      label: "So terreno",
      amount: terrainPrice,
      description: "Cliente quer comprar apenas o lote agora."
    }
  ];

  return rawOptions
    .filter((option) => option.amount > 0)
    .filter((option) => {
      if (option.key === "FULL") {
        return terrainPrice > 0 && projectPrice > 0 && buildCost > 0;
      }

      if (option.key === "TERRAIN_PROJECT") {
        return terrainPrice > 0 && projectPrice > 0;
      }

      return terrainPrice > 0;
    })
    .map((option) => {
      const minimumRequiredEntry = getMinimumRequiredEntry(option.amount, maxCreditByIncome);
      const financedValue = getEstimatedFinancedAmount(option.amount, availableEntry);
      const installment = firstPaymentForPrincipal(financedValue, monthlyRate, termMonths, financingSystem);

      return {
        ...option,
        installment,
        isAvailable:
          isAgeEligible &&
          maxInstallment > 0 &&
          availableEntry + MONEY_TOLERANCE >= minimumRequiredEntry &&
          installment <= maxInstallment + MONEY_TOLERANCE
      };
    });
}

function calculateResult(form: QuickForm, terrainPrice: number, projectPrice: number, buildCost: number): Result {
  const monthlyIncome = Math.max(parseMoney(form.monthlyIncome), 0);
  const otherIncome = Math.max(parseMoney(form.otherIncome), 0);
  const coBuyerIncome = Math.max(parseMoney(form.coBuyerIncome), 0);
  const desiredPropertyValueInput = Math.max(parseMoney(form.desiredPropertyValue), 0);
  const fgtsValue = Math.max(parseMoney(form.fgtsValue), 0);
  const downPayment = Math.max(parseMoney(form.downPayment), 0);
  const formalIncome = monthlyIncome;
  const informalIncome = form.hasInformalIncome === "yes" ? otherIncome : 0;
  const composedIncome = form.composeIncome === "yes" ? coBuyerIncome : 0;
  const totalIncome = Math.max(formalIncome + informalIncome + composedIncome, 0);
  const debtPressure =
    Math.max(parseMoney(form.activeLoans), 0) + (form.hasCurrentFinancing === "yes" ? Math.max(parseMoney(form.monthlySpending), 0) : 0);
  const maxInstallment = Math.max(totalIncome * INCOME_COMMITMENT_RATE - debtPressure, 0);
  const age = getAge(form.birthDate);
  const termMonths = getTermMonthsByAge(form.birthDate);
  const hasBirthDate = Boolean(form.birthDate);
  const isAgeEligible = hasBirthDate && age >= 18 && termMonths > 0;
  const financingSystem: "PRICE" | "SAC" = "PRICE";
  const usesFgtsForRate = form.useFgts === "yes";
  const rateInfo = getCaixaRateByIncome(totalIncome, form.state, usesFgtsForRate);
  const nominalAnnualRate = rateInfo.nominalAnnualRate;
  const effectiveAnnualRate = nominalAnnualToEffectiveAnnualRate(nominalAnnualRate);
  const monthlyRate = nominalAnnualToMonthlyRate(nominalAnnualRate);
  const maxCreditByIncome = principalByPaymentCapacity(maxInstallment, monthlyRate, termMonths, financingSystem);
  const usableFgts = form.useFgts === "yes" ? fgtsValue : 0;
  const availableEntry = Math.max(downPayment + usableFgts, 0);
  const desiredPackageValue = Math.max(
    getPackageAmount(form.packageMode, terrainPrice, projectPrice, buildCost, desiredPropertyValueInput),
    0
  );
  const maxCreditByQuota = desiredPackageValue > 0 ? desiredPackageValue * MAX_FINANCING_QUOTA : maxCreditByIncome;
  const maxCredit = Math.min(maxCreditByIncome, maxCreditByQuota);
  const maxPropertyValue = getMaxPropertyValue(maxCreditByIncome, availableEntry);
  const minimumRequiredEntry = getMinimumRequiredEntry(desiredPackageValue, maxCreditByIncome);
  const rawEntryShortfall = Math.max(minimumRequiredEntry - availableEntry, 0);
  const entryShortfall = rawEntryShortfall <= MONEY_TOLERANCE ? 0 : rawEntryShortfall;
  const financedNeeded = getEstimatedFinancedAmount(desiredPackageValue, availableEntry);
  const estimatedInstallment = firstPaymentForPrincipal(financedNeeded, monthlyRate, termMonths, financingSystem);
  const options = buildBaseOptions(
    terrainPrice,
    projectPrice,
    buildCost,
    maxCreditByIncome,
    availableEntry,
    maxInstallment,
    monthlyRate,
    termMonths,
    financingSystem,
    isAgeEligible
  );
  const requestedOption =
    form.packageMode === "CUSTOM" && desiredPackageValue > 0
      ? {
          key: "CUSTOM" as PackageMode,
          label: "Valor escolhido",
          amount: desiredPackageValue,
          installment: estimatedInstallment,
          isAvailable:
            isAgeEligible &&
            maxInstallment > 0 &&
            availableEntry + MONEY_TOLERANCE >= minimumRequiredEntry &&
            estimatedInstallment <= maxInstallment + MONEY_TOLERANCE,
          description: "Valor informado manualmente pelo cliente."
        }
      : options.find((option) => option.key === form.packageMode);
  const fallbackOption = options.find((option) => option.isAvailable);
  const selectedOption = requestedOption?.isAvailable ? requestedOption : fallbackOption;
  const notes: string[] = [];
  let score = 50 + scoreValue(form.creditScore);

  score += form.hasRestriction === "no" ? 15 : -45;
  score += form.delayedFinancing === "no" ? 5 : -15;
  score += form.workTimeMonths >= 24 ? 10 : form.workTimeMonths >= 12 ? 6 : 0;
  score += form.hasIncomeProof === "yes" ? 10 : -10;
  score += form.composeIncome === "yes" && coBuyerIncome > 0 ? 5 : 0;
  score += form.composeIncome === "yes" ? Math.round(scoreValue(form.coBuyerScore) / 3) : 0;
  score += requestedOption?.isAvailable ? 10 : selectedOption ? 4 : -10;
  score = Math.max(0, Math.min(100, score));

  if (age < 18) {
    notes.push("Idade abaixo do minimo para financiamento.");
    score = Math.min(score, 20);
  }

  if (!form.birthDate) {
    notes.push("Informe a data de nascimento para calcular o prazo maximo pela idade.");
  }

  if (termMonths <= 0) {
    notes.push("Prazo inviavel pela idade informada. A regra estimada considera idade + financiamento ate 80 anos e 6 meses.");
    score = Math.min(score, 20);
  } else if (termMonths < MAX_TERM_MONTHS) {
    notes.push(`Prazo maximo ajustado para ${termMonths} meses pela idade informada.`);
    score -= 10;
  }

  if (form.hasRestriction === "yes") {
    notes.push("Restricao no CPF joga o caso para alto risco ou analise manual.");
  }

  if (desiredPackageValue <= 0) {
    notes.push("Informe o valor do imovel ou pacote para calcular a base.");
    score = Math.min(score, 30);
  }

  if (totalIncome <= 0) {
    notes.push("Informe a renda mensal para calcular capacidade de parcela.");
    score = Math.min(score, 30);
  }

  if (maxInstallment <= 0) {
    notes.push("As dividas atuais consomem a margem de parcela estimada.");
  }

  if (entryShortfall > 0) {
    notes.push(`Entrada abaixo do minimo estimado de 20%. Falta aproximadamente ${money(entryShortfall)} para enquadrar a cota de financiamento.`);
  }

  if (form.hasIncomeProof === "no") {
    notes.push("Sem comprovacao, a renda fica em analise manual, mas nao entra com desconto automatico.");
  }

  const status = requestedOption?.isAvailable
    ? `${requestedOption.label} cabe na base`
    : selectedOption
      ? `${requestedOption?.label ?? "Escolha"} acima da base`
      : maxPropertyValue > 0
        ? `Base ate ${money(maxPropertyValue)}`
        : "Base insuficiente agora";
  const fitMessage = requestedOption?.isAvailable
    ? `A base do cliente e ${money(maxPropertyValue)}. A escolha dele, ${requestedOption.label.toLowerCase()}, cabe por ${money(requestedOption.amount)}.`
    : selectedOption
      ? `A base do cliente e ${money(maxPropertyValue)}. A escolha dele ficou acima da base; a alternativa que cabe agora e ${selectedOption.label.toLowerCase()} por ${money(selectedOption.amount)}.`
    : maxPropertyValue > 0
      ? `A base do cliente e ${money(maxPropertyValue)}. Use essa faixa para buscar uma opcao abaixo desse valor.`
      : "Ainda nao existe base suficiente com os dados informados.";

  return {
    totalIncome,
    maxInstallment,
    maxCredit,
    maxCreditByIncome,
    maxCreditByQuota,
    maxPropertyValue,
    minimumRequiredEntry,
    entryShortfall,
    desiredPackageValue,
    availableEntry,
    financedNeeded,
    estimatedInstallment,
    nominalAnnualRate,
    effectiveAnnualRate,
    monthlyRate,
    termMonths,
    ageAtEnd: age + termMonths / 12,
    hasBirthDate,
    isAgeEligible,
    financingSystem,
    productBand: rateInfo.productBand,
    requestedOption,
    selectedOption,
    options,
    score,
    status,
    fitMessage,
    fgtsMessage: usableFgts > 0 ? `FGTS considerado: ${money(usableFgts)}.` : "FGTS nao entrou na conta.",
    notes
  };
}

function buildWhatsappMessage(form: QuickForm, result: Result) {
  return encodeURIComponent(
    [
      "Ola, quero falar com um atendente da Ce constroi.",
      "",
      `Nome: ${form.name || "Nao informado"}`,
      `Telefone: ${form.phone || "Nao informado"}`,
      `Email: ${form.email || "Nao informado"}`,
      `Cidade/UF: ${form.city || "-"} / ${form.state || "-"}`,
      `CEP: ${form.zipCode || "-"}`,
      `Imovel: ${propertyTypeLabel(form.propertyType)} de ${money(result.desiredPackageValue)}`,
      `Renda total considerada: ${money(result.totalIncome)}`,
      `Valor financiado estimado: ${money(result.financedNeeded)}`,
      `Entrada que falta: ${money(result.entryShortfall)}`,
      `Capacidade com entrada informada: ate ${money(result.maxPropertyValue)}`,
      `Entrada/FGTS informado: ${money(result.availableEntry)}`,
      `Resultado do pacote: ${result.requestedOption?.isAvailable ? "Dentro da base" : "Acima da base"}`,
      `Ajuste indicado: ${getAdjustmentMessage(result)}`
    ].join("\n")
  );
}

function getSelectedPackageParts(
  mode: PackageMode,
  terrainPrice: number,
  projectPrice: number,
  buildCost: number,
  desiredPackageValue: number
) {
  if (mode === "TERRAIN") {
    return { terrainPrice, projectPrice: 0, buildCost: 0 };
  }

  if (mode === "TERRAIN_PROJECT") {
    return { terrainPrice, projectPrice, buildCost: 0 };
  }

  if (mode === "FULL") {
    return { terrainPrice, projectPrice, buildCost };
  }

  return { terrainPrice: desiredPackageValue, projectPrice: 0, buildCost: 0 };
}

function mapPropertyTypeToCaixa(type: PropertyType, condition: PropertyCondition): SimulationInput["propertyType"] {
  if (type === "LAND_BUILD") {
    return "CONSTRUCTION";
  }

  if (type === "PLANT") {
    return "NEW";
  }

  return condition === "USED" ? "USED" : "NEW";
}

function buildSimulationInput({
  form,
  result,
  terrainId,
  projectId,
  terrainPrice,
  projectPrice,
  buildCost
}: {
  form: QuickForm;
  result: Result;
  terrainId?: string;
  projectId?: string;
  terrainPrice: number;
  projectPrice: number;
  buildCost: number;
}): SimulationInput {
  const selected = getSelectedPackageParts(form.packageMode, terrainPrice, projectPrice, buildCost, result.desiredPackageValue);

  return {
    ...(terrainId ? { terrainId } : {}),
    ...(projectId ? { projectId } : {}),
    terrainPrice: selected.terrainPrice,
    projectPrice: selected.projectPrice,
    estimatedBuildCost: selected.buildCost,
    buildCost: selected.buildCost,
    familyIncome: result.totalIncome,
    monthlyDebts:
      Math.max(parseMoney(form.activeLoans), 0) +
      (form.hasCurrentFinancing === "yes" ? Math.max(parseMoney(form.monthlySpending), 0) : 0),
    buyerAge: getAge(form.birthDate),
    dependents: form.dependents === "yes" ? 1 : 0,
    ownCash: Math.max(parseMoney(form.downPayment), 0),
    downPayment: Math.max(parseMoney(form.downPayment), 0),
    fgtsBalance: form.useFgts === "yes" ? Math.max(parseMoney(form.fgtsValue), 0) : 0,
    fgtsYears: form.useFgts,
    hasCreditRestriction: form.hasRestriction,
    propertyType: mapPropertyTypeToCaixa(form.propertyType, form.propertyCondition),
    propertyUse: "OWN_HOME",
    program: "AUTO",
    system: result.financingSystem,
    months: result.termMonths,
    annualInterestRate: result.nominalAnnualRate,
    insuranceRate: 5,
    metadata: {
      source: "simple-financing-simulator",
      customerFilled: {
        name: form.name,
        phone: form.phone,
        email: form.email,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode
      },
      frontendInput: {
        packageMode: form.packageMode,
        terrainPrice: selected.terrainPrice,
        projectPrice: selected.projectPrice,
        buildCost: selected.buildCost,
        downPayment: Math.max(parseMoney(form.downPayment), 0),
        fgtsBalance: form.useFgts === "yes" ? Math.max(parseMoney(form.fgtsValue), 0) : 0,
        useFgts: form.useFgts,
        totalIncome: result.totalIncome,
        monthlyDebts:
          Math.max(parseMoney(form.activeLoans), 0) +
          (form.hasCurrentFinancing === "yes" ? Math.max(parseMoney(form.monthlySpending), 0) : 0)
      },
      frontendResult: {
        desiredPackageValue: result.desiredPackageValue,
        maxInstallment: result.maxInstallment,
        maxCredit: result.maxCredit,
        maxCreditByIncome: result.maxCreditByIncome,
        maxCreditByQuota: result.maxCreditByQuota,
        maxPropertyValue: result.maxPropertyValue,
        minimumRequiredEntry: result.minimumRequiredEntry,
        availableEntry: result.availableEntry,
        entryShortfall: result.entryShortfall,
        financedNeeded: result.financedNeeded,
        estimatedInstallment: result.estimatedInstallment,
        nominalAnnualRate: result.nominalAnnualRate,
        effectiveAnnualRate: result.effectiveAnnualRate,
        monthlyRate: result.monthlyRate,
        termMonths: result.termMonths,
        ageAtEnd: result.ageAtEnd,
        financingSystem: result.financingSystem,
        productBand: result.productBand,
        requestedOptionLabel: result.requestedOption?.label,
        requestedOptionAmount: result.requestedOption?.amount,
        requestedOptionAvailable: result.requestedOption?.isAvailable ?? false,
        selectedOptionLabel: result.selectedOption?.label,
        selectedOptionAmount: result.selectedOption?.amount,
        status: result.status,
        fitMessage: result.fitMessage,
        adjustmentMessage: getAdjustmentMessage(result)
      }
    }
  };
}

function isApprovedResult(result: Result) {
  return Boolean(result.isAgeEligible && result.requestedOption?.isAvailable);
}

function getEntryNeeded(result: Result) {
  return result.entryShortfall;
}

function formatTermMonths(result: Result) {
  if (!result.hasBirthDate) {
    return "Informe nascimento";
  }

  if (result.termMonths <= 0) {
    return "Prazo inviavel";
  }

  return `${result.termMonths} meses`;
}

function getCapacityUsage(result: Result) {
  if (result.maxPropertyValue <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((result.desiredPackageValue / result.maxPropertyValue) * 100)));
}

function getCapacityMessage(result: Result) {
  const margin = result.maxPropertyValue - result.desiredPackageValue;

  if (result.entryShortfall > MONEY_TOLERANCE) {
    return `Para este projeto, falta aproximadamente ${money(result.entryShortfall)} de entrada para respeitar a cota de 80% financiado e 20% de entrada.`;
  }

  if (margin > 5000) {
    return `Voce ainda possui aproximadamente ${money(margin)} de margem para escolher um projeto maior.`;
  }

  if (margin >= 0) {
    return "Seu projeto esta perfeitamente enquadrado para seguir para analise.";
  }

  return `Este projeto ficou aproximadamente ${money(Math.abs(margin))} acima da sua capacidade atual.`;
}

function getAdjustmentMessage(result: Result) {
  if (isApprovedResult(result)) {
    return "Seu projeto esta dentro da capacidade estimada. O proximo passo e conferir documentos com atendimento.";
  }

  if (!result.hasBirthDate) {
    return "Informe a data de nascimento para calcular o prazo permitido pela idade.";
  }

  if (!result.isAgeEligible) {
    return "A idade informada nao permite este prazo de financiamento. O atendimento precisa ajustar prazo, entrada ou composicao.";
  }

  if (result.desiredPackageValue <= 0) {
    return "Informe o valor do terreno, projeto ou pacote para calcular a simulacao.";
  }

  if (result.totalIncome <= 0) {
    return "Informe a renda bruta mensal para calcular a capacidade de financiamento.";
  }

  if (result.maxInstallment <= 0) {
    return "As dividas informadas consumiram a margem de parcela. Ajuste as dividas ou componha renda para continuar.";
  }

  if (result.entryShortfall > MONEY_TOLERANCE) {
    return `So precisa ajustar a entrada: falta aproximadamente ${money(result.entryShortfall)} para chegar na entrada necessaria de ${money(result.minimumRequiredEntry)}.`;
  }

  if (result.desiredPackageValue > result.maxPropertyValue) {
    return `O pacote ficou aproximadamente ${money(result.desiredPackageValue - result.maxPropertyValue)} acima da capacidade atual. Ajuste o valor do pacote, aumente a entrada ou componha renda.`;
  }

  return "Este pacote precisa de um pequeno ajuste de renda, entrada ou valor para seguir com mais seguranca.";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-sm font-semibold text-[var(--foreground)]">{children}</span>;
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{children}</span>;
}

export function SimpleFinancingSimulator() {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const searchKey = searchParams.toString();
  const loginHref = `/login?next=${encodeURIComponent(`/simulacao${searchKey ? `?${searchKey}` : ""}`)}` as Route;
  const initialForm = useMemo(() => getInitialForm(new URLSearchParams(searchKey)), [searchKey]);
  const terrainPrice = useMemo(() => getSearchNumber(new URLSearchParams(searchKey), "terrainPrice", 0), [searchKey]);
  const projectPrice = useMemo(() => getSearchNumber(new URLSearchParams(searchKey), "projectPrice", 0), [searchKey]);
  const buildCost = useMemo(() => getSearchNumber(new URLSearchParams(searchKey), "buildCost", 0), [searchKey]);
  const catalogIds = useMemo(() => {
    const params = new URLSearchParams(searchKey);

    return {
      terrainId: params.get("terrainId") || undefined,
      projectId: params.get("projectId") || undefined
    };
  }, [searchKey]);
  const packageTitles = useMemo(() => {
    const params = new URLSearchParams(searchKey);

    return {
      terrainTitle: params.get("terrainTitle") ?? "",
      projectTitle: params.get("projectTitle") ?? ""
    };
  }, [searchKey]);
  const packageOptions = useMemo(
    () =>
      [
        terrainPrice > 0
          ? {
              mode: "TERRAIN" as PackageMode,
              label: "So terreno",
              amount: terrainPrice
            }
          : null,
        terrainPrice > 0 && projectPrice > 0
          ? {
              mode: "TERRAIN_PROJECT" as PackageMode,
              label: "Terreno + projeto",
              amount: terrainPrice + projectPrice
            }
          : null,
        terrainPrice > 0 && projectPrice > 0 && buildCost > 0
          ? {
              mode: "FULL" as PackageMode,
              label: "Terreno + projeto + obra",
              amount: terrainPrice + projectPrice + buildCost
            }
          : null
      ].filter(Boolean) as Array<{ mode: PackageMode; label: string; amount: number }>,
    [buildCost, projectPrice, terrainPrice]
  );
  const hasPackage = terrainPrice > 0 || projectPrice > 0 || buildCost > 0;
  const [form, setForm] = useState<QuickForm>(() => {
    const savedForm = loadSavedSimulationForm();
    const hasPackageFromUrl = terrainPrice > 0 || projectPrice > 0 || buildCost > 0;

    return {
      ...initialForm,
      ...savedForm,
      ...(hasPackageFromUrl
        ? {
            packageMode: initialForm.packageMode,
            desiredPropertyValue: initialForm.desiredPropertyValue,
            propertyType: initialForm.propertyType
          }
        : {})
    };
  });
  const [result, setResult] = useState<Result | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSavingSimulation, setIsSavingSimulation] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepMessage, setCepMessage] = useState("");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [savedSimulationId, setSavedSimulationId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showResultDetails, setShowResultDetails] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setForm((current) => {
        const savedForm = loadSavedSimulationForm();
        const hasPackageFromUrl = terrainPrice > 0 || projectPrice > 0 || buildCost > 0;

        return {
          ...initialForm,
          ...savedForm,
          ...current,
          ...(hasPackageFromUrl
            ? {
                packageMode: initialForm.packageMode,
                desiredPropertyValue: initialForm.desiredPropertyValue,
                propertyType: initialForm.propertyType
              }
            : {})
        };
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [buildCost, initialForm, projectPrice, terrainPrice]);

  useEffect(() => {
    saveSimulationForm(form);
  }, [form]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const timer = window.setTimeout(() => {
      setForm((current) => ({
        ...current,
        name: current.name || user.name || "",
        email: current.email || user.email || "",
        phone: current.phone || maskPhone(user.phone ?? "")
      }));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    const cep = onlyDigits(form.zipCode);

    if (cep.length !== 8) {
      const timer = window.setTimeout(() => setCepMessage(""), 0);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsFetchingCep(true);
      setCepMessage("Buscando endereco pelo CEP...");

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
          signal: controller.signal
        });
        const data = (await response.json()) as ViaCepResponse;

        if (data.erro) {
          setCepMessage("CEP nao encontrado.");
          return;
        }

        setForm((current) => ({
          ...current,
          city: data.localidade || current.city,
          state: data.uf || current.state,
          street: data.logradouro || current.street,
          neighborhood: data.bairro || current.neighborhood,
          zipCode: maskCep(data.cep ?? current.zipCode)
        }));
        setCepMessage("Endereco preenchido pelo CEP.");
      } catch {
        if (!controller.signal.aborted) {
          setCepMessage("Nao foi possivel buscar o CEP agora.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingCep(false);
        }
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [form.zipCode]);

  function update<K extends keyof QuickForm>(key: K, value: QuickForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updatePackageMode(mode: PackageMode) {
    const amount = getPackageAmount(mode, terrainPrice, projectPrice, buildCost, parseMoney(form.desiredPropertyValue));

    setForm((current) => ({
      ...current,
      packageMode: mode,
      desiredPropertyValue: amount > 0 ? String(amount) : current.desiredPropertyValue,
      propertyType: mode === "FULL" || mode === "TERRAIN_PROJECT" ? "LAND_BUILD" : mode === "TERRAIN" ? defaultForm.propertyType : current.propertyType
    }));
  }

  async function saveSimulation(currentResult: Result) {
    setIsSavingSimulation(true);
    setSaveError(null);
    setSavedSimulationId(null);

    try {
      const input = buildSimulationInput({
        form,
        result: currentResult,
        terrainId: catalogIds.terrainId,
        projectId: catalogIds.projectId,
        terrainPrice,
        projectPrice,
        buildCost
      });
      let saved;

      try {
        saved = await createSimulation(input);
      } catch (error) {
        const message = getApiErrorMessage(error, "Nao foi possivel salvar a simulacao no banco.");

        if (!/metadata/i.test(message)) {
          throw error;
        }

        const { metadata: _metadata, ...inputWithoutMetadata } = input;
        saved = await createSimulation(inputWithoutMetadata);
      }

      setSavedSimulationId(saved.id);
    } catch (error) {
      const message = getApiErrorMessage(error, "Nao foi possivel salvar a simulacao no banco.");
      setSaveError(message);
      setRequestMessage(message);
    } finally {
      setIsSavingSimulation(false);
    }
  }

  function simulate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCalculating(true);
    setRequestMessage(null);
    setSaveError(null);
    setSavedSimulationId(null);

    window.setTimeout(() => {
      const currentResult = calculateResult(form, terrainPrice, projectPrice, buildCost);

      setResult(currentResult);
      setIsResultModalOpen(true);
      setIsCalculating(false);
      void saveSimulation(currentResult);
    }, 900);
  }

  function registerRequest() {
    const currentResult = result ?? calculateResult(form, terrainPrice, projectPrice, buildCost);

    if (!savedSimulationId && !isSavingSimulation && !saveError) {
      void saveSimulation(currentResult);
    }
  }

  const message = result ? buildWhatsappMessage(form, result) : "";

  if (!hasHydrated) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <Loader2 className="mx-auto animate-spin text-[var(--accent)]" size={30} />
          <h1 className="mt-4 text-2xl font-semibold">Carregando sessao</h1>
        </div>
      </section>
    );
  }

  if (!accessToken || !user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-8 text-center">
          <Lock className="mx-auto text-[var(--accent)]" size={34} />
          <h1 className="mt-4 text-3xl font-semibold">Entre para simular</h1>
          <p className="mt-3 text-[var(--muted)]">
            A simulacao fica salva e precisa de uma conta para manter seus dados protegidos.
          </p>
          <Link className="mt-6 inline-flex" href={loginHref}>
            <Button>Ir para login</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Simulacao rapida</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold">Veja se o projeto cabe na sua renda.</h1>
          {hasPackage ? (
            <PackageSummary
              buildCost={buildCost}
              projectPrice={projectPrice}
              projectTitle={packageTitles.projectTitle}
              terrainPrice={terrainPrice}
              terrainTitle={packageTitles.terrainTitle}
            />
          ) : null}
        </div>
      </div>

      <form className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start" onSubmit={simulate}>
        <div className="grid gap-5">
          <div className={panelClass}>
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="text-[var(--accent)]" size={20} />
              <h2 className="text-xl font-semibold">1. Dados da pessoa</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <FieldLabel>Nome completo</FieldLabel>
                <Input onChange={(event) => update("name", event.target.value)} required value={form.name} />
              </label>
              <label>
                <FieldLabel>Telefone</FieldLabel>
                <Input
                  autoComplete="tel"
                  inputMode="tel"
                  onChange={(event) => update("phone", maskPhone(event.target.value))}
                  placeholder="(11) 99999-9999"
                  required
                  value={form.phone}
                />
              </label>
              <label>
                <FieldLabel>Email</FieldLabel>
                <Input autoComplete="email" onChange={(event) => update("email", event.target.value)} type="email" value={form.email} />
              </label>
              <label>
                <FieldLabel>Data de nascimento</FieldLabel>
                <Input onChange={(event) => update("birthDate", event.target.value)} required type="date" value={form.birthDate} />
                <HelpText>Usamos a idade para estimar o prazo maximo do financiamento.</HelpText>
              </label>
              <label>
                <FieldLabel>Cidade</FieldLabel>
                <Input autoComplete="address-level2" onChange={(event) => update("city", event.target.value)} value={form.city} />
              </label>
              <label>
                <FieldLabel>Estado</FieldLabel>
                <select autoComplete="address-level1" className={selectClass} onChange={(event) => update("state", event.target.value)} value={form.state}>
                  <option value="">Selecione o estado</option>
                  {brazilStates.map(([uf, label]) => (
                    <option key={uf} value={uf}>
                      {uf} - {label}
                    </option>
                  ))}
                </select>
              </label>
              {showAdvanced ? (
                <>
                  <label>
                    <FieldLabel>CPF</FieldLabel>
                    <Input
                      autoComplete="off"
                      inputMode="numeric"
                      onChange={(event) => update("cpf", maskCpf(event.target.value))}
                      placeholder="000.000.000-00"
                      value={form.cpf}
                    />
                  </label>
                  <label>
                    <FieldLabel>Estado civil</FieldLabel>
                    <Input onChange={(event) => update("maritalStatus", event.target.value)} value={form.maritalStatus} />
                  </label>
                  <label>
                    <FieldLabel>Possui dependentes?</FieldLabel>
                    <select className={selectClass} onChange={(event) => update("dependents", event.target.value as YesNo)} value={form.dependents}>
                      <option value="no">Nao</option>
                      <option value="yes">Sim</option>
                    </select>
                  </label>
                  <label>
                    <FieldLabel>CEP</FieldLabel>
                    <Input
                      autoComplete="postal-code"
                      inputMode="numeric"
                      onChange={(event) => update("zipCode", maskCep(event.target.value))}
                      placeholder="00000-000"
                      value={form.zipCode}
                    />
                    <HelpText>{isFetchingCep ? "Buscando..." : cepMessage || "Ao digitar 8 numeros, o endereco vem do ViaCEP."}</HelpText>
                  </label>
                  <label>
                    <FieldLabel>Endereco</FieldLabel>
                    <Input autoComplete="address-line1" onChange={(event) => update("street", event.target.value)} value={form.street} />
                  </label>
                  <label>
                    <FieldLabel>Bairro</FieldLabel>
                    <Input autoComplete="address-line2" onChange={(event) => update("neighborhood", event.target.value)} value={form.neighborhood} />
                  </label>
                </>
              ) : null}
            </div>
          </div>

          <div className={panelClass}>
            <div className="mb-4 flex items-center gap-2">
              <WalletCards className="text-[var(--accent)]" size={20} />
              <h2 className="text-xl font-semibold">2. Renda e perfil financeiro</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <FieldLabel>Renda bruta mensal</FieldLabel>
                <CurrencyInput onValueChange={(value) => update("monthlyIncome", value)} value={form.monthlyIncome} />
              </label>
              <label>
                <FieldLabel>Tipo de renda</FieldLabel>
                <select className={selectClass} onChange={(event) => update("incomeType", event.target.value as IncomeType)} value={form.incomeType}>
                  <option value="CLT">CLT</option>
                  <option value="MEI">MEI</option>
                  <option value="AUTONOMO">Autonomo</option>
                  <option value="EMPRESARIO">Empresario</option>
                  <option value="INFORMAL">Informal</option>
                </select>
              </label>
              {showAdvanced ? (
                <>
                  <label>
                    <FieldLabel>Tempo no trabalho atual (meses)</FieldLabel>
                    <Input min={0} onChange={(event) => update("workTimeMonths", toNumber(event.target.value))} type="number" value={form.workTimeMonths} />
                  </label>
                  <label>
                    <FieldLabel>Outra renda mensal</FieldLabel>
                    <CurrencyInput onValueChange={(value) => update("otherIncome", value)} value={form.otherIncome} />
                  </label>
                  <label>
                    <FieldLabel>Essa outra renda e informal?</FieldLabel>
                    <select className={selectClass} onChange={(event) => update("hasInformalIncome", event.target.value as YesNo)} value={form.hasInformalIncome}>
                      <option value="no">Nao</option>
                      <option value="yes">Sim</option>
                    </select>
                  </label>
                  <label>
                    <FieldLabel>Vai compor renda?</FieldLabel>
                    <select className={selectClass} onChange={(event) => update("composeIncome", event.target.value as YesNo)} value={form.composeIncome}>
                      <option value="no">Nao</option>
                      <option value="yes">Sim</option>
                    </select>
                  </label>
                  {form.composeIncome === "yes" ? (
                    <label>
                      <FieldLabel>Renda do segundo participante</FieldLabel>
                      <CurrencyInput onValueChange={(value) => update("coBuyerIncome", value)} value={form.coBuyerIncome} />
                    </label>
                  ) : null}
                </>
              ) : null}
              <label>
                <FieldLabel>Nome negativado/restricao?</FieldLabel>
                <select className={selectClass} onChange={(event) => update("hasRestriction", event.target.value as YesNo)} value={form.hasRestriction}>
                  <option value="no">Nao</option>
                  <option value="yes">Sim</option>
                </select>
              </label>
              <label>
                <FieldLabel>Emprestimos ativos por mes</FieldLabel>
                <CurrencyInput onValueChange={(value) => update("activeLoans", value)} value={form.activeLoans} />
              </label>
              {showAdvanced ? (
                <>
                  <label>
                    <FieldLabel>Ja atrasou financiamento?</FieldLabel>
                    <select className={selectClass} onChange={(event) => update("delayedFinancing", event.target.value as YesNo)} value={form.delayedFinancing}>
                      <option value="no">Nao</option>
                      <option value="yes">Sim</option>
                    </select>
                  </label>
                  <label>
                    <FieldLabel>Media de gastos mensais</FieldLabel>
                    <CurrencyInput onValueChange={(value) => update("monthlySpending", value)} value={form.monthlySpending} />
                  </label>
                  <label>
                    <FieldLabel>Possui financiamento atual?</FieldLabel>
                    <select className={selectClass} onChange={(event) => update("hasCurrentFinancing", event.target.value as YesNo)} value={form.hasCurrentFinancing}>
                      <option value="no">Nao</option>
                      <option value="yes">Sim</option>
                    </select>
                  </label>
                </>
              ) : null}
            </div>
          </div>

          <div className={panelClass}>
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-[var(--accent)]" size={20} />
              <h2 className="text-xl font-semibold">3. Imovel e entrada</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {hasPackage && packageOptions.length > 0 ? (
                <label>
                  <FieldLabel>O que o cliente quer comprar</FieldLabel>
                  <select className={selectClass} onChange={(event) => updatePackageMode(event.target.value as PackageMode)} value={form.packageMode}>
                    {packageOptions.map((option) => (
                      <option key={option.mode} value={option.mode}>
                        {option.label} - {money(option.amount)}
                      </option>
                    ))}
                  </select>
                  <HelpText>Essa escolha manda no resultado. As outras aparecem apenas como alternativas.</HelpText>
                </label>
              ) : null}
              <label>
                <FieldLabel>Valor do imovel/casa desejada</FieldLabel>
                <CurrencyInput
                  onValueChange={(value) => {
                    update("packageMode", "CUSTOM");
                    update("desiredPropertyValue", value);
                  }}
                  value={form.desiredPropertyValue}
                />
                <HelpText>Esse valor e comparado com a base real do cliente.</HelpText>
              </label>
              <label>
                <FieldLabel>Entrada em dinheiro</FieldLabel>
                <CurrencyInput onValueChange={(value) => update("downPayment", value)} value={form.downPayment} />
                <HelpText>Para esta simulacao, a entrada minima considerada e de 20% do valor do pacote.</HelpText>
              </label>
              <label>
                <FieldLabel>Vai usar FGTS?</FieldLabel>
                <select className={selectClass} onChange={(event) => update("useFgts", event.target.value as YesNo)} value={form.useFgts}>
                  <option value="yes">Sim</option>
                  <option value="no">Nao</option>
                </select>
              </label>
              <label>
                <FieldLabel>Valor de FGTS</FieldLabel>
                <CurrencyInput onValueChange={(value) => update("fgtsValue", value)} value={form.fgtsValue} />
              </label>
              {showAdvanced ? (
                <>
                  <label>
                    <FieldLabel>Tipo do imovel</FieldLabel>
                    <select className={selectClass} onChange={(event) => update("propertyType", event.target.value as PropertyType)} value={form.propertyType}>
                      <option value="HOUSE">Casa</option>
                      <option value="APARTMENT">Apartamento</option>
                      <option value="LAND_BUILD">Terreno + construcao</option>
                      <option value="PLANT">Imovel na planta</option>
                    </select>
                  </label>
                  <label>
                    <FieldLabel>Novo ou usado?</FieldLabel>
                    <select className={selectClass} onChange={(event) => update("propertyCondition", event.target.value as PropertyCondition)} value={form.propertyCondition}>
                      <option value="NEW">Novo</option>
                      <option value="USED">Usado</option>
                    </select>
                  </label>
                </>
              ) : null}
            </div>
          </div>

          <button
            aria-expanded={showAdvanced}
            className="focus-ring flex w-full items-center justify-between gap-4 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 text-left text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => setShowAdvanced((current) => !current)}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="text-[var(--accent)]" size={18} />
              {showAdvanced ? "Ocultar dados extras" : "Mostrar dados extras do cadastro"}
            </span>
            <ChevronDown className={`transition ${showAdvanced ? "rotate-180" : ""}`} size={18} />
          </button>
        </div>

        <aside className="sticky top-24 grid gap-5">
          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-2xl sm:p-6">
            {isCalculating ? (
              <div className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-6 text-center">
                <Loader2 className="mx-auto animate-spin text-[var(--accent)]" size={34} />
                <h2 className="mt-4 text-2xl font-semibold">Calculando seu resultado...</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Estamos organizando compatibilidade estimada, entrada, parcela e limite do projeto.
                </p>
              </div>
            ) : result ? (
              <>
                <div
                  className={`rounded-[8px] border p-6 ${
                    isApprovedResult(result)
                      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-[#082f24] dark:border-emerald-700/50 dark:from-emerald-950/45 dark:to-[var(--panel)] dark:text-white"
                      : "border-amber-200 bg-gradient-to-br from-amber-50 to-white text-[#3f2d05] dark:border-amber-700/50 dark:from-amber-950/35 dark:to-[var(--panel)] dark:text-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                        isApprovedResult(result)
                          ? "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-[#052e20]"
                          : "bg-amber-500 text-[#2d2103]"
                      }`}
                    >
                      {isApprovedResult(result) ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                      {isApprovedResult(result) ? "Compativel" : "Precisa ajustar"}
                    </span>
                    {isApprovedResult(result) ? <CheckCircle2 className="text-emerald-600 dark:text-emerald-300" size={30} /> : <AlertTriangle className="text-amber-600" size={30} />}
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold leading-tight">
                    {isApprovedResult(result)
                      ? "Boa noticia! Este projeto e compativel com seu perfil."
                      : "Falta um ajuste para este pacote ficar compativel."}
                  </h2>
                  <p className="mt-3 text-sm leading-6 opacity-78">
                    {isApprovedResult(result)
                      ? "O pacote esta dentro da capacidade estimada para seguir em atendimento."
                      : getAdjustmentMessage(result)}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <ResultMetricCard icon={Home} label="Valor do Projeto" value={money(result.desiredPackageValue)} />
                  <ResultMetricCard icon={KeyRound} label="Entrada que falta" value={money(getEntryNeeded(result))} />
                  <ResultMetricCard icon={CalendarDays} label="Parcela Estimada" value={`${money(result.estimatedInstallment)}/mes`} />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <TechnicalMetric label="Sistema" value={result.financingSystem} />
                  <TechnicalMetric label="Prazo maximo" value={formatTermMonths(result)} />
                </div>

                <div className="mt-5 rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                    <TrendingUp size={18} />
                    Capacidade de compra
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-[var(--muted)]">Sua capacidade com entrada informada</span>
                      <strong className="mt-1 block text-2xl">{money(result.maxPropertyValue)}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--muted)]">Projeto escolhido</span>
                      <strong className="mt-1 block text-2xl">{money(result.desiredPackageValue)}</strong>
                    </div>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full ${isApprovedResult(result) ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${Math.max(getCapacityUsage(result), 4)}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{getCapacityMessage(result)}</p>
                </div>

                <div className="mt-5 rounded-[8px] border border-emerald-200 bg-emerald-50 p-5 text-[#082f24] dark:border-emerald-700/50 dark:bg-emerald-950/35 dark:text-white">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                    <FileCheck2 size={18} />
                    Resultado final
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold">
                    {isApprovedResult(result)
                      ? "Seu projeto esta compativel para seguir para analise documental."
                      : getAdjustmentMessage(result)}
                  </h3>
                  <p className="mt-3 text-sm leading-6 opacity-78">
                    Os valores apresentados sao estimativas baseadas nas regras atuais de financiamento e podem sofrer pequenas
                    alteracoes apos analise dos documentos.
                  </p>
                </div>

                <a
                  className="focus-ring mt-5 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-[8px] bg-[#25d366] px-5 py-4 text-base font-semibold text-[#062014] shadow-xl shadow-[#25d366]/20 transition hover:bg-[#20bd5a]"
                  href={`https://wa.me/${whatsappNumber}?text=${message}`}
                  onClick={registerRequest}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Rocket size={21} />
                  Receber Atendimento Agora
                </a>

                <Button className="mt-3 w-full" onClick={() => setIsResultModalOpen(true)} type="button" variant="secondary">
                  Ver resultado completo
                </Button>

                {saveError ? <p className="mt-3 text-xs leading-5 text-red-600">{saveError}</p> : null}
                {requestMessage ? <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{requestMessage}</p> : null}

                <div className="mt-5 rounded-[8px] border border-[var(--line)] bg-[var(--background)]">
                  <button
                    aria-expanded={showResultDetails}
                    className="focus-ring flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-semibold"
                    onClick={() => setShowResultDetails((current) => !current)}
                    type="button"
                  >
                    <span>Ver detalhes da analise</span>
                    <ChevronDown className={`transition ${showResultDetails ? "rotate-180" : ""}`} size={18} />
                  </button>

                  {showResultDetails ? (
                    <div className="grid gap-3 border-t border-[var(--line)] p-4">
                      <TechnicalMetric label="Renda considerada" value={money(result.totalIncome)} />
                      <TechnicalMetric label="Valor financiado estimado" value={money(result.financedNeeded)} />
                      <TechnicalMetric label="Sistema de amortizacao" value={result.financingSystem} />
                      <TechnicalMetric label="Prazo maximo" value={formatTermMonths(result)} />
                      <TechnicalMetric label="Entrada informada" value={money(result.availableEntry)} />
                      {result.entryShortfall > 0 ? <TechnicalMetric label="Entrada que falta" value={money(result.entryShortfall)} /> : null}

                      {result.options.length > 0 ? (
                        <div className="mt-2 grid gap-2">
                          <p className="text-xs font-semibold uppercase text-[var(--muted)]">Opcoes calculadas</p>
                          {result.options.map((option) => (
                            <BaseOptionRow isRequested={result.requestedOption?.key === option.key} key={option.key} option={option} />
                          ))}
                        </div>
                      ) : null}

                      {result.notes.length > 0 ? (
                        <div className="mt-2 grid gap-2">
                          <p className="text-xs font-semibold uppercase text-[var(--muted)]">Observacoes tecnicas</p>
                          {result.notes.map((note) => (
                            <p className="rounded-[8px] border border-[var(--line)] p-3 text-xs leading-5 text-[var(--muted)]" key={note}>
                              {note}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-6">
                <CalculatorIcon />
                <h2 className="mt-4 text-3xl font-semibold leading-tight">O resultado da sua simulacao aparece aqui.</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Informe seus dados e descubra uma estimativa do valor que podera financiar, da entrada necessaria e da
                  parcela mensal, alem de orientacoes sobre as proximas etapas da sua jornada.
                </p>
              </div>
            )}

            <Button className="mt-5 min-h-12 w-full text-base" disabled={isCalculating} type="submit" variant={result ? "ghost" : "secondary"}>
              {isCalculating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Calculando
                </>
              ) : (
                <>
                  <Clock size={18} />
                  {result ? "Atualizar simulacao" : "Ver resultado da simulacao"}
                </>
              )}
            </Button>
          </div>

          <div className={panelClass}>
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} />
              <h2 className="text-lg font-semibold">Importante</h2>
            </div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              As informacoes apresentadas servem como uma estimativa inicial de viabilidade. A liberacao do financiamento
              depende da analise da instituicao financeira, considerando documentacao, renda, condicoes de credito,
              avaliacao do imovel e demais requisitos aplicaveis.
            </p>
          </div>
        </aside>
      </form>
      {result ? (
        <ResultModal
          message={message}
          onClose={() => setIsResultModalOpen(false)}
          onRequest={registerRequest}
          open={isResultModalOpen}
          requestMessage={requestMessage}
          result={result}
          saveError={saveError}
        />
      ) : null}
    </section>
  );
}

function PackageSummary({
  terrainTitle,
  projectTitle,
  terrainPrice,
  projectPrice,
  buildCost
}: {
  terrainTitle: string;
  projectTitle: string;
  terrainPrice: number;
  projectPrice: number;
  buildCost: number;
}) {
  return (
    <div className="mt-5 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4">
      <p className="text-sm text-[var(--muted)]">Pacote selecionado</p>
      <strong className="mt-1 block text-lg">
        {projectTitle || "Projeto"} {terrainTitle ? `em ${terrainTitle}` : ""}
      </strong>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <span className="rounded-[8px] border border-[var(--line)] px-3 py-2">
          Terreno {money(terrainPrice)}
        </span>
        <span className="rounded-[8px] border border-[var(--line)] px-3 py-2">
          Projeto {money(projectPrice)}
        </span>
        <span className="rounded-[8px] border border-[var(--line)] px-3 py-2">
          Obra {money(buildCost)}
        </span>
      </div>
    </div>
  );
}

function ResultModal({
  message,
  onClose,
  onRequest,
  open,
  requestMessage,
  result,
  saveError
}: {
  message: string;
  onClose: () => void;
  onRequest: () => void;
  open: boolean;
  requestMessage: string | null;
  result: Result;
  saveError: string | null;
}) {
  if (!open) {
    return null;
  }

  const approved = isApprovedResult(result);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-6 backdrop-blur-sm sm:py-10">
      <div
        aria-modal="true"
        className="relative w-full max-w-5xl rounded-[8px] border border-[var(--line)] bg-[var(--background)] shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--background)] p-5">
          <div>
            <span
              className={`inline-flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold uppercase ${
                approved ? "bg-emerald-600 text-white" : "bg-amber-500 text-[#2d2103]"
              }`}
            >
              {approved ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              {approved ? "Compativel" : "Precisa ajustar"}
            </span>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              {approved ? "Boa noticia! Este projeto e compativel com seu perfil." : "Falta um ajuste para este pacote ficar compativel."}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              {approved ? "Resultado completo da simulacao com entrada, parcela, capacidade e proximos passos." : getAdjustmentMessage(result)}
            </p>
          </div>
          <button
            aria-label="Fechar resultado"
            className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[var(--line)]"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultMetricCard icon={Home} label="Valor do Projeto" value={money(result.desiredPackageValue)} />
            <ResultMetricCard icon={KeyRound} label="Entrada que falta" value={money(getEntryNeeded(result))} />
            <ResultMetricCard icon={CalendarDays} label="Parcela Estimada" value={`${money(result.estimatedInstallment)}/mes`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TechnicalMetric label="Sistema" value={result.financingSystem} />
            <TechnicalMetric label="Prazo maximo" value={formatTermMonths(result)} />
          </div>

          <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
              <TrendingUp size={18} />
              Capacidade de compra
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-[var(--muted)]">Sua capacidade com entrada informada</span>
                <strong className="mt-1 block text-2xl">{money(result.maxPropertyValue)}</strong>
              </div>
              <div>
                <span className="text-[var(--muted)]">Projeto escolhido</span>
                <strong className="mt-1 block text-2xl">{money(result.desiredPackageValue)}</strong>
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
              <div
                className={`h-full rounded-full ${approved ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${Math.max(getCapacityUsage(result), 4)}%` }}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{getCapacityMessage(result)}</p>
          </div>

          <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-5 text-[#082f24] dark:border-emerald-700/50 dark:bg-emerald-950/35 dark:text-white">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <FileCheck2 size={18} />
              Resultado final
            </div>
            <h3 className="mt-3 text-2xl font-semibold">
              {approved
                ? "Seu projeto esta compativel para seguir para analise documental."
                : getAdjustmentMessage(result)}
            </h3>
            <p className="mt-3 text-sm leading-6 opacity-78">
              Os valores apresentados sao estimativas baseadas nas regras atuais de financiamento e podem sofrer pequenas
              alteracoes apos analise dos documentos.
            </p>
          </div>

          <div className="grid gap-3 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
            <p className="text-sm font-semibold uppercase text-[var(--muted)]">Detalhes da analise</p>
            <TechnicalMetric label="Renda considerada" value={money(result.totalIncome)} />
            <TechnicalMetric label="Valor financiado estimado" value={money(result.financedNeeded)} />
            <TechnicalMetric label="Sistema de amortizacao" value={result.financingSystem} />
            <TechnicalMetric label="Prazo maximo" value={formatTermMonths(result)} />
            <TechnicalMetric label="Entrada informada" value={money(result.availableEntry)} />
            {result.entryShortfall > 0 ? <TechnicalMetric label="Entrada que falta" value={money(result.entryShortfall)} /> : null}
          </div>

          {result.options.length > 0 ? (
            <div className="grid gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
              <p className="text-sm font-semibold uppercase text-[var(--muted)]">Opcoes calculadas</p>
              {result.options.map((option) => (
                <BaseOptionRow isRequested={result.requestedOption?.key === option.key} key={option.key} option={option} />
              ))}
            </div>
          ) : null}

          {result.notes.length > 0 ? (
            <div className="grid gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5">
              <p className="text-sm font-semibold uppercase text-[var(--muted)]">Observacoes tecnicas</p>
              {result.notes.map((note) => (
                <p className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-3 text-sm leading-6 text-[var(--muted)]" key={note}>
                  {note}
                </p>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 border-t border-[var(--line)] pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="text-sm leading-6 text-[var(--muted)]">
              {saveError ? <p className="text-red-600">{saveError}</p> : null}
              {requestMessage ? <p>{requestMessage}</p> : null}
            </div>
            <a
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-3 rounded-[8px] bg-[#25d366] px-5 py-3 text-sm font-semibold text-[#062014]"
              href={`https://wa.me/${whatsappNumber}?text=${message}`}
              onClick={onRequest}
              rel="noreferrer"
              target="_blank"
            >
              <Rocket size={18} />
              Receber Atendimento Agora
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalculatorIcon() {
  return <WalletCards size={28} />;
}

function BaseOptionRow({ option, isRequested }: { option: BaseOption; isRequested: boolean }) {
  return (
    <div className={`rounded-[8px] border p-3 text-sm ${isRequested ? "border-[var(--accent)] bg-[var(--panel)]" : "border-[var(--line)]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong className="block">
            {option.label}
            {isRequested ? " - escolha do cliente" : ""}
          </strong>
          <span className="mt-1 block text-xs opacity-75">{option.description}</span>
        </div>
        <span
          className={`shrink-0 rounded-[8px] px-2 py-1 text-xs font-semibold ${
            option.isAvailable ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-black/5 text-[var(--muted)] dark:bg-white/10"
          }`}
        >
          {option.isAvailable ? "Cabe" : "Acima"}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-xs opacity-85 sm:grid-cols-2">
        <span>Valor: {money(option.amount)}</span>
        <span>Primeira parcela: {money(option.installment)}</span>
      </div>
    </div>
  );
}

function ResultMetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[var(--background)] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]">
        <Icon size={19} />
      </div>
      <span className="mt-4 block text-xs font-semibold uppercase leading-5 text-[var(--muted)]">{label}</span>
      <strong className="mt-1 block text-2xl leading-tight">{value}</strong>
    </div>
  );
}

function TechnicalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[8px] border border-[var(--line)] p-3 text-sm">
      <span className="block break-words text-[var(--muted)]">{label}</span>
      <strong className="mt-2 block break-words text-lg leading-tight">{value}</strong>
    </div>
  );
}
