/**
 * AuthService: thin wrapper around Firebase Auth.
 * Repositories and providers consume this; screens do not call Firebase directly.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../config/firebase.config";

export const AuthService = {
  /** Subscribe to auth state. Returns the unsubscribe function. */
  subscribe(cb: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, cb);
  },

  async register(email: string, password: string, name: string): Promise<FirebaseUser> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name && name.trim()) {
      try {
        await updateProfile(cred.user, { displayName: name.trim() });
      } catch {
        // non-fatal
      }
    }
    return cred.user;
  },

  async login(email: string, password: string): Promise<FirebaseUser> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  },

  async signOut(): Promise<void> {
    await fbSignOut(auth);
  },

  current(): FirebaseUser | null {
    return auth.currentUser;
  },
};

/** Maps Firebase Auth error codes to friendly pt-BR messages. */
export function friendlyAuthError(err: any): string {
  const code: string = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Email inválido.";
    case "auth/email-already-in-use":
      return "Este email já está cadastrado.";
    case "auth/weak-password":
      return "Senha muito fraca. Use pelo menos 6 caracteres.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente em alguns minutos.";
    case "auth/network-request-failed":
      return "Sem conexão. Verifique sua internet.";
    default:
      return err?.message || "Algo deu errado. Tente novamente.";
  }
}
