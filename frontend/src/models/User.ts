/** Domain models (pure TypeScript types). */

export type ThemePref = "light" | "dark" | "system";
/** "standard" is legacy-only: no new subscription is created with it, but
 * pre-restructure paying users may still carry it (see normalizePlanKey). */
export type UserPlan = "basic" | "standard" | "pro" | "free";
export type SubscriptionStatus = "inactive" | "active" | "canceled";
export type SubscriptionProvider = "web" | "mercadopago" | "stripe" | "apple" | "google" | "revenuecat" | null;
export type SubscriptionInterval = "monthly" | "annual" | null;

export interface User {
  uid: string;
  email: string;
  name: string;
  monthly_salary: number;
  fixed_bills_total: number;
  budget_cycle_start_day: number;
  budget_cycle_end_day: number;
  theme: ThemePref;
  onboarded: boolean;
  created_at: number; // epoch ms
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionProvider: SubscriptionProvider;
  subscriptionPrice: number;
  subscriptionCurrency: "BRL";
  subscriptionInterval: SubscriptionInterval;
  subscriptionExpiresAt: number | { toMillis?: () => number } | null;
  updatedAt: number | { toMillis?: () => number };
}

export const subscriptionDefaults = () => ({
  plan: "basic" as UserPlan,
  subscriptionStatus: "inactive" as SubscriptionStatus,
  subscriptionProvider: null as SubscriptionProvider,
  subscriptionPrice: 9.9,
  subscriptionCurrency: "BRL" as const,
  subscriptionInterval: null as SubscriptionInterval,
  subscriptionExpiresAt: null,
  updatedAt: Date.now(),
});

export const normalizeUser = (user: Partial<User> & Pick<User, "uid" | "email" | "name">): User => ({
  monthly_salary: 0,
  fixed_bills_total: 0,
  budget_cycle_start_day: 1,
  budget_cycle_end_day: 31,
  theme: "system",
  onboarded: false,
  created_at: Date.now(),
  ...subscriptionDefaults(),
  ...user,
  plan: user.plan ?? "basic",
  subscriptionStatus: user.subscriptionStatus ?? "inactive",
  subscriptionProvider: user.subscriptionProvider ?? null,
  subscriptionPrice: user.subscriptionPrice ?? 9.9,
  subscriptionCurrency: user.subscriptionCurrency ?? "BRL",
  subscriptionInterval: user.subscriptionInterval ?? null,
  subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
  updatedAt: user.updatedAt ?? Date.now(),
});

export const emptyUser = (uid: string, email: string, name: string): User =>
  normalizeUser({
    uid,
    email,
    name,
    created_at: Date.now(),
  });
