import React, { useState } from "react";
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

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { snapshot, expenses, loading, deleteExpense } = useExpenses();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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

  const recent = expenses.slice(0, 5);

  const handleDeleteExpense = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteExpense(id);
      setConfirmDeleteId(null);
    } catch {
      Alert.alert("Erro", "Não foi possível remover o gasto. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.overline, { color: colors.textMuted }]}>{monthLabel.toUpperCase()}</Text>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>
              Olá{profile?.name?.trim() ? `, ${profile.name.trim()}` : ""}
            </Text>
          </View>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        </View>

        {/* HERO balance */}
        <View style={styles.heroWrap}>
          <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Saldo do mês</Text>
          <Text
            testID="home-hero-balance"
            style={[styles.hero, { color: snapshot.saldo_restante < 0 ? colors.danger : colors.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatBRL(snapshot.saldo_restante)}
          </Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            de {formatBRL(Math.max(0, snapshot.salary - snapshot.fixed_bills))} disponíveis
          </Text>
        </View>

        {/* Smart alert */}
        <View testID="home-smart-alert" style={[styles.alert, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.alertDot, { backgroundColor: alertColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>{snapshot.alert.title}</Text>
            <Text style={[styles.alertMsg, { color: colors.textSecondary }]}>{snapshot.alert.message}</Text>
          </View>
        </View>

        {/* Cards grid */}
        <View style={styles.grid}>
          <Card title="Gastos no mês" value={formatBRLCompact(snapshot.total_spent)} icon="trending-down" iconColor={colors.danger} colors={colors} />
          <Card title="Limite por dia" value={formatBRLCompact(snapshot.limite_diario)} icon="speedometer" iconColor={colors.primary} subtitle={`${snapshot.days_remaining} dias restantes`} colors={colors} />
          <Card title="Média diária" value={formatBRLCompact(snapshot.media_diaria)} icon="calendar-outline" iconColor={colors.info} subtitle={`Ideal: ${formatBRLCompact(snapshot.ideal_diario)}`} colors={colors} />
          <Card title="Projeção mensal" value={formatBRLCompact(snapshot.projecao_mensal)} icon="stats-chart" iconColor={colors.warning} subtitle={`Previsto: ${formatBRLCompact(snapshot.saldo_previsto)}`} colors={colors} />
        </View>

        {/* Recent expenses */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recentes</Text>
          {recent.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary }}>Nenhum gasto ainda. Toque no + para começar.</Text>
            </View>
          ) : (
            recent.map((e) => {
              const cat = categoryById(e.category);
              return (
                <View key={e.id} style={[styles.expenseRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.catIcon, { backgroundColor: (cat?.color || colors.primary) + "22" }]}>
                    <Ionicons name={(cat?.icon as any) || "ellipsis-horizontal"} size={18} color={cat?.color || colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.expenseTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {e.description || cat?.name || "Gasto"}
                    </Text>
                    <Text style={[styles.expenseSub, { color: colors.textMuted }]}>
                      {cat?.name || e.category} • {new Date(e.date).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
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
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={[styles.confirmButtonText, { color: "#fff" }]}>Excluir</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.expenseAmount, { color: colors.textPrimary }]}>-{formatBRL(e.amount)}</Text>
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
                    </>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <TouchableOpacity
        testID="fab-add-expense"
        activeOpacity={0.85}
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/add-expense")}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Card({
  title, value, subtitle, colors, icon, iconColor,
}: {
  title: string; value: string; subtitle?: string;
  colors: any; icon: any; iconColor: string;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={[styles.cardValue, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {subtitle ? <Text style={[styles.cardSub, { color: colors.textMuted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xl },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  overline: { fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
  greeting: { fontSize: fontSizes.h2, fontWeight: "700", letterSpacing: -0.5 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 8 },
  heroWrap: { paddingVertical: spacing.xxl, alignItems: "flex-start" },
  heroLabel: { fontSize: fontSizes.small, marginBottom: 6 },
  hero: { fontSize: 48, fontWeight: "800", letterSpacing: -1.5 },
  heroSub: { fontSize: fontSizes.small, marginTop: 6 },
  alert: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.base, borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.lg },
  alertDot: { width: 10, height: 10, borderRadius: 5 },
  alertTitle: { fontSize: fontSizes.body, fontWeight: "700" },
  alertMsg: { fontSize: fontSizes.small, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: { flexBasis: "48%", flexGrow: 1, padding: spacing.base, borderRadius: radii.lg, borderWidth: 1, minHeight: 100 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: fontSizes.micro, fontWeight: "600", letterSpacing: 0.3 },
  cardValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  cardSub: { fontSize: 11, marginTop: 4 },
  section: { marginTop: spacing.xxl },
  sectionTitle: { fontSize: fontSizes.h3, fontWeight: "700", marginBottom: spacing.md, letterSpacing: -0.3 },
  emptyBox: { padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, alignItems: "center" },
  expenseRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.base, borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.sm },
  catIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  expenseTitle: { fontSize: fontSizes.body, fontWeight: "600" },
  expenseSub: { fontSize: fontSizes.micro, marginTop: 2 },
  expenseAmount: { fontSize: fontSizes.body, fontWeight: "700" },
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
  fab: {
    position: "absolute", bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
});
