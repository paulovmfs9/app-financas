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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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

          {error ? <Text testID="onboarding-error" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
        </ScrollView>

        <ScreenFooter>
          <Button testID="onboarding-continue-button" label="Continuar" onPress={onSubmit} loading={loading} variant="primary" />
        </ScreenFooter>
      </KeyboardAvoidingView>
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
