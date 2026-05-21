/**
 * UserRepository: Firestore CRUD for the `users` collection.
 * Each user doc is keyed by Firebase Auth UID.
 */
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase.config";
import { emptyUser, normalizeUser, subscriptionDefaults, User } from "../models/User";

const COL = "users";

function missingSubscriptionFields(data: Partial<User>): boolean {
  return (
    data.plan === undefined ||
    data.subscriptionStatus === undefined ||
    data.subscriptionProvider === undefined ||
    data.subscriptionPrice === undefined ||
    data.subscriptionCurrency === undefined ||
    data.subscriptionExpiresAt === undefined ||
    data.updatedAt === undefined
  );
}

export const UserRepository = {
  async get(uid: string): Promise<User | null> {
    const ref = doc(db, COL, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return normalizeUser(snap.data() as User);
  },

  /** Creates the user document if it doesn't exist and backfills plan fields for older users. */
  async ensure(uid: string, email: string, name: string): Promise<User> {
    const ref = doc(db, COL, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as User;
      const user = normalizeUser(data);
      if (missingSubscriptionFields(data)) {
        await setDoc(ref, { ...subscriptionDefaults(), updatedAt: Date.now() }, { merge: true });
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
