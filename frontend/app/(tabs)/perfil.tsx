import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../src/providers/ThemeProvider";
import { useAuth } from "../../src/providers/AuthProvider";
import { spacing, radii, fontSizes } from "../../src/utils/theme";
import { parseBRL } from "../../src/utils/format";
import { friendlyFirebaseError } from "../../src/utils/errors";
import { Card, TextField, Button, SegmentedControl } from "../../src/components/ui";

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
          <Card>
            <TextField
              testID="perfil-name-input"
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Informe seu nome"
            />
          </Card>

          <Text style={[styles.section, { color: colors.textPrimary }]}>Finanças</Text>
          <Card style={{ gap: spacing.base }}>
            <TextField
              testID="perfil-salary-input"
              label="Renda mensal"
              prefix="R$"
              keyboardType="decimal-pad"
              value={salary}
              onChangeText={setSalary}
              placeholder="0,00"
            />

            <TextField
              testID="perfil-bills-input"
              label="Contas fixas"
              prefix="R$"
              keyboardType="decimal-pad"
              value={bills}
              onChangeText={setBills}
              placeholder="0,00"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Ciclo financeiro</Text>
            <Text style={[styles.cycleHint, { color: colors.textMuted }]}>Use o mesmo dia no início e no fim para fechar no mês seguinte. Ex: 15 a 15.</Text>
            <View style={styles.cycleRow}>
              <View style={{ flex: 1 }}>
                <TextField
                  testID="perfil-cycle-start-input"
                  label="Inicia dia"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={cycleStartDay}
                  onChangeText={setCycleStartDay}
                  placeholder="1"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  testID="perfil-cycle-end-input"
                  label="Termina dia"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={cycleEndDay}
                  onChangeText={setCycleEndDay}
                  placeholder="31"
                />
              </View>
            </View>

            <Button testID="perfil-save-button" label="Salvar" onPress={onSave} loading={saving} variant="primary" />
          </Card>

          <Text style={[styles.section, { color: colors.textPrimary }]}>Plano</Text>
          <TouchableOpacity testID="perfil-plans-button" onPress={() => router.push("/plans" as any)} activeOpacity={0.8}>
            <Card style={styles.plansCard}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: fontSizes.body }}>Ver planos</Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSizes.small, marginTop: 2 }}>Básico e Pro</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Card>
          </TouchableOpacity>

          <Text style={[styles.section, { color: colors.textPrimary }]}>Aparência</Text>
          <Card>
            <SegmentedControl
              testID="perfil-theme"
              options={[
                { id: "light", label: "Claro" },
                { id: "dark", label: "Escuro" },
                { id: "system", label: "Sistema" },
              ]}
              selectedId={pref}
              onSelect={(id) => setPref(id as "light" | "dark" | "system")}
            />
          </Card>

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
  cycleRow: { flexDirection: "row", gap: spacing.md },
  cycleHint: { fontSize: fontSizes.micro, lineHeight: 16, marginTop: -20, marginBottom: spacing.sm },
  plansCard: { flexDirection: "row", alignItems: "center" },
  logoutBtn: { marginTop: spacing.xxl, paddingVertical: 16, borderRadius: radii.lg, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  footnote: { textAlign: "center", marginTop: spacing.xl, fontSize: fontSizes.micro },
  logoutConfirm: { marginTop: spacing.xxl, padding: spacing.base, borderRadius: radii.lg, borderWidth: 1 },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: radii.md, borderWidth: 1, alignItems: "center" },
});
