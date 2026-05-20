import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/providers/ThemeProvider";
import { AuthService, friendlyAuthError } from "../../src/services/AuthService";
import { spacing, radii, fontSizes } from "../../src/utils/theme";
import { isEmail, isStrongEnoughPassword } from "../../src/utils/validation";

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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
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

          <Text style={[styles.label, { color: colors.textSecondary }]}>Email cadastrado</Text>
          <TextInput
            testID="forgot-email-input"
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="voce@email.com"
            placeholderTextColor={colors.textMuted}
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
              <Text style={[styles.label, { color: colors.textSecondary }]}>Código ou link recebido</Text>
              <TextInput
                testID="forgot-code-input"
                style={[styles.input, styles.multilineInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Cole aqui o código ou link do email"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                multiline
                value={code}
                onChangeText={setCode}
              />

              <View style={{ height: spacing.base }} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Nova senha</Text>
              <TextInput
                testID="forgot-password-input"
                style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <View style={{ height: spacing.base }} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Confirmar nova senha</Text>
              <TextInput
                testID="forgot-confirm-password-input"
                style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Digite novamente"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </>
          ) : null}

          {message ? <Text testID="forgot-message" style={[styles.message, { color: colors.success }]}>{message}</Text> : null}
          {error ? <Text testID="forgot-error" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <TouchableOpacity
            testID={step === "email" ? "forgot-send-code-button" : "forgot-reset-button"}
            activeOpacity={0.85}
            disabled={loading}
            onPress={step === "email" ? onSendCode : onResetPassword}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{step === "email" ? "Enviar código" : "Criar nova senha"}</Text>}
          </TouchableOpacity>

          {step === "code" ? (
            <TouchableOpacity testID="forgot-resend-button" disabled={loading} onPress={onSendCode} style={styles.secondaryBtn}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: fontSizes.body }}>Reenviar email</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.footer}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity testID="forgot-go-login">
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: fontSizes.body }}>Voltar para entrar</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
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
  label: { fontSize: fontSizes.small, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.base, paddingVertical: 16, fontSize: fontSizes.body },
  multilineInput: { minHeight: 86, textAlignVertical: "top" },
  message: { marginTop: spacing.base, fontSize: fontSizes.small, lineHeight: 20 },
  error: { marginTop: spacing.base, fontSize: fontSizes.small },
  primaryBtn: { marginTop: spacing.xl, paddingVertical: 18, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: fontSizes.body, fontWeight: "700" },
  secondaryBtn: { alignItems: "center", paddingVertical: spacing.base },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
});
