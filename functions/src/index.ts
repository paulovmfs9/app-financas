import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const db = getFirestore();
const FREE_MONTHLY_EXPENSE_LIMIT = 30;
const VALID_CATEGORIES = new Set([
  "alimentacao",
  "transporte",
  "moradia",
  "lazer",
  "saude",
  "compras",
  "educacao",
  "assinatura",
  "outros",
]);

interface AddExpensePayload {
  amount?: unknown;
  category?: unknown;
  description?: unknown;
  date?: unknown;
}

interface UserProfile {
  plan?: unknown;
  subscriptionStatus?: unknown;
  subscriptionExpiresAt?: unknown;
}

function validateExpensePayload(data: AddExpensePayload) {
  const amount = typeof data.amount === "number" ? data.amount : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpsError("invalid-argument", "Valor inválido.");
  }

  if (typeof data.category !== "string" || !VALID_CATEGORIES.has(data.category)) {
    throw new HttpsError("invalid-argument", "Categoria inválida.");
  }

  if (typeof data.description !== "string") {
    throw new HttpsError("invalid-argument", "Descrição inválida.");
  }

  const description = data.description.trim();
  if (description.length > 240) {
    throw new HttpsError("invalid-argument", "Descrição muito longa.");
  }

  const date = typeof data.date === "number" ? data.date : Number.NaN;
  if (!Number.isFinite(date) || date <= 0) {
    throw new HttpsError("invalid-argument", "Data inválida.");
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new HttpsError("invalid-argument", "Data inválida.");
  }

  return {
    amount,
    category: data.category,
    description,
    date,
  };
}

function toMillis(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  return null;
}

function hasUnlimitedExpenses(profile: UserProfile): boolean {
  const plan = profile.plan === "pro" ? "pro" : profile.plan === "standard" ? "standard" : "basic";
  const expiresAt = toMillis(profile.subscriptionExpiresAt);
  const hasNotExpired = expiresAt === null || expiresAt > Date.now();
  return (plan === "standard" || plan === "pro") && profile.subscriptionStatus === "active" && hasNotExpired;
}

function monthKey(dateMs: number): string {
  const date = new Date(dateMs);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(dateMs: number): { start: number; end: number } {
  const date = new Date(dateMs);
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0).getTime();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

export const addExpense = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Não autenticado.");
  }

  const expense = validateExpensePayload((request.data ?? {}) as AddExpensePayload);
  const userRef = db.doc(`users/${uid}`);
  const usageRef = userRef.collection("usage").doc(monthKey(expense.date));
  const expenseRef = userRef.collection("expenses").doc();
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("failed-precondition", "Perfil não encontrado.");
    }

    const profile = userSnap.data() as UserProfile;
    const unlimited = hasUnlimitedExpenses(profile);
    const usageSnap = await transaction.get(usageRef);
    let currentCount = Number(usageSnap.get("expenseCount") ?? 0);

    if (!usageSnap.exists) {
      const { start, end } = monthBounds(expense.date);
      const existingExpenses = await transaction.get(
        userRef.collection("expenses").where("date", ">=", start).where("date", "<=", end)
      );
      currentCount = existingExpenses.size;
    }

    if (!unlimited && currentCount >= FREE_MONTHLY_EXPENSE_LIMIT) {
      throw new HttpsError("resource-exhausted", "Limite mensal do Plano Básico atingido.");
    }

    transaction.set(expenseRef, {
      user_id: uid,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
      created_at: now,
    });

    transaction.set(
      usageRef,
      {
        expenseCount: currentCount + 1,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  return { id: expenseRef.id };
});
