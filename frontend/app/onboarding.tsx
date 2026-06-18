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
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/providers/ThemeProvider";
import { useAuth } from "../src/providers/AuthProvider";
import { spacing, radii, fontSizes } from "../src/utils/theme";
import { parseBRL } from "../src/utils/format";
import { friendlyFirebaseError } from "../src/utils/errors";

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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
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

          <Text style={[styles.label, { color: colors.textSecondary }]}>Sua renda do mês</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.prefix, { color: colors.textMuted }]}>R$</Text>
            <TextInput
              testID="onboarding-salary-input"
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={salary}
              onChangeText={setSalary}
            />
          </View>

          <View style={{ height: spacing.lg }} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Contas fixas (aluguel, internet…)
          </Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.prefix, { color: colors.textMuted }]}>R$</Text>
            <TextInput
              testID="onboarding-bills-input"
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="0,00 (opcional)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={bills}
              onChangeText={setBills}
            />
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <TouchableOpacity
            testID="onboarding-continue-button"
            activeOpacity={0.85}
            disabled={loading}
            onPress={onSubmit}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Continuar</Text>}
          </TouchableOpacity>
        </ScrollView>
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
  label: { fontSize: fontSizes.small, fontWeight: "600", marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.base },
  prefix: { fontSize: fontSizes.body, marginRight: 6, fontWeight: "600" },
  input: { flex: 1, paddingVertical: 16, fontSize: fontSizes.body },
  error: { marginTop: spacing.base, fontSize: fontSizes.small },
  primaryBtn: { marginTop: spacing.xxl, paddingVertical: 18, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: fontSizes.body, fontWeight: "700" },
});
