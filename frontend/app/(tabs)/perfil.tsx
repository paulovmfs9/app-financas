import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/providers/ThemeProvider";
import { useAuth } from "../../src/providers/AuthProvider";
import { spacing, radii, fontSizes } from "../../src/utils/theme";
import { parseBRL } from "../../src/utils/format";
import { friendlyFirebaseError } from "../../src/utils/errors";

export default function PerfilScreen() {
  const { colors, pref, setPref } = useTheme();
  const { profile, signOut, updateProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(profile?.name ?? "");
  const [salary, setSalary] = useState(String(profile?.monthly_salary ?? 0));
  const [bills, setBills] = useState(String(profile?.fixed_bills_total ?? 0));
  const [cycleStartDay, setCycleStartDay] = useState(String(profile?.budget_cycle_start_day ?? 1));
  const [cycleEndDay, setCycleEndDay] = useState(String(profile?.budget_cycle_end_day ?? 31));
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setSalary(String(profile?.monthly_salary ?? 0));
    setBills(String(profile?.fixed_bills_total ?? 0));
    setCycleStartDay(String(profile?.budget_cycle_start_day ?? 1));
    setCycleEndDay(String(profile?.budget_cycle_end_day ?? 31));
  }, [profile?.budget_cycle_end_day, profile?.budget_cycle_start_day, profile?.fixed_bills_total, profile?.monthly_salary, profile?.name]);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe seu nome para atualizar o perfil.");
      return;
    }

    const parsedCycleStart = Number.parseInt(cycleStartDay, 10);
    const parsedCycleEnd = Number.parseInt(cycleEndDay, 10);

    if (!Number.isFinite(parsedCycleStart) || parsedCycleStart < 1 || parsedCycleStart > 31) {
      Alert.alert("Dia inválido", "Informe um dia inicial entre 1 e 31.");
      return;
    }
    if (!Number.isFinite(parsedCycleEnd) || parsedCycleEnd < 1 || parsedCycleEnd > 31) {
      Alert.alert("Dia inválido", "Informe um dia final entre 1 e 31.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        monthly_salary: parseBRL(salary),
        fixed_bills_total: parseBRL(bills),
        budget_cycle_start_day: parsedCycleStart,
        budget_cycle_end_day: parsedCycleEnd,
      });
      Alert.alert("Pronto", "Suas informações foram atualizadas.");
    } catch (e: any) {
      Alert.alert("Erro", friendlyFirebaseError(e, "Não foi possível salvar seu perfil."));
    } finally {
      setSaving(false);
    }
  };

  const onLogout = () => setConfirmLogout(true);
  const doLogout = async () => {
    setConfirmLogout(false);
    await signOut();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.overline, { color: colors.textMuted }]}>PERFIL</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{profile?.name?.trim() || "Seu perfil"}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{profile?.email}</Text>

          <Text style={[styles.section, { color: colors.textPrimary }]}>Dados pessoais</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Nome</Text>
          <TextInput
            testID="perfil-name-input"
            style={[styles.textInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Informe seu nome"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.section, { color: colors.textPrimary }]}>Finanças</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Renda mensal</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.prefix, { color: colors.textMuted }]}>R$</Text>
            <TextInput
              testID="perfil-salary-input"
              style={[styles.input, { color: colors.textPrimary }]}
              keyboardType="decimal-pad"
              value={salary}
              onChangeText={setSalary}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={{ height: spacing.base }} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Contas fixas</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.prefix, { color: colors.textMuted }]}>R$</Text>
            <TextInput
              testID="perfil-bills-input"
              style={[styles.input, { color: colors.textPrimary }]}
              keyboardType="decimal-pad"
              value={bills}
              onChangeText={setBills}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={{ height: spacing.base }} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Ciclo financeiro</Text>
          <Text style={[styles.cycleHint, { color: colors.textMuted }]}>Use o mesmo dia no início e no fim para fechar no mês seguinte. Ex: 15 a 15.</Text>
          <View style={styles.cycleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helperLabel, { color: colors.textMuted }]}>Inicia dia</Text>
              <TextInput
                testID="perfil-cycle-start-input"
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="number-pad"
                maxLength={2}
                value={cycleStartDay}
                onChangeText={setCycleStartDay}
                placeholder="1"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helperLabel, { color: colors.textMuted }]}>Termina dia</Text>
              <TextInput
                testID="perfil-cycle-end-input"
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="number-pad"
                maxLength={2}
                value={cycleEndDay}
                onChangeText={setCycleEndDay}
                placeholder="31"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <TouchableOpacity
            testID="perfil-save-button"
            disabled={saving}
            onPress={onSave}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Salvar</Text>}
          </TouchableOpacity>


          <Text style={[styles.section, { color: colors.textPrimary }]}>Plano</Text>
          <TouchableOpacity
            testID="perfil-plans-button"
            onPress={() => router.push("/plans" as any)}
            style={[styles.plansBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: fontSizes.body }}>Ver planos</Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSizes.small, marginTop: 2 }}>Básico, Standard e Pro</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.section, { color: colors.textPrimary }]}>Aparência</Text>
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

          {!confirmLogout ? (
            <TouchableOpacity
              testID="perfil-logout-button"
              onPress={onLogout}
              style={[styles.logoutBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={{ color: colors.danger, fontWeight: "700", marginLeft: 8, fontSize: fontSizes.body }}>Sair</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.logoutConfirm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: fontSizes.body, marginBottom: 6 }}>
                Sair da conta?
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSizes.small, marginBottom: spacing.base }}>
                Você precisará entrar novamente.
              </Text>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <TouchableOpacity
                  testID="logout-cancel"
                  onPress={() => setConfirmLogout(false)}
                  style={[styles.confirmBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: fontSizes.small }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="logout-confirm"
                  onPress={doLogout}
                  style={[styles.confirmBtn, { backgroundColor: colors.danger, borderColor: colors.danger }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: fontSizes.small }}>Sair</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[styles.footnote, { color: colors.textMuted }]}>Saldo • Firebase</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
  title: { fontSize: fontSizes.h1, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { fontSize: fontSizes.body, marginTop: 4 },
  section: { fontSize: fontSizes.h3, fontWeight: "700", marginTop: spacing.xxl, marginBottom: spacing.base },
  label: { fontSize: fontSizes.small, fontWeight: "600", marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.base },
  textInput: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.base, paddingVertical: 16, fontSize: fontSizes.body },
  prefix: { fontSize: fontSizes.body, marginRight: 6, fontWeight: "600" },
  input: { flex: 1, paddingVertical: 16, fontSize: fontSizes.body },
  cycleRow: { flexDirection: "row", gap: spacing.md },
  cycleHint: { fontSize: fontSizes.micro, lineHeight: 16, marginTop: -4, marginBottom: spacing.sm },
  helperLabel: { fontSize: fontSizes.micro, fontWeight: "700", marginBottom: 6 },
  primaryBtn: { marginTop: spacing.base, paddingVertical: 16, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: fontSizes.body, fontWeight: "700" },
  themeRow: { flexDirection: "row", gap: spacing.sm },
  themeBtn: { flex: 1, paddingVertical: 12, paddingHorizontal: spacing.base, borderRadius: radii.lg, borderWidth: 1, alignItems: "center" },
  plansBtn: { padding: spacing.base, borderRadius: radii.lg, borderWidth: 1, alignItems: "center", flexDirection: "row" },
  logoutBtn: { marginTop: spacing.xxl, paddingVertical: 16, borderRadius: radii.lg, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  footnote: { textAlign: "center", marginTop: spacing.xl, fontSize: fontSizes.micro },
  logoutConfirm: { marginTop: spacing.xxl, padding: spacing.base, borderRadius: radii.lg, borderWidth: 1 },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.md, borderWidth: 1, alignItems: "center" },
});
