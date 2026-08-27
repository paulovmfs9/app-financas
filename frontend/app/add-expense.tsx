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
  Alert,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/providers/ThemeProvider";
import { useExpenses } from "../src/providers/ExpensesProvider";
import { spacing, fontSizes } from "../src/utils/theme";
import { parseBRL } from "../src/utils/format";
import { friendlyFirebaseError } from "../src/utils/errors";
import { CATEGORIES, suggestCategory } from "../src/models/Category";
import { isExpenseLimitError } from "../src/services/MonetizationService";
import { TextField, ChipGroup, ScreenFooter, Button, type ChipOption } from "../src/components/ui";

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

  const categoryOptions: ChipOption[] = CATEGORIES.map((c) => ({
    id: c.id,
    label: c.name,
    color: c.color,
    icon: <Ionicons name={c.icon as any} size={14} color={c.color} />,
  }));

  const onSave = async () => {
    if (saving) return;
    Keyboard.dismiss();

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
        Alert.alert("Erro", friendlyFirebaseError(e, "Não foi possível salvar o gasto."));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
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

          <TextField
            testID="add-expense-description"
            label="Descrição (opcional)"
            placeholder="Ex: Almoço no restaurante"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.lg }]}>Categoria</Text>
          <ChipGroup
            testID="category-chip"
            options={categoryOptions}
            selectedId={selected}
            onSelect={(id) => {
              setSelected(id);
              setAutoMode(false);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ScreenFooter>
        <Button testID="add-expense-save" label="Salvar gasto" onPress={onSave} loading={saving} variant="primary" />
      </ScreenFooter>
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
});
