import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import * as crypto from "crypto";

initializeApp();

const db = getFirestore();
const FREE_MONTHLY_EXPENSE_LIMIT = 30;
const FREE_MONTHLY_EXPORT_LIMIT = 5;
const STANDARD_MONTHLY_PRICE = 9.9;
const SUBSCRIPTION_DAYS = 30;
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
const VALID_EXPORT_FORMATS = new Set(["pdf", "png", "csv", "xlsx", "docx"]);
const PAID_PLANS = new Set(["standard", "pro"]);

interface AddExpensePayload {
  amount?: unknown;
  category?: unknown;
  description?: unknown;
  date?: unknown;
}

interface DeleteExpensePayload {
  expenseId?: unknown;
}

interface RegisterExportPayload {
  format?: unknown;
  month?: unknown;
}

interface InitSubscriptionPayload {
  plan?: unknown;
  provider?: unknown;
}

interface UserProfile {
  plan?: unknown;
  subscriptionStatus?: unknown;
  subscriptionProvider?: unknown;
  subscriptionExpiresAt?: unknown;
  budget_cycle_start_day?: unknown;
  budget_cycle_end_day?: unknown;
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

function validateExpenseId(data: DeleteExpensePayload): string {
  if (typeof data.expenseId !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(data.expenseId)) {
    throw new HttpsError("invalid-argument", "Gasto inválido.");
  }
  return data.expenseId;
}

function validateExportPayload(data: RegisterExportPayload) {
  if (typeof data.format !== "string" || !VALID_EXPORT_FORMATS.has(data.format)) {
    throw new HttpsError("invalid-argument", "Formato inválido.");
  }

  const sourceMonth = typeof data.month === "string" ? data.month : monthKey(Date.now());
  if (!/^\d{4}-\d{2}$/.test(sourceMonth)) {
    throw new HttpsError("invalid-argument", "Mês inválido.");
  }

  return {
    format: data.format,
    month: sourceMonth,
  };
}

function validateSubscriptionPayload(data: InitSubscriptionPayload) {
  const plan = data.plan === "pro" ? "pro" : data.plan === "standard" ? "standard" : null;
  if (!plan) {
    throw new HttpsError("invalid-argument", "Plano inválido.");
  }

  const provider = typeof data.provider === "string" && data.provider.trim() ? data.provider.trim() : "manual";
  if (!["manual", "mercadopago", "stripe", "apple", "google", "revenuecat"].includes(provider)) {
    throw new HttpsError("invalid-argument", "Provedor inválido.");
  }

  return { plan, provider };
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

function hasUnlimitedUsage(profile: UserProfile): boolean {
  const plan = typeof profile.plan === "string" && PAID_PLANS.has(profile.plan) ? profile.plan : "basic";
  const expiresAt = toMillis(profile.subscriptionExpiresAt);
  const hasNotExpired = expiresAt === null || expiresAt > Date.now();
  return PAID_PLANS.has(plan) && profile.subscriptionStatus === "active" && hasNotExpired;
}

function monthKey(dateMs: number): string {
  const date = new Date(dateMs);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function cycleBounds(dateMs: number, profile: UserProfile): { start: number; end: number } {
  const date = new Date(dateMs);
  const startDay = profileDay(profile.budget_cycle_start_day, 1);
  const endDay = profileDay(profile.budget_cycle_end_day, 31);
  const year = date.getFullYear();
  const month = date.getMonth();

  if (startDay <= endDay) {
    return {
      start: dateAtDay(year, month, startDay, false).getTime(),
      end: dateAtDay(year, month, endDay, true).getTime(),
    };
  }

  const startMonth = date.getDate() >= startDay ? month : month - 1;
  const endMonth = date.getDate() >= startDay ? month + 1 : month;
  return {
    start: dateAtDay(year, startMonth, startDay, false).getTime(),
    end: dateAtDay(year, endMonth, endDay, true).getTime(),
  };
}

function cycleKey(bounds: { start: number }): string {
  const date = new Date(bounds.start);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function profileDay(value: unknown, fallback: number): number {
  const day = typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
  return Math.min(31, Math.max(1, day));
}

function dateAtDay(year: number, month: number, day: number, endOfDay: boolean): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(year, month, safeDay, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
}

function assertWebhookSecret(request: Parameters<Parameters<typeof onRequest>[0]>[0]) {
  const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!configuredSecret) {
    throw new Error("payment-webhook-secret-not-configured");
  }

  const received = request.header("x-saldo-signature") || "";
  const rawBody = request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));
  const expected = crypto.createHmac("sha256", configuredSecret).update(rawBody).digest("hex");
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
    throw new Error("invalid-payment-webhook-signature");
  }
}

function subscriptionExpiration(now: number): number {
  return now + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000;
}

export const addExpense = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Não autenticado.");
  }

  const expense = validateExpensePayload((request.data ?? {}) as AddExpensePayload);
  const userRef = db.doc(`users/${uid}`);
  const expenseRef = userRef.collection("expenses").doc();
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("failed-precondition", "Perfil não encontrado.");
    }

    const profile = userSnap.data() as UserProfile;
    const unlimited = hasUnlimitedUsage(profile);
    const cycle = cycleBounds(expense.date, profile);
    const usageRef = userRef.collection("usage").doc(cycleKey(cycle));
    const usageSnap = await transaction.get(usageRef);
    let currentCount = Number(usageSnap.get("expenseCount") ?? 0);

    if (!usageSnap.exists) {
      const existingExpenses = await transaction.get(
        userRef.collection("expenses").where("date", ">=", cycle.start).where("date", "<=", cycle.end)
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
        periodStart: cycle.start,
        periodEnd: cycle.end,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  return { id: expenseRef.id };
});

export const deleteExpense = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Não autenticado.");
  }

  const expenseId = validateExpenseId((request.data ?? {}) as DeleteExpensePayload);
  const userRef = db.doc(`users/${uid}`);
  const expenseRef = userRef.collection("expenses").doc(expenseId);

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("failed-precondition", "Perfil não encontrado.");
    }

    const expenseSnap = await transaction.get(expenseRef);
    if (!expenseSnap.exists) {
      throw new HttpsError("not-found", "Gasto não encontrado.");
    }

    const data = expenseSnap.data();
    if (!data || data.user_id !== uid) {
      throw new HttpsError("permission-denied", "Gasto inválido.");
    }

    const dateMs = typeof data.date === "number" ? data.date : Date.now();
    const cycle = cycleBounds(dateMs, userSnap.data() as UserProfile);
    const usageRef = userRef.collection("usage").doc(cycleKey(cycle));
    const usageSnap = await transaction.get(usageRef);
    let currentCount = Number(usageSnap.get("expenseCount") ?? 0);

    if (!usageSnap.exists) {
      const existingExpenses = await transaction.get(
        userRef.collection("expenses").where("date", ">=", cycle.start).where("date", "<=", cycle.end)
      );
      currentCount = existingExpenses.size;
    }

    transaction.delete(expenseRef);
    transaction.set(
      usageRef,
      {
        expenseCount: Math.max(0, currentCount - 1),
        periodStart: cycle.start,
        periodEnd: cycle.end,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  });

  return { ok: true };
});

export const registerExport = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Não autenticado.");
  }

  const payload = validateExportPayload((request.data ?? {}) as RegisterExportPayload);
  const userRef = db.doc(`users/${uid}`);
  const usageRef = userRef.collection("usage").doc(payload.month);
  const exportRef = userRef.collection("exports").doc();
  const now = Date.now();
  let exportCount = 0;
  let limit: number | null = FREE_MONTHLY_EXPORT_LIMIT;
  let unlimited = false;

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("failed-precondition", "Perfil não encontrado.");
    }

    unlimited = hasUnlimitedUsage(userSnap.data() as UserProfile);
    limit = unlimited ? null : FREE_MONTHLY_EXPORT_LIMIT;
    const usageSnap = await transaction.get(usageRef);
    const currentCount = Number(usageSnap.get("exportCount") ?? 0);

    if (!unlimited && currentCount >= FREE_MONTHLY_EXPORT_LIMIT) {
      throw new HttpsError("resource-exhausted", "Limite mensal de exportações do Plano Básico atingido.");
    }

    exportCount = currentCount + 1;
    transaction.set(exportRef, {
      user_id: uid,
      format: payload.format,
      month: payload.month,
      created_at: now,
    });
    transaction.set(
      usageRef,
      {
        exportCount,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  return { exportCount, limit, unlimited };
});

export const initSubscriptionPayment = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Não autenticado.");
  }

  const payload = validateSubscriptionPayload((request.data ?? {}) as InitSubscriptionPayload);
  const now = Date.now();
  const paymentRef = db.collection("paymentIntents").doc();
  const checkoutUrl = process.env.STANDARD_CHECKOUT_URL || null;

  await paymentRef.set({
    uid,
    plan: payload.plan,
    provider: payload.provider,
    status: checkoutUrl ? "pending" : "configuration_required",
    amount: payload.plan === "standard" ? STANDARD_MONTHLY_PRICE : 47.9,
    currency: "BRL",
    checkoutUrl,
    createdAt: now,
    updatedAt: now,
  });

  return {
    paymentId: paymentRef.id,
    provider: payload.provider,
    checkoutUrl,
    status: checkoutUrl ? "pending" : "configuration_required",
  };
});

export const paymentWebhook = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false });
    return;
  }

  try {
    assertWebhookSecret(request);
    const body = request.body ?? {};
    const paymentId = typeof body.paymentId === "string" ? body.paymentId : null;
    const status = typeof body.status === "string" ? body.status : null;
    const externalId = typeof body.externalId === "string" ? body.externalId : null;

    if (!paymentId || !["paid", "canceled", "failed"].includes(status ?? "")) {
      response.status(400).json({ ok: false });
      return;
    }

    const paymentRef = db.collection("paymentIntents").doc(paymentId);
    await db.runTransaction(async (transaction) => {
      const paymentSnap = await transaction.get(paymentRef);
      if (!paymentSnap.exists) {
        throw new Error("payment-not-found");
      }

      const payment = paymentSnap.data() ?? {};
      const uid = typeof payment.uid === "string" ? payment.uid : null;
      const plan = typeof payment.plan === "string" && PAID_PLANS.has(payment.plan) ? payment.plan : null;
      if (!uid || !plan) {
        throw new Error("invalid-payment");
      }

      const now = Date.now();
      transaction.set(
        paymentRef,
        {
          status,
          externalId,
          updatedAt: now,
          processedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (status === "paid") {
        transaction.set(
          db.doc(`users/${uid}`),
          {
            plan,
            subscriptionStatus: "active",
            subscriptionProvider: payment.provider ?? "manual",
            subscriptionPrice: payment.amount ?? STANDARD_MONTHLY_PRICE,
            subscriptionCurrency: "BRL",
            subscriptionExpiresAt: subscriptionExpiration(now),
            updatedAt: now,
          },
          { merge: true }
        );
      }
    });

    response.status(200).json({ ok: true });
  } catch {
    response.status(401).json({ ok: false });
  }
});
