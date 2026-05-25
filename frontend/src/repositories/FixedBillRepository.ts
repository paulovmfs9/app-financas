import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../config/firebase.config";
import type { FixedBill, FixedBillInput } from "../models/FixedBill";

function colRef(uid: string) {
  return collection(db, "users", uid, "fixedBills");
}

export const FixedBillRepository = {
  async create(uid: string, input: FixedBillInput): Promise<string> {
    const now = Date.now();
    const docRef = await addDoc(colRef(uid), {
      ...input,
      user_id: uid,
      created_at: now,
      updated_at: now,
    });
    return docRef.id;
  },

  async remove(uid: string, fixedBillId: string): Promise<void> {
    await deleteDoc(doc(db, "users", uid, "fixedBills", fixedBillId));
  },

  subscribeAll(
    uid: string,
    cb: (fixedBills: FixedBill[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    const q = query(colRef(uid), orderBy("due_day", "asc"));
    return onSnapshot(
      q,
      (snap) => {
        const items: FixedBill[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .sort((a, b) => a.due_day - b.due_day || a.name.localeCompare(b.name));
        cb(items);
      },
      (err) => {
        console.warn("[FixedBillRepository] subscribeAll error:", err.message);
        if (onError) onError(err);
      }
    );
  },
};
