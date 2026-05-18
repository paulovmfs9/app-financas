/**
 * ExpenseRepository: Firestore CRUD for `users/{uid}/expenses` subcollection.
 * We use a subcollection so each user only sees their own data (security rules
 * can simply check `request.auth.uid == uid`).
 */
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../config/firebase.config";
import type { Expense, ExpenseInput } from "../models/Expense";

function colRef(uid: string) {
  return collection(db, "users", uid, "expenses");
}

export const ExpenseRepository = {
  async create(uid: string, input: ExpenseInput): Promise<string> {
    const docRef = await addDoc(colRef(uid), {
      ...input,
      user_id: uid,
      created_at: Date.now(),
    });
    return docRef.id;
  },

  async remove(uid: string, expenseId: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid, "expenses", expenseId));
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
