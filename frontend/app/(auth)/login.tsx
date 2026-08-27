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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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

        <ScreenFooter>
          <Button testID="login-submit-button" label="Entrar" onPress={onSubmit} loading={loading} variant="primary" />
          <Button
            testID="login-forgot-password"
            label="Esqueci minha senha"
            onPress={() => router.push("/(auth)/forgot-password")}
            variant="ghost"
          />
          <Button
            testID="login-go-register"
            label="Não tem conta? Criar conta"
            onPress={() => router.push("/(auth)/register")}
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
  error: { marginTop: spacing.base, fontSize: fontSizes.small },
});
