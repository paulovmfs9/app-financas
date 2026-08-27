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
