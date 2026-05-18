/** Pure finance calculations (no IO). */
import type { Expense } from "../models/Expense";

export interface FinanceSnapshot {
  month: string;            // "YYYY-MM"
  days_in_month: number;
  days_passed: number;
  days_remaining: number;
  salary: number;
  fixed_bills: number;
  total_spent: number;
  saldo_restante: number;
  media_diaria: number;
  projecao_mensal: number;
  saldo_previsto: number;
  limite_diario: number;
  ideal_diario: number;
  by_category: Record<string, number>;
  alert: AlertInfo;
}

export type AlertLevel = "success" | "warning" | "danger" | "info";
export interface AlertInfo {
  level: AlertLevel;
  title: string;
  message: string;
}

export function monthBounds(now: Date = new Date()): { start: number; end: number; daysInMonth: number } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1, 0, 0, 0, 0).getTime();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const end = new Date(y, m, daysInMonth, 23, 59, 59, 999).getTime();
  return { start, end, daysInMonth };
}

export function monthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Builds the full finance snapshot from user info + expenses of the month. */
export function computeSnapshot(
  salary: number,
  fixedBills: number,
  expenses: Pick<Expense, "amount" | "category">[],
  now: Date = new Date()
): FinanceSnapshot {
  const { daysInMonth } = monthBounds(now);
  const daysPassed = Math.max(1, now.getDate());
  const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);

  let totalSpent = 0;
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    totalSpent += e.amount;
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  const availableBudget = Math.max(0, salary - fixedBills);
  const saldoRestante = salary - fixedBills - totalSpent;
  const mediaDiaria = totalSpent / daysPassed;
  const projecaoMensal = mediaDiaria * daysInMonth;
  const saldoPrevisto = salary - fixedBills - projecaoMensal;
  const limiteDiario = daysRemaining > 0 ? Math.max(0, saldoRestante / daysRemaining) : 0;
  const idealDiario = daysInMonth > 0 ? availableBudget / daysInMonth : 0;

  const alert = buildAlert({ salary, saldoPrevisto, mediaDiaria, idealDiario });

  return {
    month: monthKey(now),
    days_in_month: daysInMonth,
    days_passed: daysPassed,
    days_remaining: daysRemaining,
    salary,
    fixed_bills: fixedBills,
    total_spent: round2(totalSpent),
    saldo_restante: round2(saldoRestante),
    media_diaria: round2(mediaDiaria),
    projecao_mensal: round2(projecaoMensal),
    saldo_previsto: round2(saldoPrevisto),
    limite_diario: round2(limiteDiario),
    ideal_diario: round2(idealDiario),
    by_category: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, round2(v)])),
    alert,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildAlert(args: {
  salary: number;
  saldoPrevisto: number;
  mediaDiaria: number;
  idealDiario: number;
}): AlertInfo {
  const { salary, saldoPrevisto, mediaDiaria, idealDiario } = args;
  if (salary <= 0) {
    return {
      level: "info",
      title: "Configure seu salário",
      message: "Adicione seu salário em Perfil para ver suas projeções.",
    };
  }
  if (saldoPrevisto < 0) {
    return {
      level: "danger",
      title: "Atenção com seus gastos",
      message: "Nesse ritmo, pode faltar dinheiro antes do fim do mês.",
    };
  }
  if (idealDiario > 0 && mediaDiaria > idealDiario * 1.15) {
    return {
      level: "warning",
      title: "Acima do ideal",
      message: "Você está gastando um pouco acima do planejado. Vamos com calma?",
    };
  }
  return {
    level: "success",
    title: "Tudo sob controle",
    message: "Você está dentro do planejado. Continue assim!",
  };
}
