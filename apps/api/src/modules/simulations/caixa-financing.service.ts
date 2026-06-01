import { Injectable } from "@nestjs/common";
import { CreateSimulationDto } from "./dto/create-simulation.dto";

type YesNo = "yes" | "no";
type FinancingSystem = "SAC" | "PRICE";
type Region = "N_NE" | "OTHER";
type PropertyType = "NEW" | "USED" | "CONSTRUCTION";
type PropertyUse = "OWN_HOME" | "INVESTMENT";
type Program = "AUTO" | "CAIXA_MCMV" | "CAIXA_SBPE" | "OTHER_BANK";
type ProductKind = "MCMV" | "SBPE" | "SFI" | "PRIVATE";

type CatalogValues = {
  terrainPrice?: number;
  projectPrice?: number;
  estimatedBuildCost?: number;
};

type CaixaSimulationInput = {
  terrainPrice: number;
  projectPrice: number;
  buildCost: number;
  documentationRate: number;
  extraReserve: number;
  familyIncome: number;
  monthlyDebts: number;
  buyerAge: number;
  dependents: number;
  ownCash: number;
  fgtsBalance: number;
  fgtsYears: YesNo;
  hasPropertySameCity: YesNo;
  activeSfh: YesNo;
  hasCreditRestriction: YesNo;
  region: Region;
  propertyType: PropertyType;
  propertyUse: PropertyUse;
  program: Program;
  system: FinancingSystem;
  months: number;
  annualInterestRate: number;
  insuranceRate: number;
};

type Product = {
  kind: ProductKind;
  label: string;
  description: string;
};

export type CaixaSimulationResult = {
  product: Product;
  packageValue: number;
  documentationCost: number;
  financingQuota: number;
  suggestedAnnualRate: number;
  annualRate: number;
  monthlyRate: number;
  maxByQuota: number;
  termMonths: number;
  ageAtEnd: number;
  canUseFgts: boolean;
  eligibleFgts: number;
  principal: number;
  entry: number;
  fgtsUsed: number;
  cashEntry: number;
  cashAtStart: number;
  initialShortfall: number;
  firstPayment: number;
  lastPayment: number;
  monthlyCapacity: number;
  requiredIncome: number;
  totalWithInitial: number;
  blockers: string[];
  warnings: string[];
  status: string;
};

export type CaixaSimulationResponse = {
  input: CaixaSimulationInput;
  result: CaixaSimulationResult;
  rules: typeof CAIXA_RULES;
};

const CAIXA_RULES = {
  version: "caixa-public-2026-04-22",
  source: "CAIXA public housing conditions and official simulator reference",
  simulatorUrl: "https://www.simuladorhabitacao.caixa.gov.br",
  references: [
    "https://caixanoticias.caixa.gov.br/Paginas/Not%C3%ADcias/2026/04-ABRIL/CAIXA-inicia-opera%C3%A7%C3%A3o-das-novas-condi%C3%A7%C3%B5es-do-Minha-Casa%2C-Minha-Vida-na-pr%C3%B3xima-quarta-feira-%2822%29.aspx",
    "https://www.caixa.gov.br/voce/habitacao/financiamento-de-imoveis/Paginas/default.aspx",
    "https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/habitacao/programa-minha-casa-minha-vida/arquivos/PORTARIAMCIDN333DE30DEMARODE2026PORTARIAMCIDN333DE30DEMARODE2026DOUImprensaNacional.pdf"
  ],
  maxTermMonths: 420,
  maxAgeAtEnd: 80,
  incomeCommitmentRate: 0.3,
  sfhValueLimit: 2250000,
  mcmvIncomeLimit: 13000,
  mcmvValueLimits: {
    urbanBands1And2: 275000,
    urbanBand3: 400000,
    middleClass: 600000
  },
  defaultAnnualRates: {
    sbpe: 10.99,
    sfi: 12.8,
    private: 11.5,
    mcmvMiddleClass: 10.5
  },
  adminFee: {
    defaultMonthly: 25,
    sfiMonthly: 0
  }
};

const DEFAULT_INPUT: CaixaSimulationInput = {
  terrainPrice: 620000,
  projectPrice: 42000,
  buildCost: 980000,
  documentationRate: 4.5,
  extraReserve: 60000,
  familyIncome: 18500,
  monthlyDebts: 1400,
  buyerAge: 36,
  dependents: 2,
  ownCash: 330000,
  fgtsBalance: 70000,
  fgtsYears: "yes",
  hasPropertySameCity: "no",
  activeSfh: "no",
  hasCreditRestriction: "no",
  region: "OTHER",
  propertyType: "CONSTRUCTION",
  propertyUse: "OWN_HOME",
  program: "AUTO",
  system: "SAC",
  months: 360,
  annualInterestRate: 0,
  insuranceRate: 5
};

@Injectable()
export class CaixaFinancingService {
  getRules() {
    return CAIXA_RULES;
  }

  simulate(dto: CreateSimulationDto, catalogValues: CatalogValues = {}): CaixaSimulationResponse {
    const input = this.normalizeInput(dto, catalogValues);

    return {
      input,
      result: calculateSimulation(input),
      rules: CAIXA_RULES
    };
  }

  private normalizeInput(dto: CreateSimulationDto, catalogValues: CatalogValues): CaixaSimulationInput {
    const monthlyInterestRate = getNumber(dto.monthlyInterestRate, 0);
    const annualRateFromMonthly =
      monthlyInterestRate > 0 ? (Math.pow(1 + monthlyInterestRate, 12) - 1) * 100 : DEFAULT_INPUT.annualInterestRate;

    return {
      terrainPrice: getNumber(dto.terrainPrice, catalogValues.terrainPrice ?? DEFAULT_INPUT.terrainPrice),
      projectPrice: getNumber(dto.projectPrice, catalogValues.projectPrice ?? DEFAULT_INPUT.projectPrice),
      buildCost: getNumber(
        dto.buildCost ?? dto.estimatedBuildCost,
        catalogValues.estimatedBuildCost ?? DEFAULT_INPUT.buildCost
      ),
      documentationRate: getNumber(dto.documentationRate, DEFAULT_INPUT.documentationRate),
      extraReserve: getNumber(dto.extraReserve, DEFAULT_INPUT.extraReserve),
      familyIncome: getNumber(dto.familyIncome, DEFAULT_INPUT.familyIncome),
      monthlyDebts: getNumber(dto.monthlyDebts, DEFAULT_INPUT.monthlyDebts),
      buyerAge: getNumber(dto.buyerAge, DEFAULT_INPUT.buyerAge),
      dependents: getNumber(dto.dependents, DEFAULT_INPUT.dependents),
      ownCash: getNumber(dto.ownCash ?? dto.downPayment, DEFAULT_INPUT.ownCash),
      fgtsBalance: getNumber(dto.fgtsBalance, DEFAULT_INPUT.fgtsBalance),
      fgtsYears: normalizeChoice(dto.fgtsYears, ["yes", "no"], DEFAULT_INPUT.fgtsYears),
      hasPropertySameCity: normalizeChoice(dto.hasPropertySameCity, ["yes", "no"], DEFAULT_INPUT.hasPropertySameCity),
      activeSfh: normalizeChoice(dto.activeSfh, ["yes", "no"], DEFAULT_INPUT.activeSfh),
      hasCreditRestriction: normalizeChoice(dto.hasCreditRestriction, ["yes", "no"], DEFAULT_INPUT.hasCreditRestriction),
      region: normalizeChoice(dto.region, ["N_NE", "OTHER"], DEFAULT_INPUT.region),
      propertyType: normalizeChoice(dto.propertyType, ["NEW", "USED", "CONSTRUCTION"], DEFAULT_INPUT.propertyType),
      propertyUse: normalizeChoice(dto.propertyUse, ["OWN_HOME", "INVESTMENT"], DEFAULT_INPUT.propertyUse),
      program: normalizeChoice(dto.program, ["AUTO", "CAIXA_MCMV", "CAIXA_SBPE", "OTHER_BANK"], DEFAULT_INPUT.program),
      system: normalizeChoice(dto.system, ["SAC", "PRICE"], DEFAULT_INPUT.system),
      months: getNumber(dto.months ?? dto.installmentCount, DEFAULT_INPUT.months),
      annualInterestRate: getNumber(dto.annualInterestRate, annualRateFromMonthly),
      insuranceRate: getNumber(dto.insuranceRate, DEFAULT_INPUT.insuranceRate)
    };
  }
}

function calculateSimulation(form: CaixaSimulationInput): CaixaSimulationResult {
  const packageValue = Math.max(form.terrainPrice + form.projectPrice + form.buildCost, 0);
  const documentationCost = packageValue * (form.documentationRate / 100);
  const product = resolveProduct(form, packageValue);
  const financingQuota = getFinancingQuota(form, product);
  const suggestedAnnualRate = getSuggestedAnnualRate(form, product);
  const annualRate = form.annualInterestRate > 0 ? form.annualInterestRate : suggestedAnnualRate;
  const monthlyRate = annualToMonthly(annualRate);
  const maxByQuota = packageValue * financingQuota;
  const ageTermLimit = Math.max(Math.floor((CAIXA_RULES.maxAgeAtEnd - form.buyerAge) * 12), 0);
  const termMonths = Math.min(Math.max(form.months, 1), CAIXA_RULES.maxTermMonths, ageTermLimit || 0);
  const canUseFgts =
    form.fgtsYears === "yes" &&
    form.hasPropertySameCity === "no" &&
    form.activeSfh === "no" &&
    form.propertyUse === "OWN_HOME" &&
    packageValue <= CAIXA_RULES.sfhValueLimit;
  const eligibleFgts = canUseFgts ? Math.max(form.fgtsBalance, 0) : 0;
  const cashAfterCosts = Math.max(form.ownCash - documentationCost - form.extraReserve, 0);
  const requestedFinancing = Math.max(packageValue - cashAfterCosts - eligibleFgts, 0);
  const principal = Math.min(requestedFinancing, maxByQuota);
  const entry = Math.max(packageValue - principal, 0);
  const fgtsUsed = Math.min(eligibleFgts, entry);
  const cashEntry = Math.max(entry - fgtsUsed, 0);
  const cashAtStart = cashEntry + documentationCost + form.extraReserve;
  const initialShortfall = Math.max(cashAtStart - form.ownCash, 0);
  const adminFee = product.kind === "SFI" ? CAIXA_RULES.adminFee.sfiMonthly : CAIXA_RULES.adminFee.defaultMonthly;
  const monthsForCalc = termMonths > 0 ? termMonths : 1;
  const priceBase = pricePayment(principal, monthlyRate, monthsForCalc);
  const sacAmortization = principal > 0 ? principal / monthsForCalc : 0;
  const sacFirst = principal > 0 ? sacAmortization + principal * monthlyRate : 0;
  const sacLast = principal > 0 ? sacAmortization + sacAmortization * monthlyRate : 0;
  const baseFirst = form.system === "PRICE" ? priceBase : sacFirst;
  const baseLast = form.system === "PRICE" ? priceBase : sacLast;
  const firstFees = baseFirst * (form.insuranceRate / 100) + (principal > 0 ? adminFee : 0);
  const lastFees = baseLast * (form.insuranceRate / 100) + (principal > 0 ? adminFee : 0);
  const firstPayment = termMonths > 0 ? baseFirst + firstFees : 0;
  const lastPayment = termMonths > 0 ? baseLast + lastFees : 0;
  const monthlyCapacity = form.familyIncome * CAIXA_RULES.incomeCommitmentRate;
  const requiredIncome =
    firstPayment > 0 ? (firstPayment + form.monthlyDebts) / CAIXA_RULES.incomeCommitmentRate : 0;
  const affordable = firstPayment + form.monthlyDebts <= monthlyCapacity;
  const priceTotal = priceBase * monthsForCalc + firstFees * monthsForCalc;
  const sacInterestTotal = principal * monthlyRate * ((monthsForCalc + 1) / 2);
  const sacFeesTotal = ((firstFees + lastFees) / 2) * monthsForCalc;
  const sacTotal = principal + sacInterestTotal + sacFeesTotal;
  const financingTotal = form.system === "PRICE" ? priceTotal : sacTotal;
  const totalWithInitial = cashAtStart + financingTotal;
  const mcmvLimit = getMcmvValueLimit(form.familyIncome);
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (form.hasCreditRestriction === "yes") {
    blockers.push("Regularizar restricoes cadastrais antes da analise bancaria.");
  }

  if (initialShortfall > 100) {
    blockers.push(`Aumentar entrada/reserva em pelo menos ${moneyText(initialShortfall)}.`);
  }

  if (!affordable && principal > 0) {
    blockers.push(
      `Parcela + dividas passam do teto estimado de 30% da renda. Renda sugerida: ${moneyText(requiredIncome)}.`
    );
  }

  if (termMonths <= 0) {
    blockers.push("Prazo inviavel pela idade informada.");
  } else if (termMonths < form.months) {
    warnings.push(`Prazo ajustado para ${termMonths} meses por limite de 35 anos e idade no fim do contrato.`);
  }

  if (form.months > CAIXA_RULES.maxTermMonths) {
    warnings.push("CAIXA costuma limitar o prazo a 420 meses.");
  }

  if (!canUseFgts && form.fgtsBalance > 0) {
    warnings.push("FGTS informado pode nao entrar na conta por regra de uso, imovel, finalidade ou financiamento ativo.");
  }

  if (product.kind === "MCMV") {
    if (form.familyIncome > CAIXA_RULES.mcmvIncomeLimit) {
      blockers.push("Renda acima da base estimada para MCMV/FGTS.");
    }

    if (packageValue > mcmvLimit) {
      blockers.push(`Valor acima do limite estimado do MCMV para a renda: ${moneyText(mcmvLimit)}.`);
    }

    if (form.propertyUse !== "OWN_HOME") {
      blockers.push("MCMV/FGTS exige finalidade de moradia propria.");
    }
  }

  if (product.kind === "SFI") {
    warnings.push("Valor acima do teto SFH: a analise tende a ser SFI/alto valor, com cota e taxa dependentes do banco.");
  }

  if (form.system === "PRICE" && product.kind === "SBPE") {
    warnings.push("No SBPE/CAIXA, a cota estimada para Price costuma ser menor que SAC.");
  }

  const status =
    blockers.length === 0
      ? "Base boa para falar com atendente e fechar analise"
      : blockers.length <= 2
        ? "Ajustar antes de tentar fechar"
        : "Fora da base estimada agora";

  return {
    product,
    packageValue: roundMoney(packageValue),
    documentationCost: roundMoney(documentationCost),
    financingQuota: round(financingQuota, 4),
    suggestedAnnualRate: round(suggestedAnnualRate, 4),
    annualRate: round(annualRate, 4),
    monthlyRate: round(monthlyRate, 8),
    maxByQuota: roundMoney(maxByQuota),
    termMonths,
    ageAtEnd: round(form.buyerAge + termMonths / 12, 2),
    canUseFgts,
    eligibleFgts: roundMoney(eligibleFgts),
    principal: roundMoney(principal),
    entry: roundMoney(entry),
    fgtsUsed: roundMoney(fgtsUsed),
    cashEntry: roundMoney(cashEntry),
    cashAtStart: roundMoney(cashAtStart),
    initialShortfall: roundMoney(initialShortfall),
    firstPayment: roundMoney(firstPayment),
    lastPayment: roundMoney(lastPayment),
    monthlyCapacity: roundMoney(monthlyCapacity),
    requiredIncome: roundMoney(requiredIncome),
    totalWithInitial: roundMoney(totalWithInitial),
    blockers,
    warnings,
    status
  };
}

function resolveProduct(form: CaixaSimulationInput, packageValue: number): Product {
  const fitsMcmv =
    form.familyIncome <= CAIXA_RULES.mcmvIncomeLimit && packageValue <= getMcmvValueLimit(form.familyIncome);

  if (form.program === "CAIXA_MCMV" || (form.program === "AUTO" && fitsMcmv && form.propertyUse === "OWN_HOME")) {
    return {
      kind: "MCMV",
      label: form.familyIncome > 9600 ? "CAIXA MCMV Classe Media" : "CAIXA MCMV/FGTS",
      description: "Base para moradia propria com renda e valor dentro do Minha Casa Minha Vida."
    };
  }

  if (form.program === "OTHER_BANK") {
    return {
      kind: "PRIVATE",
      label: "Banco privado/manual",
      description: "Base generica para comparar com bancos privados usando a taxa informada."
    };
  }

  if (packageValue > CAIXA_RULES.sfhValueLimit) {
    return {
      kind: "SFI",
      label: "CAIXA SFI/alto valor",
      description: "Imoveis acima do teto de SFH entram em analise de alto valor."
    };
  }

  return {
    kind: "SBPE",
    label: "CAIXA SBPE/SFH",
    description: "Base de credito imobiliario CAIXA fora do MCMV, dentro do teto estimado de SFH."
  };
}

function getFinancingQuota(form: CaixaSimulationInput, product: Product) {
  if (product.kind === "MCMV") {
    if (form.familyIncome > 9600) {
      return 0.8;
    }

    if (form.familyIncome > 5000 && form.propertyType === "USED" && form.region === "OTHER") {
      return 0.6;
    }

    return 0.8;
  }

  if (product.kind === "SBPE") {
    return form.system === "SAC" ? 0.8 : 0.7;
  }

  if (product.kind === "SFI") {
    return form.system === "SAC" ? 0.7 : 0.6;
  }

  return form.system === "SAC" ? 0.8 : 0.7;
}

function getMcmvValueLimit(income: number) {
  if (income <= 5000) {
    return CAIXA_RULES.mcmvValueLimits.urbanBands1And2;
  }

  if (income <= 9600) {
    return CAIXA_RULES.mcmvValueLimits.urbanBand3;
  }

  return CAIXA_RULES.mcmvValueLimits.middleClass;
}

function getMcmvRate(form: CaixaSimulationInput) {
  const isNorthNortheast = form.region === "N_NE";
  const isFgtsWorker = form.fgtsYears === "yes";
  const income = form.familyIncome;

  if (income <= 2160) {
    return isFgtsWorker ? (isNorthNortheast ? 4 : 4.25) : isNorthNortheast ? 4.5 : 4.75;
  }

  if (income <= 2850) {
    return isFgtsWorker ? (isNorthNortheast ? 4.25 : 4.5) : isNorthNortheast ? 4.75 : 5;
  }

  if (income <= 3200) {
    return isFgtsWorker ? (isNorthNortheast ? 4.5 : 4.75) : isNorthNortheast ? 5 : 5.25;
  }

  if (income <= 3500) {
    return isFgtsWorker ? (isNorthNortheast ? 4.75 : 5) : isNorthNortheast ? 5.25 : 5.5;
  }

  if (income <= 4000) {
    return isFgtsWorker ? 5.5 : 6;
  }

  if (income <= 5000) {
    return isFgtsWorker ? 6.5 : 7;
  }

  if (income <= 9600) {
    return isFgtsWorker ? 7.66 : 8.16;
  }

  return CAIXA_RULES.defaultAnnualRates.mcmvMiddleClass;
}

function getSuggestedAnnualRate(form: CaixaSimulationInput, product: Product) {
  if (product.kind === "MCMV") {
    return getMcmvRate(form);
  }

  if (product.kind === "SBPE") {
    return CAIXA_RULES.defaultAnnualRates.sbpe;
  }

  if (product.kind === "SFI") {
    return CAIXA_RULES.defaultAnnualRates.sfi;
  }

  return CAIXA_RULES.defaultAnnualRates.private;
}

function annualToMonthly(ratePercent: number) {
  return Math.pow(1 + ratePercent / 100, 1 / 12) - 1;
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

function getNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeChoice<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function round(value: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function roundMoney(value: number) {
  return round(value, 2);
}

function moneyText(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}
