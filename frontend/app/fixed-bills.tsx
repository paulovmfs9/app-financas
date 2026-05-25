import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/providers/ThemeProvider";
import { useExpenses } from "../src/providers/ExpensesProvider";
import { formatBRL, parseBRL } from "../src/utils/format";
import { spacing, radii, fontSizes } from "../src/utils/theme";

export default function FixedBillsScreen() {
  const { colors } = useTheme();
  const { fixedBills, fixedBillsTotal, addFixedBill, deleteFixedBill } = useExpenses();
  const router = useRouter();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeBills = fixedBills.filter((bill) => bill.is_active);

  const onSave = async () => {
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

    setSaving(true);
    try {
      await addFixedBill({
        name: cleanName,
        amount: value,
        due_day: parsedDueDay,
        is_active: true,
      });
      setName("");
      setAmount("");
      setDueDay("1");
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Não foi possível salvar a conta fixa.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteFixedBill(id);
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Não foi possível remover a conta fixa.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}> 
          <TouchableOpacity testID="fixed-bills-back-button" onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Contas fixas</Text>
          <View style={styles.iconButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total fixo mensal</Text>
            <Text testID="fixed-bills-total" style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatBRL(fixedBillsTotal)}</Text>
            <Text style={[styles.summarySub, { color: colors.textMuted }]}>{activeBills.length} conta{activeBills.length === 1 ? "" : "s"} ativa{activeBills.length === 1 ? "" : "s"}</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Adicionar conta</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Nome</Text>
          <TextInput
            testID="fixed-bill-name-input"
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Ex: Aluguel, internet, energia"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Valor</Text>
              <View style={[styles.moneyInput, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <Text style={[styles.prefix, { color: colors.textMuted }]}>R$</Text>
                <TextInput
                  testID="fixed-bill-amount-input"
                  style={[styles.moneyField, { color: colors.textPrimary }]}
                  placeholder="0,00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>
            <View style={styles.dayWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Vence dia</Text>
              <TextInput
                testID="fixed-bill-due-day-input"
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                keyboardType="number-pad"
                maxLength={2}
                value={dueDay}
                onChangeText={setDueDay}
              />
            </View>
          </View>

          <TouchableOpacity
            testID="fixed-bill-save-button"
            activeOpacity={0.85}
            disabled={saving}
            onPress={onSave}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Salvar conta fixa</Text>}
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Cadastradas</Text>
          {fixedBills.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={{ color: colors.textSecondary, textAlign: "center" }}>Nenhuma conta fixa cadastrada ainda.</Text>
            </View>
          ) : (
            fixedBills.map((bill) => (
              <View key={bill.id} style={[styles.billRow, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <View style={[styles.billIcon, { backgroundColor: colors.primarySoft }]}> 
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.billName, { color: colors.textPrimary }]} numberOfLines={1}>{bill.name}</Text>
                  <Text style={[styles.billSub, { color: colors.textMuted }]}>Todo mês no dia {bill.due_day}</Text>
                </View>
                <Text style={[styles.billAmount, { color: colors.textPrimary }]}>{formatBRL(bill.amount)}</Text>
                <TouchableOpacity
                  testID={`fixed-bill-delete-${bill.id}`}
                  activeOpacity={0.75}
                  disabled={deletingId === bill.id}
                  onPress={() => onDelete(bill.id)}
                  style={[styles.deleteButton, { backgroundColor: colors.danger + "14" }]}
                >
                  {deletingId === bill.id ? <ActivityIndicator size="small" color={colors.danger} /> : <Ionicons name="trash-outline" size={18} color={colors.danger} />}
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 56, paddingHorizontal: spacing.base, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: fontSizes.body, fontWeight: "800" },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  summary: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.xxl },
  summaryLabel: { fontSize: fontSizes.small, fontWeight: "700" },
  summaryValue: { fontSize: 36, fontWeight: "900", marginTop: 4 },
  summarySub: { fontSize: fontSizes.small, marginTop: 4 },
  sectionTitle: { fontSize: fontSizes.h3, fontWeight: "800", marginBottom: spacing.base, marginTop: spacing.lg },
  label: { fontSize: fontSizes.small, fontWeight: "700", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.base, paddingVertical: 14, fontSize: fontSizes.body },
  formRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.base },
  dayWrap: { width: 104 },
  moneyInput: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.base },
  prefix: { fontSize: fontSizes.body, marginRight: 6, fontWeight: "700" },
  moneyField: { flex: 1, paddingVertical: 14, fontSize: fontSizes.body },
  primaryBtn: { marginTop: spacing.base, paddingVertical: 16, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: fontSizes.body, fontWeight: "800" },
  emptyBox: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg, alignItems: "center" },
  billRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.base, borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.sm },
  billIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  billName: { fontSize: fontSizes.body, fontWeight: "800" },
  billSub: { fontSize: fontSizes.micro, marginTop: 2 },
  billAmount: { fontSize: fontSizes.small, fontWeight: "800" },
  deleteButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
});
