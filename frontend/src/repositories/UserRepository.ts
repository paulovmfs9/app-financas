/**
 * UserRepository: Firestore CRUD for the `users` collection.
 * Each user doc is keyed by Firebase Auth UID.
 */
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase.config";
import { emptyUser, normalizeUser, subscriptionDefaults, User } from "../models/User";

const COL = "users";

function missingDefaultFields(data: Partial<User>): boolean {
  return (
    data.plan === undefined ||
    data.subscriptionStatus === undefined ||
    data.subscriptionProvider === undefined ||
    data.subscriptionPrice === undefined ||
    data.subscriptionCurrency === undefined ||
    data.subscriptionExpiresAt === undefined ||
    data.updatedAt === undefined ||
    data.budget_cycle_start_day === undefined ||
    data.budget_cycle_end_day === undefined
  );
}

function defaultBackfill(data: Partial<User>) {
  const subscription = subscriptionDefaults();
  return {
    plan: data.plan ?? subscription.plan,
    subscriptionStatus: data.subscriptionStatus ?? subscription.subscriptionStatus,
    subscriptionProvider: data.subscriptionProvider ?? subscription.subscriptionProvider,
    subscriptionPrice: data.subscriptionPrice ?? subscription.subscriptionPrice,
    subscriptionCurrency: data.subscriptionCurrency ?? subscription.subscriptionCurrency,
    subscriptionExpiresAt: data.subscriptionExpiresAt ?? subscription.subscriptionExpiresAt,
    budget_cycle_start_day: data.budget_cycle_start_day ?? 1,
    budget_cycle_end_day: data.budget_cycle_end_day ?? 31,
    updatedAt: Date.now(),
  };
}

export const UserRepository = {
  async get(uid: string): Promise<User | null> {
    const ref = doc(db, COL, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return normalizeUser(snap.data() as User);
  },

  /** Creates the user document if it doesn't exist and backfills defaults for older users. */
  async ensure(uid: string, email: string, name: string): Promise<User> {
    const ref = doc(db, COL, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as User;
      const user = normalizeUser(data);
      if (missingDefaultFields(data)) {
        try {
          await setDoc(ref, defaultBackfill(data), { merge: true });
        } catch (err) {
          console.warn("[UserRepository] failed to backfill profile defaults:", err);
        }
      }
      return user;
    }

    const user = emptyUser(uid, email, name);
    await setDoc(ref, user, { merge: true });
    return user;
  },

  async update(uid: string, patch: Partial<User>): Promise<void> {
    await updateDoc(doc(db, COL, uid), { ...patch, updatedAt: Date.now() } as any);
  },
};
