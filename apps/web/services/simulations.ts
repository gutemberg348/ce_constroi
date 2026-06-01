import { api, unwrap } from "./api";

export type YesNo = "yes" | "no";
export type FinancingSystem = "SAC" | "PRICE";
export type Region = "N_NE" | "OTHER";
export type PropertyType = "NEW" | "USED" | "CONSTRUCTION";
export type PropertyUse = "OWN_HOME" | "INVESTMENT";
export type Program = "AUTO" | "CAIXA_MCMV" | "CAIXA_SBPE" | "OTHER_BANK";
export type ProductKind = "MCMV" | "SBPE" | "SFI" | "PRIVATE";

export type SimulationInput = {
  terrainId?: string;
  projectId?: string;
  terrainPrice?: number;
  projectPrice?: number;
  estimatedBuildCost?: number;
  buildCost?: number;
  downPayment?: number;
  installmentCount?: number;
  monthlyInterestRate?: number;
  documentationRate?: number;
  extraReserve?: number;
  familyIncome?: number;
  monthlyDebts?: number;
  buyerAge?: number;
  dependents?: number;
  ownCash?: number;
  fgtsBalance?: number;
  fgtsYears?: YesNo;
  hasPropertySameCity?: YesNo;
  activeSfh?: YesNo;
  hasCreditRestriction?: YesNo;
  region?: Region;
  propertyType?: PropertyType;
  propertyUse?: PropertyUse;
  program?: Program;
  system?: FinancingSystem;
  months?: number;
  annualInterestRate?: number;
  insuranceRate?: number;
};

export type CaixaSimulationResult = {
  product: {
    kind: ProductKind;
    label: string;
    description: string;
  };
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
  input: Required<
    Pick<
      SimulationInput,
      | "terrainPrice"
      | "projectPrice"
      | "buildCost"
      | "documentationRate"
      | "extraReserve"
      | "familyIncome"
      | "monthlyDebts"
      | "buyerAge"
      | "dependents"
      | "ownCash"
      | "fgtsBalance"
      | "fgtsYears"
      | "hasPropertySameCity"
      | "activeSfh"
      | "hasCreditRestriction"
      | "region"
      | "propertyType"
      | "propertyUse"
      | "program"
      | "system"
      | "months"
      | "annualInterestRate"
      | "insuranceRate"
    >
  >;
  result: CaixaSimulationResult;
  rules: {
    version: string;
    simulatorUrl: string;
    references: string[];
  };
};

export type SavedSimulation = {
  id: string;
  metadata?: {
    result?: CaixaSimulationResult;
    rulesVersion?: string;
  };
};

export async function previewCaixaSimulation(input: SimulationInput) {
  const response = await api.post("/simulations/caixa-preview", input);
  return unwrap<CaixaSimulationResponse>(response);
}

export async function getCaixaSimulationRules() {
  const response = await api.get("/simulations/caixa-rules");
  return unwrap<CaixaSimulationResponse["rules"]>(response);
}

export async function createSimulation(input: SimulationInput) {
  const response = await api.post("/simulations", input);
  return unwrap<SavedSimulation>(response);
}
