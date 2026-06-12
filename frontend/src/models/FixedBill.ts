export interface FixedBill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  is_active: boolean;
  installment_count?: number;
  installment_start_date?: number;
  installment_end_date?: number;
  created_at: number;
  updated_at: number;
}

export type FixedBillInput = Omit<FixedBill, "id" | "user_id" | "created_at" | "updated_at">;
