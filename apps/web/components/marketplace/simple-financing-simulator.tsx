"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MessageCircle,
  SlidersHorizontal,
  UserRound,
  WalletCards
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import { useSimulationRequestsStore } from "@/stores/simulation-requests-store";

type YesNo = "yes" | "no";
type IncomeType = "CLT" | "MEI" | "AUTONOMO" | "EMPRESARIO" | "INFORMAL";
type CreditScore = "EXCELLENT" | "GOOD" | "MEDIUM" | "LOW";
type PropertyType = "HOUSE" | "APARTMENT" | "LAND_BUILD" | "PLANT";
type PropertyCondition = "NEW" | "USED";

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
  monthlyIncome: number;
  hasInformalIncome: YesNo;
  otherIncome: number;
  incomeType: IncomeType;
  workTimeMonths: number;
  hasIncomeProof: YesNo;
  composeIncome: YesNo;
  coBuyerIncome: number;
  coBuyerScore: CreditScore;
  hasRestriction: YesNo;
  delayedFinancing: YesNo;
  activeLoans: number;
  monthlySpending: number;
  hasCurrentFinancing: YesNo;
  desiredPropertyValue: number;
  propertyType: PropertyType;
  propertyCondition: PropertyCondition;
  useFgts: YesNo;
  fgtsValue: number;
  downPayment: number;
  creditScore: CreditScore;
};

type Result = {
  totalIncome: number;
  maxInstallment: number;
  maxCredit: number;
  maxPropertyValue: number;
  desiredPackageValue: number;
  minimumEntry: number;
  suggestedEntry: number;
  entryGap: number;
  financedNeeded: number;
  estimatedInstallment: number;
  score: number;
  status: string;
  chance: string;
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
  monthlyIncome: 6000,
  hasInformalIncome: "no",
  otherIncome: 0,
  incomeType: "CLT",
  workTimeMonths: 24,
  hasIncomeProof: "yes",
  composeIncome: "no",
  coBuyerIncome: 0,
  coBuyerScore: "GOOD",
  hasRestriction: "no",
  delayedFinancing: "no",
  activeLoans: 0,
  monthlySpending: 1800,
  hasCurrentFinancing: "no",
  desiredPropertyValue: 360000,
  propertyType: "LAND_BUILD",
  propertyCondition: "NEW",
  useFgts: "yes",
  fgtsValue: 30000,
  downPayment: 45000,
  creditScore: "GOOD"
};

const selectClass =
  "focus-ring h-11 w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-3 text-sm outline-none transition";

const panelClass = "rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-5";
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511999999999";

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

function getInitialForm(searchParams: URLSearchParams): QuickForm {
  const terrainPrice = getSearchNumber(searchParams, "terrainPrice", 0);
  const projectPrice = getSearchNumber(searchParams, "projectPrice", 0);
  const buildCost = getSearchNumber(searchParams, "buildCost", 0);
  const desiredPropertyValue = terrainPrice + projectPrice + buildCost;

  return {
    ...defaultForm,
    desiredPropertyValue: desiredPropertyValue > 0 ? desiredPropertyValue : defaultForm.desiredPropertyValue,
    propertyType: terrainPrice > 0 ? "LAND_BUILD" : defaultForm.propertyType
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

function calculateResult(form: QuickForm, terrainPrice: number, projectPrice: number, buildCost: number): Result {
  const formalIncome = form.hasIncomeProof === "yes" ? form.monthlyIncome : form.monthlyIncome * 0.65;
  const informalIncome = form.hasInformalIncome === "yes" ? form.otherIncome * 0.5 : 0;
  const composedIncome = form.composeIncome === "yes" ? form.coBuyerIncome : 0;
  const totalIncome = Math.max(formalIncome + informalIncome + composedIncome, 0);
  const debtPressure = form.activeLoans + (form.hasCurrentFinancing === "yes" ? form.monthlySpending * 0.25 : 0);
  const maxInstallment = Math.max(totalIncome * 0.3 - debtPressure, 0);
  const maxCredit = maxInstallment * 180;
  const usableFgts = form.useFgts === "yes" ? Math.max(form.fgtsValue, 0) : 0;
  const desiredPackageValue = Math.max(form.desiredPropertyValue, 0);
  const entryRate = form.propertyCondition === "USED" ? 0.2 : form.propertyType === "LAND_BUILD" ? 0.2 : 0.15;
  const minimumEntry = desiredPackageValue * entryRate;
  const availableEntry = Math.max(form.downPayment + usableFgts, 0);
  const maxPropertyValue = maxCredit + availableEntry;
  const suggestedEntry = Math.max(minimumEntry, desiredPackageValue - maxCredit);
  const entryGap = Math.max(suggestedEntry - availableEntry, 0);
  const financedNeeded = Math.max(desiredPackageValue - availableEntry, 0);
  const estimatedInstallment = financedNeeded > 0 ? financedNeeded / 180 : 0;
  const age = getAge(form.birthDate);
  const notes: string[] = [];
  let score = 20 + scoreValue(form.creditScore);

  score += form.hasRestriction === "no" ? 20 : -50;
  score += form.delayedFinancing === "no" ? 5 : -15;
  score += form.workTimeMonths >= 24 ? 15 : form.workTimeMonths >= 12 ? 10 : form.workTimeMonths < 6 ? -10 : 0;
  score += availableEntry >= desiredPackageValue * 0.2 ? 20 : availableEntry >= desiredPackageValue * 0.1 ? 10 : -20;
  score += form.hasIncomeProof === "yes" ? 10 : -10;
  score += form.composeIncome === "yes" && form.coBuyerIncome > 0 ? 5 : 0;
  score += form.composeIncome === "yes" ? Math.round(scoreValue(form.coBuyerScore) / 3) : 0;
  score = Math.max(0, Math.min(100, score));

  if (age < 18) {
    notes.push("Idade abaixo do minimo para financiamento.");
    score = Math.min(score, 20);
  }

  if (age + 35 > 80) {
    notes.push("Prazo maximo pode cair porque idade + financiamento precisa ficar dentro da regra de contrato.");
    score -= 10;
  }

  if (form.hasRestriction === "yes") {
    notes.push("Restricao no CPF joga o caso para alto risco ou analise manual.");
  }

  if (entryGap > 0) {
    notes.push(`Faltam cerca de ${money(entryGap)} para a entrada base desta casa.`);
  }

  if (maxInstallment <= 0) {
    notes.push("As dividas atuais consomem a margem de parcela estimada.");
  }

  if (form.hasIncomeProof === "no") {
    notes.push("Sem comprovacao, a renda foi considerada parcialmente para manter a pre-analise conservadora.");
  }

  const chance = score >= 70 ? "Boa" : score >= 40 ? "Analise manual" : "Alto risco";
  const status = score >= 70 ? "Base aprovada para atendimento" : score >= 40 ? "Precisa de ajuste/manual" : "Base fraca agora";

  let fitMessage = "Pela base, ainda nao fecha o imovel desejado.";
  if (maxPropertyValue >= desiredPackageValue && entryGap === 0 && maxInstallment > 0) {
    fitMessage = "Pela media, a casa desejada cabe na base informada.";
  } else if (terrainPrice > 0 && maxPropertyValue >= terrainPrice && desiredPackageValue > terrainPrice) {
    fitMessage = "Pela media, da para estudar o terreno; casa + obra ainda precisa ajustar entrada ou renda.";
  } else if (terrainPrice > 0) {
    fitMessage = "Pela media, nem o terreno sozinho ficou confortavel nessa base.";
  }

  return {
    totalIncome,
    maxInstallment,
    maxCredit,
    maxPropertyValue,
    desiredPackageValue,
    minimumEntry,
    suggestedEntry,
    entryGap,
    financedNeeded,
    estimatedInstallment,
    score,
    status,
    chance,
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
      `Credito medio estimado: ${money(result.maxCredit)}`,
      `Faixa de imovel recomendada: ate ${money(result.maxPropertyValue)}`,
      `Parcela base: ${money(result.maxInstallment)}`,
      `Entrada sugerida: ${money(result.suggestedEntry)}`,
      `Score interno: ${result.score}/100 - ${result.chance}`,
      `Resumo: ${result.fitMessage}`
    ].join("\n")
  );
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
  const searchKey = searchParams.toString();
  const initialForm = useMemo(() => getInitialForm(new URLSearchParams(searchKey)), [searchKey]);
  const terrainPrice = useMemo(() => getSearchNumber(new URLSearchParams(searchKey), "terrainPrice", 0), [searchKey]);
  const projectPrice = useMemo(() => getSearchNumber(new URLSearchParams(searchKey), "projectPrice", 0), [searchKey]);
  const buildCost = useMemo(() => getSearchNumber(new URLSearchParams(searchKey), "buildCost", 0), [searchKey]);
  const packageTitles = useMemo(() => {
    const params = new URLSearchParams(searchKey);

    return {
      terrainTitle: params.get("terrainTitle") ?? "",
      projectTitle: params.get("projectTitle") ?? ""
    };
  }, [searchKey]);
  const hasPackage = terrainPrice > 0 || projectPrice > 0 || buildCost > 0;
  const addRequest = useSimulationRequestsStore((state) => state.addRequest);
  const [form, setForm] = useState<QuickForm>(initialForm);
  const [result, setResult] = useState<Result | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepMessage, setCepMessage] = useState("");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((current) => ({
      ...current,
      name: current.name || user.name || "",
      email: current.email || user.email || "",
      phone: current.phone || maskPhone(user.phone ?? "")
    }));
  }, [user]);

  useEffect(() => {
    const cep = onlyDigits(form.zipCode);

    if (cep.length !== 8) {
      setCepMessage("");
      return;
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

  function simulate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCalculating(true);
    setRequestMessage(null);

    window.setTimeout(() => {
      setResult(calculateResult(form, terrainPrice, projectPrice, buildCost));
      setIsCalculating(false);
    }, 900);
  }

  function registerRequest() {
    const currentResult = result ?? calculateResult(form, terrainPrice, projectPrice, buildCost);
    const request = addRequest({
      name: form.name || "Lead sem nome",
      phone: form.phone,
      email: form.email,
      city: form.city,
      state: form.state,
      desiredPropertyValue: currentResult.desiredPackageValue,
      terrainPrice,
      projectPrice,
      buildCost,
      totalIncome: currentResult.totalIncome,
      maxCredit: currentResult.maxCredit,
      maxPropertyValue: currentResult.maxPropertyValue,
      maxInstallment: currentResult.maxInstallment,
      suggestedEntry: currentResult.suggestedEntry,
      score: currentResult.score,
      status: currentResult.status,
      fitMessage: currentResult.fitMessage
    });

    setRequestMessage(`Pedido ${request.id} cadastrado no painel.`);
  }

  const message = result ? buildWhatsappMessage(form, result) : "";

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:items-end">
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Simulacao rapida</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold">
            Calcule a base da casa sem travar o cliente no cadastro.
          </h1>
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
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--muted)]">
          A tela agora abre direto na estimativa. Dados extras continuam disponiveis, mas a primeira simulacao pede so o
          essencial para atendimento.
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
                <FieldLabel>Cidade</FieldLabel>
                <Input autoComplete="address-level2" onChange={(event) => update("city", event.target.value)} value={form.city} />
              </label>
              <label>
                <FieldLabel>Estado</FieldLabel>
                <Input
                  autoComplete="address-level1"
                  maxLength={2}
                  onChange={(event) => update("state", event.target.value.toUpperCase())}
                  value={form.state}
                />
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
                    <FieldLabel>Data de nascimento</FieldLabel>
                    <Input onChange={(event) => update("birthDate", event.target.value)} type="date" value={form.birthDate} />
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
                <FieldLabel>Renda mensal principal</FieldLabel>
                <Input min={0} onChange={(event) => update("monthlyIncome", toNumber(event.target.value))} type="number" value={form.monthlyIncome} />
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
              <label>
                <FieldLabel>Tem comprovacao de renda?</FieldLabel>
                <select className={selectClass} onChange={(event) => update("hasIncomeProof", event.target.value as YesNo)} value={form.hasIncomeProof}>
                  <option value="yes">Sim</option>
                  <option value="no">Nao</option>
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
                    <Input min={0} onChange={(event) => update("otherIncome", toNumber(event.target.value))} type="number" value={form.otherIncome} />
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
                    <>
                      <label>
                        <FieldLabel>Renda do segundo participante</FieldLabel>
                        <Input min={0} onChange={(event) => update("coBuyerIncome", toNumber(event.target.value))} type="number" value={form.coBuyerIncome} />
                      </label>
                      <label>
                        <FieldLabel>Score aproximado dele(a)</FieldLabel>
                        <select className={selectClass} onChange={(event) => update("coBuyerScore", event.target.value as CreditScore)} value={form.coBuyerScore}>
                          <option value="EXCELLENT">Excelente</option>
                          <option value="GOOD">Bom</option>
                          <option value="MEDIUM">Medio</option>
                          <option value="LOW">Baixo</option>
                        </select>
                      </label>
                    </>
                  ) : null}
                </>
              ) : null}
              <label>
                <FieldLabel>Score aproximado</FieldLabel>
                <select className={selectClass} onChange={(event) => update("creditScore", event.target.value as CreditScore)} value={form.creditScore}>
                  <option value="EXCELLENT">Excelente</option>
                  <option value="GOOD">Bom</option>
                  <option value="MEDIUM">Medio</option>
                  <option value="LOW">Baixo</option>
                </select>
              </label>
              <label>
                <FieldLabel>Nome negativado/restricao?</FieldLabel>
                <select className={selectClass} onChange={(event) => update("hasRestriction", event.target.value as YesNo)} value={form.hasRestriction}>
                  <option value="no">Nao</option>
                  <option value="yes">Sim</option>
                </select>
              </label>
              <label>
                <FieldLabel>Emprestimos ativos por mes</FieldLabel>
                <Input min={0} onChange={(event) => update("activeLoans", toNumber(event.target.value))} type="number" value={form.activeLoans} />
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
                    <Input min={0} onChange={(event) => update("monthlySpending", toNumber(event.target.value))} type="number" value={form.monthlySpending} />
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
              <label>
                <FieldLabel>Valor do imovel/casa desejada</FieldLabel>
                <Input min={0} onChange={(event) => update("desiredPropertyValue", toNumber(event.target.value))} type="number" value={form.desiredPropertyValue} />
                <HelpText>Se veio de um terreno/projeto, ja puxei a base do pacote.</HelpText>
              </label>
              <label>
                <FieldLabel>Entrada em dinheiro</FieldLabel>
                <Input min={0} onChange={(event) => update("downPayment", toNumber(event.target.value))} type="number" value={form.downPayment} />
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
                <Input min={0} onChange={(event) => update("fgtsValue", toNumber(event.target.value))} type="number" value={form.fgtsValue} />
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
              {showAdvanced ? "Ocultar dados extras" : "Detalhes da analise"}
            </span>
            <ChevronDown className={`transition ${showAdvanced ? "rotate-180" : ""}`} size={18} />
          </button>
        </div>

        <aside className="sticky top-24 grid gap-5">
          <div className="rounded-[8px] border border-[var(--line)] bg-[#11150f] p-6 text-white shadow-2xl dark:bg-white dark:text-[#11150f]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm opacity-75">Resultado da base</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {isCalculating ? "Calculando media..." : result?.status ?? "Preencha e simule"}
                </h2>
              </div>
              {isCalculating ? <Loader2 className="animate-spin" size={28} /> : result?.score && result.score >= 70 ? <CheckCircle2 size={28} /> : <CalculatorIcon />}
            </div>

            {isCalculating ? (
              <div className="mt-6 rounded-[8px] bg-white/10 p-4 text-sm leading-6 opacity-85 dark:bg-black/10">
                Conferindo renda, entrada, score e valor da casa...
              </div>
            ) : result ? (
              <>
                <div className="mt-6 grid gap-3 text-sm">
                  <Metric label="Chance" value={`${result.chance} (${result.score}/100)`} />
                  <Metric label="Renda considerada" value={money(result.totalIncome)} />
                  <Metric label="Parcela maxima" value={money(result.maxInstallment)} />
                  <Metric label="Credito medio" value={money(result.maxCredit)} />
                  <Metric label="Faixa recomendada" value={`ate ${money(result.maxPropertyValue)}`} />
                  <Metric label="Entrada sugerida" value={money(result.suggestedEntry)} />
                  <Metric label="Parcela do desejado" value={money(result.estimatedInstallment)} />
                </div>

                <div className="mt-5 rounded-[8px] bg-white/10 p-4 text-sm leading-6 opacity-90 dark:bg-black/10">
                  <strong className="block">{result.fitMessage}</strong>
                  <span className="mt-2 block">{result.fgtsMessage}</span>
                </div>

                {result.notes.length > 0 ? (
                  <div className="mt-4 grid gap-2 text-xs leading-5 opacity-85">
                    {result.notes.map((note) => (
                      <p className="rounded-[8px] border border-white/15 p-3 dark:border-black/15" key={note}>
                        {note}
                      </p>
                    ))}
                  </div>
                ) : null}

                <a
                  className="focus-ring mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#25d366] px-4 text-sm font-semibold text-[#062014] hover:bg-[#20bd5a]"
                  href={`https://wa.me/${whatsappNumber}?text=${message}`}
                  onClick={registerRequest}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle size={18} />
                  Falar no WhatsApp
                </a>

                {requestMessage ? <p className="mt-3 text-xs leading-5 opacity-80">{requestMessage}</p> : null}
              </>
            ) : (
              <div className="mt-6 rounded-[8px] bg-white/10 p-4 text-sm leading-6 opacity-85 dark:bg-black/10">
                A conta usa uma base simples: parcela maxima de ate 30% da renda e credito medio de parcela x 180.
              </div>
            )}

            <Button className="mt-5 w-full" disabled={isCalculating} type="submit" variant="secondary">
              {isCalculating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Calculando
                </>
              ) : (
                <>
                  <Clock size={18} />
                  Simular base
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
              Essa ferramenta nao garante aprovacao. O atendimento precisa conferir documentos, renda real, restricao, avaliacao
              do imovel e simulacao oficial do banco.
            </p>
          </div>
        </aside>
      </form>
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

function CalculatorIcon() {
  return <WalletCards size={28} />;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/20 pb-2 dark:border-black/20">
      <span className="opacity-75">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  );
}
