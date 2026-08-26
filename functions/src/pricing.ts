/**
 * Pure plan/pricing logic (no Admin SDK IO), mirrored from
 * frontend/src/services/MonetizationService.ts. Kept separate from
 * index.ts so it can be unit-tested without a Firebase runtime.
 */
import { Timestamp } from "firebase-admin/firestore";

export const FREE_MONTHLY_EXPENSE_LIMIT = 40;
export const FREE_MONTHLY_EXPORT_LIMIT = 2;

export const PRO_MONTHLY_PRICE = 9.9;
export const PRO_ANNUAL_PRICE = 59.45;
export const PRO_ANNUAL_MAX_INSTALLMENTS = 12;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Plan values a user doc may carry. "standard" is legacy-only: never created
 * by a new subscription, but still honored as a paid plan on read. */
export const PAID_PLANS = new Set(["standard", "pro"]);

export type BillingInterval = "monthly" | "annual";

export function isValidInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "annual";
}

export function isValidInstallments(value: unknown, interval: BillingInterval): boolean {
  if (typeof value !== "number" || !Number.isInteger(value)) return false;
  if (interval === "monthly") return value === 1;
  return value >= 1 && value <= PRO_ANNUAL_MAX_INSTALLMENTS;
}

export function subscriptionDurationDays(interval: BillingInterval): number {
  return interval === "annual" ? 365 : 30;
}

export function subscriptionExpiration(now: number, interval: BillingInterval): number {
  return now + subscriptionDurationDays(interval) * DAY_MS;
}

export function subscriptionAmountFor(interval: BillingInterval): number {
  return interval === "annual" ? PRO_ANNUAL_PRICE : PRO_MONTHLY_PRICE;
}

export function toMillis(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "object" && "toMillis" in value && typeof (value as { toMillis: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

export interface UnlimitedUsageProfile {
  plan?: unknown;
  subscriptionStatus?: unknown;
  subscriptionExpiresAt?: unknown;
}

export function hasUnlimitedUsage(profile: UnlimitedUsageProfile): boolean {
  const plan = typeof profile.plan === "string" && PAID_PLANS.has(profile.plan) ? profile.plan : "basic";
  const expiresAt = toMillis(profile.subscriptionExpiresAt);
  const hasNotExpired = expiresAt === null || expiresAt > Date.now();
  return PAID_PLANS.has(plan) && profile.subscriptionStatus === "active" && hasNotExpired;
}
