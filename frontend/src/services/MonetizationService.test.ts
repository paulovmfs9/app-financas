/**
 * Testes da regra de monetização (módulo puro, sem IO).
 * Rode com `npm test` na pasta frontend.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ANNUAL_INSTALLMENT_INTEREST_RATE,
  FREE_MONTHLY_EXPENSE_LIMIT,
  FREE_MONTHLY_EXPORT_LIMIT,
  PLAN_DEFINITIONS,
  PRO_ANNUAL_MAX_INSTALLMENTS,
  PRO_ANNUAL_PRICE,
  PRO_MONTHLY_PRICE,
  annualSavingsPercent,
  findPlan,
  installmentAmount,
  isUnlimitedPlan,
  normalizePlanKey,
  proAnnualInstallmentAmount,
  proAnnualInstallmentTotal,
  proAnnualMonthlyEquivalent,
} from "./MonetizationService";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("limites do plano gratuito", () => {
  it("permite 40 gastos por mês", () => {
    assert.equal(FREE_MONTHLY_EXPENSE_LIMIT, 40);
  });

  it("permite 2 exportações por mês", () => {
    assert.equal(FREE_MONTHLY_EXPORT_LIMIT, 2);
  });
});

describe("preços do Pro", () => {
  it("mantém a mensalidade em R$ 9,90", () => {
    assert.equal(PRO_MONTHLY_PRICE, 9.9);
  });

  it("cobra R$ 59,45 no anual", () => {
    assert.equal(PRO_ANNUAL_PRICE, 59.45);
  });

  it("equivale a R$ 4,95 por mês no anual à vista", () => {
    assert.equal(proAnnualMonthlyEquivalent(), 4.95);
  });

  it("economiza 50% em relação a 12 mensalidades avulsas", () => {
    assert.equal(annualSavingsPercent(), 50);
  });
});

describe("parcelamento do anual (tabela Price)", () => {
  it("repassa 2,99% ao mês", () => {
    assert.equal(ANNUAL_INSTALLMENT_INTEREST_RATE, 0.0299);
  });

  it("oferece até 12 parcelas", () => {
    assert.equal(PRO_ANNUAL_MAX_INSTALLMENTS, 12);
  });

  it("calcula 12x de R$ 5,97 sobre R$ 59,45", () => {
    assert.equal(proAnnualInstallmentAmount(), 5.97);
    assert.equal(installmentAmount(PRO_ANNUAL_PRICE, 12, 0.0299), 5.97);
  });

  it("soma R$ 71,64 no total parcelado", () => {
    assert.equal(proAnnualInstallmentTotal(), 71.64);
  });

  it("cobra a parcela sempre acima do piso de R$ 5,00 do gateway", () => {
    assert.ok(proAnnualInstallmentAmount() >= 5);
  });

  it("não cobra juros em 1x", () => {
    assert.equal(installmentAmount(PRO_ANNUAL_PRICE, 1, 0.0299), 59.45);
  });

  it("divide sem juros quando a taxa é zero", () => {
    assert.equal(installmentAmount(PRO_ANNUAL_PRICE, 12, 0), 4.95);
  });

  it("é sempre mais caro parcelar do que pagar à vista", () => {
    assert.ok(proAnnualInstallmentTotal() > PRO_ANNUAL_PRICE);
  });

  it("mesmo parcelado, sai mais barato que 12 mensalidades avulsas", () => {
    assert.ok(proAnnualInstallmentTotal() < PRO_MONTHLY_PRICE * 12);
  });

  it("trata entradas inválidas sem quebrar", () => {
    assert.equal(installmentAmount(0, 12, 0.0299), 0);
    assert.equal(installmentAmount(-10, 12, 0.0299), 0);
    assert.equal(installmentAmount(Number.NaN, 12, 0.0299), 0);
    assert.equal(installmentAmount(59.45, 0, 0.0299), 59.45);
  });
});

describe("normalizePlanKey", () => {
  it("reconhece o Pro", () => {
    assert.equal(normalizePlanKey("pro"), "pro");
  });

  it("não rebaixa quem assinou como Standard antes da migração", () => {
    assert.equal(normalizePlanKey("standard"), "pro");
  });

  it("trata básico, free, nulo e lixo como básico", () => {
    assert.equal(normalizePlanKey("basic"), "basic");
    assert.equal(normalizePlanKey("free"), "basic");
    assert.equal(normalizePlanKey(null), "basic");
    assert.equal(normalizePlanKey(undefined), "basic");
    assert.equal(normalizePlanKey("qualquer-coisa"), "basic");
  });
});

describe("isUnlimitedPlan", () => {
  const future = Date.now() + 30 * DAY_MS;
  const past = Date.now() - DAY_MS;

  it("nega quando não há perfil", () => {
    assert.equal(isUnlimitedPlan(null), false);
    assert.equal(isUnlimitedPlan(undefined), false);
  });

  it("nega o plano básico", () => {
    assert.equal(isUnlimitedPlan({ plan: "basic", subscriptionStatus: "inactive", subscriptionExpiresAt: null }), false);
  });

  it("libera Pro ativo dentro da validade", () => {
    assert.equal(isUnlimitedPlan({ plan: "pro", subscriptionStatus: "active", subscriptionExpiresAt: future }), true);
  });

  it("libera Pro ativo sem data de expiração", () => {
    assert.equal(isUnlimitedPlan({ plan: "pro", subscriptionStatus: "active", subscriptionExpiresAt: null }), true);
  });

  it("bloqueia Pro com assinatura vencida", () => {
    assert.equal(isUnlimitedPlan({ plan: "pro", subscriptionStatus: "active", subscriptionExpiresAt: past }), false);
  });

  it("bloqueia Pro inativo ou cancelado", () => {
    assert.equal(isUnlimitedPlan({ plan: "pro", subscriptionStatus: "inactive", subscriptionExpiresAt: future }), false);
    assert.equal(isUnlimitedPlan({ plan: "pro", subscriptionStatus: "canceled", subscriptionExpiresAt: future }), false);
  });

  it("continua liberando assinantes legados do Standard", () => {
    assert.equal(isUnlimitedPlan({ plan: "standard", subscriptionStatus: "active", subscriptionExpiresAt: future }), true);
  });

  it("aceita Timestamp-like (Firestore) na expiração", () => {
    assert.equal(isUnlimitedPlan({ plan: "pro", subscriptionStatus: "active", subscriptionExpiresAt: { toMillis: () => future } }), true);
    assert.equal(isUnlimitedPlan({ plan: "pro", subscriptionStatus: "active", subscriptionExpiresAt: { toMillis: () => past } }), false);
  });
});

describe("catálogo de planos", () => {
  it("expõe só Básico e Pro", () => {
    assert.deepEqual(PLAN_DEFINITIONS.map((plan) => plan.key), ["basic", "pro"]);
  });

  it("não oferece mais Standard nem o Pro antigo de R$ 47,90", () => {
    const serialized = JSON.stringify(PLAN_DEFINITIONS);
    assert.ok(!serialized.includes("standard"));
    assert.ok(!serialized.includes("Standard"));
    assert.ok(!serialized.includes("47,90"));
  });

  it("mantém o Básico gratuito e com os limites visíveis", () => {
    const basic = findPlan("basic");
    assert.equal(basic.prices.length, 1);
    assert.equal(basic.prices[0].amount, 0);
    const features = basic.features.join(" ");
    assert.ok(features.includes("40"));
    assert.ok(features.includes("2 exportações"));
  });

  it("oferece o Pro no mensal e no anual", () => {
    const pro = findPlan("pro");
    assert.deepEqual(pro.prices.map((price) => price.interval), ["monthly", "annual"]);
    assert.equal(pro.prices[0].amount, 9.9);
    assert.equal(pro.prices[1].amount, 59.45);
  });

  it("destaca R$ 4,95/mês no anual, que é o que o cliente enxerga primeiro", () => {
    const annual = findPlan("pro").prices[1];
    assert.equal(annual.priceLabel, "R$ 4,95");
    assert.equal(annual.periodLabel, "/mês");
  });

  it("informa a parcela com os juros já embutidos", () => {
    const annual = findPlan("pro").prices[1];
    assert.ok(annual.installmentLabel?.includes("12x"));
    assert.ok(annual.installmentLabel?.includes("5,97"));
    assert.ok(annual.installmentNote?.includes("2,99"));
  });

  it("destaca o Pro como plano recomendado", () => {
    assert.equal(findPlan("pro").highlighted, true);
    assert.equal(findPlan("basic").highlighted, undefined);
  });
});
