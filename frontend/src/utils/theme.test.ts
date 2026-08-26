import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getColors } from "./theme";

describe("tokens de cor — light mode", () => {
  it("usa branco puro como fundo de página (era o valor de surface antes do redesign)", () => {
    assert.equal(getColors("light").background, "#FFFFFF");
  });

  it("usa o tom suave como fundo de card (era o valor de background antes do redesign)", () => {
    assert.equal(getColors("light").surface, "#F8FAF9");
  });

  it("expõe um tom suave de vermelho para badges de alerta", () => {
    assert.equal(getColors("light").dangerSoft, "#FEE2E2");
  });

  it("expõe branco fixo para conteúdo sobre o verde primário", () => {
    assert.equal(getColors("light").onPrimary, "#FFFFFF");
  });
});

describe("tokens de cor — dark mode (não deve mudar)", () => {
  it("mantém o fundo de página quase preto", () => {
    assert.equal(getColors("dark").background, "#0A0F0D");
  });

  it("mantém o card num tom mais claro que a página", () => {
    assert.equal(getColors("dark").surface, "#131C18");
  });

  it("expõe um tom escuro de vermelho para badges de alerta", () => {
    assert.equal(getColors("dark").dangerSoft, "#7F1D1D");
  });

  it("mantém branco fixo para conteúdo sobre o verde primário no dark mode também", () => {
    assert.equal(getColors("dark").onPrimary, "#FFFFFF");
  });
});
