import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/providers/ThemeProvider";
import { useAuth } from "../../src/providers/AuthProvider";
import { useExpenses } from "../../src/providers/ExpensesProvider";
import { spacing, radii, fontSizes } from "../../src/utils/theme";
import { formatBRL, formatBRLCompact } from "../../src/utils/format";
import { categoryById } from "../../src/models/Category";
import { previousCycleBounds, percentChange } from "../../src/utils/finance";
import { friendlyFirebaseError } from "../../src/utils/errors";
import { Card, Badge, QuickAction, ListRow } from "../../src/components/ui";
import { ExpenseRepository } from "../../src/repositories/ExpenseRepository";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { snapshot, expenses, loading, deleteExpense, usageLabel, hasUnlimitedExpenses } = useExpenses();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previousPeriodTotal, setPreviousPeriodTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const uid = profile.uid;
    const previousPeriod = previousCycleBounds(
      snapshot.period_start,
      profile?.budget_cycle_start_day ?? 1,
      profile?.budget_cycle_end_day ?? 31
    );
    let cancelled = false;
    ExpenseRepository.sumMonth(uid, previousPeriod.start, previousPeriod.end).then((total) => {
      if (!cancelled) setPreviousPeriodTotal(total);
    });
    return () => {
      cancelled = true;
    };
  }, [snapshot.period_start, profile?.uid, profile?.budget_cycle_start_day, profile?.budget_cycle_end_day]);

  const router = useRouter();

  const now = new Date();
  const monthLabel = `${MONTHS_PT[now.getMonth()]} • ${now.getFullYear()}`;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const alertColor =
    snapshot.alert.level === "success"
      ? colors.success
      : snapshot.alert.level === "warning"
      ? colors.warning
      : snapshot.alert.level === "danger"
      ? colors.danger
      : colors.info;

  const variationPercent = previousPeriodTotal !== null ? percentChange(snapshot.total_spent, previousPeriodTotal) : null;

  const recent = expenses.slice(0, 5);

  const handleDeleteExpense = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteExpense(id);
      setConfirmDeleteId(null);
    } catch (err) {
      Alert.alert("Erro", friendlyFirebaseError(err, "Não foi possível remover o gasto. Tente novamente."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.overline, { color: colors.textMuted }]}>{monthLabel.toUpperCase()}</Text>
        <Text style={[styles.greeting, { color: colors.textPrimary }]}>
          Olá{profile?.name?.trim() ? `, ${profile.name.trim()}` : ""}
        </Text>

        {/* HERO balance */}
        <Card style={styles.heroCard}>
          <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>SALDO DO MÊS</Text>
          <Text
            testID="home-hero-balance"
            style={[styles.hero, { color: snapshot.saldo_restante < 0 ? colors.danger : colors.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatBRL(snapshot.saldo_restante)}
          </Text>
          {variationPercent !== null ? (
            <Badge
              label={`${variationPercent > 0 ? "+" : ""}${variationPercent}% vs. ciclo anterior`}
              variant={variationPercent > 0 ? "danger" : "soft"}
            />
          ) : null}
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            de {formatBRL(Math.max(0, snapshot.salary - snapshot.fixed_bills))} disponíveis
          </Text>
        </Card>

        <View style={styles.planRow}>
          {hasUnlimitedExpenses ? (
            <Badge label={usageLabel} variant="soft" />
          ) : (
            <Text style={[styles.planIndicatorText, { color: colors.textSecondary }]}>{usageLabel}</Text>
          )}
          {!hasUnlimitedExpenses ? (
            <TouchableOpacity testID="home-upgrade-button" activeOpacity={0.75} onPress={() => router.push("/plans" as any)}>
              <Text style={[styles.planAction, { color: colors.primary }]}>Ver planos</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Smart alert */}
        <Card style={styles.alert} padding={spacing.base}>
          <View testID="home-smart-alert" style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: alertColor }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>{snapshot.alert.title}</Text>
              <Text style={[styles.alertMsg, { color: colors.textSecondary }]}>{snapshot.alert.message}</Text>
            </View>
          </View>
        </Card>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <QuickAction
            icon={<Ionicons name="add" size={20} color={colors.primary} />}
            label="Gasto"
            onPress={() => router.push("/add-expense")}
            testID="home-qa-gasto"
          />
          <QuickAction
            icon={<Ionicons name="document-text-outline" size={20} color={colors.primary} />}
            label="Contas"
            onPress={() => router.push("/fixed-bills")}
            testID="home-qa-contas"
          />
          <QuickAction
            icon={<Ionicons name="download-outline" size={20} color={colors.primary} />}
            label="Exportar"
            onPress={() => router.push("/(tabs)/resumo" as any)}
            testID="home-qa-exportar"
          />
          <QuickAction
            icon={<Ionicons name="star-outline" size={20} color={colors.primary} />}
            label="Pro"
            onPress={() => router.push("/plans" as any)}
            testID="home-qa-pro"
          />
        </View>

        {/* Metrics grid */}
        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>GASTOS NO MÊS</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatBRLCompact(snapshot.total_spent)}</Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>LIMITE POR DIA</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatBRLCompact(snapshot.limite_diario)}</Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>{snapshot.days_remaining} dias restantes</Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>MÉDIA DIÁRIA</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatBRLCompact(snapshot.media_diaria)}</Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>Ideal: {formatBRLCompact(snapshot.ideal_diario)}</Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>PROJEÇÃO MENSAL</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{formatBRLCompact(snapshot.projecao_mensal)}</Text>
            <Text style={[styles.metricSub, { color: colors.textMuted }]}>Previsto: {formatBRLCompact(snapshot.saldo_previsto)}</Text>
          </Card>
        </View>

        {/* Recent expenses */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recentes</Text>
          {recent.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary }}>Nenhum gasto ainda. Toque em "Gasto" para começar.</Text>
            </View>
          ) : (
            <Card>
              {recent.map((e, index) => {
                const cat = categoryById(e.category);
                return (
                  <View key={e.id} style={index > 0 ? [styles.expenseRowDividerBase, { borderTopColor: colors.border }] : undefined}>
                    <ListRow
                      icon={<Ionicons name={(cat?.icon as any) || "ellipsis-horizontal"} size={16} color={cat?.color || colors.primary} />}
                      iconBg={(cat?.color || colors.primary) + "22"}
                      title={e.description || cat?.name || "Gasto"}
                      subtitle={`${cat?.name || e.category} • ${new Date(e.date).toLocaleDateString("pt-BR")}`}
                      value={confirmDeleteId === e.id ? undefined : `-${formatBRL(e.amount)}`}
                      valueColor={colors.danger}
                      testID={`home-expense-row-${e.id}`}
                    />
                    {confirmDeleteId === e.id ? (
                      <View style={styles.deleteConfirm}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Cancelar exclusão"
                          activeOpacity={0.75}
                          disabled={deletingId === e.id}
                          onPress={() => setConfirmDeleteId(null)}
                          style={[styles.confirmButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                          testID={`cancel-delete-expense-${e.id}`}
                        >
                          <Text style={[styles.confirmButtonText, { color: colors.textPrimary }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Confirmar exclusão de ${e.description || cat?.name || "gasto"}`}
                          activeOpacity={0.75}
                          disabled={deletingId === e.id}
                          onPress={() => handleDeleteExpense(e.id)}
                          style={[styles.confirmButton, { backgroundColor: colors.danger, borderColor: colors.danger }]}
                          testID={`confirm-delete-expense-${e.id}`}
                        >
                          {deletingId === e.id ? (
                            <ActivityIndicator size="small" color={colors.onPrimary} />
                          ) : (
                            <Text style={[styles.confirmButtonText, { color: colors.onPrimary }]}>Excluir</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Remover gasto ${e.description || cat?.name || "Gasto"}`}
                        activeOpacity={0.75}
                        disabled={deletingId === e.id}
                        onPress={() => setConfirmDeleteId(e.id)}
                        style={[styles.deleteButton, { backgroundColor: colors.danger + "14" }]}
                        testID={`delete-expense-${e.id}`}
                      >
                        {deletingId === e.id ? (
                          <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                          <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </Card>
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xl },
  overline: { fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
  greeting: { fontSize: fontSizes.h2, fontWeight: "700", letterSpacing: -0.5 },
  heroCard: { marginTop: spacing.xl, gap: 6, alignItems: "flex-start" },
  heroLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  hero: { fontSize: 48, fontWeight: "800", letterSpacing: -1.5 },
  heroSub: { fontSize: fontSizes.small, marginTop: 6 },
  planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg, marginBottom: spacing.lg },
  planIndicatorText: { flex: 1, fontSize: fontSizes.small, fontWeight: "700" },
  planAction: { fontSize: fontSizes.small, fontWeight: "800" },
  alert: { marginBottom: spacing.lg },
  alertRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  alertDot: { width: 10, height: 10, borderRadius: 5 },
  alertTitle: { fontSize: fontSizes.body, fontWeight: "700" },
  alertMsg: { fontSize: fontSizes.small, marginTop: 2 },
  quickActions: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  metricCard: { flexBasis: "48%", flexGrow: 1, minHeight: 90 },
  metricLabel: { fontSize: fontSizes.micro, fontWeight: "700", letterSpacing: 0.5 },
  metricValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  metricSub: { fontSize: 11, marginTop: 4 },
  section: { marginTop: spacing.xxl },
  sectionTitle: { fontSize: fontSizes.h3, fontWeight: "700", marginBottom: spacing.md, letterSpacing: -0.3 },
  emptyBox: { padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, alignItems: "center" },
  expenseRowDividerBase: { borderTopWidth: 1, marginTop: spacing.xs, paddingTop: spacing.xs },
  deleteButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  deleteConfirm: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  confirmButton: {
    minWidth: 74,
    height: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: { fontSize: fontSizes.micro, fontWeight: "700" },
});
