/**
 * AuthProvider: exposes the current Firebase user + Firestore profile.
 * Handles login/register/sign-out + profile updates.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { AuthService } from "../services/AuthService";
import { UserRepository } from "../repositories/UserRepository";
import type { User } from "../models/User";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthCtx {
  status: Status;
  firebaseUser: FirebaseUser | null;
  profile: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [firebaseUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    const unsub = AuthService.subscribe(async (u) => {
      setFbUser(u);
      if (!u) {
        setProfile(null);
        setStatus("unauthenticated");
        return;
      }
      try {
        const p = await UserRepository.ensure(u.uid, u.email || "", u.displayName || "");
        setProfile(p);
        setStatus("authenticated");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[AuthProvider] failed to load profile:", err);
        await AuthService.signOut();
        setFbUser(null);
        setProfile(null);
        setStatus("unauthenticated");
      }
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await AuthService.login(email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const u = await AuthService.register(email, password, name);
    await UserRepository.ensure(u.uid, u.email || email, name);
  }, []);

  const signOut = useCallback(async () => {
    await AuthService.signOut();
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<User>) => {
      if (!firebaseUser) return;
      await UserRepository.update(firebaseUser.uid, patch);
      if (typeof patch.name === "string") {
        await AuthService.updateDisplayName(firebaseUser, patch.name);
      }
      setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    },
    [firebaseUser]
  );

  return (
    <Ctx.Provider value={{ status, firebaseUser, profile, signIn, signUp, signOut, updateProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
