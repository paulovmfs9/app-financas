# Redesign Visual — Fase 2: Início, Resumo, Perfil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruct the app's 3 most-used screens (Início, Resumo, Perfil) on top of the Fase 1 component kit, following the approved visual direction, and add the new "% vs. ciclo anterior" comparison the design calls for.

**Architecture:** Each screen keeps 100% of its existing business logic (handlers, validation, Firebase calls) untouched — only the JSX/markup layer is rebuilt on `frontend/src/components/ui/` primitives. One new pure-logic pair (`previousCycleBounds`/`percentChange`) and one new one-off repository read (`ExpenseRepository.sumMonth`) support the new percentage badge. Início's duplicated inline "contas fixas" CRUD panel is removed in favor of the existing dedicated `/fixed-bills` route.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, the Fase 1 kit (`frontend/src/components/ui/`), existing `ExpensesProvider`/`AuthProvider`/`ThemeProvider`, `node:test` for the one new pure-logic pair.

**Spec:** `docs/superpowers/specs/2026-08-26-visual-redesign-design.md`

## Global Constraints

- Manter a paleta verde/branco/preto existente — nenhuma cor nova fora do estritamente necessário.
- Sem novas libs de gráfico, animação pesada, ou dependências grandes (nenhum pacote npm novo nesta fase).
- Não existe testing-library de componentes — verificação é `npx tsc --noEmit` (limpo) a cada task. Verificação visual manual é tratada à parte na Task 8 (ver nota abaixo — estas telas exigem login real, diferente da Fase 1).
- Todo componente novo/alterado consome cor via `useTheme()` — nunca hardcode um hex que já tem token, exceto os dois casos já documentados no projeto: `Badge` variante `dark` (Fase 1) e o bloco "Dica do dia" do Resumo (Task 5 abaixo), ambos deliberadamente estáticos.
- Cada task termina com `npx tsc --noEmit` limpo e um commit.
- Nenhuma mudança na lógica de negócio existente (handlers, validações, chamadas Firebase) — apenas a camada de markup/estilo é reconstruída, exceto pela remoção do painel de contas fixas inline (decisão #1) e a nova busca do ciclo anterior (decisão #7).

---

## Decisões tomadas nesta fase

1. **Painel inline de "contas fixas" da Início (linhas atuais ~197-336 de `index.tsx`, mais o estado/handlers que o alimentam: `showFixedBills`, `fixedBillName/Amount/DueDay/Kind/Installments`, `savingFixedBill`, `deletingFixedBillId`, `handleAddFixedBill`, `handleDeleteFixedBill`, `activeFixedBills`) é REMOVIDO por completo.** Motivo: `frontend/app/fixed-bills.tsx` (274 linhas) já oferece o mesmo CRUD completo (mesmo `addFixedBill`/`deleteFixedBill` de `useExpenses()`, mesmos campos nome/valor/dia de vencimento/mensal-ou-parcelado) como rota dedicada — o painel inline era pura duplicação. A ação rápida "Contas" (decisão #3) passa a navegar para `/fixed-bills`. Isso torna não utilizados os imports `installmentEndDate`, `isFixedBillActiveInPeriod`, `Keyboard`, `TextInput`, `parseBRL`, e as desestruturações `addFixedBill`/`deleteFixedBill` de `useExpenses()` — todos removidos na Task 4.
2. **O FAB (botão flutuante, linhas atuais ~419-426) é REMOVIDO.** A ação rápida "Gasto" (decisão #3) cobre exatamente o mesmo destino (`router.push("/add-expense")`), como no mockup aprovado (que não tem FAB).
3. **Grid de 4 ações rápidas da Início, exatamente como no mockup aprovado:** "Gasto" → `router.push("/add-expense")`; "Contas" → `router.push("/fixed-bills")`; "Exportar" → `router.push("/(tabs)/resumo" as any)` (a Início não tem lógica de exportação própria — duplicar o `ExportModal` violaria DRY; a ação leva para onde a exportação já existe); "Pro" → `router.push("/plans" as any)` (mesmo destino do link "Ver planos" atual).
4. **O grid de 4 métricas (Gastos no mês / Limite por dia / Média diária / Projeção mensal) e o "alerta inteligente" (`snapshot.alert`, 4 níveis coloridos) são MANTIDOS**, não removidos — são funcionalidades reais e já existentes que o mockup da Fase 1 simplesmente não modelou (o mockup é de uma tela nova, a tela real já tinha mais funcionalidade). Ambos são reestilizados sobre o `Card` do kit (label caixa-alta + valor em negrito + subtítulo opcional, no mesmo idioma visual já usado nas linhas de resumo da tela Resumo) em vez do `Card` local da tela (que é removido).
5. **O ponto colorido decorativo no canto superior direito do cabeçalho da Início (`styles.dot`, sempre `colors.primary`, sem significado semântico) é REMOVIDO** como parte da simplificação do cabeçalho.
6. **Nenhum ícone de sino/notificação é adicionado ao cabeçalho da Início**, apesar do mockup mostrar um — não existe funcionalidade de notificação nem fonte de dados para isso no app. Adicionar um ícone decorativo sem função seria exatamente o tipo de elemento não solicitado que o projeto evita.
7. **O selo "% vs. ciclo anterior" compara `total_spent` (gasto) entre os dois ciclos — não saldo.** Confirmado pela "Nota técnica" da spec (`docs/superpowers/specs/2026-08-26-visual-redesign-design.md`, seção "Nota técnica: selo de variação percentual"): *"...somando o valor para comparar com `snapshot.total_spent` do ciclo atual."* Implementação: (a) `previousCycleBounds` + `percentChange`, funções puras em `finance.ts` (Task 1); (b) `ExpenseRepository.sumMonth`, busca pontual (não subscription) em `ExpenseRepository.ts` (Task 2); (c) na Início, um `useEffect`+`useState` **local à tela** (não vai para `ExpensesProvider` — nenhuma outra tela precisa disso, e o provider compartilhado não deve crescer uma busca usada por uma única tela) que busca o total do ciclo anterior sempre que `snapshot.period_start` muda, e calcula `percentChange(snapshot.total_spent, previousTotal)` (Task 3). Quando `percentChange` retorna `null` (ciclo anterior sem gastos), o selo não é renderizado — por isso a função retorna `number | null`, não `0`.
8. **Perfil**: todo `TextInput` cru vira `TextField` do kit (nome, salário com prefixo "R$", contas fixas com prefixo "R$", dia de início/fim do ciclo — preservando `testID`, `keyboardType`, `maxLength`, `placeholder` de cada campo exatamente); cada seção lógica (Dados pessoais, Finanças, Plano, Aparência) fica dentro de um `Card`; o botão Salvar vira `Button` (`variant="primary"`, `loading={saving}`); o seletor Claro/Escuro/Sistema vira `SegmentedControl` (ver Task 7 para o detalhe de tipos — `ThemePref` não é `string` puro, precisa de um cast pontual); a linha "Ver planos" fica um `TouchableOpacity` estilizado com os tokens do kit envolvendo um `Card` (o `Card` do kit não tem `onPress` próprio, então o `TouchableOpacity` continua sendo o elemento pressionável, só por fora do `Card`); o botão "Sair" e sua confirmação inline (Cancelar/Sair) **permanecem estilizados manualmente com `colors.danger`**, não viram `Button` — o kit não tem variante de botão "perigo" (só `Badge` tem variante `danger`), e inventar uma variante nova está fora do escopo desta fase.
9. **Resumo**: o pill de status do plano vira `Badge` (`variant="soft"` quando `hasUnlimitedExpenses`, texto simples quando não — mesma regra usada na Início, para as duas telas ficarem consistentes); as 6 linhas de resumo atuais (Salário, Contas fixas, Gastos atuais, Média diária, Projeção mensal, Saldo previsto — confirmado no arquivo atual, não são 4) vão para dentro de um `Card`; o card do gráfico vira um `Card` do kit envolvendo o `PieChart`/legenda **existentes sem alteração nenhuma na lógica SVG** (`buildChartSlices`, `describeSlice`, `polarToCartesian` ficam exatamente como estão — só o container/cabeçalho/linhas da legenda são reestilizados); o bloco "Dica do dia" vira um `Card` de destaque escuro com hex estático (mesmo padrão da variante `dark` do `Badge` da Fase 1 — não é um token de tema, é uma exceção deliberada e documentada).
10. **`ExportModal`**: reestilizado com os tokens do kit (fundo dos círculos de ícone, raios, espaçamento) mas **sem mudar o comportamento** — `comingSoon`, spinner por formato durante `loadingFormat`, fechar tocando no backdrop, tudo idêntico. `ListRow` do kit **não é usado aqui** — ele não tem um slot para o chevron/spinner à direita que cada linha do modal precisa; a linha continua sendo markup próprio, só usando as cores/raios/espaçamentos do kit em vez de valores soltos.

---

### Task 1: `previousCycleBounds` + `percentChange` (lógica pura)

**Files:**
- Modify: `frontend/src/utils/finance.ts`
- Create: `frontend/src/utils/finance.test.ts`
- Modify: `frontend/tsconfig.test.json`

**Interfaces:**
- Consumes: `cycleBounds(now, startDay, endDay)` já existente em `finance.ts` (linha 43).
- Produces: `previousCycleBounds(currentPeriodStart: number, startDay?: number, endDay?: number): { start: number; end: number; daysInMonth: number }` e `percentChange(current: number, previous: number): number | null`, ambas exportadas nomeadas. Task 3 consome as duas.

- [ ] **Step 1: Escrever os testes (vai falhar)**

Crie `frontend/src/utils/finance.test.ts`:

```typescript
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
```

- [ ] **Step 2: Registrar os arquivos no build de teste**

Edite `frontend/tsconfig.test.json`, adicione ao array `include` (mantendo as entradas já existentes):

```json
    "src/utils/finance.ts",
    "src/utils/finance.test.ts",
```

- [ ] **Step 3: Rodar para confirmar que falha**

Run: `cd frontend && npm test`
Expected: FAIL — `previousCycleBounds`/`percentChange` ainda não existem em `finance.ts`.

- [ ] **Step 4: Implementar — editar `finance.ts`**

Em `frontend/src/utils/finance.ts`, adicione estas duas funções exportadas (posição sugerida: logo depois de `cycleBounds`, antes de `monthKey`):

```typescript
export function previousCycleBounds(
  currentPeriodStart: number,
  startDay = 1,
  endDay = 31
): { start: number; end: number; daysInMonth: number } {
  return cycleBounds(new Date(currentPeriodStart - 1), startDay, endDay);
}

export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
```

- [ ] **Step 5: Rodar para confirmar que passa**

Run: `cd frontend && npm test`
Expected: PASS (todos os testes, incluindo os novos de `finance.test.ts`)

- [ ] **Step 6: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 7: Commit**

```bash
cd frontend
git add src/utils/finance.ts src/utils/finance.test.ts tsconfig.test.json
git commit -m "feat(fase2): add previousCycleBounds and percentChange pure functions"
```

---

### Task 2: `ExpenseRepository.sumMonth`

**Files:**
- Modify: `frontend/src/repositories/ExpenseRepository.ts`

**Interfaces:**
- Consumes: `colRef(uid)`, `query`, `where`, `getDocs` (já importados no arquivo).
- Produces: `ExpenseRepository.sumMonth(uid: string, startMs: number, endMs: number): Promise<number>`. Task 3 consome esse método.

- [ ] **Step 1: Implementar**

Em `frontend/src/repositories/ExpenseRepository.ts`, adicione este método ao objeto `ExpenseRepository`, logo depois de `countMonth` (linhas atuais 38-46):

```typescript
  async sumMonth(uid: string, startMs: number, endMs: number): Promise<number> {
    const q = query(
      colRef(uid),
      where("date", ">=", startMs),
      where("date", "<=", endMs)
    );
    const snap = await getDocs(q);
    let total = 0;
    snap.forEach((doc) => {
      const amount = doc.data().amount;
      if (typeof amount === "number") total += amount;
    });
    return total;
  },
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/repositories/ExpenseRepository.ts
git commit -m "feat(fase2): add ExpenseRepository.sumMonth for previous-cycle comparison"
```

---

### Task 3: Início — cabeçalho, card de saldo, badge de plano, alerta, ações rápidas

**Files:**
- Modify: `frontend/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `QuickAction` de `../src/components/ui`; `previousCycleBounds`, `percentChange` de `../src/utils/finance` (Task 1); `ExpenseRepository.sumMonth` de `../src/repositories/ExpenseRepository` (Task 2).
- Produces: nenhuma interface nova exportada — é uma tela, não um componente reutilizável.

- [ ] **Step 1: Atualizar imports**

No topo de `frontend/app/(tabs)/index.tsx`, adicione:

```typescript
import { Card, Badge, QuickAction } from "../../src/components/ui";
import { previousCycleBounds, percentChange } from "../../src/utils/finance";
import { ExpenseRepository } from "../../src/repositories/ExpenseRepository";
```

(Os imports `installmentEndDate`, `isFixedBillActiveInPeriod`, `Keyboard`, `TextInput`, `parseBRL` só são removidos na Task 4, quando o painel de contas fixas é de fato apagado — nesta task eles continuam em uso pelo painel ainda presente. Não remova nada de import ainda.)

- [ ] **Step 2: Adicionar o estado e o efeito de busca do ciclo anterior**

Logo abaixo da linha `const [deletingFixedBillId, setDeletingFixedBillId] = useState<string | null>(null);` (linha atual 33), adicione:

```typescript
  const [previousPeriodTotal, setPreviousPeriodTotal] = useState<number | null>(null);

  React.useEffect(() => {
    if (!profile?.uid) return;
    const uid = profile.uid;
    const previousPeriod = previousCycleBounds(
      snapshot.period_start,
      profile?.budget_cycle_start_day ?? 1,
      profile?.budget_cycle_end_day ?? 31
    );
    let cancelled = false;
    ExpenseRepository.sumMonth(uid, previousPeriod.start, previousPeriod.end).then((total) => {
      if (!cancelled) setPreviousPeriodTotal(total);
    });
    return () => {
      cancelled = true;
    };
  }, [snapshot.period_start, profile?.uid, profile?.budget_cycle_start_day, profile?.budget_cycle_end_day]);
```

(`React` já está disponível via `import React, { useState } from "react";` na linha 1 — `React.useEffect` funciona sem import adicional porque `React` é importado como default. Se preferir, pode trocar a linha 1 para `import React, { useState, useEffect } from "react";` e usar `useEffect` direto — escolha uma forma e seja consistente com o resto do arquivo, que já usa `useState` sem o prefixo `React.`. **Recomendado:** trocar o import para incluir `useEffect` e usar `useEffect(...)` sem prefixo, para consistência com `useState` já usado no arquivo.)

Depois do `useEffect`, adicione a variável derivada (perto de `const alertColor = ...`, linha atual 47):

```typescript
  const variationPercent = previousPeriodTotal !== null ? percentChange(snapshot.total_spent, previousPeriodTotal) : null;
```

- [ ] **Step 3: Substituir o cabeçalho (linhas atuais 145-153)**

Troque:

```tsx
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.overline, { color: colors.textMuted }]}>{monthLabel.toUpperCase()}</Text>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>
              Olá{profile?.name?.trim() ? `, ${profile.name.trim()}` : ""}
            </Text>
          </View>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        </View>
```

por:

```tsx
        <Text style={[styles.overline, { color: colors.textMuted }]}>{monthLabel.toUpperCase()}</Text>
        <Text style={[styles.greeting, { color: colors.textPrimary }]}>
          Olá{profile?.name?.trim() ? `, ${profile.name.trim()}` : ""}
        </Text>
```

(Remove o `styles.headerRow` e `styles.dot` do `StyleSheet` no Step 7 desta task — não usados em mais nenhum lugar do arquivo.)

- [ ] **Step 4: Substituir o card de saldo (linhas atuais 155-169)**

Troque o bloco `{/* HERO balance */}` inteiro por:

```tsx
        {/* HERO balance */}
        <Card style={styles.heroCard}>
          <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>SALDO DO MÊS</Text>
          <Text
            testID="home-hero-balance"
            style={[styles.hero, { color: snapshot.saldo_restante < 0 ? colors.danger : colors.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatBRL(snapshot.saldo_restante)}
          </Text>
          {variationPercent !== null ? (
            <Badge
              label={`${variationPercent > 0 ? "+" : ""}${variationPercent}% vs. ciclo anterior`}
              variant={variationPercent > 0 ? "danger" : "soft"}
            />
          ) : null}
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            de {formatBRL(Math.max(0, snapshot.salary - snapshot.fixed_bills))} disponíveis
          </Text>
        </Card>
```

(`variant={variationPercent > 0 ? "danger" : "soft"}`: gastar mais que o ciclo anterior é o sinal de alerta — `danger` já é a cor certa para isso, `soft` verde para quando gastou igual ou menos. Isso é uma leitura direta do próprio `total_spent` crescente = ruim, decrescente/igual = ok, consistente com o resto da tela onde `saldo_restante < 0` também usa `colors.danger`.)

Adicione ao `StyleSheet` (Step 7): `heroCard: { marginTop: spacing.xl, gap: 6, alignItems: "flex-start" }` — substitui o antigo `heroWrap`.

- [ ] **Step 5: Substituir o indicador de plano (linhas atuais 171-178)**

Troque:

```tsx
        <View style={[styles.planIndicator, { backgroundColor: colors.surface, borderColor: hasUnlimitedExpenses ? colors.primary : colors.border }]}> 
          <Text style={[styles.planIndicatorText, { color: hasUnlimitedExpenses ? colors.primary : colors.textSecondary }]}>{usageLabel}</Text>
          {!hasUnlimitedExpenses ? (
            <TouchableOpacity testID="home-upgrade-button" activeOpacity={0.75} onPress={() => router.push("/plans" as any)}>
              <Text style={[styles.planAction, { color: colors.primary }]}>Ver planos</Text>
            </TouchableOpacity>
          ) : null}
        </View>
```

por:

```tsx
        <View style={styles.planRow}>
          {hasUnlimitedExpenses ? (
            <Badge label={usageLabel} variant="soft" />
          ) : (
            <Text style={[styles.planIndicatorText, { color: colors.textSecondary }]}>{usageLabel}</Text>
          )}
          {!hasUnlimitedExpenses ? (
            <TouchableOpacity testID="home-upgrade-button" activeOpacity={0.75} onPress={() => router.push("/plans" as any)}>
              <Text style={[styles.planAction, { color: colors.primary }]}>Ver planos</Text>
            </TouchableOpacity>
          ) : null}
        </View>
```

Adicione ao `StyleSheet`: `planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg, marginBottom: spacing.lg }`. Remova `styles.planIndicator` (não usado mais).

- [ ] **Step 6: Substituir o alerta inteligente (linhas atuais 180-187)**

Troque:

```tsx
        {/* Smart alert */}
        <View testID="home-smart-alert" style={[styles.alert, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.alertDot, { backgroundColor: alertColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>{snapshot.alert.title}</Text>
            <Text style={[styles.alertMsg, { color: colors.textSecondary }]}>{snapshot.alert.message}</Text>
          </View>
        </View>
```

por:

```tsx
        {/* Smart alert */}
        <Card style={styles.alert} padding={spacing.base}>
          <View testID="home-smart-alert" style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: alertColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>{snapshot.alert.title}</Text>
              <Text style={[styles.alertMsg, { color: colors.textSecondary }]}>{snapshot.alert.message}</Text>
            </View>
          </View>
        </Card>
```

(`alertColor` — cálculo existente nas linhas atuais 47-54, não muda.) Ajuste `styles.alert` para `{ marginBottom: spacing.lg }` e adicione `alertRow: { flexDirection: "row", alignItems: "center", gap: spacing.md }`.

- [ ] **Step 7: Inserir a grade de ações rápidas (novo bloco, logo depois do alerta e antes do grid de métricas — antes da linha atual 189 `{/* Cards grid */}`)**

```tsx
        {/* Quick actions */}
        <View style={styles.quickActions}>
          <QuickAction
            icon={<Ionicons name="add" size={20} color={colors.primary} />}
            label="Gasto"
            onPress={() => router.push("/add-expense")}
            testID="home-qa-gasto"
          />
          <QuickAction
            icon={<Ionicons name="document-text-outline" size={20} color={colors.primary} />}
            label="Contas"
            onPress={() => router.push("/fixed-bills")}
            testID="home-qa-contas"
          />
          <QuickAction
            icon={<Ionicons name="download-outline" size={20} color={colors.primary} />}
            label="Exportar"
            onPress={() => router.push("/(tabs)/resumo" as any)}
            testID="home-qa-exportar"
          />
          <QuickAction
            icon={<Ionicons name="star-outline" size={20} color={colors.primary} />}
            label="Pro"
            onPress={() => router.push("/plans" as any)}
            testID="home-qa-pro"
          />
        </View>
```

Adicione ao `StyleSheet`: `quickActions: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xl }`.

- [ ] **Step 8: Ajustar `StyleSheet` (edições consolidadas deste task)**

No objeto `styles` (linhas atuais 451 em diante), aplique exatamente as mudanças descritas nos Steps 3, 4, 5, 6, 7 acima: remova `headerRow`, `dot`, `heroWrap`, `planIndicator`; adicione `heroCard`, `planRow`, `alertRow`, `quickActions`; ajuste `alert` para não ter mais `backgroundColor`/`borderColor`/`borderWidth`/`padding`/`flexDirection`/`alignItems`/`gap` (isso tudo passa a vir do `Card`/`alertRow`) — mantenha só `marginBottom: spacing.lg`. `heroLabel`, `hero`, `heroSub`, `alertDot`, `alertTitle`, `alertMsg`, `planIndicatorText`, `planAction` continuam como estão (só a cap-label do saldo precisa virar caixa-alta — ajuste `heroLabel` para incluir `fontWeight: "700"`, `letterSpacing: 1`, `fontSize: 11` se ainda não tiver esse peso, para bater com o padrão "SALDO DO MÊS" caixa-alta do mockup aprovado).

- [ ] **Step 9: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 10: Commit**

```bash
cd frontend
git add "app/(tabs)/index.tsx"
git commit -m "feat(fase2): restyle Início header, hero card, alert and quick actions"
```

---

### Task 4: Início — grid de métricas, lista de gastos recentes, remoção do painel de contas fixas e do FAB

**Files:**
- Modify: `frontend/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `Card`, `ListRow` de `../src/components/ui` (já importados na Task 3 — adicione `ListRow` ao import existente).
- Produces: nada novo.

- [ ] **Step 1: Ampliar o import do kit**

Troque a linha de import adicionada na Task 3 (`import { Card, Badge, QuickAction } from "../../src/components/ui";`) por:

```typescript
import { Card, Badge, QuickAction, ListRow } from "../../src/components/ui";
```

- [ ] **Step 2: Remover os imports que ficam sem uso**

Remova do topo do arquivo: `TextInput`, `Keyboard` (de `react-native`); `installmentEndDate`, `isFixedBillActiveInPeriod` (de `../../src/utils/finance`); `parseBRL` (de `../../src/utils/format` — mantenha `formatBRL`, `formatBRLCompact`, que continuam em uso). Confira a lista final de imports contra o restante do arquivo antes de finalizar — não deve sobrar nenhum import não utilizado.

- [ ] **Step 3: Remover o estado e handlers de contas fixas**

Remova as declarações de estado: `showFixedBills`, `fixedBillName`, `fixedBillAmount`, `fixedBillDueDay`, `fixedBillKind`, `fixedBillInstallments`, `savingFixedBill`, `deletingFixedBillId` (linhas atuais 26-33). Remova também da desestruturação de `useExpenses()` (linha atual 23): `addFixedBill`, `deleteFixedBill` — mantenha `snapshot, expenses, fixedBills, loading, deleteExpense, usageLabel, hasUnlimitedExpenses` (mantenha `fixedBills` porque `snapshot.fixed_bills` já vem computado, mas confirme se `fixedBills` cru ainda é referenciado em algum lugar do arquivo após as remoções desta task — se não for, remova `fixedBills` da desestruturação também). Remova as funções `handleAddFixedBill` (linhas atuais 73-129) e `handleDeleteFixedBill` (linhas atuais 131-140) por inteiro. Remova a variável `activeFixedBills` (linhas atuais 57-59).

- [ ] **Step 4: Substituir o grid de métricas (linhas atuais 189-195, o bloco `{/* Cards grid */}`)**

Troque:

```tsx
        {/* Cards grid */}
        <View style={styles.grid}>
          <Card title="Gastos no mês" value={formatBRLCompact(snapshot.total_spent)} icon="trending-down" iconColor={colors.danger} colors={colors} />
          <Card title="Limite por dia" value={formatBRLCompact(snapshot.limite_diario)} icon="speedometer" iconColor={colors.primary} subtitle={`${snapshot.days_remaining} dias restantes`} colors={colors} />
          <Card title="Média diária" value={formatBRLCompact(snapshot.media_diaria)} icon="calendar-outline" iconColor={colors.info} subtitle={`Ideal: ${formatBRLCompact(snapshot.ideal_diario)}`} colors={colors} />
          <Card title="Projeção mensal" value={formatBRLCompact(snapshot.projecao_mensal)} icon="stats-chart" iconColor={colors.warning} subtitle={`Previsto: ${formatBRLCompact(snapshot.saldo_previsto)}`} colors={colors} />
        </View>
```

por (usando o `Card` do kit, com um pequeno bloco de texto próprio em vez do `Card` local com ícone — o `Card` local é removido no Step 7):

```tsx
        {/* Metrics grid */}
        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>GASTOS NO MÊS</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatBRLCompact(snapshot.total_spent)}</Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>LIMITE POR DIA</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatBRLCompact(snapshot.limite_diario)}</Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>{snapshot.days_remaining} dias restantes</Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>MÉDIA DIÁRIA</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatBRLCompact(snapshot.media_diaria)}</Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>Ideal: {formatBRLCompact(snapshot.ideal_diario)}</Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>PROJEÇÃO MENSAL</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatBRLCompact(snapshot.projecao_mensal)}</Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>Previsto: {formatBRLCompact(snapshot.saldo_previsto)}</Text>
          </Card>
        </View>
```

Adicione ao `StyleSheet`: `metricCard: { flexBasis: "48%", flexGrow: 1, minHeight: 90 }`, `metricLabel: { fontSize: fontSizes.micro, fontWeight: "700", letterSpacing: 0.5 }`, `metricValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 }`, `metricSub: { fontSize: 11, marginTop: 4 }`. Mantenha `styles.grid` como está (`flexDirection: "row", flexWrap: "wrap", gap: spacing.md`).

- [ ] **Step 5: Remover o card e o painel de contas fixas (linhas atuais 197-336)**

Apague por completo o bloco desde `<TouchableOpacity testID="home-fixed-bills-card" ...>` até o `) : null}` que fecha o painel condicional (`{showFixedBills ? (...) : null}`) — todo o trecho entre o fim do grid de métricas e o comentário `{/* Recent expenses */}`.

- [ ] **Step 6: Substituir a lista de gastos recentes (linhas atuais 338-414)**

Troque o `map` interno (a partir de `recent.map((e) => { ... })`, preservando a estrutura externa `<View style={styles.section}>...` e o caso vazio `recent.length === 0`) — a lógica de `confirmDeleteId`/`deletingId`/`handleDeleteExpense` continua idêntica, só a linha em si muda de markup cru para `Card` + `ListRow` com botões de exclusão ao lado:

```tsx
        {/* Recent expenses */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recentes</Text>
          {recent.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary }}>Nenhum gasto ainda. Toque em "Gasto" para começar.</Text>
            </View>
          ) : (
            <Card>
              {recent.map((e, index) => {
                const cat = categoryById(e.category);
                return (
                  <View key={e.id} style={index > 0 ? styles.expenseRowDivider : undefined}>
                    <ListRow
                      icon={<Ionicons name={(cat?.icon as any) || "ellipsis-horizontal"} size={16} color={cat?.color || colors.primary} />}
                      iconBg={(cat?.color || colors.primary) + "22"}
                      title={e.description || cat?.name || "Gasto"}
                      subtitle={`${cat?.name || e.category} • ${new Date(e.date).toLocaleDateString("pt-BR")}`}
                      value={confirmDeleteId === e.id ? undefined : `-${formatBRL(e.amount)}`}
                      valueColor={colors.danger}
                      testID={`home-expense-row-${e.id}`}
                    />
                    {confirmDeleteId === e.id ? (
                      <View style={styles.deleteConfirm}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Cancelar exclusão"
                          activeOpacity={0.75}
                          disabled={deletingId === e.id}
                          onPress={() => setConfirmDeleteId(null)}
                          style={[styles.confirmButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                          testID={`cancel-delete-expense-${e.id}`}
                        >
                          <Text style={[styles.confirmButtonText, { color: colors.textPrimary }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Confirmar exclusão de ${e.description || cat?.name || "gasto"}`}
                          activeOpacity={0.75}
                          disabled={deletingId === e.id}
                          onPress={() => handleDeleteExpense(e.id)}
                          style={[styles.confirmButton, { backgroundColor: colors.danger, borderColor: colors.danger }]}
                          testID={`confirm-delete-expense-${e.id}`}
                        >
                          {deletingId === e.id ? (
                            <ActivityIndicator size="small" color={colors.onPrimary} />
                          ) : (
                            <Text style={[styles.confirmButtonText, { color: colors.onPrimary }]}>Excluir</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Remover gasto ${e.description || cat?.name || "Gasto"}`}
                        activeOpacity={0.75}
                        disabled={deletingId === e.id}
                        onPress={() => setConfirmDeleteId(e.id)}
                        style={[styles.deleteButton, { backgroundColor: colors.danger + "14" }]}
                        testID={`delete-expense-${e.id}`}
                      >
                        {deletingId === e.id ? (
                          <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                          <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </Card>
          )}
        </View>
```

(`colors.onPrimary` existe desde a Fase 1 — usado aqui porque o fundo do botão de confirmação é `colors.danger`, um fundo saturado que precisa de texto branco fixo, mesmo raciocínio do `Button` variante `primary`. Note que o botão de exclusão em si — ícone de lixeira sem confirmação — fica fora do `ListRow`, ao lado dele, porque `ListRow` não tem um slot de ação secundária; a linha de código acima já reflete isso, com `ListRow` e os botões como irmãos dentro do mesmo `View`.)

Adicione ao `StyleSheet`: `expenseRowDivider: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xs, paddingTop: spacing.xs }` — **atenção**: `StyleSheet.create` é chamado no module scope, fora do componente, então não tem acesso a `colors` (que só existe dentro do componente via `useTheme()`). Ajuste isso criando esse estilo específico inline no JSX em vez de no `StyleSheet.create` (ex: `style={index > 0 ? [styles.expenseRowDividerBase, { borderTopColor: colors.border }] : undefined}`, com `expenseRowDividerBase: { borderTopWidth: 1, marginTop: spacing.xs, paddingTop: spacing.xs }` no `StyleSheet.create` sem a cor).

- [ ] **Step 7: Remover o FAB e o `Card` local**

Remova o bloco `<TouchableOpacity testID="fab-add-expense" ...>...</TouchableOpacity>` (linhas atuais 419-426, entre o fechamento do `</ScrollView>` e o fechamento do `</SafeAreaView>`). Remova a função `Card` local por completo (linhas atuais 431-449 — a que recebe `title, value, subtitle, colors, icon, iconColor`; não confundir com o `Card` do kit importado no Step 1 da Task 3, que tem o mesmo nome mas é outro componente — depois desta remoção só existe um `Card` no arquivo, o do kit).

- [ ] **Step 8: Limpar o `StyleSheet` de estilos órfãos**

Remova do `StyleSheet.create`: `card`, `cardHeader`, `cardTitle`, `cardValue`, `cardSub` (do antigo `Card` local), `fixedBillsCard`, `fixedBillsIcon`, `fixedBillsTitle`, `fixedBillsSub`, `fixedBillsAmountWrap`, `fixedBillsAmount`, `fixedBillsChevron`, `fixedBillsCount`, `fixedBillsPanel`, `fixedBillsPanelTitle`, `fixedBillsPanelHint`, `fixedBillsLabel`, `fixedBillsHelper`, `fixedBillsInput`, `fixedBillsModeRow`, `fixedBillsModeButton`, `fixedBillsModeText`, `fixedBillsFormRow`, `fixedBillsDayWrap`, `fixedBillsDayInput`, `fixedBillsSaveButton`, `fixedBillsSaveText`, `fixedBillsList`, `fixedBillItem`, `fixedBillItemName`, `fixedBillItemSub`, `fixedBillDeleteButton`, `catIcon` (agora coberto pelo `iconBg`/ícone do `ListRow`), `expenseRow` (a linha crua antiga), `expenseTitle`, `expenseSub`, `expenseAmount` (o `ListRow` já estiliza esses três), `fab`. Mantenha `deleteButton`, `deleteConfirm`, `confirmButton`, `confirmButtonText` (ainda usados no Step 6 desta task), `section`, `sectionTitle`, `emptyBox` (ainda usados).

- [ ] **Step 9: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 10: Commit**

```bash
cd frontend
git add "app/(tabs)/index.tsx"
git commit -m "feat(fase2): restyle Início metrics grid and expense list; drop duplicated fixed-bills panel and FAB"
```

---

### Task 5: Resumo — badge de plano, card de resumo, card de gráfico, dica do dia

**Files:**
- Modify: `frontend/app/(tabs)/resumo.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge` de `../../src/components/ui`.
- Produces: nada novo.

- [ ] **Step 1: Adicionar import**

Adicione ao topo de `frontend/app/(tabs)/resumo.tsx`:

```typescript
import { Card, Badge } from "../../src/components/ui";
```

- [ ] **Step 2: Substituir o indicador de plano**

Localize o bloco atual:

```tsx
        <View style={[styles.planIndicator, { backgroundColor: colors.surface, borderColor: hasUnlimitedExpenses ? colors.primary : colors.border }]}> 
          <Text style={[styles.planIndicatorText, { color: hasUnlimitedExpenses ? colors.primary : colors.textSecondary }]}>{usageLabel}</Text>
          {!hasUnlimitedExpenses ? (
            <Text testID="resumo-upgrade-button" onPress={() => router.push("/plans" as any)} style={[styles.planAction, { color: colors.primary }]}>Ver planos</Text>
          ) : null}
        </View>
```

Troque por:

```tsx
        <View style={styles.planRow}>
          {hasUnlimitedExpenses ? (
            <Badge label={usageLabel} variant="soft" />
          ) : (
            <Text style={[styles.planIndicatorText, { color: colors.textSecondary }]}>{usageLabel}</Text>
          )}
          {!hasUnlimitedExpenses ? (
            <Text testID="resumo-upgrade-button" onPress={() => router.push("/plans" as any)} style={[styles.planAction, { color: colors.primary }]}>Ver planos</Text>
          ) : null}
        </View>
```

No `StyleSheet`, troque `planIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, padding: spacing.base, borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.lg }` por `planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg }`.

- [ ] **Step 3: Envolver a tabela de resumo em um `Card`**

Localize:

```tsx
        <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          {rows.map((r, i) => {
```

até o `</View>` que fecha esse bloco (a lista de 6 linhas: Salário, Contas fixas, Gastos atuais, Média diária, Projeção mensal, Saldo previsto — `const rows` não muda). Troque a `<View style={[styles.table, ...]}>` de abertura por `<Card padding={0} style={styles.table}>` e o `</View>` de fechamento por `</Card>`. No `StyleSheet`, troque `table: { borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: spacing.base }` por `table: { paddingHorizontal: spacing.base }` (o `Card` já cuida de fundo/borda/raio; `padding={0}` no `Card` porque as linhas internas (`styles.row`) já têm seu próprio `paddingVertical: 18`, então o padding horizontal fica só em `styles.table` para não dobrar o espaçamento).

- [ ] **Step 4: Envolver o card do gráfico em um `Card`**

`CardProps` (confirmado em `frontend/src/components/ui/Card.tsx`) é `{ children, style?, padding? }` — **não tem `testID`**. Em vez de mudar `Card` (fora de escopo desta fase), mova o `testID` para o `View` interno que já envolve `chartHeader`/`chartContent`/`emptyChart`.

Localize:

```tsx
        <View testID="resumo-expenses-pie-chart" style={[styles.chartBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.chartHeader}>
```

Troque por:

```tsx
        <Card style={styles.chartBox}>
          <View testID="resumo-expenses-pie-chart" style={styles.chartHeader}>
```

E troque o `</View>` de fechamento que corresponde à abertura original (o que fecha todo o card — não o `chartHeader`) por `</Card>`. No `StyleSheet`, remova `chartBox: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.base }` por completo (o `Card` já cobre isso com o `padding` default) e troque toda referência a `style={styles.chartBox}` no restante do arquivo — só existe essa uma. O conteúdo interno do card (cabeçalho com título/subtítulo/botão exportar, `PieChart`, legenda) não muda — só o container por fora.

- [ ] **Step 5: Envolver o "Dica do dia" em um `Card` de destaque escuro**

Localize:

```tsx
        <View style={[styles.tipBox, { backgroundColor: colors.primarySoft }]}> 
          <Text style={[styles.tipTitle, { color: colors.primary }]}>Dica do dia</Text>
          <Text style={[styles.tipBody, { color: colors.textPrimary }]}> 
            Tente manter sua média diária próxima do limite ideal. Pequenos ajustes diários fazem grande diferença no fim do mês.
          </Text>
        </View>
```

Troque por (hex estático, mesma exceção documentada do `Badge` variante `dark` da Fase 1 — este bloco é deliberadamente escuro mesmo em light mode, não reage ao tema):

```tsx
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>Dica do dia</Text>
          <Text style={styles.tipBody}>
            Tente manter sua média diária próxima do limite ideal. Pequenos ajustes diários fazem grande diferença no fim do mês.
          </Text>
        </View>
```

No `StyleSheet`, troque `tipBox: { padding: spacing.lg, borderRadius: radii.lg }` por `tipBox: { padding: spacing.lg, borderRadius: radii.lg, backgroundColor: "#0A0F0D" }`, `tipTitle: { fontSize: fontSizes.small, fontWeight: "800", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase", color: "#10B981" }`, `tipBody: { fontSize: fontSizes.body, lineHeight: 22, color: "#F3F4F6" }` (mesmos hex estáticos usados em `Badge.tsx` para a variante `dark` — `DARK_BADGE_BG`/`DARK_BADGE_TEXT` — repita os valores literais aqui; não importe as constantes de `Badge.tsx`, elas não são exportadas e não deveriam ser só para isso).

- [ ] **Step 6: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 7: Commit**

```bash
cd frontend
git add "app/(tabs)/resumo.tsx"
git commit -m "feat(fase2): restyle Resumo plan badge, summary card, chart card and tip block"
```

---

### Task 6: `ExportModal` — reestilo sem mudar comportamento

**Files:**
- Modify: `frontend/src/components/ExportModal.tsx`

**Interfaces:**
- Consumes: nada do kit `ui/` diretamente (decisão #10: `ListRow` não serve aqui) — só os tokens `radii`, `spacing`, `fontSizes` de `../utils/theme`, já importados.
- Produces: nenhuma mudança de props — `ExportModalProps` continua exatamente como está.

- [ ] **Step 1: Ajustar o `StyleSheet`**

Em `frontend/src/components/ExportModal.tsx`, ajuste os valores de `radii`/`spacing` já usados no `StyleSheet.create` (linhas atuais 68-89) para bater com os valores agora padronizados no kit — especificamente troque `sheet`'s `borderTopLeftRadius`/`borderTopRightRadius` de `radii.lg` para `radii.xl` (para ficar visualmente mais próximo do arredondamento generoso dos cards do kit) e `option`'s `borderRadius` de `radii.lg` para `radii.lg` (mantém — já bate). Troque `optionIcon`'s tamanho de `38`/`19` (raio) para `40`/`20`, igual ao `iconWrap` do `ListRow` do kit (`frontend/src/components/ui/ListRow.tsx`), para os círculos de ícone ficarem consistentes entre o modal e as listas do resto do app.

- [ ] **Step 2: Nenhuma mudança de lógica**

Confirme que `OPTIONS`, o `Modal`, `onClose`/`onExport`, `loadingFormat`, `comingSoon` continuam exatamente como estão — este task é só ajuste de `StyleSheet`, não de JSX/comportamento.

- [ ] **Step 3: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/components/ExportModal.tsx
git commit -m "feat(fase2): align ExportModal radii/icon sizing with the ui kit"
```

---

### Task 7: Perfil — campos, cards, seletor de aparência, botões

**Files:**
- Modify: `frontend/app/(tabs)/perfil.tsx`

**Interfaces:**
- Consumes: `Card`, `TextField`, `Button`, `SegmentedControl` de `../../src/components/ui`.
- Produces: nada novo.

- [ ] **Step 1: Adicionar import**

```typescript
import { Card, TextField, Button, SegmentedControl } from "../../src/components/ui";
```

Remova o import de `TextInput` de `react-native` (fica sem uso depois deste task — confirme antes de remover que nenhum outro `TextInput` cru sobra no arquivo).

- [ ] **Step 2: Trocar os 5 campos de texto por `TextField`**

Substitua cada par `<Text style={[styles.label,...]}>Label</Text>` + `<TextInput .../>` (ou `<View style={[styles.inputRow,...]}>` com prefixo "R$") por um `TextField` equivalente, preservando `testID`, `value`, `onChangeText`, `keyboardType`, `maxLength`, `placeholder` de cada campo exatamente:

```tsx
          <TextField
            testID="perfil-name-input"
            label="Nome"
            value={name}
            onChangeText={setName}
            placeholder="Informe seu nome"
          />

          {/* ... seção Finanças ... */}

          <TextField
            testID="perfil-salary-input"
            label="Renda mensal"
            prefix="R$"
            keyboardType="decimal-pad"
            value={salary}
            onChangeText={setSalary}
            placeholder="0,00"
          />

          <View style={{ height: spacing.base }} />

          <TextField
            testID="perfil-bills-input"
            label="Contas fixas"
            prefix="R$"
            keyboardType="decimal-pad"
            value={bills}
            onChangeText={setBills}
            placeholder="0,00"
          />

          <View style={{ height: spacing.base }} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Ciclo financeiro</Text>
          <Text style={[styles.cycleHint, { color: colors.textMuted }]}>Use o mesmo dia no início e no fim para fechar no mês seguinte. Ex: 15 a 15.</Text>
          <View style={styles.cycleRow}>
            <View style={{ flex: 1 }}>
              <TextField
                testID="perfil-cycle-start-input"
                label="Inicia dia"
                keyboardType="number-pad"
                maxLength={2}
                value={cycleStartDay}
                onChangeText={setCycleStartDay}
                placeholder="1"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                testID="perfil-cycle-end-input"
                label="Termina dia"
                keyboardType="number-pad"
                maxLength={2}
                value={cycleEndDay}
                onChangeText={setCycleEndDay}
                placeholder="31"
              />
            </View>
          </View>
```

(`TextField` já cuida de `placeholderTextColor`/cores de foco internamente — não passe `style`/cores manualmente. O rótulo "Inicia dia"/"Termina dia" que antes vinha de `styles.helperLabel` agora é o próprio `label` do `TextField`, então remova os dois `<Text style={[styles.helperLabel,...]}>` correspondentes.)

- [ ] **Step 3: Envolver as seções em `Card`**

Envolva o conteúdo de cada seção (do título `<Text style={[styles.section,...]}>Dados pessoais</Text>` até logo antes do próximo título de seção) em um `Card` — ex:

```tsx
          <Text style={[styles.section, { color: colors.textPrimary }]}>Dados pessoais</Text>
          <Card>
            <TextField testID="perfil-name-input" label="Nome" value={name} onChangeText={setName} placeholder="Informe seu nome" />
          </Card>

          <Text style={[styles.section, { color: colors.textPrimary }]}>Finanças</Text>
          <Card style={{ gap: spacing.base }}>
            {/* os 4 campos de Renda mensal, Contas fixas, Ciclo (start/end) + o botão Salvar do Step 4 */}
          </Card>
```

Repita o padrão para a seção "Plano" (Step 5) e "Aparência" (Step 6) abaixo.

- [ ] **Step 4: Trocar o botão Salvar por `Button`**

Troque:

```tsx
          <TouchableOpacity
            testID="perfil-save-button"
            disabled={saving}
            onPress={onSave}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Salvar</Text>}
          </TouchableOpacity>
```

por:

```tsx
          <Button testID="perfil-save-button" label="Salvar" onPress={onSave} loading={saving} variant="primary" />
```

(Coloque este `Button` dentro do mesmo `Card` da seção "Finanças", como último filho — ele salva nome+renda+contas+ciclo juntos, então faz sentido visualmente fechar o card com a ação de salvar.)

- [ ] **Step 5: Trocar a linha "Ver planos"**

Troque:

```tsx
          <TouchableOpacity
            testID="perfil-plans-button"
            onPress={() => router.push("/plans" as any)}
            style={[styles.plansBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: fontSizes.body }}>Ver planos</Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSizes.small, marginTop: 2 }}>Básico e Pro</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
```

por:

```tsx
          <TouchableOpacity testID="perfil-plans-button" onPress={() => router.push("/plans" as any)} activeOpacity={0.8}>
            <Card style={styles.plansCard}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: fontSizes.body }}>Ver planos</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSizes.small, marginTop: 2 }}>Básico e Pro</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Card>
          </TouchableOpacity>
```

No `StyleSheet`, remova `plansBtn` e adicione `plansCard: { flexDirection: "row", alignItems: "center" }`.

- [ ] **Step 6: Trocar o seletor de Aparência por `SegmentedControl`**

Troque:

```tsx
          <View style={styles.themeRow}>
            {(["light", "dark", "system"] as const).map((m) => {
              const active = pref === m;
              return (
                <TouchableOpacity
                  key={m}
                  testID={`theme-${m}`}
                  onPress={() => setPref(m)}
                  style={[
                    styles.themeBtn,
                    { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border },
                  ]}
                >
                  <Text style={{ color: active ? "#fff" : colors.textPrimary, fontWeight: "600", fontSize: fontSizes.small }}>
                    {m === "light" ? "Claro" : m === "dark" ? "Escuro" : "Sistema"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
```

por:

```tsx
          <SegmentedControl
            testID="perfil-theme"
            options={[
              { id: "light", label: "Claro" },
              { id: "dark", label: "Escuro" },
              { id: "system", label: "Sistema" },
            ]}
            selectedId={pref}
            onSelect={(id) => setPref(id as "light" | "dark" | "system")}
          />
```

(**Atenção de tipos:** `setPref` tem assinatura `(p: "light" | "dark" | "system") => void` — não é `(id: string) => void` — então passar `setPref` direto como `onSelect` dá erro de tipo em `tsc --noEmit`. O `onSelect={(id) => setPref(id as "light" | "dark" | "system")}` acima resolve isso com um cast pontual, seguro porque as três opções acima são exatamente os três valores válidos. Isso muda os `testID`s de `theme-light`/`theme-dark`/`theme-system` para os que o `SegmentedControl` gera internamente — `${testID}-${opt.id}` — ou seja, `perfil-theme-light`/`perfil-theme-dark`/`perfil-theme-system`. Se algum outro lugar do código ou de testes referenciar os `testID`s antigos, ajuste — uma busca rápida por `theme-light`/`theme-dark`/`theme-system` no repositório antes de finalizar esta task é suficiente para confirmar que não há.)

Remova `themeRow`, `themeBtn` do `StyleSheet` (não usados mais).

- [ ] **Step 7: Deixar o botão Sair e a confirmação como estão**

Não altere o bloco do `onLogout`/`confirmLogout` (linhas atuais 213-247) — permanece com `TouchableOpacity` estilizado manualmente, por decisão #8 (sem variante de "perigo" no `Button` do kit).

- [ ] **Step 8: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 9: Commit**

```bash
cd frontend
git add "app/(tabs)/perfil.tsx"
git commit -m "feat(fase2): restyle Perfil fields, sections and appearance selector"
```

---

### Task 8: Verificação final da Fase 2

**Files:** nenhum arquivo novo — task de verificação.

- [ ] **Step 1: Rodar a suíte completa**

Run: `cd frontend && npm test`
Expected: PASS — todos os testes anteriores mais os novos de `finance.test.ts` (Task 1), sem regressão.

- [ ] **Step 2: Checar tipos em todo o app**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Verificação visual — restrição conhecida desta fase**

Diferente da Fase 1 (que tinha a rota `/dev-ui-kit`, isolada e sem necessidade de login), as telas desta fase — Início, Resumo, Perfil — ficam atrás do `Gate` de autenticação real (`frontend/app/_layout.tsx`, componente `Gate`: qualquer visita não-autenticada a uma rota fora de `(auth)` é redirecionada para `/(auth)/login`). Não existe rota de desenvolvimento isolada para essas telas, porque elas dependem de dados reais do usuário (perfil, gastos, ciclo financeiro) que não fazem sentido mockados isoladamente.

A verificação visual real desta fase, portanto, **exige uma sessão logada de verdade** — duas formas de fazer isso, nenhuma delas parte desta task automatizada:

1. O parceiro humano abre `npx expo start --web` localmente, loga com uma conta real e navega pelas 3 telas (light e dark mode).
2. Um bypass temporário e não commitado do `Gate` (o mesmo padrão já usado neste projeto para revisar `/dev-ui-kit` sem login), aplicado só durante a sessão de revisão e revertido logo em seguida — mas isso só mostra as telas sem dados reais de usuário (perfil vazio), então serve para conferir que nada quebra visualmente, não para validar os números exibidos.

Documente no relatório desta task qual das duas formas foi usada (ou que nenhuma foi possível nesta rodada) — não afirme "verificado visualmente" sem ter feito uma das duas.

- [ ] **Step 4: Commit final (se houver qualquer ajuste dos steps acima)**

```bash
cd frontend
git add -A
git commit -m "chore(fase2): final verification pass"
```

(Só crie este commit se algo mudou nos steps 1-3; se tudo já estava commitado nas tasks anteriores e só a verificação rodou, não há o que commitar aqui.)

---

## Self-Review

**Cobertura da spec:** todas as seções "Tela Início", "Tela Resumo" e "Tela Perfil" da spec têm task correspondente. A "Nota técnica: selo de variação percentual" é coberta pelas Tasks 1-3, com a métrica de comparação (`total_spent`, não saldo) resolvida explicitamente contra o texto da própria spec. O restyle do `ExportModal`, citado na descrição da Fase 2, tem task própria (Task 6).

**Placeholders:** nenhum "TBD"/"restilizar como apropriado" — toda task tem o código exato a escrever ou uma referência de linha precisa para o que preservar/remover.

**Consistência de tipos:** `previousCycleBounds`/`percentChange` (Task 1) são consumidas com a mesma assinatura na Task 3. `ExpenseRepository.sumMonth` (Task 2) é consumida com a mesma assinatura na Task 3. O cast `id as "light"|"dark"|"system"` na Task 7 evita o erro real de tipo entre `SegmentedControl.onSelect: (id: string) => void` e `setPref: (p: ThemePref) => void` — sinalizado explicitamente para não gerar uma surpresa de `tsc` no meio da task.

**Risco assinalado:** a Task 3, Step 4 usa `Badge` variante `danger` para uma variação positiva de gasto (`variationPercent > 0`) — isto é intencional (gastar mais que o ciclo anterior é o sinal de atenção), mas vale conferir visualmente na Task 8 se a leitura "vermelho quando gastei mais" fica clara para o usuário, já que o mockup original não especificava a cor do selo para o caso negativo.

## Próximos passos (fora deste plano)

Fase 3 (Login/Registro/Esqueci senha, Onboarding, Adicionar Gasto, Contas Fixas, Planos) é um plano separado, a ser escrito depois que esta Fase 2 estiver implementada e revisada.
