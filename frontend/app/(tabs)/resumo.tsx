import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/providers/ThemeProvider";
import { useExpenses } from "../../src/providers/ExpensesProvider";
import { spacing, radii, fontSizes } from "../../src/utils/theme";
import { formatBRL } from "../../src/utils/format";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function ResumoScreen() {
  const { colors } = useTheme();
  const { snapshot } = useExpenses();
  const now = new Date();
  const monthLabel = `${MONTHS_PT[now.getMonth()]} de ${now.getFullYear()}`;

  const rows: { label: string; value: number; emphasis?: "positive" | "negative" | "neutral" }[] = [
    { label: "Salário", value: snapshot.salary },
    { label: "Contas fixas", value: -snapshot.fixed_bills },
    { label: "Gastos atuais", value: -snapshot.total_spent },
    { label: "Média diária", value: snapshot.media_diaria, emphasis: "neutral" },
    { label: "Projeção mensal", value: snapshot.projecao_mensal, emphasis: "neutral" },
    {
      label: "Saldo previsto",
      value: snapshot.saldo_previsto,
      emphasis: snapshot.saldo_previsto < 0 ? "negative" : "positive",
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.overline, { color: colors.textMuted }]}>RESUMO</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{monthLabel}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Visão completa das suas finanças deste mês.
        </Text>

        <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {rows.map((r, i) => {
            const isLast = i === rows.length - 1;
            const valColor =
              r.emphasis === "negative"
                ? colors.danger
                : r.emphasis === "positive"
                ? colors.success
                : r.value < 0
                ? colors.danger
                : colors.textPrimary;
            return (
              <View
                key={r.label}
                style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: isLast ? 0 : 1 }]}
                testID={`resumo-row-${r.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{r.label}</Text>
                <Text style={[styles.rowValue, { color: valColor }]}>{formatBRL(r.value)}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
        <View style={[styles.tipBox, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.tipTitle, { color: colors.primary }]}>Dica do dia</Text>
          <Text style={[styles.tipBody, { color: colors.textPrimary }]}>
            Tente manter sua média diária próxima do limite ideal. Pequenos ajustes diários fazem grande diferença no fim do mês.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl },
  overline: { fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
  title: { fontSize: fontSizes.h1, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { fontSize: fontSizes.body, marginTop: 6, marginBottom: spacing.xl },
  table: { borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: spacing.base },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18 },
  rowLabel: { fontSize: fontSizes.body, fontWeight: "500" },
  rowValue: { fontSize: fontSizes.body, fontWeight: "700" },
  tipBox: { padding: spacing.lg, borderRadius: radii.lg },
  tipTitle: { fontSize: fontSizes.small, fontWeight: "800", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" },
  tipBody: { fontSize: fontSizes.body, lineHeight: 22 },
});
