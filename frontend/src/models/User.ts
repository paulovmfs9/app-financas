/** Domain models (pure TypeScript types). */

export type ThemePref = "light" | "dark" | "system";

export interface User {
  uid: string;
  email: string;
  name: string;
  monthly_salary: number;
  fixed_bills_total: number;
  theme: ThemePref;
  onboarded: boolean;
  created_at: number; // epoch ms
}

export const emptyUser = (uid: string, email: string, name: string): User => ({
  uid,
  email,
  name,
  monthly_salary: 0,
  fixed_bills_total: 0,
  theme: "system",
  onboarded: false,
  created_at: Date.now(),
});
