/**
 * Testes da lógica de planos/preços do backend (módulo puro).
 * Rode com `npm test` na pasta functions.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Timestamp } from "firebase-admin/firestore";

import {
  FREE_MONTHLY_EXPENSE_LIMIT,
  FREE_MONTHLY_EXPORT_LIMIT,
  PRO_ANNUAL_MAX_INSTALLMENTS,
  PRO_ANNUAL_PRICE,
  PRO_MONTHLY_PRICE,
  hasUnlimitedUsage,
  isValidInstallments,
  isValidInterval,
  subscriptionAmountFor,
  subscriptionDurationDays,
  subscriptionExpiration,
} from "./pricing";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("limites do plano gratuito", () => {
  it("permite 40 gastos e 2 exportações por mês", () => {
    assert.equal(FREE_MONTHLY_EXPENSE_LIMIT, 40);
    assert.equal(FREE_MONTHLY_EXPORT_LIMIT, 2);
  });
});

describe("isValidInterval", () => {
  it("aceita monthly e annual", () => {
    assert.equal(isValidInterval("monthly"), true);
    assert.equal(isValidInterval("annual"), true);
  });

  it("rejeita qualquer outro valor", () => {
    assert.equal(isValidInterval("standard"), false);
    assert.equal(isValidInterval(""), false);
    assert.equal(isValidInterval(null), false);
    assert.equal(isValidInterval(undefined), false);
    assert.equal(isValidInterval(12), false);
  });
});

describe("isValidInstallments", () => {
  it("mensal só aceita 1 parcela", () => {
    assert.equal(isValidInstallments(1, "monthly"), true);
    assert.equal(isValidInstallments(2, "monthly"), false);
    assert.equal(isValidInstallments(0, "monthly"), false);
  });

  it("anual aceita de 1 a 12 parcelas", () => {
    assert.equal(isValidInstallments(1, "annual"), true);
    assert.equal(isValidInstallments(12, "annual"), true);
    assert.equal(isValidInstallments(6, "annual"), true);
  });

  it("anual rejeita fora do intervalo ou não inteiro", () => {
    assert.equal(isValidInstallments(0, "annual"), false);
    assert.equal(isValidInstallments(13, "annual"), false);
    assert.equal(isValidInstallments(-1, "annual"), false);
    assert.equal(isValidInstallments(1.5, "annual"), false);
    assert.equal(isValidInstallments("12", "annual"), false);
    assert.equal(isValidInstallments(Number.NaN, "annual"), false);
  });
});

describe("duração e expiração da assinatura", () => {
  it("mensal dura 30 dias", () => {
    assert.equal(subscriptionDurationDays("monthly"), 30);
  });

  it("anual dura 365 dias", () => {
    assert.equal(subscriptionDurationDays("annual"), 365);
  });

  it("calcula a expiração a partir de agora", () => {
    const now = 1_700_000_000_000;
    assert.equal(subscriptionExpiration(now, "monthly"), now + 30 * DAY_MS);
    assert.equal(subscriptionExpiration(now, "annual"), now + 365 * DAY_MS);
  });
});

describe("preço cobrado por intervalo", () => {
  it("mensal cobra R$ 9,90", () => {
    assert.equal(subscriptionAmountFor("monthly"), PRO_MONTHLY_PRICE);
  });

  it("anual cobra R$ 59,45", () => {
    assert.equal(subscriptionAmountFor("annual"), PRO_ANNUAL_PRICE);
  });

  it("o anual permite até 12 parcelas", () => {
    assert.equal(PRO_ANNUAL_MAX_INSTALLMENTS, 12);
  });
});

describe("hasUnlimitedUsage", () => {
  const future = Date.now() + 30 * DAY_MS;
  const past = Date.now() - DAY_MS;

  it("nega o plano básico", () => {
    assert.equal(hasUnlimitedUsage({ plan: "basic", subscriptionStatus: "inactive", subscriptionExpiresAt: null }), false);
  });

  it("libera pro ativo e válido", () => {
    assert.equal(hasUnlimitedUsage({ plan: "pro", subscriptionStatus: "active", subscriptionExpiresAt: future }), true);
  });

  it("continua liberando assinantes legados do standard", () => {
    assert.equal(hasUnlimitedUsage({ plan: "standard", subscriptionStatus: "active", subscriptionExpiresAt: future }), true);
  });

  it("bloqueia assinatura vencida", () => {
    assert.equal(hasUnlimitedUsage({ plan: "pro", subscriptionStatus: "active", subscriptionExpiresAt: past }), false);
  });

  it("bloqueia plano pago mas não ativo", () => {
    assert.equal(hasUnlimitedUsage({ plan: "pro", subscriptionStatus: "canceled", subscriptionExpiresAt: future }), false);
  });

  it("aceita Timestamp do Firestore na expiração", () => {
    const futureTs = Timestamp.fromMillis(future);
    const pastTs = Timestamp.fromMillis(past);
    assert.equal(hasUnlimitedUsage({ plan: "pro", subscriptionStatus: "active", subscriptionExpiresAt: futureTs }), true);
    assert.equal(hasUnlimitedUsage({ plan: "pro", subscriptionStatus: "active", subscriptionExpiresAt: pastTs }), false);
  });

  it("trata plano desconhecido como básico", () => {
    assert.equal(hasUnlimitedUsage({ plan: "lixo", subscriptionStatus: "active", subscriptionExpiresAt: future }), false);
  });
});
