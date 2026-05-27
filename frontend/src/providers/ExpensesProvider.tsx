/**
 * ExpensesProvider: subscribes to the current month's expenses from Firestore
 * and exposes both the raw list and the computed finance snapshot (saldo,
 * média diária, projeção, alerta, etc).
 */
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import type { Expense, ExpenseInput } from "../models/Expense";
import type { FixedBill, FixedBillInput } from "../models/FixedBill";
import { ExpenseRepository } from "../repositories/ExpenseRepository";
import { FixedBillRepository } from "../repositories/FixedBillRepository";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { computeSnapshot, monthBounds, monthKey, FinanceSnapshot } from "../utils/finance";
import {
  FREE_MONTHLY_EXPENSE_LIMIT,
  ExpenseLimitError,
  isUnlimitedPlan,
  LIMIT_REACHED_MESSAGE,
  openUpgradeModal as showUpgradeModal,
} from "../services/MonetizationService";
import { spacing, radii, fontSizes } from "../utils/theme";

interface ExpensesCtx {
  loading: boolean;
  expenses: Expense[];
  fixedBills: FixedBill[];
  fixedBillsTotal: number;
  snapshot: FinanceSnapshot;
  monthlyExpenseCount: number;
  hasUnlimitedExpenses: boolean;
  usageLabel: string;
  addExpense: (input: ExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addFixedBill: (input: FixedBillInput) => Promise<void>;
  deleteFixedBill: (id: string) => Promise<void>;
  openUpgradeModal: () => void;
}

type MonetizationModal = "limit" | "upgrade" | "payment" | null;

const Ctx = createContext<ExpensesCtx | null>(null);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, profile, updateProfile } = useAuth();
  const { colors } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => monthKey());
  const [activeModal, setActiveModal] = useState<MonetizationModal>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMonth((prev) => {
        const next = monthKey();
        return prev === next ? prev : next;
      });
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setExpenses([]);
      setFixedBills([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { start, end } = monthBounds();
    const unsub = ExpenseRepository.subscribeMonth(
      firebaseUser.uid,
      start,
      end,
      (items) => {
        setExpenses(items);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [firebaseUser, currentMonth]);


  useEffect(() => {
    if (!firebaseUser) {
      setFixedBills([]);
      return;
    }

    const unsub = FixedBillRepository.subscribeAll(
      firebaseUser.uid,
      setFixedBills,
      () => setFixedBills([])
    );
    return () => unsub();
  }, [firebaseUser]);

  const hasUnlimitedExpenses = isUnlimitedPlan(profile);
  const monthlyExpenseCount = expenses.length;
  const usageLabel = hasUnlimitedExpenses
    ? "Plano Standard ativo - gastos ilimitados"
    : `Plano Básico: ${monthlyExpenseCount}/${FREE_MONTHLY_EXPENSE_LIMIT} gastos`;

  const recurringFixedBillsTotal = useMemo(
    () => fixedBills.filter((bill) => bill.is_active).reduce((sum, bill) => sum + bill.amount, 0),
    [fixedBills]
  );
  const legacyFixedBillsTotal = profile?.fixed_bills_total ?? 0;
  const fixedBillsTotal = fixedBills.length > 0 ? recurringFixedBillsTotal : legacyFixedBillsTotal;

  const snapshot = useMemo<FinanceSnapshot>(() => {
    const salary = profile?.monthly_salary ?? 0;
    return computeSnapshot(salary, fixedBillsTotal, expenses);
  }, [expenses, fixedBillsTotal, profile?.monthly_salary]);

  const openUpgradeModal = useCallback(() => {
    showUpgradeModal(() => setActiveModal("upgrade"));
  }, []);

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      if (!firebaseUser) throw new Error("Não autenticado");
      try {
        await ExpenseRepository.create(firebaseUser.uid, input);
      } catch (err: any) {
        if (err?.code === "functions/resource-exhausted" || err?.code === "resource-exhausted") {
          setActiveModal("limit");
          throw new ExpenseLimitError();
        }
        throw err;
      }
      // Live snapshot will update automatically via onSnapshot.
    },
    [firebaseUser]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!firebaseUser) throw new Error("Não autenticado");

      let removedExpense: Expense | undefined;
      setExpenses((current) => {
        removedExpense = current.find((expense) => expense.id === id);
        return current.filter((expense) => expense.id !== id);
      });

      try {
        await ExpenseRepository.remove(firebaseUser.uid, id);
      } catch (err) {
        const expenseToRestore = removedExpense;
        if (expenseToRestore) {
          setExpenses((current) => {
            if (current.some((expense) => expense.id === expenseToRestore.id)) return current;
            return [...current, expenseToRestore].sort((a, b) => b.date - a.date);
          });
        }
        throw err;
      }
    },
    [firebaseUser]
  );

  const addFixedBill = useCallback(
    async (input: FixedBillInput) => {
      if (!firebaseUser) throw new Error("Não autenticado");
      try {
        await FixedBillRepository.create(firebaseUser.uid, input);
      } catch {
        await updateProfile({ fixed_bills_total: fixedBillsTotal + input.amount });
      }
    },
    [firebaseUser, fixedBillsTotal, updateProfile]
  );

  const deleteFixedBill = useCallback(
    async (id: string) => {
      if (!firebaseUser) throw new Error("Não autenticado");
      await FixedBillRepository.remove(firebaseUser.uid, id);
    },
    [firebaseUser]
  );

  return (
    <Ctx.Provider
      value={{
        loading,
        expenses,
        fixedBills,
        fixedBillsTotal,
        snapshot,
        monthlyExpenseCount,
        hasUnlimitedExpenses,
        usageLabel,
        addExpense,
        deleteExpense,
        addFixedBill,
        deleteFixedBill,
        openUpgradeModal,
      }}
    >
      {children}
      <MonetizationModalView
        activeModal={activeModal}
        close={() => setActiveModal(null)}
        showUpgrade={() => setActiveModal("upgrade")}
        showPaymentInfo={() => setActiveModal("payment")}
        colors={colors}
      />
    </Ctx.Provider>
  );
}

function MonetizationModalView({
  activeModal,
  close,
  showUpgrade,
  showPaymentInfo,
  colors,
}: {
  activeModal: MonetizationModal;
  close: () => void;
  showUpgrade: () => void;
  showPaymentInfo: () => void;
  colors: any;
}) {
  const visible = activeModal !== null;
  const isLimit = activeModal === "limit";
  const isUpgrade = activeModal === "upgrade";
  const isPayment = activeModal === "payment";

  if (!visible) return null;

  return (
    <View style={styles.modalBackdrop}>
      <TouchableOpacity accessibilityRole="button" activeOpacity={1} onPress={close} style={StyleSheet.absoluteFill} />
      <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          {isLimit ? (
            <>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Limite do Plano Básico atingido</Text>
              <Text style={[styles.modalBody, { color: colors.textSecondary }]}>{LIMIT_REACHED_MESSAGE}</Text>
              <TouchableOpacity testID="limit-upgrade-button" activeOpacity={0.85} onPress={showUpgrade} style={[styles.primaryButton, { backgroundColor: colors.primary }]}> 
                <Text style={styles.primaryButtonText}>Ver planos</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="limit-later-button" activeOpacity={0.75} onPress={close} style={styles.secondaryButton}> 
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Agora não</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {isUpgrade ? (
            <>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Plano Standard</Text>
              <Text style={[styles.price, { color: colors.primary }]}>R$ 9,90/mês</Text>
              <View style={styles.benefits}>
                {[
                  "gastos ilimitados",
                  "controle financeiro completo",
                  "média diária de gastos",
                  "projeção de gastos até o fim do mês",
                  "acompanhamento mensal sem limite",
                ].map((item) => (
                  <Text key={item} style={[styles.benefit, { color: colors.textPrimary }]}>- {item}</Text>
                ))}
              </View>
              <TouchableOpacity testID="upgrade-subscribe-button" activeOpacity={0.85} onPress={showPaymentInfo} style={[styles.primaryButton, { backgroundColor: colors.primary }]}> 
                <Text style={styles.primaryButtonText}>Assinar Plano Standard</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="upgrade-later-button" activeOpacity={0.75} onPress={close} style={styles.secondaryButton}> 
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>Agora não</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {isPayment ? (
            <>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Assinatura em breve</Text>
              <Text style={[styles.modalBody, { color: colors.textSecondary }]}>Em breve você poderá assinar com cartão de crédito, Pix, Apple Pay ou Google Play.</Text>
              <TouchableOpacity testID="payment-info-ok-button" activeOpacity={0.85} onPress={close} style={[styles.primaryButton, { backgroundColor: colors.primary }]}> 
                <Text style={styles.primaryButtonText}>Entendi</Text>
              </TouchableOpacity>
            </>
          ) : null}
      </View>
    </View>
  );
}

export function useExpenses(): ExpensesCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useExpenses must be used within ExpensesProvider");
  return v;
}

const styles = StyleSheet.create({
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.xl,
  },
  modalTitle: { fontSize: fontSizes.h2, fontWeight: "800", marginBottom: spacing.sm },
  modalBody: { fontSize: fontSizes.body, lineHeight: 23, marginBottom: spacing.lg },
  price: { fontSize: 28, fontWeight: "900", marginBottom: spacing.base },
  benefits: { gap: spacing.sm, marginBottom: spacing.lg },
  benefit: { fontSize: fontSizes.body, lineHeight: 22 },
  primaryButton: {
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: fontSizes.body, fontWeight: "800" },
  secondaryButton: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { fontSize: fontSizes.body, fontWeight: "700" },
});
