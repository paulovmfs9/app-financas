/**
 * UserRepository: Firestore CRUD for the `users` collection.
 * Each user doc is keyed by Firebase Auth UID.
 */
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase.config";
import { emptyUser, User } from "../models/User";

const COL = "users";

export const UserRepository = {
  async get(uid: string): Promise<User | null> {
    const ref = doc(db, COL, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as User;
  },

  /** Creates the user document if it doesn't exist. Idempotent. */
  async ensure(uid: string, email: string, name: string): Promise<User> {
    const existing = await this.get(uid);
    if (existing) return existing;
    const user = emptyUser(uid, email, name);
    await setDoc(doc(db, COL, uid), user, { merge: true });
    return user;
  },

  async update(uid: string, patch: Partial<User>): Promise<void> {
    await updateDoc(doc(db, COL, uid), patch as any);
  },
};
