/** Pure finance calculations (no IO). */
import type { Expense } from "../models/Expense";
import type { FixedBill } from "../models/FixedBill";

export interface FinanceSnapshot {
  month: string;            // "YYYY-MM"
  period_start: number;
  period_end: number;
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

const DAY_MS = 24 * 60 * 60 * 1000;

export function monthBounds(now: Date = new Date()): { start: number; end: number; daysInMonth: number } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1, 0, 0, 0, 0).getTime();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const end = new Date(y, m, daysInMonth, 23, 59, 59, 999).getTime();
  return { start, end, daysInMonth };
}

export function cycleBounds(
  now: Date = new Date(),
  startDay = 1,
  endDay = 31
): { start: number; end: number; daysInMonth: number } {
  const start = clampDay(startDay);
  const end = clampDay(endDay);
  const currentDay = now.getDate();
  const y = now.getFullYear();
  const m = now.getMonth();

  if (start < end) {
    return buildPeriod(dateAtDay(y, m, start, false), dateAtDay(y, m, end, true));
  }

  const startMonth = currentDay >= start ? m : m - 1;
  const endMonth = currentDay >= start ? m + 1 : m;
  return buildPeriod(dateAtDay(y, startMonth, start, false), dateAtDay(y, endMonth, end, true));
}

export function monthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Builds the full finance snapshot from user info + expenses of the period. */
export function computeSnapshot(
  salary: number,
  fixedBills: number,
  expenses: Pick<Expense, "amount" | "category">[],
  now: Date = new Date(),
  period = cycleBounds(now)
): FinanceSnapshot {
  const { start, end, daysInMonth } = period;
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  const daysPassed = clamp(Math.ceil((Math.min(todayEnd, end) - start + 1) / DAY_MS), 1, daysInMonth);
  const daysRemaining = clamp(Math.ceil((end - Math.max(now.getTime(), start) + 1) / DAY_MS), 1, daysInMonth);

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
    period_start: start,
    period_end: end,
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

export function isFixedBillActiveInPeriod(
  bill: Pick<FixedBill, "is_active" | "installment_start_date" | "installment_end_date">,
  periodStart: number,
  periodEnd: number
): boolean {
  if (!bill.is_active) return false;
  const start = bill.installment_start_date ?? Number.NEGATIVE_INFINITY;
  const end = bill.installment_end_date ?? Number.POSITIVE_INFINITY;
  return start <= periodEnd && end >= periodStart;
}

export function installmentEndDate(startMs: number, installments: number): number {
  const startDate = new Date(startMs);
  const lastMonth = startDate.getMonth() + Math.max(1, installments) - 1;
  return new Date(startDate.getFullYear(), lastMonth + 1, 0, 23, 59, 59, 999).getTime();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function dateAtDay(year: number, month: number, day: number, endOfDay: boolean): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(year, month, safeDay, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
}

function buildPeriod(startDate: Date, endDate: Date): { start: number; end: number; daysInMonth: number } {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const daysInMonth = Math.max(1, Math.ceil((end - start + 1) / DAY_MS));
  return { start, end, daysInMonth };
}

function clampDay(day: number): number {
  return clamp(Number.isFinite(day) ? Math.trunc(day) : 1, 1, 31);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
