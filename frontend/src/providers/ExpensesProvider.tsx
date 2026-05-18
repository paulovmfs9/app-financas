/**
 * ExpensesProvider: subscribes to the current month's expenses from Firestore
 * and exposes both the raw list and the computed finance snapshot (saldo,
 * média diária, projeção, alerta, etc).
 */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { Expense, ExpenseInput } from "../models/Expense";
import { ExpenseRepository } from "../repositories/ExpenseRepository";
import { useAuth } from "./AuthProvider";
import { computeSnapshot, monthBounds, FinanceSnapshot } from "../utils/finance";

interface ExpensesCtx {
  loading: boolean;
  expenses: Expense[];
  snapshot: FinanceSnapshot;
  addExpense: (input: ExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const Ctx = createContext<ExpensesCtx | null>(null);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { start, end } = monthBounds();
    const unsub = ExpenseRepository.subscribeMonth(
      firebaseUser.uid,
      start,
      end,
      (items) => {
        setExpenses(items);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [firebaseUser]);

  const snapshot = useMemo<FinanceSnapshot>(() => {
    const salary = profile?.monthly_salary ?? 0;
    const bills = profile?.fixed_bills_total ?? 0;
    return computeSnapshot(salary, bills, expenses);
  }, [expenses, profile?.monthly_salary, profile?.fixed_bills_total]);

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      if (!firebaseUser) throw new Error("Não autenticado");
      await ExpenseRepository.create(firebaseUser.uid, input);
      // Live snapshot will update automatically via onSnapshot.
    },
    [firebaseUser]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!firebaseUser) throw new Error("Não autenticado");
      await ExpenseRepository.remove(firebaseUser.uid, id);
    },
    [firebaseUser]
  );

  return (
    <Ctx.Provider value={{ loading, expenses, snapshot, addExpense, deleteExpense }}>
      {children}
    </Ctx.Provider>
  );
}

export function useExpenses(): ExpensesCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useExpenses must be used within ExpensesProvider");
  return v;
}
