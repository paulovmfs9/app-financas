# Redesign Visual — Fase 3: Auth, Onboarding, Formulários, Planos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle as últimas 7 telas do app (Login, Registro, Esqueci senha, Onboarding, Adicionar Gasto, Contas Fixas, Planos) em cima do kit de componentes das Fases 1/2, fechando o redesign visual completo do app.

**Architecture:** Cada tela recebe o mesmo tratamento das Fases 1/2 — troca de elementos manuais por `frontend/src/components/ui/*`, preservando toda a lógica de negócio (validação, chamadas Firebase, navegação) byte a byte. Uma extensão pequena e aditiva do kit (`ChipGroup` ganha ícone+cor por opção) é necessária pra cobrir os chips de categoria de Adicionar Gasto. `ScreenFooter` vira o padrão de CTA fixo em toda tela de formulário desta fase.

**Tech Stack:** React Native (Expo SDK 54), TypeScript, kit `frontend/src/components/ui/`, `expo-router` (navegação imperativa via `useRouter()`), Firebase (Auth/Firestore via os providers/services já existentes). `node:test` só se alguma lógica pura nova aparecer (não é esperado nesta fase — é só reestilo).

**Spec:** `docs/superpowers/specs/2026-08-26-visual-redesign-design.md`

## Global Constraints

- Manter a paleta verde/branco/preto existente — nenhuma cor nova fora do estritamente necessário.
- Sem novas libs de gráfico, animação pesada, ou dependências grandes.
- `npx tsc --noEmit` limpo a cada task.
- **`eslint` limpo a cada task** (novo nesta fase — a Fase 2 só rodou lint na revisão final e isso deixou passar 2 erros reais por várias tasks; aqui roda a cada task): `cd frontend && ./node_modules/.bin/eslint <arquivos-da-task> --max-warnings=0`. `npm run lint`/`expo lint` falha neste ambiente por falta do binário `yarn` — limitação pré-existente do ambiente, não tentar corrigir, só usar o eslint direto.
- Todo componente novo/alterado consome cor via `useTheme()` — nunca hardcode um hex que já tem token, exceto casos deliberados e já documentados (`Badge` variante "dark", bloco "Dica do dia" do Resumo).
- `ScreenFooter` para o CTA principal de toda tela de formulário desta fase, exceto `plans.tsx` (ver decisão 4). Telas que adotam `ScreenFooter` devem trocar `edges={["top", "bottom"]}` para `edges={["top"]}` na `SafeAreaView` (o `ScreenFooter` já aplica o inset de baixo sozinho — ver seu comentário em `ScreenFooter.tsx`; aplicar os dois juntos duplicaria o espaçamento).
- Cada task termina com commit.

---

## Decisões tomadas nesta fase

1. **`ChipGroup` ganha ícone + cor por opção, de forma aditiva.** Os chips de categoria de `add-expense.tsx` precisam de um ícone à esquerda e um realce de cor por categoria (vindo de `CATEGORIES` em `frontend/src/models/Category.ts` — 9 categorias, cada uma com `{id, name, icon, color, keywords}`), e o `ChipGroup`/`ChipOption` atual (`{id, label}` só) não cobre isso. Mesma categoria de lacuna que a Fase 2 resolveu no `ListRow` (com `iconBg?: string`) — mesma resolução aqui: estender o componente do kit de forma pontual e aditiva, em vez de duplicar a lógica de seleção-por-chip numa versão hand-rolled só para esta tela. `icon` é um `React.ReactNode` estático já colorido pelo chamador (mesma convenção de `ListRow.icon`/`QuickAction.icon` — não é uma função, quem decide a cor do ícone é quem monta o `ChipOption`). `color`, quando presente, controla só o estado SELECIONADO (fundo `color + "22"`, borda de 1px em `color`, texto em `color`); sem `color`, o selecionado se comporta exatamente como hoje (`colors.primary` cheio, texto `colors.onPrimary`, sem borda) — 100% compatível com o uso atual em `/dev-ui-kit` (`ChipOption`s simples, sem ícone/cor). O estado não-selecionado nunca muda (`colors.surfaceAlt`/`colors.textSecondary`), com ou sem `color`/`icon`.

2. **Links secundários de navegação (Esqueci minha senha, Criar conta, Já tem conta, Voltar para entrar, Reenviar email) viram `Button` variante `ghost` dentro do `ScreenFooter`, com navegação IMPERATIVA via `router.push`/`router.replace`, não mais `<Link href=... asChild>`.** `Button.onPress` é obrigatório na interface do kit; compor isso com o padrão `Link asChild` (que injeta seu próprio `onPress` no filho) é um comportamento não verificado nesta base de código — mais simples e seguro trocar para navegação imperativa, que já é o padrão usado em todo o resto do app (Início, Resumo, Perfil todos usam `router.push`). Isso significa que `login.tsx` MANTÉM seu `useRouter()` (ao contrário do que uma leitura rápida sugeriria — ver decisão 3) e `register.tsx` GANHA um `useRouter()` que não tinha antes. O componente `Link` do `expo-router` some de todas as 3 telas de auth.

3. **Correção da leitura anterior sobre o `router` não utilizado do `login.tsx`.** Uma nota de pesquisa anterior identificou `const router = useRouter();` como código morto em `login.tsx` (nenhuma chamada `router.` existia, navegação era só via `<Link>`). Isso era verdade no código ANTES desta fase. Com a decisão 2 (navegação imperativa), `router` deixa de ser código morto — ele passa a ser usado para os 2 links secundários da tela. Não remover.

4. **`plans.tsx` NÃO ganha `ScreenFooter`.** É uma tela de seleção com botão de ação por card (`Assinar`/`Plano atual`), não um formulário com um CTA global — os botões de ação continuam como `Button` do kit dentro de cada `PlanCard`, sem rodapé fixo.

5. **`plans.tsx` recebe sua primeira adoção do kit** (confirmado por leitura direta: zero imports de `frontend/src/components/ui/` hoje, 100% `StyleSheet` local). O componente local `function PlanCard({...})` mantém o nome (sem colisão — não se chama `Card`), mas sua marcação interna troca para `Card`/`Badge`/`Button`/`SegmentedControl` do kit onde encaixa: container do card → `Card` do kit, envolvido por uma `View` simples com o `testID` (padrão já usado no card de gráfico do Resumo na Fase 2, já que `Card` não tem prop `testID`); selo "Mais escolhido"/selo de economia → `Badge`; alternância mensal/anual → `SegmentedControl`; botões de ação → `Button`. A lógica de `startSubscription`, os dados de `MonetizationService` (`PLAN_DEFINITIONS`/`normalizePlanKey`/`annualSavingsPercent`) e todas as regras condicionais de estilo (`active`/`highlighted`/`disabled`) continuam exatamente como estão — só a marcação que as renderiza muda.

6. **Login + Registro entram numa task só.** Confirmado por leitura direta: os dois arquivos compartilham um objeto `styles` quase idêntico (`safe/scroll/brandWrap/dot/brand/title/subtitle/label/input/error/primaryBtn/primaryBtnText/forgotBtn/footer`) e a mesma estrutura (marca, título/subtítulo, campos, texto de erro, botão primário, links secundários) — é trabalho genuinamente do mesmo formato, não dois desenhos distintos. Esqueci senha NÃO entra nessa task — sua máquina de estados de 2 passos e o campo extra (`code`) fazem dela uma tela distinta o bastante pra task própria.

7. **`fixed-bills.tsx`: o botão Salvar vai para um `ScreenFooter`.** Hoje o botão fica no meio do corpo rolável, seguido pela lista de contas cadastradas — ou seja, ele deixa de estar alcançável sem rolar assim que a lista cresce. Mover para um `ScreenFooter` fixo é uma melhoria de UX deliberada, não só estética: o Salvar fica sempre alcançável, e a tela passa a seguir o mesmo padrão de toda tela de formulário desta fase. O card de resumo, os campos do formulário e a lista de contas cadastradas continuam no corpo rolável, acima do rodapé.

8. **`fixed-bills.tsx`: a lista de contas cadastradas adota `ListRow`**, reaproveitando exatamente o padrão já validado na Fase 2 para a lista de gastos recentes de Início — cada item vira `<View style={{flex:1}}><ListRow .../></View>` ao lado do botão de excluir (que `ListRow` não tem slot pra acomodar), dentro de um wrapper `View` com `flexDirection: "row"`, tudo dentro de um `Card` único (divisórias entre itens, não uma caixa bordada por item como é hoje) — mesma estrutura visual que Início usa pra sua lista de gastos.

9. **QA visual final**: ao contrário de Início/Resumo/Perfil (Fase 2), as 3 telas de auth (`login.tsx`, `register.tsx`, `forgot-password.tsx`) são alcançáveis SEM nenhum bypass de autenticação — o `Gate` em `frontend/app/_layout.tsx` redireciona qualquer visita não-autenticada exatamente pra essas telas, então elas são o ponto de entrada natural deslogado. Só `onboarding.tsx`, `add-expense.tsx`, `fixed-bills.tsx` e `plans.tsx` precisam do mesmo bypass temporário e não-commitado do `Gate` já usado com sucesso nas Fases 1 e 2.

---

### Task 1: `ChipGroup` — ícone + cor por opção

**Files:**
- Modify: `frontend/src/components/ui/ChipGroup.tsx`

**Interfaces:**
- Consumes: `useTheme()` → `colors.primary`, `colors.surfaceAlt`, `colors.textSecondary`, `colors.onPrimary`; `radii`, `spacing`, `fontSizes`.
- Produces: `ChipOption` agora com `icon?: React.ReactNode` e `color?: string` adicionados (compatível com o shape atual `{id, label}` — ambos os campos novos são opcionais). `ChipGroupProps` sem mudança de shape. Task 5 consome o novo shape.

- [ ] **Step 1: Implementar**

Substitua todo o conteúdo de `frontend/src/components/ui/ChipGroup.tsx` por:

```tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { radii, spacing, fontSizes } from "../../utils/theme";

export interface ChipOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

export interface ChipGroupProps {
  options: ChipOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  testID?: string;
}

// ChipGroup: selectable set where nothing may be selected (e.g. optional
// category filter — selectedId is nullable) — contrast with SegmentedControl.
export function ChipGroup({ options, selectedId, onSelect, testID }: ChipGroupProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row} testID={testID}>
      {options.map((opt) => {
        const selected = opt.id === selectedId;
        const tint = opt.color;
        const bg = selected ? (tint ? tint + "22" : colors.primary) : colors.surfaceAlt;
        const fg = selected ? (tint ?? colors.onPrimary) : colors.textSecondary;
        return (
          <TouchableOpacity
            key={opt.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            activeOpacity={0.8}
            onPress={() => onSelect(opt.id)}
            testID={testID ? `${testID}-${opt.id}` : undefined}
            style={[
              styles.chip,
              { backgroundColor: bg },
              selected && tint ? { borderWidth: 1, borderColor: tint } : null,
            ]}
          >
            {opt.icon}
            <Text style={[styles.text, { color: fg }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radii.pill, paddingHorizontal: 13, paddingVertical: 8 },
  text: { fontSize: fontSizes.small, fontWeight: "700" },
});
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Checar lint**

Run: `cd frontend && ./node_modules/.bin/eslint src/components/ui/ChipGroup.tsx app/dev-ui-kit.tsx --max-warnings=0`
Expected: sem erros (o uso existente em `/dev-ui-kit`, sem ícone/cor, deve continuar funcionando sem alteração)

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/components/ui/ChipGroup.tsx
git commit -m "feat(ui-kit): add optional icon and color to ChipGroup/ChipOption"
```

---

### Task 2: Login + Registro

**Files:**
- Modify: `frontend/app/(auth)/login.tsx`
- Modify: `frontend/app/(auth)/register.tsx`

**Interfaces:**
- Consumes: `TextField`, `Button`, `ScreenFooter` de `../../src/components/ui`.
- Produces: nada consumido por outra task.

- [ ] **Step 1: Reescrever `login.tsx`**

Substitua todo o conteúdo de `frontend/app/(auth)/login.tsx` por:

```tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/providers/ThemeProvider";
import { useAuth } from "../../src/providers/AuthProvider";
import { friendlyAuthError } from "../../src/services/AuthService";
import { spacing, fontSizes } from "../../src/utils/theme";
import { isEmail, isStrongEnoughPassword } from "../../src/utils/validation";
import { TextField, Button, ScreenFooter } from "../../src/components/ui";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!isEmail(email)) {
      setError("Informe um email válido.");
      return;
    }
    if (!isStrongEnoughPassword(password)) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // Gate will handle navigation after auth state changes.
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandWrap}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.brand, { color: colors.textPrimary }]}>Saldo</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Bem-vindo de volta</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Entre para ver suas finanças do mês.
          </Text>

          <View style={{ height: spacing.xxl }} />

          <TextField
            testID="login-email-input"
            label="Email"
            placeholder="voce@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />

          <View style={{ height: spacing.base }} />
          <TextField
            testID="login-password-input"
            label="Senha"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <Text testID="login-error" style={[styles.error, { color: colors.danger }]}>{error}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ScreenFooter>
        <Button testID="login-submit-button" label="Entrar" onPress={onSubmit} loading={loading} variant="primary" />
        <Button
          testID="login-forgot-password"
          label="Esqueci minha senha"
          onPress={() => router.push("/(auth)/forgot-password" as any)}
          variant="ghost"
        />
        <Button
          testID="login-go-register"
          label="Não tem conta? Criar conta"
          onPress={() => router.push("/(auth)/register" as any)}
          variant="ghost"
        />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl, flexGrow: 1 },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.xxxl },
  dot: { width: 14, height: 14, borderRadius: 7 },
  brand: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  title: { fontSize: fontSizes.h1, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { fontSize: fontSizes.body, marginTop: 8 },
  error: { marginTop: spacing.base, fontSize: fontSizes.small },
});
```

Nota: o `<ScreenFooter>` fica FORA do `<KeyboardAvoidingView>`, como um irmão dele dentro da `SafeAreaView` — mesma estrutura já usada em `add-expense.tsx` hoje (`<SafeAreaView><KeyboardAvoidingView>...</KeyboardAvoidingView><View style={styles.footer}>...</View></SafeAreaView>`), só que agora com `ScreenFooter` no lugar da `View` manual.

- [ ] **Step 2: Reescrever `register.tsx`**

Substitua todo o conteúdo de `frontend/app/(auth)/register.tsx` por:

```tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/providers/ThemeProvider";
import { useAuth } from "../../src/providers/AuthProvider";
import { friendlyAuthError } from "../../src/services/AuthService";
import { spacing, fontSizes } from "../../src/utils/theme";
import { isEmail, isNonEmpty, isStrongEnoughPassword } from "../../src/utils/validation";
import { TextField, Button, ScreenFooter } from "../../src/components/ui";

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!isNonEmpty(name)) {
      setError("Informe seu nome.");
      return;
    }
    if (!isEmail(email)) {
      setError("Informe um email válido.");
      return;
    }
    if (!isStrongEnoughPassword(password)) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name);
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandWrap}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.brand, { color: colors.textPrimary }]}>Saldo</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Crie sua conta</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Em segundos, você assume o controle do seu mês.
          </Text>

          <View style={{ height: spacing.xxl }} />

          <TextField
            testID="register-name-input"
            label="Nome"
            placeholder="Como devemos te chamar?"
            value={name}
            onChangeText={setName}
          />

          <View style={{ height: spacing.base }} />
          <TextField
            testID="register-email-input"
            label="Email"
            placeholder="voce@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={{ height: spacing.base }} />
          <TextField
            testID="register-password-input"
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <Text testID="register-error" style={[styles.error, { color: colors.danger }]}>{error}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ScreenFooter>
        <Button testID="register-submit-button" label="Criar conta" onPress={onSubmit} loading={loading} variant="primary" />
        <Button
          testID="register-forgot-password"
          label="Esqueci minha senha"
          onPress={() => router.push("/(auth)/forgot-password" as any)}
          variant="ghost"
        />
        <Button
          testID="register-go-login"
          label="Já tem uma conta? Entrar"
          onPress={() => router.push("/(auth)/login" as any)}
          variant="ghost"
        />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl, flexGrow: 1 },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.xxxl },
  dot: { width: 14, height: 14, borderRadius: 7 },
  brand: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  title: { fontSize: fontSizes.h1, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { fontSize: fontSizes.body, marginTop: 8 },
  error: { marginTop: spacing.base, fontSize: fontSizes.small },
});
```

- [ ] **Step 3: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 4: Checar lint**

Run: `cd frontend && ./node_modules/.bin/eslint "app/(auth)/login.tsx" "app/(auth)/register.tsx" --max-warnings=0`
Expected: sem erros

- [ ] **Step 5: Commit**

```bash
cd frontend
git add "app/(auth)/login.tsx" "app/(auth)/register.tsx"
git commit -m "feat(fase3): restyle Login and Registro onto the ui kit"
```

---

### Task 3: Esqueci senha (`forgot-password.tsx`)

**Files:**
- Modify: `frontend/app/(auth)/forgot-password.tsx`

**Interfaces:**
- Consumes: `TextField`, `Button`, `ScreenFooter` de `../../src/components/ui`.
- Produces: nada consumido por outra task.

- [ ] **Step 1: Reescrever**

Substitua todo o conteúdo de `frontend/app/(auth)/forgot-password.tsx` por:

```tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/providers/ThemeProvider";
import { AuthService, friendlyAuthError } from "../../src/services/AuthService";
import { spacing, fontSizes } from "../../src/utils/theme";
import { isEmail, isStrongEnoughPassword } from "../../src/utils/validation";
import { TextField, Button, ScreenFooter } from "../../src/components/ui";

type Step = "email" | "code";

function extractResetCode(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const match = trimmed.match(/[?&]oobCode=([^&#]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);

  return trimmed;
}

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSendCode = async () => {
    setError(null);
    setMessage(null);

    if (!isEmail(email)) {
      setError("Informe o email cadastrado.");
      return;
    }

    setLoading(true);
    try {
      await AuthService.sendPasswordReset(email);
      setMessage("Enviamos um email de confirmação. Copie o código do link recebido ou cole o link completo abaixo.");
      setStep("code");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    setError(null);
    setMessage(null);

    const resetCode = extractResetCode(code);
    if (!resetCode) {
      setError("Informe o código ou cole o link recebido por email.");
      return;
    }
    if (!isStrongEnoughPassword(password)) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await AuthService.verifyPasswordResetCode(resetCode);
      await AuthService.confirmPasswordReset(resetCode, password);
      setMessage("Senha alterada com sucesso. Entre com sua nova senha.");
      setTimeout(() => router.replace("/(auth)/login"), 900);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandWrap}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.brand, { color: colors.textPrimary }]}>Saldo</Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Recuperar senha</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Confirme seu email e use o código recebido para criar uma nova senha.
          </Text>

          <View style={{ height: spacing.xxl }} />

          <TextField
            testID="forgot-email-input"
            label="Email cadastrado"
            placeholder="voce@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={step === "email" && !loading}
            value={email}
            onChangeText={setEmail}
          />

          {step === "code" ? (
            <>
              <View style={{ height: spacing.base }} />
              <TextField
                testID="forgot-code-input"
                label="Código ou link recebido"
                placeholder="Cole aqui o código ou link do email"
                autoCapitalize="none"
                multiline
                style={styles.multilineInput}
                value={code}
                onChangeText={setCode}
              />

              <View style={{ height: spacing.base }} />
              <TextField
                testID="forgot-password-input"
                label="Nova senha"
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <View style={{ height: spacing.base }} />
              <TextField
                testID="forgot-confirm-password-input"
                label="Confirmar nova senha"
                placeholder="Digite novamente"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </>
          ) : null}

          {message ? <Text testID="forgot-message" style={[styles.message, { color: colors.success }]}>{message}</Text> : null}
          {error ? <Text testID="forgot-error" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ScreenFooter>
        <Button
          testID={step === "email" ? "forgot-send-code-button" : "forgot-reset-button"}
          label={step === "email" ? "Enviar código" : "Criar nova senha"}
          onPress={step === "email" ? onSendCode : onResetPassword}
          loading={loading}
          variant="primary"
        />
        {step === "code" ? (
          <Button testID="forgot-resend-button" label="Reenviar email" onPress={onSendCode} variant="ghost" disabled={loading} />
        ) : null}
        <Button
          testID="forgot-go-login"
          label="Voltar para entrar"
          onPress={() => router.push("/(auth)/login" as any)}
          variant="ghost"
        />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl, flexGrow: 1 },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.xxxl },
  dot: { width: 14, height: 14, borderRadius: 7 },
  brand: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  title: { fontSize: fontSizes.h1, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { fontSize: fontSizes.body, marginTop: 8 },
  multilineInput: { minHeight: 86, textAlignVertical: "top" },
  message: { marginTop: spacing.base, fontSize: fontSizes.small, lineHeight: 20 },
  error: { marginTop: spacing.base, fontSize: fontSizes.small },
});
```

Nota: `TextField` estende `TextInputProps`, então `multiline`/`editable`/`autoComplete`/`keyboardType`/`autoCapitalize`/`secureTextEntry` passam direto pro `TextInput` interno via `{...rest}` — nenhuma prop nova precisa ser adicionada ao componente do kit pra esta task funcionar. `style={styles.multilineInput}` no `TextField` do código atinge o `TextInput` interno (não o container) — comportamento já documentado como conhecido no kit (`TextField`'s `style` mira o input, não o container).

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Checar lint**

Run: `cd frontend && ./node_modules/.bin/eslint "app/(auth)/forgot-password.tsx" --max-warnings=0`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
cd frontend
git add "app/(auth)/forgot-password.tsx"
git commit -m "feat(fase3): restyle Esqueci senha onto the ui kit"
```

---

### Task 4: Onboarding

**Files:**
- Modify: `frontend/app/onboarding.tsx`

**Interfaces:**
- Consumes: `TextField`, `Button`, `ScreenFooter` de `../src/components/ui`.
- Produces: nada consumido por outra task.

- [ ] **Step 1: Reescrever**

Substitua todo o conteúdo de `frontend/app/onboarding.tsx` por:

```tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/providers/ThemeProvider";
import { useAuth } from "../src/providers/AuthProvider";
import { spacing, fontSizes } from "../src/utils/theme";
import { parseBRL } from "../src/utils/format";
import { friendlyFirebaseError } from "../src/utils/errors";
import { TextField, Button, ScreenFooter } from "../src/components/ui";

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { profile, updateProfile } = useAuth();
  const [salary, setSalary] = useState("");
  const [bills, setBills] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    const s = parseBRL(salary);
    const b = parseBRL(bills);
    if (s <= 0) {
      setError("Informe um salário válido.");
      return;
    }
    setLoading(true);
    try {
      await updateProfile({ monthly_salary: s, fixed_bills_total: b, onboarded: true });
    } catch (e: any) {
      setError(friendlyFirebaseError(e, "Não foi possível salvar seu perfil."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Olá, {profile?.name?.split(" ")[0] || "tudo bem"}
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Vamos começar?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Conte rapidinho sua renda e contas fixas. Você pode mudar depois no Perfil.
          </Text>

          <View style={{ height: spacing.xxl }} />

          <TextField
            testID="onboarding-salary-input"
            label="Sua renda do mês"
            prefix="R$"
            placeholder="0,00"
            keyboardType="decimal-pad"
            value={salary}
            onChangeText={setSalary}
          />

          <View style={{ height: spacing.lg }} />

          <TextField
            testID="onboarding-bills-input"
            label="Contas fixas (aluguel, internet…)"
            prefix="R$"
            placeholder="0,00 (opcional)"
            keyboardType="decimal-pad"
            value={bills}
            onChangeText={setBills}
          />

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ScreenFooter>
        <Button testID="onboarding-continue-button" label="Continuar" onPress={onSubmit} loading={loading} variant="primary" />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxxl, flexGrow: 1 },
  greeting: { fontSize: fontSizes.body, marginBottom: 6 },
  title: { fontSize: fontSizes.h1, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { fontSize: fontSizes.body, marginTop: 8, lineHeight: 22 },
  error: { marginTop: spacing.base, fontSize: fontSizes.small },
});
```

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Checar lint**

Run: `cd frontend && ./node_modules/.bin/eslint app/onboarding.tsx --max-warnings=0`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
cd frontend
git add app/onboarding.tsx
git commit -m "feat(fase3): restyle Onboarding onto the ui kit"
```

---

### Task 5: Adicionar Gasto (`add-expense.tsx`)

**Files:**
- Modify: `frontend/app/add-expense.tsx`

**Interfaces:**
- Consumes: `TextField`, `ChipGroup` (com `icon`/`color` da Task 1), `ScreenFooter`, `Button` de `../src/components/ui`; `CATEGORIES` de `../src/models/Category` (já importado hoje).
- Produces: nada consumido por outra task.

- [ ] **Step 1: Reescrever**

Substitua todo o conteúdo de `frontend/app/add-expense.tsx` por:

```tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/providers/ThemeProvider";
import { useExpenses } from "../src/providers/ExpensesProvider";
import { spacing, radii, fontSizes } from "../src/utils/theme";
import { parseBRL } from "../src/utils/format";
import { friendlyFirebaseError } from "../src/utils/errors";
import { CATEGORIES, suggestCategory } from "../src/models/Category";
import { isExpenseLimitError } from "../src/services/MonetizationService";
import { TextField, ChipGroup, ScreenFooter, Button, type ChipOption } from "../src/components/ui";

export default function AddExpenseScreen() {
  const { colors } = useTheme();
  const { addExpense } = useExpenses();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string>("outros");
  const [autoMode, setAutoMode] = useState(true);
  const [saving, setSaving] = useState(false);

  // Live category suggestion from description (debounced).
  useEffect(() => {
    if (!autoMode || !description.trim()) return;
    const t = setTimeout(() => setSelected(suggestCategory(description)), 250);
    return () => clearTimeout(t);
  }, [description, autoMode]);

  const categoryOptions: ChipOption[] = CATEGORIES.map((c) => ({
    id: c.id,
    label: c.name,
    color: c.color,
    icon: <Ionicons name={c.icon as any} size={14} color={c.color} />,
  }));

  const onSave = async () => {
    if (saving) return;
    Keyboard.dismiss();

    const value = parseBRL(amount);
    if (value <= 0) {
      Alert.alert("Valor inválido", "Digite um valor maior que zero.");
      return;
    }
    setSaving(true);
    try {
      await addExpense({
        amount: value,
        category: selected,
        description: description.trim(),
        date: Date.now(),
      });
      router.back();
    } catch (e: any) {
      if (!isExpenseLimitError(e)) {
        Alert.alert("Erro", friendlyFirebaseError(e, "Não foi possível salvar o gasto."));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity testID="add-expense-close" onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Novo gasto</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.amountWrap}>
            <Text style={[styles.amountPrefix, { color: colors.textMuted }]}>R$</Text>
            <TextInput
              testID="add-expense-amount"
              style={[styles.amountInput, { color: colors.textPrimary }]}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          <TextField
            testID="add-expense-description"
            label="Descrição (opcional)"
            placeholder="Ex: Almoço no restaurante"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.lg }]}>Categoria</Text>
          <ChipGroup
            testID="category-chip"
            options={categoryOptions}
            selectedId={selected}
            onSelect={(id) => {
              setSelected(id);
              setAutoMode(false);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ScreenFooter>
        <Button testID="add-expense-save" label="Salvar gasto" onPress={onSave} loading={saving} variant="primary" />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.base },
  headerTitle: { fontSize: fontSizes.body, fontWeight: "700" },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  amountWrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: spacing.xl, marginBottom: spacing.lg },
  amountPrefix: { fontSize: 28, fontWeight: "700", marginRight: 6 },
  amountInput: { fontSize: 56, fontWeight: "800", letterSpacing: -2, minWidth: 120, textAlign: "center" },
  label: { fontSize: fontSizes.small, fontWeight: "600", marginBottom: 8 },
});
```

**Atenção — testID muda de formato:** hoje cada chip tem `testID={`category-chip-${c.id}`}` (ex: `category-chip-alimentacao`). Com `ChipGroup`, o testID de cada opção vira `${testID}-${opt.id}` automaticamente a partir do `testID="category-chip"` passado pro grupo — resultado final é o MESMO formato (`category-chip-alimentacao`), então nenhum teste externo quebra. Confirme isso rodando `grep -rn "category-chip-" frontend --include="*.ts" --include="*.tsx"` fora deste arquivo antes de finalizar — não deve haver nenhuma referência hardcoded a um ID de categoria específico fora deste componente.

O campo de valor (`amountInput`, tipografia grande de 56px) permanece um `TextInput` cru, não vira `TextField` — é um campo de entrada de número grande e centralizado, visualmente distinto de um campo com label, e o kit não tem esse padrão (decisão do plano, não confundir com uma omissão).

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Checar lint**

Run: `cd frontend && ./node_modules/.bin/eslint app/add-expense.tsx --max-warnings=0`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
cd frontend
git add app/add-expense.tsx
git commit -m "feat(fase3): restyle Adicionar Gasto onto the ui kit"
```

---

### Task 6: Contas Fixas (`fixed-bills.tsx`)

**Files:**
- Modify: `frontend/app/fixed-bills.tsx`

**Interfaces:**
- Consumes: `Card`, `TextField`, `Button`, `ScreenFooter`, `ListRow` de `../src/components/ui`.
- Produces: nada consumido por outra task.

- [ ] **Step 1: Reescrever**

Substitua todo o conteúdo de `frontend/app/fixed-bills.tsx` por:

```tsx
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/providers/ThemeProvider";
import { useExpenses } from "../src/providers/ExpensesProvider";
import { formatBRL, parseBRL } from "../src/utils/format";
import { installmentEndDate, isFixedBillActiveInPeriod } from "../src/utils/finance";
import { spacing, radii, fontSizes } from "../src/utils/theme";
import { friendlyFirebaseError } from "../src/utils/errors";
import { Card, TextField, Button, ScreenFooter, ListRow } from "../src/components/ui";

export default function FixedBillsScreen() {
  const { colors } = useTheme();
  const { fixedBills, fixedBillsTotal, addFixedBill, deleteFixedBill, snapshot } = useExpenses();
  const router = useRouter();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [billMode, setBillMode] = useState<"monthly" | "installment">("monthly");
  const [installments, setInstallments] = useState("2");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeBills = fixedBills.filter((bill) => isFixedBillActiveInPeriod(bill, snapshot.period_start, snapshot.period_end));

  const onSave = async () => {
    if (saving) return;
    Keyboard.dismiss();

    const cleanName = name.trim();
    const value = parseBRL(amount);
    const parsedDueDay = Number.parseInt(dueDay, 10);

    if (!cleanName) {
      Alert.alert("Nome obrigatório", "Informe o nome da conta fixa.");
      return;
    }
    if (value <= 0) {
      Alert.alert("Valor inválido", "Digite um valor maior que zero.");
      return;
    }
    if (!Number.isFinite(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      Alert.alert("Vencimento inválido", "Informe um dia entre 1 e 31.");
      return;
    }

    const parsedInstallments = Number.parseInt(installments, 10);
    if (billMode === "installment" && (!Number.isFinite(parsedInstallments) || parsedInstallments < 1 || parsedInstallments > 120)) {
      Alert.alert("Parcelas inválidas", "Informe uma quantidade entre 1 e 120 parcelas.");
      return;
    }

    setSaving(true);
    try {
      const installmentStartDate = new Date().getTime();
      await addFixedBill({
        name: cleanName,
        amount: value,
        due_day: parsedDueDay,
        is_active: true,
        ...(billMode === "installment"
          ? {
              installment_count: parsedInstallments,
              installment_start_date: installmentStartDate,
              installment_end_date: installmentEndDate(installmentStartDate, parsedInstallments),
            }
          : {}),
      });
      setName("");
      setAmount("");
      setDueDay("1");
      setBillMode("monthly");
      setInstallments("2");
    } catch (err: any) {
      Alert.alert("Erro", friendlyFirebaseError(err, "Não foi possível salvar a conta fixa."));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteFixedBill(id);
    } catch (err: any) {
      Alert.alert("Erro", friendlyFirebaseError(err, "Não foi possível remover a conta fixa."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="fixed-bills-back-button" onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Contas fixas</Text>
          <View style={styles.iconButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total fixo mensal</Text>
            <Text testID="fixed-bills-total" style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatBRL(fixedBillsTotal)}</Text>
            <Text style={[styles.summarySub, { color: colors.textMuted }]}>{activeBills.length} conta{activeBills.length === 1 ? "" : "s"} ativa{activeBills.length === 1 ? "" : "s"}</Text>
          </Card>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Adicionar conta</Text>
          <View style={styles.modeRow}>
            {(["monthly", "installment"] as const).map((mode) => {
              const active = billMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  testID={`fixed-bill-mode-${mode}`}
                  activeOpacity={0.8}
                  onPress={() => setBillMode(mode)}
                  style={[styles.modeButton, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.modeButtonText, { color: active ? colors.onPrimary : colors.textPrimary }]}>{mode === "monthly" ? "Mensal" : "Parcelada"}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextField
            testID="fixed-bill-name-input"
            label="Nome"
            placeholder="Ex: Aluguel, internet, energia"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <TextField
                testID="fixed-bill-amount-input"
                label="Valor"
                prefix="R$"
                placeholder="0,00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
            <View style={styles.dayWrap}>
              <TextField
                testID="fixed-bill-due-day-input"
                label="Vence dia"
                keyboardType="number-pad"
                maxLength={2}
                value={dueDay}
                onChangeText={setDueDay}
              />
            </View>
          </View>

          {billMode === "installment" ? (
            <View style={styles.installmentsWrap}>
              <TextField
                testID="fixed-bill-installments-input"
                label="Quantidade de parcelas"
                keyboardType="number-pad"
                maxLength={3}
                value={installments}
                onChangeText={setInstallments}
              />
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Cadastradas</Text>
          {activeBills.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary, textAlign: "center" }}>Nenhuma conta fixa ativa para este período.</Text>
            </View>
          ) : (
            <Card>
              {activeBills.map((bill, index) => (
                <View
                  key={bill.id}
                  style={[
                    styles.billRow,
                    index > 0 ? [styles.billRowDivider, { borderTopColor: colors.border }] : null,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <ListRow
                      icon={<Ionicons name="calendar-outline" size={18} color={colors.primary} />}
                      iconBg={colors.primarySoft}
                      title={bill.name}
                      subtitle={bill.installment_count ? `${bill.installment_count}x até ${formatShortDate(bill.installment_end_date)} - dia ${bill.due_day}` : `Todo mês no dia ${bill.due_day}`}
                      value={formatBRL(bill.amount)}
                      testID={`fixed-bill-row-${bill.id}`}
                    />
                  </View>
                  <TouchableOpacity
                    testID={`fixed-bill-delete-${bill.id}`}
                    activeOpacity={0.75}
                    disabled={deletingId === bill.id}
                    onPress={() => onDelete(bill.id)}
                    style={[styles.deleteButton, { backgroundColor: colors.danger + "14" }]}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ScreenFooter>
        <Button
          testID="fixed-bill-save-button"
          label={billMode === "installment" ? "Salvar compra parcelada" : "Salvar conta fixa"}
          onPress={onSave}
          loading={saving}
          variant="primary"
        />
      </ScreenFooter>
    </SafeAreaView>
  );
}

function formatShortDate(dateMs?: number): string {
  if (!dateMs) return "sem data";
  return new Date(dateMs).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 56, paddingHorizontal: spacing.base, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: fontSizes.body, fontWeight: "800" },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  summaryLabel: { fontSize: fontSizes.small, fontWeight: "700" },
  summaryValue: { fontSize: 36, fontWeight: "900", marginTop: 4 },
  summarySub: { fontSize: fontSizes.small, marginTop: 4 },
  sectionTitle: { fontSize: fontSizes.h3, fontWeight: "800", marginBottom: spacing.base, marginTop: spacing.xxl },
  modeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.base },
  modeButton: { flex: 1, borderWidth: 1, borderRadius: radii.lg, paddingVertical: 12, alignItems: "center" },
  modeButtonText: { fontSize: fontSizes.small, fontWeight: "800" },
  formRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.base },
  dayWrap: { width: 104 },
  installmentsWrap: { marginTop: spacing.base },
  emptyBox: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, alignItems: "center" },
  billRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  billRowDivider: { borderTopWidth: 1, marginTop: spacing.xs, paddingTop: spacing.xs },
  deleteButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
});
```

Note importante: `Card` não tem prop de `padding` customizada aqui — o card de resumo (`Total fixo mensal`) e o card da lista usam o `padding` padrão do kit (`spacing.base`), diferente do card de resumo original que tinha `padding: spacing.lg`. Isso é uma pequena mudança visual deliberada (consistência com todo o resto do app, que já usa o padding padrão do `Card` em todo lugar) — não uma omissão.

`marginBottom: spacing.xxl` no card de resumo (estilo `summary` original) não existe mais como estilo próprio — o espaçamento entre o card de resumo e o título "Adicionar conta" agora vem só do `sectionTitle`'s `marginTop: spacing.xxl` que já existia. Confirme visualmente na Task 8 que o espaçamento não ficou nem apertado nem exagerado (mesmo tipo de checagem que a Fase 2 fez pra pegar o bug do `Card`+`gap`).

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Checar lint**

Run: `cd frontend && ./node_modules/.bin/eslint app/fixed-bills.tsx --max-warnings=0`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
cd frontend
git add app/fixed-bills.tsx
git commit -m "feat(fase3): restyle Contas Fixas onto the ui kit, Save button into ScreenFooter"
```

---

### Task 7: Planos (`plans.tsx`)

**Files:**
- Modify: `frontend/app/plans.tsx`

**Interfaces:**
- Consumes: `Card`, `Badge`, `Button`, `SegmentedControl`, type `SegmentOption` de `../src/components/ui`.
- Produces: nada consumido por outra task.

- [ ] **Step 1: Reescrever**

Substitua todo o conteúdo de `frontend/app/plans.tsx` por:

```tsx
import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/providers/ThemeProvider";
import { useAuth } from "../src/providers/AuthProvider";
import { spacing, radii, fontSizes } from "../src/utils/theme";
import {
  PLAN_DEFINITIONS,
  annualSavingsPercent,
  normalizePlanKey,
  type BillingInterval,
  type PlanDefinition,
  type PlanKey,
  type PlanPrice,
} from "../src/services/MonetizationService";
import { initSubscriptionPayment } from "../src/services/PaymentService";
import { friendlyFirebaseError } from "../src/utils/errors";
import { Card, Badge, Button, SegmentedControl, type SegmentOption } from "../src/components/ui";

const INTERVAL_OPTIONS: SegmentOption[] = [
  { id: "monthly", label: "Mensal" },
  { id: "annual", label: "Anual" },
];

export default function PlansScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const currentPlan = normalizePlanKey(profile?.plan);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [proInterval, setProInterval] = useState<BillingInterval>("monthly");

  const startSubscription = async (plan: PlanDefinition, price: PlanPrice) => {
    if (plan.key === "basic") return;

    setLoadingPlan(plan.key);
    try {
      const payment = await initSubscriptionPayment(plan.key as Exclude<PlanKey, "basic">, price.interval, "manual");
      if (payment.checkoutUrl) {
        await Linking.openURL(payment.checkoutUrl);
        Alert.alert("Pagamento iniciado", "Conclua o pagamento no checkout para ativar seu plano.");
        return;
      }
      Alert.alert(
        "Checkout pendente",
        "A função de pagamento já foi criada. Configure PRO_MONTHLY_CHECKOUT_URL / PRO_ANNUAL_CHECKOUT_URL e PAYMENT_WEBHOOK_SECRET nas Firebase Functions para ativar o checkout real."
      );
    } catch (error: any) {
      Alert.alert("Erro no pagamento", friendlyFirebaseError(error, "Não foi possível iniciar a assinatura."));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity accessibilityRole="button" testID="plans-back-button" onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Planos</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.overline, { color: colors.textMuted }]}>SALDO</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Escolha seu plano</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Comece no Básico e evolua quando precisar de mais controle.</Text>

        <View style={styles.cards}>
          {PLAN_DEFINITIONS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              active={currentPlan === plan.key}
              colors={colors}
              loading={loadingPlan === plan.key}
              interval={proInterval}
              onIntervalChange={setProInterval}
              onPress={(price) => startSubscription(plan, price)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({
  plan,
  active,
  colors,
  onPress,
  loading = false,
  interval,
  onIntervalChange,
}: {
  plan: PlanDefinition;
  active: boolean;
  colors: any;
  onPress: (price: PlanPrice) => void;
  loading?: boolean;
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
}) {
  const hasMultiplePrices = plan.prices.length > 1;
  const price = hasMultiplePrices ? plan.prices.find((p) => p.interval === interval) ?? plan.prices[0] : plan.prices[0];
  const isAnnual = price.interval === "annual";

  const disabled = active || plan.key === "basic" || loading;
  const buttonLabel = active ? "Plano atual" : plan.key === "basic" ? "Incluso" : "Assinar";
  const buttonVariant = active ? "secondary" : plan.highlighted ? "primary" : "secondary";

  return (
    <View testID={`plan-card-${plan.key}`}>
      {hasMultiplePrices ? (
        <View style={styles.intervalToggleWrap}>
          <SegmentedControl
            testID={`plan-interval-${plan.key}`}
            options={INTERVAL_OPTIONS}
            selectedId={interval}
            onSelect={(id) => onIntervalChange(id as BillingInterval)}
          />
        </View>
      ) : null}

      <Card style={[plan.highlighted ? { borderColor: colors.primary } : null]}>
        <View style={styles.cardTopRow}>
          <View>
            <Text style={[styles.planName, { color: colors.textPrimary }]}>{plan.name}</Text>
            <Text style={[styles.planDescription, { color: colors.textSecondary }]}>{plan.description}</Text>
          </View>
          {plan.highlighted ? <Badge label="Mais escolhido" variant="soft" /> : null}
        </View>

        <View style={styles.priceBlock}>
          <View style={styles.priceLine}>
            <Text style={[styles.currentPrice, { color: colors.textPrimary }]}>{price.priceLabel}</Text>
            <Text style={[styles.period, { color: colors.textMuted }]}>{price.periodLabel}</Text>
            {isAnnual ? <Badge label={`Economize ${annualSavingsPercent()}%`} variant="soft" /> : null}
          </View>
          {price.fullPriceLabel ? (
            <Text style={[styles.priceNote, { color: colors.textSecondary }]}>{price.fullPriceLabel}</Text>
          ) : null}
          {price.installmentLabel ? (
            <Text style={[styles.priceNote, { color: colors.textSecondary }]}>{price.installmentLabel}</Text>
          ) : null}
          {price.installmentNote ? (
            <Text style={[styles.priceFinePrint, { color: colors.textMuted }]}>{price.installmentNote}</Text>
          ) : null}
        </View>

        <View style={styles.features}>
          {plan.features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textPrimary }]}>{feature}</Text>
            </View>
          ))}
        </View>

        <Button
          testID={`plan-action-${plan.key}`}
          label={buttonLabel}
          onPress={() => onPress(price)}
          disabled={disabled}
          loading={loading}
          variant={buttonVariant}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: fontSizes.body, fontWeight: "800" },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
  title: { fontSize: fontSizes.h1, fontWeight: "800" },
  subtitle: { fontSize: fontSizes.body, lineHeight: 23, marginTop: 8, marginBottom: spacing.xl },
  cards: { gap: spacing.base },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  planName: { fontSize: fontSizes.h2, fontWeight: "900" },
  planDescription: { fontSize: fontSizes.small, lineHeight: 20, marginTop: 4, maxWidth: 230 },
  intervalToggleWrap: { marginTop: spacing.lg, alignItems: "flex-start" },
  priceBlock: { marginTop: spacing.lg, marginBottom: spacing.base },
  priceLine: { flexDirection: "row", alignItems: "flex-end", gap: 6, flexWrap: "wrap" },
  currentPrice: { fontSize: 34, fontWeight: "900" },
  period: { fontSize: fontSizes.small, fontWeight: "700", marginBottom: 7 },
  priceNote: { fontSize: fontSizes.small, fontWeight: "700", marginTop: 6 },
  priceFinePrint: { fontSize: 12, marginTop: 2 },
  features: { gap: spacing.sm, marginTop: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { flex: 1, fontSize: fontSizes.small, lineHeight: 20 },
});
```

**Decisões desta task, registradas aqui pra não ficarem implícitas:**

- `SegmentedControl` (o alternador Mensal/Anual) fica FORA do `Card` do plano por completo — é o primeiro elemento dentro do `View testID={`plan-card-${plan.key}`}`, antes do `Card`, não um filho dele. Isso muda a posição visual em relação ao desenho original (onde o alternador ficava dentro do card, logo abaixo do cabeçalho) — o alternador agora aparece acima do nome/descrição do plano, associado ao card mas não contido nele. A mudança é deliberada: segue a mesma "Regra de aninhamento" que a Fase 2 já corrigiu no `SegmentedControl` do Perfil (o track `surfaceAlt` do `SegmentedControl` quase some sobre o fundo `surface` de um `Card`), e esta tela nunca teve um mockup aprovado que fixasse a posição interna do alternador — não há contradição com nenhum desenho validado.
- O botão de ação de cada plano perde a cor customizada por `highlighted`/`active` que tinha antes (fundo `colors.primary` quando `highlighted`, `colors.surfaceAlt` quando `active`, `colors.background` caso contrário) — os 3 estados agora mapeiam pra variantes do `Button` do kit: `active` → `variant="secondary"` (Plano atual — outline, não é uma ação), `highlighted && !active` → `variant="primary"` (Assinar Pro — ação principal), `!highlighted && !active` → `variant="secondary"` (Incluso do Básico — outline, não clicável de qualquer forma já que fica `disabled`). Isso simplifica a lógica de cor (a `variant` do `Button` já cuida de tudo), mas é uma mudança visual real — confirme na Task 8 que o card do Básico (não-highlighted) ainda se lê como "menos importante" que o do Pro visualmente, mesmo com os dois usando `variant="secondary"` quando não `highlighted`.
- `testID={`plan-interval-${plan.key}`}` no `SegmentedControl` gera testIDs internos `plan-interval-${plan.key}-monthly`/`plan-interval-${plan.key}-annual` — diferente do formato antigo (`plan-interval-monthly`/`plan-interval-annual`, sem o `plan.key`, já que só o Pro tem múltiplos preços). Rode `grep -rn "plan-interval-" frontend --include="*.ts" --include="*.tsx"` fora deste arquivo antes de finalizar pra confirmar que nenhum outro lugar depende do formato antigo.

- [ ] **Step 2: Checar tipos**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 3: Checar lint**

Run: `cd frontend && ./node_modules/.bin/eslint app/plans.tsx --max-warnings=0`
Expected: sem erros

- [ ] **Step 4: Commit**

```bash
cd frontend
git add app/plans.tsx
git commit -m "feat(fase3): first ui-kit adoption for Planos (Card/Badge/Button/SegmentedControl)"
```

---

### Task 8: Verificação final da Fase 3

**Files:** nenhum arquivo novo — task de verificação.

- [ ] **Step 1: Rodar a suíte completa**

Run: `cd frontend && npm test`
Expected: PASS — nenhuma regressão (esta fase não deve adicionar lógica pura nova; se adicionar, ela precisa de teste próprio antes deste step).

- [ ] **Step 2: Checar tipos em todo o app**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Checar lint em todo o app**

Run: `cd frontend && ./node_modules/.bin/eslint . --max-warnings=0 --ignore-pattern ".test-build"`
Expected: sem erros novos. Avisos pré-existentes (não introduzidos por nenhuma fase deste redesign) podem persistir — confira contra `git log` que qualquer aviso restante já existia antes do commit inicial desta fase.

- [ ] **Step 4: Verificação visual**

As 3 telas de auth (`login`, `register`, `forgot-password`) são alcançáveis sem nenhum bypass — são o destino natural do `Gate` quando não autenticado. Rode `cd frontend && npx expo start --web` (ou, se o Metro reclamar de link simbólico, `NODE_OPTIONS=--preserve-symlinks npx expo start --web` — problema já visto nas Fases 1/2), abra a URL, e confira as 3 telas em light e dark mode sem precisar logar.

Para `onboarding`, `add-expense`, `fixed-bills` e `plans`, use o mesmo bypass temporário e não-commitado do `Gate` já usado nas Fases 1 e 2 (`frontend/app/_layout.tsx`, função `Gate`, ajustar a condição de redirecionamento pra também permitir o segmento da rota sendo testada) — reverta o bypass assim que a checagem terminar, ele NUNCA deve ser commitado.

Documente no relatório desta task qual das duas formas foi usada pra cada tela (ou que não foi possível nesta rodada) — não afirme "verificado visualmente" sem ter feito de fato.

Confira em especial (achados reais da Fase 2 que vieram de exatamente este tipo de checagem, não assuma que "parece certo no código" é suficiente):
- O espaçamento do card de resumo de Contas Fixas (nota da Task 6) não ficou nem apertado nem exagerado.
- Os botões de ação dos planos (Básico vs. Pro) ainda se distinguem visualmente apesar da simplificação de variantes (nota da Task 7).
- O rodapé fixo de cada tela de formulário não sobrepõe conteúdo nem duplica o espaçamento de área segura (a troca de `edges={["top","bottom"]}` para `edges={["top"]}` foi aplicada em TODAS as 6 telas que ganharam `ScreenFooter`: login, register, forgot-password, onboarding, add-expense, fixed-bills — `plans.tsx` fica de fora, mantém `edges={["top","bottom"]}`).
- Os chips de categoria de Adicionar Gasto mostram ícone + cor corretos por categoria, e a sugestão automática (`autoMode`) ainda funciona ao digitar uma descrição.

- [ ] **Step 5: Commit final (se houver qualquer ajuste dos steps acima)**

```bash
cd frontend
git add -A
git commit -m "chore(fase3): final verification pass"
```

(Só crie este commit se algo mudou nos steps 1-4; se tudo já estava commitado nas tasks anteriores e só a verificação rodou, não há o que commitar aqui.)

---

## Self-Review

**Cobertura da spec:** as 7 telas da Fase 3 (Login, Registro, Esqueci senha, Onboarding, Adicionar Gasto, Contas Fixas, Planos) têm task correspondente. O padrão "rodapé fixo com CTA" da spec é aplicado a todas as telas de formulário (decisão 4), com a exceção documentada e justificada de `plans.tsx` (decisão 4). A extensão do `ChipGroup` (decisão 1) resolve a lacuna que a spec previa ("`ChipGroup` para categoria") sem estar coberta pelo shape original do componente.

**Placeholders:** nenhum "TBD"/"reestilizar como apropriado" — toda task tem o código exato a escrever, pronto para copiar. Dois erros de composição foram encontrados e corrigidos durante esta autorrevisão antes de considerar o plano pronto: a Task 4 usava `Text` em vez de `View` como espaçador (corrigido direto no bloco de código e no import); a Task 7 tinha o `SegmentedControl` aninhado dentro do `Card` do plano por engano de composição, violando a própria "Regra de aninhamento" que a task deveria seguir (corrigido direto no bloco de código, com a decisão de posicionamento registrada em texto).

**Consistência de tipos:** `ChipOption` (Task 1) é consumida com o mesmo shape na Task 5 (`icon`/`color` opcionais, mesma assinatura). `ScreenFooter`'s `{children}` é usado da mesma forma em todas as 6 tasks que o consomem — nenhuma task tenta passar uma prop que `ScreenFooterProps` não tem. `SegmentedControl.onSelect: (id: string) => void` é convertido para `BillingInterval`/`"light"|"dark"|"system"` via cast pontual em todo lugar que precisa (mesmo padrão já usado no Perfil da Fase 2), nunca passado direto sem cast.

**Risco assinalado:** a decisão 2 (navegação imperativa em vez de `<Link asChild>`) é uma mudança de padrão de navegação, não só de estilo — vale confirmar na Task 8 que o comportamento de navegação (incluindo o histórico de back/forward do navegador, se relevante no build web) continua correto nas 3 telas de auth.

## Próximos passos (fora deste plano)

Com a Fase 3 completa, as 3 fases do redesign visual (`docs/superpowers/specs/2026-08-26-visual-redesign-design.md`) estarão implementadas. Não há Fase 4 planejada — pendências remanescentes (decisão sobre `frontend/app/dev-ui-kit.tsx` permanecer acessível em produção, unificação dos 3 estilos de label em caixa-alta de Início, decisão sobre `TextField` aninhado em `Card`) ficam registradas na spec para revisão futura, fora do escopo deste redesign.
