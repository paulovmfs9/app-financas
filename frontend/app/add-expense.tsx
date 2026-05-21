import React, { useEffect, useState } from "react";
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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/providers/ThemeProvider";
import { useExpenses } from "../src/providers/ExpensesProvider";
import { spacing, radii, fontSizes } from "../src/utils/theme";
import { parseBRL } from "../src/utils/format";
import { CATEGORIES, suggestCategory } from "../src/models/Category";
import { isExpenseLimitError } from "../src/services/MonetizationService";

export default function AddExpenseScreen() {
  const { colors } = useTheme();
  const { addExpense } = useExpenses();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string>("outros");
  const [autoMode, setAutoMode] = useState(true);
  const [saving, setSaving] = useState(false);

  // Live category suggestion from description (debounced).
  useEffect(() => {
    if (!autoMode || !description.trim()) return;
    const t = setTimeout(() => setSelected(suggestCategory(description)), 250);
    return () => clearTimeout(t);
  }, [description, autoMode]);

  const onSave = async () => {
    const value = parseBRL(amount);
    if (value <= 0) {
      Alert.alert("Valor inválido", "Digite um valor maior que zero.");
      return;
    }
    setSaving(true);
    try {
      await addExpense({
        amount: value,
        category: selected,
        description: description.trim(),
        date: Date.now(),
      });
      router.back();
    } catch (e: any) {
      if (!isExpenseLimitError(e)) {
        Alert.alert("Erro", e?.message || "Não foi possível salvar.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity testID="add-expense-close" onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Novo gasto</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.amountWrap}>
            <Text style={[styles.amountPrefix, { color: colors.textMuted }]}>R$</Text>
            <TextInput
              testID="add-expense-amount"
              style={[styles.amountInput, { color: colors.textPrimary }]}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição (opcional)</Text>
          <TextInput
            testID="add-expense-description"
            style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Ex: Almoço no restaurante"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.lg }]}>Categoria</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => {
              const active = selected === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  testID={`category-chip-${c.id}`}
                  onPress={() => {
                    setSelected(c.id);
                    setAutoMode(false);
                  }}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? c.color + "22" : colors.surface, borderColor: active ? c.color : colors.border },
                  ]}
                >
                  <Ionicons name={c.icon as any} size={14} color={active ? c.color : colors.textSecondary} />
                  <Text style={{ color: active ? c.color : colors.textPrimary, fontWeight: "600", fontSize: fontSizes.small }}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity
            testID="add-expense-save"
            disabled={saving}
            onPress={onSave}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Salvar gasto</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.base },
  headerTitle: { fontSize: fontSizes.body, fontWeight: "700" },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  amountWrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: spacing.xl, marginBottom: spacing.lg },
  amountPrefix: { fontSize: 28, fontWeight: "700", marginRight: 6 },
  amountInput: { fontSize: 56, fontWeight: "800", letterSpacing: -2, minWidth: 120, textAlign: "center" },
  label: { fontSize: fontSizes.small, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.base, paddingVertical: 14, fontSize: fontSizes.body },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.pill, borderWidth: 1 },
  footer: { padding: spacing.xl, borderTopWidth: 1 },
  primaryBtn: { paddingVertical: 18, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#fff", fontSize: fontSizes.body, fontWeight: "700" },
});
