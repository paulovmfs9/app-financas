import { ExpenseRepository } from "../repositories/ExpenseRepository";
import { UserRepository } from "../repositories/UserRepository";
import type { User } from "../models/User";
import { monthBounds } from "../utils/finance";

export const FREE_MONTHLY_EXPENSE_LIMIT = 30;
export const LIMIT_REACHED_MESSAGE =
  "Você atingiu o limite de 30 gastos gratuitos neste mês. Para continuar adicionando gastos ilimitados, assine o Plano Pro por apenas R$ 9,90/mês.";

export interface AddExpensePermission {
  allowed: boolean;
  isPro: boolean;
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

export function isUserPro(userProfile: User | null | undefined): boolean {
  if (!userProfile) return false;
  const expiresAt = toMillis(userProfile.subscriptionExpiresAt);
  const hasNotExpired = expiresAt === null || expiresAt > Date.now();
  return userProfile.plan === "pro" && userProfile.subscriptionStatus === "active" && hasNotExpired;
}

export async function getCurrentMonthExpenseCount(uid: string): Promise<number> {
  const { start, end } = monthBounds();
  return ExpenseRepository.countMonth(uid, start, end);
}

export async function canAddExpense(uid: string, userProfile?: User | null): Promise<AddExpensePermission> {
  const profile = userProfile ?? (await getCurrentUserProfile(uid));
  const pro = isUserPro(profile);
  if (pro) {
    return { allowed: true, isPro: true, count: 0, limit: FREE_MONTHLY_EXPENSE_LIMIT };
  }

  const count = await getCurrentMonthExpenseCount(uid);
  return {
    allowed: count < FREE_MONTHLY_EXPENSE_LIMIT,
    isPro: false,
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
