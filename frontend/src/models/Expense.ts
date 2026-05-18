export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: number; // epoch ms
  created_at: number;
}

export type ExpenseInput = Omit<Expense, "id" | "user_id" | "created_at">;
