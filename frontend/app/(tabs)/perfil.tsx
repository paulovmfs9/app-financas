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

export default function PerfilScreen() {
  const { colors, pref, setPref } = useTheme();
  const { profile, signOut, updateProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(profile?.name ?? "");
  const [salary, setSalary] = useState(String(profile?.monthly_salary ?? 0));
  const [bills, setBills] = useState(String(profile?.fixed_bills_total ?? 0));
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setSalary(String(profile?.monthly_salary ?? 0));
    setBills(String(profile?.fixed_bills_total ?? 0));
  }, [profile?.fixed_bills_total, profile?.monthly_salary, profile?.name]);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe seu nome para atualizar o perfil.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        monthly_salary: parseBRL(salary),
        fixed_bills_total: parseBRL(bills),
      });
      Alert.alert("Pronto", "Suas informações foram atualizadas.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Não foi possível salvar.");
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
