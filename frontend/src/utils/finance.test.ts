import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { cycleBounds, percentChange, previousCycleBounds } from "./finance";

describe("previousCycleBounds", () => {
  it("retorna o ciclo imediatamente anterior (ciclo calendário, dia 1 a 31)", () => {
    const current = cycleBounds(new Date(2026, 7, 15), 1, 31);
    const previous = previousCycleBounds(current.start, 1, 31);
    const expected = cycleBounds(new Date(2026, 6, 15), 1, 31);
    assert.equal(previous.start, expected.start);
    assert.equal(previous.end, expected.end);
  });

  it("retorna o ciclo anterior para ciclos com dia de início/fim customizado (ex: 5 a 4)", () => {
    const current = cycleBounds(new Date(2026, 7, 10), 5, 4);
    const previous = previousCycleBounds(current.start, 5, 4);
    const expected = cycleBounds(new Date(2026, 6, 10), 5, 4);
    assert.equal(previous.start, expected.start);
    assert.equal(previous.end, expected.end);
  });

  it("o ciclo anterior sempre termina antes do início do ciclo atual", () => {
    const current = cycleBounds(new Date(2026, 7, 15), 1, 31);
    const previous = previousCycleBounds(current.start, 1, 31);
    assert.equal(previous.end < current.start, true);
  });
});

describe("percentChange", () => {
  it("calcula a variação percentual quando há gasto no ciclo anterior", () => {
    assert.equal(percentChange(112, 100), 12);
  });

  it("arredonda para o inteiro mais próximo", () => {
    assert.equal(percentChange(133, 100), 33);
  });

  it("calcula variação negativa quando o gasto atual é menor que o anterior", () => {
    assert.equal(percentChange(80, 100), -20);
  });

  it("retorna null quando o ciclo anterior não teve gastos (evita divisão por zero)", () => {
    assert.equal(percentChange(50, 0), null);
  });

  it("retorna null quando o valor anterior é negativo (defensivo, dado nunca deveria ser negativo)", () => {
    assert.equal(percentChange(50, -10), null);
  });
});
