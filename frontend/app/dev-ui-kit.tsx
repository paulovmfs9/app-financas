import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useTheme } from "../src/providers/ThemeProvider";
import { spacing, fontSizes } from "../src/utils/theme";
import {
  Card,
  Badge,
  Button,
  TextField,
  ChipGroup,
  Toggle,
  ListRow,
  QuickAction,
  SegmentedControl,
  ScreenFooter,
  type ChipOption,
  type SegmentOption,
} from "../src/components/ui";

const CATEGORY_OPTIONS: ChipOption[] = [
  { id: "food", label: "Alimentação" },
  { id: "transport", label: "Transporte" },
  { id: "bills", label: "Contas" },
];

const PERIOD_OPTIONS: SegmentOption[] = [
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
  { id: "year", label: "Ano" },
];

export default function DevUiKitScreen() {
  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  const { colors } = useTheme();
  const [category, setCategory] = useState("food");
  const [period, setPeriod] = useState("month");
  const [recurring, setRecurring] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.section, { color: colors.textMuted }]}>CARD + BADGE</Text>
        <Card style={{ gap: spacing.sm }}>
          <Badge label="Plano Pro ativo" variant="soft" />
          <Badge label="Economize 50%" variant="dark" />
          <Badge label="Limite atingido" variant="danger" />
        </Card>

        <Text style={[styles.section, { color: colors.textMuted }]}>TEXTFIELD</Text>
        <TextField label="Valor" prefix="R$" placeholder="0,00" keyboardType="decimal-pad" testID="dev-field-valor" />

        <Text style={[styles.section, { color: colors.textMuted }]}>CHIPGROUP</Text>
        <ChipGroup options={CATEGORY_OPTIONS} selectedId={category} onSelect={setCategory} testID="dev-chips" />

        <Text style={[styles.section, { color: colors.textMuted }]}>SEGMENTEDCONTROL</Text>
        <SegmentedControl options={PERIOD_OPTIONS} selectedId={period} onSelect={setPeriod} testID="dev-segment" />

        <Text style={[styles.section, { color: colors.textMuted }]}>TOGGLE</Text>
        <View style={styles.row}>
          <Text style={{ color: colors.textPrimary }}>Gasto recorrente</Text>
          <Toggle value={recurring} onValueChange={setRecurring} testID="dev-toggle" />
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>QUICKACTION (grid)</Text>
        <View style={styles.row}>
          <QuickAction icon={<Ionicons name="add" size={20} color={colors.primary} />} label="Gasto" onPress={() => {}} testID="dev-qa-gasto" />
          <QuickAction icon={<Ionicons name="document-text-outline" size={20} color={colors.primary} />} label="Contas" onPress={() => {}} testID="dev-qa-contas" />
          <QuickAction icon={<Ionicons name="download-outline" size={20} color={colors.primary} />} label="Exportar" onPress={() => {}} testID="dev-qa-exportar" />
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>LISTROW</Text>
        <Card>
          <ListRow
            icon={<Ionicons name="fast-food-outline" size={16} color={colors.primary} />}
            title="iFood"
            subtitle="Hoje, 19:42"
            value="-R$ 42,00"
            valueColor={colors.danger}
            testID="dev-row-1"
          />
          <ListRow
            icon={<Ionicons name="flash-outline" size={16} color={colors.primary} />}
            title="Energia"
            subtitle="Ontem"
            value="-R$ 180,00"
            valueColor={colors.danger}
            testID="dev-row-2"
          />
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      <ScreenFooter>
        <Button label="Salvar gasto" onPress={() => {}} variant="primary" testID="dev-footer-primary" />
        <Button label="Cancelar" onPress={() => {}} variant="ghost" testID="dev-footer-ghost" />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, gap: spacing.base },
  section: { fontSize: fontSizes.micro, fontWeight: "800", letterSpacing: 1, marginTop: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
});
