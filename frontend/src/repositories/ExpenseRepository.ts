/**
 * ExpenseRepository: Firestore read/delete for `users/{uid}/expenses` and
 * secure expense creation through the `addExpense` Cloud Function.
 */
import {
  collection,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../config/firebase.config";
import type { Expense, ExpenseInput } from "../models/Expense";

function colRef(uid: string) {
  return collection(db, "users", uid, "expenses");
}

interface AddExpenseResult {
  id: string;
}

export const ExpenseRepository = {
  async create(_uid: string, input: ExpenseInput): Promise<string> {
    const addExpense = httpsCallable<ExpenseInput, AddExpenseResult>(functions, "addExpense");
    const result = await addExpense(input);
    return result.data.id;
  },

  async remove(uid: string, expenseId: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid, "expenses", expenseId));
  },

  async countMonth(uid: string, startMs: number, endMs: number): Promise<number> {
    const q = query(
      colRef(uid),
      where("date", ">=", startMs),
      where("date", "<=", endMs)
    );
    const snap = await getDocs(q);
    return snap.size;
  },

  /**
   * Live subscription to a month's expenses (ordered by date desc).
   * Returns an unsubscribe function.
   */
  subscribeMonth(
    uid: string,
    startMs: number,
    endMs: number,
    cb: (expenses: Expense[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    const q = query(
      colRef(uid),
      where("date", ">=", startMs),
      where("date", "<=", endMs),
      orderBy("date", "desc")
    );
    return onSnapshot(
      q,
      (snap) => {
        const items: Expense[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        cb(items);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn("[ExpenseRepository] subscribeMonth error:", err.message);
        if (onError) onError(err);
      }
    );
  },
};
