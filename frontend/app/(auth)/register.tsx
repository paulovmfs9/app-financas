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
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/providers/ThemeProvider";
import { useAuth } from "../../src/providers/AuthProvider";
import { friendlyAuthError } from "../../src/services/AuthService";
import { spacing, radii, fontSizes } from "../../src/utils/theme";
import { isEmail, isNonEmpty, isStrongEnoughPassword } from "../../src/utils/validation";

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
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

          <Text style={[styles.label, { color: colors.textSecondary }]}>Nome</Text>
          <TextInput
            testID="register-name-input"
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Como devemos te chamar?"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <View style={{ height: spacing.base }} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            testID="register-email-input"
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="voce@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <View style={{ height: spacing.base }} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Senha</Text>
          <TextInput
            testID="register-password-input"
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <Text testID="register-error" style={[styles.error, { color: colors.danger }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            testID="register-submit-button"
            activeOpacity={0.85}
            disabled={loading}
            onPress={onSubmit}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Criar conta</Text>}
          </TouchableOpacity>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity testID="register-forgot-password" style={styles.forgotBtn}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: fontSizes.body }}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </Link>

          <View style={styles.footer}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.body }}>Já tem uma conta? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity testID="register-go-login">
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: fontSizes.body }}>Entrar</Text>
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
  error: { marginTop: spacing.base, fontSize: fontSizes.small },
  primaryBtn: { marginTop: spacing.xl, paddingVertical: 18, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: fontSizes.body, fontWeight: "700" },
  forgotBtn: { alignItems: "center", paddingVertical: spacing.base },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
});
