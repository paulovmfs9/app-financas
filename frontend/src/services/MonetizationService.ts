import { ExpenseRepository } from "../repositories/ExpenseRepository";
import { UserRepository } from "../repositories/UserRepository";
import type { User } from "../models/User";
import { monthBounds } from "../utils/finance";

export const FREE_MONTHLY_EXPENSE_LIMIT = 30;
export const STANDARD_PRICE_LABEL = "R$ 9,90/mês";
export const LIMIT_REACHED_MESSAGE =
  "Você atingiu o limite de 30 gastos do Plano Básico neste mês. Para continuar adicionando gastos ilimitados, assine o Plano Standard por apenas R$ 9,90/mês.";

export type PlanKey = "basic" | "standard" | "pro";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  originalPrice: string;
  currentPrice: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  comingSoon?: boolean;
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    key: "basic",
    name: "Básico",
    originalPrice: "R$ 9,90",
    currentPrice: "R$ 0,00",
    description: "Para começar a registrar gastos e entender o mês.",
    features: [
      `até ${FREE_MONTHLY_EXPENSE_LIMIT} gastos por mês`,
      "saldo restante do mês",
      "alertas financeiros simples",
      "resumo mensal básico",
    ],
  },
  {
    key: "standard",
    name: "Standard",
    originalPrice: "R$ 47,90",
    currentPrice: "R$ 9,90",
    description: "O antigo Plano Pro, agora com o nome certo para uso completo.",
    highlighted: true,
    features: [
      "gastos ilimitados",
      "controle financeiro completo",
      "média diária de gastos",
      "projeção de gastos até o fim do mês",
      "exportação de relatórios",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    originalPrice: "R$ 97,70",
    currentPrice: "R$ 47,90",
    description: "Plano avançado reservado para as próximas funcionalidades.",
    comingSoon: true,
    features: [
      "novas funcionalidades premium",
      "recursos inteligentes em desenvolvimento",
      "experiências avançadas de análise",
      "prioridade para melhorias futuras",
    ],
  },
];

export interface AddExpensePermission {
  allowed: boolean;
  hasUnlimitedExpenses: boolean;
  count: number;
  limit: number;
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

export async function getCurrentUserProfile(uid: string): Promise<User | null> {
  return UserRepository.get(uid);
}

function toMillis(value: User["subscriptionExpiresAt"]): number | null {
  if (value === null) return null;
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  return null;
}

export function normalizePlanKey(plan: User["plan"] | null | undefined): PlanKey {
  if (plan === "standard") return "standard";
  if (plan === "pro") return "standard";
  return "basic";
}

export function isUnlimitedPlan(userProfile: User | null | undefined): boolean {
  if (!userProfile) return false;
  const expiresAt = toMillis(userProfile.subscriptionExpiresAt);
  const hasNotExpired = expiresAt === null || expiresAt > Date.now();
  const plan = normalizePlanKey(userProfile.plan);
  return (plan === "standard" || plan === "pro") && userProfile.subscriptionStatus === "active" && hasNotExpired;
}

export async function getCurrentMonthExpenseCount(uid: string): Promise<number> {
  const { start, end } = monthBounds();
  return ExpenseRepository.countMonth(uid, start, end);
}

export async function canAddExpense(uid: string, userProfile?: User | null): Promise<AddExpensePermission> {
  const profile = userProfile ?? (await getCurrentUserProfile(uid));
  const hasUnlimitedExpenses = isUnlimitedPlan(profile);
  if (hasUnlimitedExpenses) {
    return { allowed: true, hasUnlimitedExpenses: true, count: 0, limit: FREE_MONTHLY_EXPENSE_LIMIT };
  }

  const count = await getCurrentMonthExpenseCount(uid);
  return {
    allowed: count < FREE_MONTHLY_EXPENSE_LIMIT,
    hasUnlimitedExpenses: false,
    count,
    limit: FREE_MONTHLY_EXPENSE_LIMIT,
  };
}

export function handleExpenseLimitReached(openUpgradeModal: () => void): never {
  openUpgradeModal();
  throw new ExpenseLimitError();
}

export function openUpgradeModal(setVisible: (visible: boolean) => void): void {
  setVisible(true);
}
