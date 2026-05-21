import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "../../src/providers/ThemeProvider";
import { useExpenses } from "../../src/providers/ExpensesProvider";
import { spacing, radii, fontSizes } from "../../src/utils/theme";
import { formatBRL } from "../../src/utils/format";
import { CATEGORIES, categoryById } from "../../src/models/Category";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const CHART_SIZE = 184;
const CHART_RADIUS = CHART_SIZE / 2;
const CENTER = CHART_SIZE / 2;

type ChartSlice = {
  id: string;
  name: string;
  color: string;
  value: number;
  percent: number;
  startAngle: number;
  endAngle: number;
};

export default function ResumoScreen() {
  const { colors } = useTheme();
  const { snapshot, usageLabel, isPro, openUpgradeModal } = useExpenses();
  const now = new Date();
  const monthLabel = `${MONTHS_PT[now.getMonth()]} de ${now.getFullYear()}`;
  const chartSlices = buildChartSlices(snapshot.by_category, snapshot.total_spent);

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
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Visão completa das suas finanças deste mês.</Text>

        <View style={[styles.planIndicator, { backgroundColor: colors.surface, borderColor: isPro ? colors.primary : colors.border }]}> 
          <Text style={[styles.planIndicatorText, { color: isPro ? colors.primary : colors.textSecondary }]}>{usageLabel}</Text>
          {!isPro ? (
            <Text testID="resumo-upgrade-button" onPress={openUpgradeModal} style={[styles.planAction, { color: colors.primary }]}>Plano Pro</Text>
          ) : null}
        </View>

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
        <View testID="resumo-expenses-pie-chart" style={[styles.chartBox, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Gastos por categoria</Text>
            <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}> 
              {snapshot.total_spent > 0 ? formatBRL(snapshot.total_spent) : "Nenhum gasto registrado"}
            </Text>
          </View>

          {chartSlices.length === 0 ? (
            <View style={[styles.emptyChart, { borderColor: colors.border }]}> 
              <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
                Adicione gastos para visualizar a divisão por categoria.
              </Text>
            </View>
          ) : (
            <View style={styles.chartContent}>
              <PieChart slices={chartSlices} backgroundColor={colors.surfaceAlt} />
              <View style={styles.legend}>
                {chartSlices.map((slice) => (
                  <View key={slice.id} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.legendName, { color: colors.textPrimary }]} numberOfLines={1}>{slice.name}</Text>
                      <Text style={[styles.legendValue, { color: colors.textMuted }]}> 
                        {formatBRL(slice.value)} • {slice.percent.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
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

function buildChartSlices(byCategory: Record<string, number>, totalSpent: number): ChartSlice[] {
  if (totalSpent <= 0) return [];

  let currentAngle = -90;
  return Object.entries(byCategory)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([id, value]) => {
      const category = categoryById(id);
      const percent = (value / totalSpent) * 100;
      const sweep = (value / totalSpent) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweep;
      currentAngle = endAngle;

      return {
        id,
        name: category?.name || id,
        color: category?.color || CATEGORIES[CATEGORIES.length - 1].color,
        value,
        percent,
        startAngle,
        endAngle,
      };
    });
}

function PieChart({ slices, backgroundColor }: { slices: ChartSlice[]; backgroundColor: string }) {
  if (slices.length === 1) {
    return (
      <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
        <Circle cx={CENTER} cy={CENTER} r={CHART_RADIUS} fill={slices[0].color} />
      </Svg>
    );
  }

  return (
    <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
      <Circle cx={CENTER} cy={CENTER} r={CHART_RADIUS} fill={backgroundColor} />
      {slices.map((slice) => (
        <Path key={slice.id} d={describeSlice(slice.startAngle, slice.endAngle)} fill={slice.color} />
      ))}
    </Svg>
  );
}

function describeSlice(startAngle: number, endAngle: number): string {
  const start = polarToCartesian(endAngle);
  const end = polarToCartesian(startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${CHART_RADIUS} ${CHART_RADIUS} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function polarToCartesian(angleInDegrees: number): { x: number; y: number } {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: CENTER + CHART_RADIUS * Math.cos(angleInRadians),
    y: CENTER + CHART_RADIUS * Math.sin(angleInRadians),
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl },
  overline: { fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
  title: { fontSize: fontSizes.h1, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { fontSize: fontSizes.body, marginTop: 6, marginBottom: spacing.xl },
  planIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, padding: spacing.base, borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.lg },
  planIndicatorText: { flex: 1, fontSize: fontSizes.small, fontWeight: "700" },
  planAction: { fontSize: fontSizes.small, fontWeight: "800" },
  table: { borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: spacing.base },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18 },
  rowLabel: { fontSize: fontSizes.body, fontWeight: "500" },
  rowValue: { fontSize: fontSizes.body, fontWeight: "700" },
  chartBox: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.base },
  chartHeader: { marginBottom: spacing.base },
  chartTitle: { fontSize: fontSizes.h3, fontWeight: "700", letterSpacing: -0.2 },
  chartSubtitle: { fontSize: fontSizes.small, marginTop: 4 },
  chartContent: { alignItems: "center", gap: spacing.lg },
  emptyChart: {
    minHeight: 150,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  legend: { alignSelf: "stretch", gap: spacing.md },
  legendRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendName: { fontSize: fontSizes.small, fontWeight: "700" },
  legendValue: { fontSize: fontSizes.micro, marginTop: 2 },
  tipBox: { padding: spacing.lg, borderRadius: radii.lg },
  tipTitle: { fontSize: fontSizes.small, fontWeight: "800", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" },
  tipBody: { fontSize: fontSizes.body, lineHeight: 22 },
});
