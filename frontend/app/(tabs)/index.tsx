import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/providers/ThemeProvider";
import { useAuth } from "../../src/providers/AuthProvider";
import { useExpenses } from "../../src/providers/ExpensesProvider";
import { spacing, radii, fontSizes } from "../../src/utils/theme";
import { formatBRL, formatBRLCompact, parseBRL } from "../../src/utils/format";
import { categoryById } from "../../src/models/Category";
import { installmentEndDate } from "../../src/utils/finance";
import { friendlyFirebaseError } from "../../src/utils/errors";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { snapshot, expenses, fixedBills, loading, deleteExpense, addFixedBill, deleteFixedBill, usageLabel, hasUnlimitedExpenses } = useExpenses();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showFixedBills, setShowFixedBills] = useState(false);
  const [fixedBillName, setFixedBillName] = useState("");
  const [fixedBillAmount, setFixedBillAmount] = useState("");
  const [fixedBillDueDay, setFixedBillDueDay] = useState("1");
  const [fixedBillKind, setFixedBillKind] = useState<"recurring" | "installment">("recurring");
  const [fixedBillInstallments, setFixedBillInstallments] = useState("2");
  const [savingFixedBill, setSavingFixedBill] = useState(false);
  const [deletingFixedBillId, setDeletingFixedBillId] = useState<string | null>(null);
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
  const activeFixedBills = fixedBills.filter((bill) => bill.is_active);

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

  const handleAddFixedBill = async () => {
    if (savingFixedBill) return;
    Keyboard.dismiss();

    const name = fixedBillName.trim();
    const amount = parseBRL(fixedBillAmount);
    const dueDay = Number.parseInt(fixedBillDueDay, 10);
    const installmentCount = Number.parseInt(fixedBillInstallments, 10);

    if (!name) {
      Alert.alert("Nome obrigatório", "Informe o nome da conta fixa.");
      return;
    }
    if (amount <= 0) {
      Alert.alert("Valor inválido", "Digite um valor maior que zero.");
      return;
    }
    if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) {
      Alert.alert("Vencimento inválido", "Informe um dia entre 1 e 31.");
      return;
    }
    if (fixedBillKind === "installment" && (!Number.isFinite(installmentCount) || installmentCount < 1 || installmentCount > 120)) {
      Alert.alert("Parcelas inválidas", "Informe entre 1 e 120 meses.");
      return;
    }

    setSavingFixedBill(true);
    try {
      const installmentStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        Math.min(dueDay, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())
      ).getTime();
      await addFixedBill({
        name,
        amount,
        due_day: dueDay,
        is_active: true,
        ...(fixedBillKind === "installment"
          ? {
              installment_count: installmentCount,
              installment_start_date: installmentStart,
              installment_end_date: installmentEndDate(installmentStart, installmentCount),
            }
          : {}),
      });
      setFixedBillName("");
      setFixedBillAmount("");
      setFixedBillDueDay("1");
      setFixedBillKind("recurring");
      setFixedBillInstallments("2");
    } catch (err) {
      Alert.alert("Erro", friendlyFirebaseError(err, "Não foi possível salvar a conta fixa."));
    } finally {
      setSavingFixedBill(false);
    }
  };

  const handleDeleteFixedBill = async (id: string) => {
    setDeletingFixedBillId(id);
    try {
      await deleteFixedBill(id);
    } catch (err) {
      Alert.alert("Erro", friendlyFirebaseError(err, "Não foi possível remover a conta fixa."));
    } finally {
      setDeletingFixedBillId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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

        <View style={[styles.planIndicator, { backgroundColor: colors.surface, borderColor: hasUnlimitedExpenses ? colors.primary : colors.border }]}> 
          <Text style={[styles.planIndicatorText, { color: hasUnlimitedExpenses ? colors.primary : colors.textSecondary }]}>{usageLabel}</Text>
          {!hasUnlimitedExpenses ? (
            <TouchableOpacity testID="home-upgrade-button" activeOpacity={0.75} onPress={() => router.push("/plans" as any)}>
              <Text style={[styles.planAction, { color: colors.primary }]}>Ver planos</Text>
            </TouchableOpacity>
          ) : null}
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

        <TouchableOpacity
          testID="home-fixed-bills-card"
          activeOpacity={0.82}
          onPress={() => setShowFixedBills((visible) => !visible)}
          style={[styles.fixedBillsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.fixedBillsIcon, { backgroundColor: colors.primarySoft }]}> 
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fixedBillsTitle, { color: colors.textPrimary }]}>Contas fixas</Text>
            <Text style={[styles.fixedBillsSub, { color: colors.textSecondary }]}>Todo mês já começa contando com elas</Text>
          </View>
          <View style={styles.fixedBillsAmountWrap}>
            <Text style={[styles.fixedBillsAmount, { color: colors.textPrimary }]}>{formatBRLCompact(snapshot.fixed_bills)}</Text>
            <Text style={[styles.fixedBillsCount, { color: colors.textMuted }]}>{activeFixedBills.length} ativa{activeFixedBills.length === 1 ? "" : "s"}</Text>
          </View>
          <View style={[styles.fixedBillsChevron, { backgroundColor: colors.primarySoft }]}> 
            <Ionicons name={showFixedBills ? "chevron-down" : "chevron-forward"} size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {showFixedBills ? (
          <View testID="home-fixed-bills-panel" style={[styles.fixedBillsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.fixedBillsPanelTitle, { color: colors.textPrimary }]}>Adicionar conta fixa</Text>
            <Text style={[styles.fixedBillsPanelHint, { color: colors.textSecondary }]}>Use mensal fixa para contas contínuas ou compra parcelada para debitar por alguns meses.</Text>

            <View style={styles.fixedBillsModeRow}>
              {([
                ["recurring", "Mensal fixa"],
                ["installment", "Compra parcelada"],
              ] as const).map(([key, label]) => {
                const active = fixedBillKind === key;
                return (
                  <TouchableOpacity
                    key={key}
                    testID={"home-fixed-bill-mode-" + key}
                    activeOpacity={0.8}
                    onPress={() => setFixedBillKind(key)}
                    style={[
                      styles.fixedBillsModeButton,
                      { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={[styles.fixedBillsModeText, { color: active ? "#fff" : colors.textPrimary }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fixedBillsLabel, { color: colors.textSecondary }]}>Nome da conta</Text>
            <TextInput
              testID="home-fixed-bill-name-input"
              style={[styles.fixedBillsInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Ex: Aluguel, internet, energia"
              placeholderTextColor={colors.textMuted}
              value={fixedBillName}
              onChangeText={setFixedBillName}
            />
            <Text style={[styles.fixedBillsHelper, { color: colors.textMuted }]}>Identifica qual despesa será repetida todo mês.</Text>

            <View style={styles.fixedBillsFormRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fixedBillsLabel, { color: colors.textSecondary }]}>Valor mensal</Text>
                <TextInput
                  testID="home-fixed-bill-amount-input"
                  style={[styles.fixedBillsInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Ex: 1.200,00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={fixedBillAmount}
                  onChangeText={setFixedBillAmount}
                />
              </View>
              <View style={styles.fixedBillsDayWrap}>
                <Text style={[styles.fixedBillsLabel, { color: colors.textSecondary }]}>Vence dia</Text>
                <TextInput
                  testID="home-fixed-bill-due-day-input"
                  style={[styles.fixedBillsInput, styles.fixedBillsDayInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Ex: 5"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={fixedBillDueDay}
                  onChangeText={setFixedBillDueDay}
                />
              </View>
            </View>
            {fixedBillKind === "installment" ? (
              <View>
                <Text style={[styles.fixedBillsLabel, { color: colors.textSecondary }]}>Quantidade de meses</Text>
                <TextInput
                  testID="home-fixed-bill-installments-input"
                  style={[styles.fixedBillsInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Ex: 10"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={fixedBillInstallments}
                  onChangeText={setFixedBillInstallments}
                />
                <Text style={[styles.fixedBillsHelper, { color: colors.textMuted }]}>O valor será debitado uma vez por mês até a última parcela.</Text>
              </View>
            ) : null}
            <TouchableOpacity
              testID="home-fixed-bill-save-button"
              activeOpacity={0.85}
              disabled={savingFixedBill}
              onPress={handleAddFixedBill}
              style={[styles.fixedBillsSaveButton, { backgroundColor: colors.primary, opacity: savingFixedBill ? 0.7 : 1 }]}
            >
              {savingFixedBill ? <ActivityIndicator color="#fff" /> : <Text style={styles.fixedBillsSaveText}>Salvar conta fixa</Text>}
            </TouchableOpacity>

            {fixedBills.length > 0 ? (
              <View style={styles.fixedBillsList}>
                {fixedBills.map((bill) => (
                  <View key={bill.id} style={[styles.fixedBillItem, { borderTopColor: colors.border }]}> 
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fixedBillItemName, { color: colors.textPrimary }]} numberOfLines={1}>{bill.name}</Text>
                      <Text style={[styles.fixedBillItemSub, { color: colors.textMuted }]}>
                        Dia {bill.due_day} • {formatBRL(bill.amount)}
                        {bill.installment_count ? " • " + bill.installment_count + "x ate " + new Date(bill.installment_end_date ?? 0).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }) : ""}
                      </Text>
                    </View>
                    <TouchableOpacity
                      testID={`home-fixed-bill-delete-${bill.id}`}
                      activeOpacity={0.75}
                      disabled={deletingFixedBillId === bill.id}
                      onPress={() => handleDeleteFixedBill(bill.id)}
                      style={[styles.fixedBillDeleteButton, { backgroundColor: colors.danger + "14" }]}
                    >
                      {deletingFixedBillId === bill.id ? <ActivityIndicator size="small" color={colors.danger} /> : <Ionicons name="trash-outline" size={17} color={colors.danger} />}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

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
  planIndicator: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, padding: spacing.base, borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.lg },
  planIndicatorText: { flex: 1, fontSize: fontSizes.small, fontWeight: "700" },
  planAction: { fontSize: fontSizes.small, fontWeight: "800" },
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
  fixedBillsCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.base, borderRadius: radii.lg, borderWidth: 1, marginTop: spacing.lg },
  fixedBillsIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  fixedBillsTitle: { fontSize: fontSizes.body, fontWeight: "800" },
  fixedBillsSub: { fontSize: fontSizes.micro, marginTop: 2 },
  fixedBillsAmountWrap: { alignItems: "flex-end" },
  fixedBillsAmount: { fontSize: fontSizes.body, fontWeight: "900" },
  fixedBillsChevron: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  fixedBillsCount: { fontSize: 11, marginTop: 2 },
  fixedBillsPanel: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.base, marginTop: spacing.sm },
  fixedBillsPanelTitle: { fontSize: fontSizes.body, fontWeight: "800", marginBottom: 4 },
  fixedBillsPanelHint: { fontSize: fontSizes.micro, lineHeight: 18, marginBottom: spacing.base },
  fixedBillsLabel: { fontSize: fontSizes.micro, fontWeight: "800", marginBottom: 6 },
  fixedBillsHelper: { fontSize: 11, lineHeight: 16, marginTop: -4, marginBottom: spacing.base },
  fixedBillsInput: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.base, paddingVertical: 12, fontSize: fontSizes.body, marginBottom: spacing.sm },
  fixedBillsModeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.base },
  fixedBillsModeButton: { flex: 1, borderWidth: 1, borderRadius: radii.md, paddingVertical: 11, paddingHorizontal: spacing.sm, alignItems: "center" },
  fixedBillsModeText: { fontSize: fontSizes.small, fontWeight: "800" },
  fixedBillsFormRow: { flexDirection: "row", gap: spacing.sm },
  fixedBillsDayWrap: { width: 104 },
  fixedBillsDayInput: { textAlign: "center" },
  fixedBillsSaveButton: { paddingVertical: 14, borderRadius: radii.md, alignItems: "center", justifyContent: "center", marginTop: spacing.xs },
  fixedBillsSaveText: { color: "#fff", fontSize: fontSizes.body, fontWeight: "800" },
  fixedBillsList: { marginTop: spacing.base },
  fixedBillItem: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.sm },
  fixedBillItemName: { fontSize: fontSizes.small, fontWeight: "800" },
  fixedBillItemSub: { fontSize: fontSizes.micro, marginTop: 2 },
  fixedBillDeleteButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
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
