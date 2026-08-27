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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
            onPress={() => router.push("/(auth)/login")}
            variant="ghost"
          />
        </ScreenFooter>
      </KeyboardAvoidingView>
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
