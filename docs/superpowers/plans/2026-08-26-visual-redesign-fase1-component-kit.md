# Redesign Visual — Fase 1: Kit de Componentes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, theme-aware UI component kit (`frontend/src/components/ui/`) that gives the rest of the redesign (Fases 2 e 3, planos futuros) a consistent visual language, without touching any existing screen yet.

**Architecture:** Ten small presentational React Native components, each consuming `useTheme()` for colors so light/dark mode work automatically. No new npm dependencies, no animation library, no component-testing framework — verification is `tsc --noEmit` + manual visual check on a dedicated dev-only route (`/dev-ui-kit`) that is not linked from any navigation.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, existing `ThemeProvider`/`theme.ts` tokens, `@expo/vector-icons` for icons. `node:test` for the one pure-logic task (theme tokens).

**Spec:** `docs/superpowers/specs/2026-08-26-visual-redesign-design.md`

## Global Constraints

- Manter a paleta verde/branco/preto existente — nenhuma cor nova fora do estritamente necessário (spec: "Referências visuais").
- Sem novas libs de gráfico, animação pesada (`reanimated` não é necessário aqui) ou dependências grandes (spec: "Contexto").
- Não existe testing-library de componentes no projeto — verificação é `npx tsc --noEmit` (limpo) + checagem visual manual via `npx expo start --web`, em light e dark mode, a cada task que produz um componente visual (spec: "Testes e verificação").
- Todo componente consome cor via `useTheme()` — nunca hardcode um hex de `theme.ts`, exceto o variant `dark` do `Badge`, que é deliberadamente estático (não reage ao tema) — ver Task 3.
- Componentes novos ficam em `frontend/src/components/ui/`, um arquivo por componente.
- Esta fase **não toca nenhuma tela existente** (`app/(tabs)/*`, `app/*.tsx`) — só cria componentes novos e uma rota de desenvolvimento isolada.

---

## Decisões tomadas nesta fase (resolvendo os pontos em aberto da spec)

1. **Token `background`/`surface` (light mode):** em vez de criar um token novo, a solução mais simples e de menor risco é **trocar os dois valores hex entre si** no modo claro — `background.light` passa a ser `#FFFFFF` (era `#FFFFFF` o `surface`) e `surface.light` passa a ser `#F8FAF9` (era o `background`). O modo escuro **não muda** (já tinha a relação certa: página quase preta, card num tom mais claro). Isso dá o efeito "página branca, card com leve realce" em todas as telas existentes de graça, sem editar nenhuma tela — só o arquivo de tokens (Task 1).
2. **Card do gráfico "branco sobre branco" do mockup do Resumo:** simplificado para usar o mesmo `Card` (fundo `colors.surface`) que todo o resto — não há necessidade de uma variante "elevated" separada nesta fase (YAGNI).
3. **Tela de smoke-test:** fica como uma rota real do Expo Router, `frontend/app/dev-ui-kit.tsx` (path `/dev-ui-kit`), **não** dentro de uma pasta prefixada com `_` (o Expo Router ignora pastas `_algo` — ficaria inacessível). Não é linkada em nenhuma navegação; permanece no repositório como referência viva do kit (não precisa ser removida depois).

---

### Task 1: Tokens de tema (swap background/surface + dangerSoft)

**Files:**
- Modify: `frontend/src/utils/theme.ts`
- Create: `frontend/src/utils/theme.test.ts`
- Modify: `frontend/tsconfig.test.json` (adicionar os dois arquivos ao `include`)

**Interfaces:**
- Consumes: nada (task fundacional)
- Produces: `getColors(mode: ThemeMode): Colors` com `Colors` agora incluindo `dangerSoft: string`; `background`/`surface` com valores trocados no modo claro. Todo componente das próximas tasks consome `colors.background`, `colors.surface`, `colors.dangerSoft` por esses nomes.

- [ ] **Step 1: Escrever o teste (vai falhar)**

Crie `frontend/src/utils/theme.test.ts`:

```typescript
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
});
```

- [ ] **Step 2: Registrar os arquivos no build de teste**

Edite `frontend/tsconfig.test.json`, adicione ao array `include`:

```json
    "src/utils/theme.ts",
    "src/utils/theme.test.ts",
```

- [ ] **Step 3: Rodar para confirmar que falha**

Run: `cd frontend && npm test`
Expected: FAIL — `getColors("light").background` ainda é `#F8FAF9`, não `#FFFFFF` (e `dangerSoft` não existe no objeto, erro de tipo/undefined).

- [ ] **Step 4: Implementar — editar `theme.ts`**

Em `frontend/src/utils/theme.ts`, troque os dois valores no modo claro e adicione `dangerSoft`:

```typescript
const palette = {
  primary: { light: "#059669", dark: "#10b981" },
  primarySoft: { light: "#D1FAE5", dark: "#064E3B" },
  background: { light: "#FFFFFF", dark: "#0A0F0D" },
  surface: { light: "#F8FAF9", dark: "#131C18" },
  surfaceAlt: { light: "#F1F5F4", dark: "#0F1612" },
  textPrimary: { light: "#1A202C", dark: "#F3F4F6" },
  textSecondary: { light: "#64748B", dark: "#94A3B8" },
  textMuted: { light: "#94A3B8", dark: "#64748B" },
  border: { light: "#E2E8F0", dark: "#22302A" },
  success: { light: "#10B981", dark: "#34D399" },
  warning: { light: "#F59E0B", dark: "#FBBF24" },
  danger: { light: "#EF4444", dark: "#F87171" },
  dangerSoft: { light: "#FEE2E2", dark: "#7F1D1D" },
  info: { light: "#3B82F6", dark: "#60A5FA" },
};

export function getColors(mode: ThemeMode) {
  return {
    primary: palette.primary[mode],
    primarySoft: palette.primarySoft[mode],
    background: palette.background[mode],
    surface: palette.surface[mode],
    surfaceAlt: palette.surfaceAlt[mode],
    textPrimary: palette.textPrimary[mode],
    textSecondary: palette.textSecondary[mode],
    textMuted: palette.textMuted[mode],
    border: palette.border[mode],
    success: palette.success[mode],
    warning: palette.warning[mode],
    danger: palette.danger[mode],
    dangerSoft: palette.dangerSoft[mode],
    info: palette.info[mode],
  };
}
```

(Resto do arquivo — `Colors`, `spacing`, `radii`, `fontSizes` — não muda.)

- [ ] **Step 5: Rodar para confirmar que passa**

Run: `cd frontend && npm test`
Expected: PASS (todos os testes de `theme.test.ts` e os já existentes de `MonetizationService.test.ts`)

- [ ] **Step 6: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 7: Checagem visual manual**

Run: `cd frontend && npx expo start --web`, abra qualquer tela existente (ex: Início) em light mode. Confirme visualmente: fundo da tela ficou branco puro, e as áreas que antes eram brancas (ex: linhas da tabela do Resumo, se visível) agora têm um leve tom esverdeado-acinzentado. Alterne pra dark mode (ajuste de sistema ou toggle do app) e confirme que nada mudou visualmente lá.

- [ ] **Step 8: Commit**

```bash
cd frontend
git add src/utils/theme.ts src/utils/theme.test.ts tsconfig.test.json
git commit -m "feat(ui-kit): invert light-mode background/surface tokens, add dangerSoft"
```

---

### Task 2: `Card`

**Files:**
- Create: `frontend/src/components/ui/Card.tsx`

**Interfaces:**
- Consumes: `useTheme()` de `frontend/src/providers/ThemeProvider.tsx` (produz `{ colors }`); `radii`, `spacing` de `frontend/src/utils/theme.ts`.
- Produces: `Card({ children, style?, padding? }): JSX.Element`, exportado nomeado. Usado por todas as telas nas Fases 2/3 como container padrão.

- [ ] **Step 1: Implementar**

Crie `frontend/src/components/ui/Card.tsx`:

```tsx
import React from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, spacing } from "../../utils/theme";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export function Card({ children, style, padding = spacing.base }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.lg,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros (o componente ainda não é usado em lugar nenhum, mas precisa compilar isoladamente)

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/components/ui/Card.tsx
git commit -m "feat(ui-kit): add Card component"
```

---

### Task 3: `Badge`

**Files:**
- Create: `frontend/src/components/ui/Badge.tsx`

**Interfaces:**
- Consumes: `useTheme()` → `colors.primarySoft`, `colors.primary`, `colors.dangerSoft`, `colors.danger` (de Task 1); `radii`, `fontSizes` de `theme.ts`.
- Produces: `Badge({ label, variant? }): JSX.Element`, `type BadgeVariant = "soft" | "dark" | "danger"`, ambos exportados nomeados.

- [ ] **Step 1: Implementar**

Crie `frontend/src/components/ui/Badge.tsx`:

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, fontSizes } from "../../utils/theme";

export type BadgeVariant = "soft" | "dark" | "danger";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

// Variante "dark" é deliberadamente estática (não segue o tema) — é um
// acento visual sempre-escuro usado em destaques pontuais (ex: "Economize 50%"),
// independente de o app estar em light ou dark mode.
const DARK_BADGE_BG = "#0A0F0D";
const DARK_BADGE_TEXT = "#10B981";

export function Badge({ label, variant = "soft" }: BadgeProps) {
  const { colors } = useTheme();
  const { bg, text } =
    variant === "dark"
      ? { bg: DARK_BADGE_BG, text: DARK_BADGE_TEXT }
      : variant === "danger"
      ? { bg: colors.dangerSoft, text: colors.danger }
      : { bg: colors.primarySoft, text: colors.primary };

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: fontSizes.micro, fontWeight: "700" },
});
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/components/ui/Badge.tsx
git commit -m "feat(ui-kit): add Badge component"
```

---

### Task 4: `Button`

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`

**Interfaces:**
- Consumes: `useTheme()` → `colors.primary`, `colors.textMuted`; `radii`, `fontSizes` de `theme.ts`.
- Produces: `Button({ label, onPress, variant?, disabled?, loading?, testID?, style? }): JSX.Element`, `type ButtonVariant = "primary" | "secondary" | "ghost"`, exportados nomeados. Usado por `ScreenFooter` (Task 10) e por todas as telas de formulário na Fase 3.

- [ ] **Step 1: Implementar**

Crie `frontend/src/components/ui/Button.tsx`:

```tsx
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, fontSizes } from "../../utils/theme";

export type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = "primary", disabled, loading, testID, style }: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = Boolean(disabled || loading);

  const variantStyle: ViewStyle =
    variant === "primary"
      ? { backgroundColor: colors.primary }
      : variant === "secondary"
      ? { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.primary }
      : { backgroundColor: "transparent" };

  const textColor = variant === "primary" ? "#FFFFFF" : variant === "secondary" ? colors.primary : colors.textMuted;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.8}
      testID={testID}
      style={[
        styles.base,
        variantStyle,
        variant === "ghost" && styles.ghostPadding,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : colors.primary} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostPadding: { paddingVertical: 10 },
  disabled: { opacity: 0.6 },
  text: { fontSize: fontSizes.body, fontWeight: "800" },
});
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/components/ui/Button.tsx
git commit -m "feat(ui-kit): add Button component (primary/secondary/ghost)"
```

---

### Task 5: `TextField`

**Files:**
- Create: `frontend/src/components/ui/TextField.tsx`

**Interfaces:**
- Consumes: `useTheme()` → `colors.surface`, `colors.border`, `colors.primary`, `colors.textPrimary`, `colors.textSecondary`, `colors.textMuted`; `radii`, `spacing`, `fontSizes`.
- Produces: `TextField(props: TextFieldProps): JSX.Element` onde `TextFieldProps` estende `TextInputProps` do React Native com `label: string` e `prefix?: string` adicionais. Exportado nomeado.

- [ ] **Step 1: Implementar**

Crie `frontend/src/components/ui/TextField.tsx`:

```tsx
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, spacing, fontSizes } from "../../utils/theme";

interface TextFieldProps extends TextInputProps {
  label: string;
  prefix?: string;
}

export function TextField({ label, prefix, onFocus, onBlur, style, testID, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: focused ? colors.primary : colors.border,
          },
        ]}
      >
        {prefix ? <Text style={[styles.prefix, { color: colors.textMuted }]}>{prefix}</Text> : null}
        <TextInput
          testID={testID}
          style={[styles.input, { color: colors.textPrimary }, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSizes.small, fontWeight: "600", marginBottom: 6 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: 13,
  },
  prefix: { fontSize: fontSizes.body, fontWeight: "700", marginRight: 6 },
  input: { flex: 1, fontSize: fontSizes.body, fontWeight: "700", padding: 0 },
});
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/components/ui/TextField.tsx
git commit -m "feat(ui-kit): add TextField component"
```

---

### Task 6: `ChipGroup`

**Files:**
- Create: `frontend/src/components/ui/ChipGroup.tsx`

**Interfaces:**
- Consumes: `useTheme()` → `colors.primary`, `colors.surfaceAlt`, `colors.textSecondary`; `radii`, `spacing`, `fontSizes`.
- Produces: `ChipGroup({ options, selectedId, onSelect, testID? }): JSX.Element`, `interface ChipOption { id: string; label: string }`, exportados nomeados. Usado pelo formulário de categoria em "Adicionar Gasto" (Fase 3).

- [ ] **Step 1: Implementar**

Crie `frontend/src/components/ui/ChipGroup.tsx`:

```tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, spacing, fontSizes } from "../../utils/theme";

export interface ChipOption {
  id: string;
  label: string;
}

interface ChipGroupProps {
  options: ChipOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  testID?: string;
}

export function ChipGroup({ options, selectedId, onSelect, testID }: ChipGroupProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} testID={testID}>
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        return (
          <TouchableOpacity
            key={opt.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            activeOpacity={0.8}
            onPress={() => onSelect(opt.id)}
            testID={testID ? `${testID}-${opt.id}` : undefined}
            style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.surfaceAlt }]}
          >
            <Text style={[styles.text, { color: selected ? "#FFFFFF" : colors.textSecondary }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderRadius: radii.pill, paddingHorizontal: 13, paddingVertical: 8 },
  text: { fontSize: fontSizes.small, fontWeight: "700" },
});
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/components/ui/ChipGroup.tsx
git commit -m "feat(ui-kit): add ChipGroup component"
```

---

### Task 7: `Toggle`

**Files:**
- Create: `frontend/src/components/ui/Toggle.tsx`

**Interfaces:**
- Consumes: `useTheme()` → `colors.primary`, `colors.border`.
- Produces: `Toggle({ value, onValueChange, testID? }): JSX.Element`, exportado nomeado.

- [ ] **Step 1: Implementar**

Crie `frontend/src/components/ui/Toggle.tsx`:

```tsx
import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
}

export function Toggle({ value, onValueChange, testID }: ToggleProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      testID={testID}
      style={[styles.track, { backgroundColor: value ? colors.primary : colors.border }]}
    >
      <View style={[styles.knob, value ? styles.knobOn : styles.knobOff]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: { width: 42, height: 24, borderRadius: 20, padding: 2, justifyContent: "center" },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF" },
  knobOn: { alignSelf: "flex-end" },
  knobOff: { alignSelf: "flex-start" },
});
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/components/ui/Toggle.tsx
git commit -m "feat(ui-kit): add Toggle component"
```

---

### Task 8: `ListRow`

**Files:**
- Create: `frontend/src/components/ui/ListRow.tsx`

**Interfaces:**
- Consumes: `useTheme()` → `colors.surfaceAlt`, `colors.textPrimary`, `colors.textMuted`; `spacing`, `fontSizes`.
- Produces: `ListRow({ icon, title, subtitle?, value?, valueColor?, testID? }): JSX.Element`, exportado nomeado. `icon` é `React.ReactNode` (o chamador passa um `<Ionicons .../>` ou emoji já pronto).

- [ ] **Step 1: Implementar**

Crie `frontend/src/components/ui/ListRow.tsx`:

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { spacing, fontSizes } from "../../utils/theme";

interface ListRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  valueColor?: string;
  testID?: string;
}

export function ListRow({ icon, title, subtitle, value, valueColor, testID }: ListRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} testID={testID}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceAlt }]}>{icon}</View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={[styles.value, { color: valueColor ?? colors.textPrimary }]}>{value}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1 },
  title: { fontSize: fontSizes.small, fontWeight: "700" },
  subtitle: { fontSize: fontSizes.micro, marginTop: 2 },
  value: { fontSize: fontSizes.small, fontWeight: "700" },
});
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/components/ui/ListRow.tsx
git commit -m "feat(ui-kit): add ListRow component"
```

---

### Task 9: `QuickAction` e `SegmentedControl`

**Files:**
- Create: `frontend/src/components/ui/QuickAction.tsx`
- Create: `frontend/src/components/ui/SegmentedControl.tsx`

**Interfaces:**
- Consumes: `useTheme()` → `colors.primarySoft`, `colors.textSecondary`, `colors.surfaceAlt`, `colors.textPrimary`, `colors.surface`; `radii`, `fontSizes`.
- Produces: `QuickAction({ icon, label, onPress, testID? }): JSX.Element`; `SegmentedControl({ options, selectedId, onSelect, testID? }): JSX.Element` com `interface SegmentOption { id: string; label: string }`. Todos exportados nomeados.

- [ ] **Step 1: Implementar `QuickAction`**

Crie `frontend/src/components/ui/QuickAction.tsx`:

```tsx
import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { fontSizes } from "../../utils/theme";

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  testID?: string;
}

export function QuickAction({ icon, label, onPress, testID }: QuickActionProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} onPress={onPress} testID={testID} style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>{icon}</View>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", flex: 1, gap: 6 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  label: { fontSize: fontSizes.micro, fontWeight: "600" },
});
```

- [ ] **Step 2: Implementar `SegmentedControl`**

Crie `frontend/src/components/ui/SegmentedControl.tsx`:

```tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, fontSizes } from "../../utils/theme";

export interface SegmentOption {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  testID?: string;
}

export function SegmentedControl({ options, selectedId, onSelect, testID }: SegmentedControlProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceAlt }]} testID={testID}>
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        return (
          <TouchableOpacity
            key={opt.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(opt.id)}
            testID={testID ? `${testID}-${opt.id}` : undefined}
            style={[styles.option, selected && { backgroundColor: colors.textPrimary }]}
          >
            <Text style={[styles.text, { color: selected ? colors.surface : colors.textSecondary }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", borderRadius: radii.pill, padding: 4, alignSelf: "flex-start" },
  option: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.pill },
  text: { fontSize: fontSizes.small, fontWeight: "700" },
});
```

- [ ] **Step 3: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/components/ui/QuickAction.tsx src/components/ui/SegmentedControl.tsx
git commit -m "feat(ui-kit): add QuickAction and SegmentedControl components"
```

---

### Task 10: `ScreenFooter`

**Files:**
- Create: `frontend/src/components/ui/ScreenFooter.tsx`

**Interfaces:**
- Consumes: `useTheme()` → `colors.background`, `colors.border`; `spacing` de `theme.ts`.
- Produces: `ScreenFooter({ children }): JSX.Element`, exportado nomeado. Espera receber `Button`s (Task 4) como filhos.

- [ ] **Step 1: Implementar**

Crie `frontend/src/components/ui/ScreenFooter.tsx`:

```tsx
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { spacing } from "../../utils/theme";

interface ScreenFooterProps {
  children: React.ReactNode;
}

export function ScreenFooter({ children }: ScreenFooterProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.base,
    gap: spacing.sm,
  },
});
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/components/ui/ScreenFooter.tsx
git commit -m "feat(ui-kit): add ScreenFooter component"
```

---

### Task 11: Barrel export + tela de smoke-test `/dev-ui-kit` + verificação final

**Files:**
- Create: `frontend/src/components/ui/index.ts`
- Create: `frontend/app/dev-ui-kit.tsx`

**Interfaces:**
- Consumes: todos os exports das Tasks 2–10 (`Card`, `Badge`+`BadgeVariant`, `Button`+`ButtonVariant`, `TextField`, `ChipGroup`+`ChipOption`, `Toggle`, `ListRow`, `QuickAction`, `SegmentedControl`+`SegmentOption`, `ScreenFooter`).
- Produces: `frontend/src/components/ui/index.ts` como ponto único de import (`import { Card, Button, ... } from "../src/components/ui"`) para as Fases 2 e 3.

- [ ] **Step 1: Criar o barrel export**

Crie `frontend/src/components/ui/index.ts`:

```typescript
export { Card } from "./Card";
export { Badge } from "./Badge";
export type { BadgeVariant } from "./Badge";
export { Button } from "./Button";
export type { ButtonVariant } from "./Button";
export { TextField } from "./TextField";
export { ChipGroup } from "./ChipGroup";
export type { ChipOption } from "./ChipGroup";
export { Toggle } from "./Toggle";
export { ListRow } from "./ListRow";
export { QuickAction } from "./QuickAction";
export { SegmentedControl } from "./SegmentedControl";
export type { SegmentOption } from "./SegmentedControl";
export { ScreenFooter } from "./ScreenFooter";
```

- [ ] **Step 2: Criar a tela de smoke-test**

Crie `frontend/app/dev-ui-kit.tsx` — rota real do Expo Router (`/dev-ui-kit`), sem link em nenhuma navegação, usada só pra ver todos os componentes juntos:

```tsx
import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/providers/ThemeProvider";
import { spacing, fontSizes } from "../src/utils/theme";
import {
  Card,
  Badge,
  Button,
  TextField,
  ChipGroup,
  Toggle,
  ListRow,
  QuickAction,
  SegmentedControl,
  ScreenFooter,
  type ChipOption,
  type SegmentOption,
} from "../src/components/ui";

const CATEGORY_OPTIONS: ChipOption[] = [
  { id: "food", label: "Alimentação" },
  { id: "transport", label: "Transporte" },
  { id: "bills", label: "Contas" },
];

const PERIOD_OPTIONS: SegmentOption[] = [
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
  { id: "year", label: "Ano" },
];

export default function DevUiKitScreen() {
  const { colors } = useTheme();
  const [category, setCategory] = useState("food");
  const [period, setPeriod] = useState("month");
  const [recurring, setRecurring] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.section, { color: colors.textMuted }]}>CARD + BADGE</Text>
        <Card style={{ gap: spacing.sm }}>
          <Badge label="Plano Pro ativo" variant="soft" />
          <Badge label="Economize 50%" variant="dark" />
          <Badge label="Limite atingido" variant="danger" />
        </Card>

        <Text style={[styles.section, { color: colors.textMuted }]}>BUTTON</Text>
        <Button label="Salvar gasto" onPress={() => {}} variant="primary" testID="dev-btn-primary" />
        <View style={{ height: spacing.sm }} />
        <Button label="Cancelar" onPress={() => {}} variant="secondary" testID="dev-btn-secondary" />
        <View style={{ height: spacing.sm }} />
        <Button label="Esqueci minha senha" onPress={() => {}} variant="ghost" testID="dev-btn-ghost" />

        <Text style={[styles.section, { color: colors.textMuted }]}>TEXTFIELD</Text>
        <TextField label="Valor" prefix="R$" placeholder="0,00" keyboardType="decimal-pad" testID="dev-field-valor" />

        <Text style={[styles.section, { color: colors.textMuted }]}>CHIPGROUP</Text>
        <ChipGroup options={CATEGORY_OPTIONS} selectedId={category} onSelect={setCategory} testID="dev-chips" />

        <Text style={[styles.section, { color: colors.textMuted }]}>SEGMENTEDCONTROL</Text>
        <SegmentedControl options={PERIOD_OPTIONS} selectedId={period} onSelect={setPeriod} testID="dev-segment" />

        <Text style={[styles.section, { color: colors.textMuted }]}>TOGGLE</Text>
        <View style={styles.row}>
          <Text style={{ color: colors.textPrimary }}>Gasto recorrente</Text>
          <Toggle value={recurring} onValueChange={setRecurring} testID="dev-toggle" />
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>QUICKACTION (grid)</Text>
        <View style={styles.row}>
          <QuickAction icon={<Ionicons name="add" size={20} color={colors.primary} />} label="Gasto" onPress={() => {}} testID="dev-qa-gasto" />
          <QuickAction icon={<Ionicons name="document-text-outline" size={20} color={colors.primary} />} label="Contas" onPress={() => {}} testID="dev-qa-contas" />
          <QuickAction icon={<Ionicons name="download-outline" size={20} color={colors.primary} />} label="Exportar" onPress={() => {}} testID="dev-qa-exportar" />
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>LISTROW</Text>
        <Card>
          <ListRow
            icon={<Ionicons name="fast-food-outline" size={16} color={colors.primary} />}
            title="iFood"
            subtitle="Hoje, 19:42"
            value="-R$ 42,00"
            valueColor={colors.danger}
            testID="dev-row-1"
          />
          <ListRow
            icon={<Ionicons name="flash-outline" size={16} color={colors.primary} />}
            title="Energia"
            subtitle="Ontem"
            value="-R$ 180,00"
            valueColor={colors.danger}
            testID="dev-row-2"
          />
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      <ScreenFooter>
        <Button label="Salvar gasto" onPress={() => {}} variant="primary" testID="dev-footer-primary" />
        <Button label="Cancelar" onPress={() => {}} variant="ghost" testID="dev-footer-ghost" />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.base },
  section: { fontSize: fontSizes.micro, fontWeight: "800", letterSpacing: 1, marginTop: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
});
```

- [ ] **Step 3: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 4: Rodar todos os testes**

Run: `cd frontend && npm test`
Expected: PASS (`theme.test.ts` + `MonetizationService.test.ts`, sem regressão)

- [ ] **Step 5: Verificação visual manual completa**

Run: `cd frontend && npx expo start --web`, navegue manualmente para `http://localhost:8081/dev-ui-kit` (ajuste a porta se o Expo escolher outra). Confira, em **light e dark mode**:
- Os 3 badges têm contraste de texto legível.
- Os 3 botões (primary/secondary/ghost) têm hierarquia visual clara.
- O campo de texto mostra o prefixo "R$" e o placeholder.
- Os chips de categoria alternam seleção ao clicar.
- O segmented control alterna seleção ao clicar.
- O toggle alterna e anima a posição do knob ao clicar.
- As 3 quick actions ficam lado a lado, ícone + label.
- As linhas de lista mostram ícone, título, subtítulo e valor em vermelho.
- O rodapé (`ScreenFooter`) fica fixo na parte inferior da tela, com sombra sutil separando do conteúdo, mesmo rolando a tela.

Se algo estiver visualmente quebrado, corrija o componente correspondente (não este arquivo de smoke-test) antes de prosseguir.

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/components/ui/index.ts app/dev-ui-kit.tsx
git commit -m "feat(ui-kit): add barrel export and /dev-ui-kit smoke-test screen"
```

---

## Self-Review (executado ao escrever este plano)

**Cobertura da spec:** todos os 10 componentes listados na seção "Kit de componentes (Fase 1)" da spec têm uma task (`Card`, `Button`, `TextField`, `ChipGroup`/`Chip`, `Toggle`, `Badge`, `ListRow`, `QuickAction`, `SegmentedControl`, `ScreenFooter`). A "Nota sobre tokens de cor" da spec é resolvida na Task 1, com a decisão documentada. Nenhuma tela real é tocada, conforme escopo da Fase 1.

**Placeholders:** nenhum "TBD"/"implementar depois" — toda task tem código completo.

**Consistência de tipos:** `ChipOption`, `SegmentOption`, `BadgeVariant`, `ButtonVariant` são definidos uma vez (Tasks 3, 4, 6, 9) e consumidos com o mesmo nome na Task 11. Todos os componentes usam `useTheme()` da mesma forma (`const { colors } = useTheme()`), consistente com o padrão já usado em `plans.tsx` e `ExpensesProvider.tsx`.

---

## Próximos passos (fora deste plano)

Fase 2 (Início, Resumo, Perfil) e Fase 3 (telas restantes) serão planos separados, escritos **depois** que este kit estiver implementado e revisado — assim os planos seguintes referenciam as props e nomes reais dos componentes, em vez de assumidos antecipadamente.
