import type { User } from "../models/User";
import { formatBRL } from "../utils/format";

export const FREE_MONTHLY_EXPENSE_LIMIT = 40;
export const FREE_MONTHLY_EXPORT_LIMIT = 2;

export const PRO_MONTHLY_PRICE = 9.9;
export const PRO_ANNUAL_PRICE = 59.45;
/** Repassada ao cliente quando ele parcela o anual no cartão (tabela Price). */
export const ANNUAL_INSTALLMENT_INTEREST_RATE = 0.0299;
export const PRO_ANNUAL_MAX_INSTALLMENTS = 12;

export const LIMIT_REACHED_MESSAGE =
  `Você atingiu o limite de ${FREE_MONTHLY_EXPENSE_LIMIT} gastos do Plano Básico neste mês. ` +
  `Para continuar adicionando gastos ilimitados, assine o Plano Pro por apenas ${formatBRL(PRO_MONTHLY_PRICE)}/mês.`;

export type PlanKey = "basic" | "pro";
export type BillingInterval = "monthly" | "annual";

export interface PlanPrice {
  interval: BillingInterval;
  amount: number;
  priceLabel: string;
  periodLabel: string;
  /** Só o anual: preço cheio à vista, exibido junto do equivalente mensal. */
  fullPriceLabel?: string;
  /** Só o anual: parcelamento no cartão com os juros já embutidos. */
  installmentLabel?: string;
  installmentNote?: string;
}

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  description: string;
  features: string[];
  prices: PlanPrice[];
  highlighted?: boolean;
}

export class ExpenseLimitError extends Error {
  constructor() {
    super(LIMIT_REACHED_MESSAGE);
    this.name = "ExpenseLimitError";
  }
}

export function isExpenseLimitError(err: unknown): boolean {
  return err instanceof ExpenseLimitError || (err as Error)?.name === "ExpenseLimitError";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Valor da parcela pela tabela Price (juros compostos), igual ao cálculo
 * padrão de gateways de pagamento brasileiros (Mercado Pago, PagBank, etc).
 * 1 parcela ou taxa zero caem para divisão simples, sem juros.
 */
export function installmentAmount(principal: number, installments: number, monthlyRate: number): number {
  if (!Number.isFinite(principal) || principal <= 0) return 0;
  const n = Number.isFinite(installments) ? Math.trunc(installments) : 1;
  if (n <= 1) return round2(principal);

  const rate = Number.isFinite(monthlyRate) ? monthlyRate : 0;
  if (rate <= 0) return round2(principal / n);

  const pmt = (principal * rate) / (1 - Math.pow(1 + rate, -n));
  return round2(pmt);
}

export function proAnnualInstallmentAmount(): number {
  return installmentAmount(PRO_ANNUAL_PRICE, PRO_ANNUAL_MAX_INSTALLMENTS, ANNUAL_INSTALLMENT_INTEREST_RATE);
}

export function proAnnualInstallmentTotal(): number {
  return round2(proAnnualInstallmentAmount() * PRO_ANNUAL_MAX_INSTALLMENTS);
}

export function proAnnualMonthlyEquivalent(): number {
  return round2(PRO_ANNUAL_PRICE / 12);
}

/** % de economia do anual à vista frente a 12 mensalidades avulsas. */
export function annualSavingsPercent(): number {
  const monthlyTotal = PRO_MONTHLY_PRICE * 12;
  return Math.round((1 - PRO_ANNUAL_PRICE / monthlyTotal) * 100);
}

const interestPercentLabel = `${(ANNUAL_INSTALLMENT_INTEREST_RATE * 100).toFixed(2).replace(".", ",")}%`;

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    key: "basic",
    name: "Básico",
    description: "Para começar a registrar gastos e entender o mês.",
    features: [
      `até ${FREE_MONTHLY_EXPENSE_LIMIT} gastos por mês`,
      `até ${FREE_MONTHLY_EXPORT_LIMIT} exportações por mês`,
      "saldo restante do mês",
      "alertas financeiros simples",
      "resumo mensal básico",
    ],
    prices: [
      {
        interval: "monthly",
        amount: 0,
        priceLabel: "R$ 0,00",
        periodLabel: "/mês",
      },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    description: "Controle financeiro completo, sem limites.",
    highlighted: true,
    features: [
      "gastos ilimitados",
      "exportações ilimitadas",
      "controle financeiro completo",
      "média diária de gastos",
      "projeção de gastos até o fim do mês",
    ],
    prices: [
      {
        interval: "monthly",
        amount: PRO_MONTHLY_PRICE,
        priceLabel: formatBRL(PRO_MONTHLY_PRICE),
        periodLabel: "/mês",
      },
      {
        interval: "annual",
        amount: PRO_ANNUAL_PRICE,
        priceLabel: formatBRL(proAnnualMonthlyEquivalent()),
        periodLabel: "/mês",
        fullPriceLabel: `${formatBRL(PRO_ANNUAL_PRICE)} à vista, 1x ao ano`,
        installmentLabel: `ou em até ${PRO_ANNUAL_MAX_INSTALLMENTS}x de ${formatBRL(proAnnualInstallmentAmount())} no cartão`,
        installmentNote: `juros de ${interestPercentLabel} a.m. já inclusos na parcela`,
      },
    ],
  },
];

export function findPlan(key: PlanKey): PlanDefinition {
  const plan = PLAN_DEFINITIONS.find((p) => p.key === key);
  if (!plan) throw new Error(`Unknown plan: ${key}`);
  return plan;
}

/**
 * Normaliza um valor de `plan` (potencialmente legado ou inválido) para as
 * chaves de catálogo atuais. "standard" é o antigo nome do plano pago:
 * quem já assinava não é rebaixado, só deixa de existir como opção nova.
 */
export function normalizePlanKey(plan: string | null | undefined): PlanKey {
  if (plan === "standard" || plan === "pro") return "pro";
  return "basic";
}

interface UnlimitedPlanInput {
  plan?: string | null;
  subscriptionStatus?: string | null;
  subscriptionExpiresAt?: User["subscriptionExpiresAt"];
}

function toMillis(value: UnlimitedPlanInput["subscriptionExpiresAt"]): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value.toMillis === "function") return value.toMillis();
  return null;
}

export function isUnlimitedPlan(userProfile: UnlimitedPlanInput | null | undefined): boolean {
  if (!userProfile) return false;
  const expiresAt = toMillis(userProfile.subscriptionExpiresAt);
  const hasNotExpired = expiresAt === null || expiresAt > Date.now();
  const plan = normalizePlanKey(userProfile.plan);
  return plan === "pro" && userProfile.subscriptionStatus === "active" && hasNotExpired;
}

export function openUpgradeModal(setVisible: (visible: boolean) => void): void {
  setVisible(true);
}
