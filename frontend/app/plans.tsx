import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/providers/ThemeProvider";
import { useAuth } from "../src/providers/AuthProvider";
import { spacing, radii, fontSizes } from "../src/utils/theme";
import {
  PLAN_DEFINITIONS,
  annualSavingsPercent,
  normalizePlanKey,
  type BillingInterval,
  type PlanDefinition,
  type PlanKey,
  type PlanPrice,
} from "../src/services/MonetizationService";
import { initSubscriptionPayment } from "../src/services/PaymentService";
import { friendlyFirebaseError } from "../src/utils/errors";

export default function PlansScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const currentPlan = normalizePlanKey(profile?.plan);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [proInterval, setProInterval] = useState<BillingInterval>("monthly");

  const startSubscription = async (plan: PlanDefinition, price: PlanPrice) => {
    if (plan.key === "basic") return;

    setLoadingPlan(plan.key);
    try {
      const payment = await initSubscriptionPayment(plan.key as Exclude<PlanKey, "basic">, price.interval, "manual");
      if (payment.checkoutUrl) {
        await Linking.openURL(payment.checkoutUrl);
        Alert.alert("Pagamento iniciado", "Conclua o pagamento no checkout para ativar seu plano.");
        return;
      }
      Alert.alert(
        "Checkout pendente",
        "A função de pagamento já foi criada. Configure PRO_MONTHLY_CHECKOUT_URL / PRO_ANNUAL_CHECKOUT_URL e PAYMENT_WEBHOOK_SECRET nas Firebase Functions para ativar o checkout real."
      );
    } catch (error: any) {
      Alert.alert("Erro no pagamento", friendlyFirebaseError(error, "Não foi possível iniciar a assinatura."));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity accessibilityRole="button" testID="plans-back-button" onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Planos</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.overline, { color: colors.textMuted }]}>SALDO</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Escolha seu plano</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Comece no Básico e evolua quando precisar de mais controle.</Text>

        <View style={styles.cards}>
          {PLAN_DEFINITIONS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              active={currentPlan === plan.key}
              colors={colors}
              loading={loadingPlan === plan.key}
              interval={proInterval}
              onIntervalChange={setProInterval}
              onPress={(price) => startSubscription(plan, price)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({
  plan,
  active,
  colors,
  onPress,
  loading = false,
  interval,
  onIntervalChange,
}: {
  plan: PlanDefinition;
  active: boolean;
  colors: any;
  onPress: (price: PlanPrice) => void;
  loading?: boolean;
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
}) {
  const hasMultiplePrices = plan.prices.length > 1;
  const price = hasMultiplePrices ? plan.prices.find((p) => p.interval === interval) ?? plan.prices[0] : plan.prices[0];
  const isAnnual = price.interval === "annual";

  const disabled = active || plan.key === "basic" || loading;
  const buttonLabel = active ? "Plano atual" : plan.key === "basic" ? "Incluso" : "Assinar";

  return (
    <View
      testID={`plan-card-${plan.key}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: plan.highlighted ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.cardTopRow}>
        <View>
          <Text style={[styles.planName, { color: colors.textPrimary }]}>{plan.name}</Text>
          <Text style={[styles.planDescription, { color: colors.textSecondary }]}>{plan.description}</Text>
        </View>
        {plan.highlighted ? (
          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>Mais escolhido</Text>
          </View>
        ) : null}
      </View>

      {hasMultiplePrices ? (
        <View style={[styles.intervalToggle, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
          {plan.prices.map((p) => {
            const isSelected = p.interval === interval;
            return (
              <TouchableOpacity
                key={p.interval}
                testID={`plan-interval-${p.interval}`}
                accessibilityRole="button"
                activeOpacity={0.8}
                onPress={() => onIntervalChange(p.interval)}
                style={[
                  styles.intervalOption,
                  isSelected ? { backgroundColor: colors.primary } : null,
                ]}
              >
                <Text style={[styles.intervalOptionText, { color: isSelected ? "#fff" : colors.textSecondary }]}>
                  {p.interval === "monthly" ? "Mensal" : "Anual"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <View style={styles.priceBlock}>
        <View style={styles.priceLine}>
          <Text style={[styles.currentPrice, { color: colors.textPrimary }]}>{price.priceLabel}</Text>
          <Text style={[styles.period, { color: colors.textMuted }]}>{price.periodLabel}</Text>
          {isAnnual ? (
            <View style={[styles.savingsBadge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.savingsBadgeText, { color: colors.primary }]}>Economize {annualSavingsPercent()}%</Text>
            </View>
          ) : null}
        </View>
        {price.fullPriceLabel ? (
          <Text style={[styles.priceNote, { color: colors.textSecondary }]}>{price.fullPriceLabel}</Text>
        ) : null}
        {price.installmentLabel ? (
          <Text style={[styles.priceNote, { color: colors.textSecondary }]}>{price.installmentLabel}</Text>
        ) : null}
        {price.installmentNote ? (
          <Text style={[styles.priceFinePrint, { color: colors.textMuted }]}>{price.installmentNote}</Text>
        ) : null}
      </View>

      <View style={styles.features}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.textPrimary }]}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.82}
        disabled={disabled}
        onPress={() => onPress(price)}
        testID={`plan-action-${plan.key}`}
        style={[
          styles.actionButton,
          {
            backgroundColor: active ? colors.surfaceAlt : plan.highlighted ? colors.primary : colors.background,
            borderColor: plan.highlighted && !active ? colors.primary : colors.border,
            opacity: disabled && !active ? 0.68 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={plan.highlighted && !active ? "#fff" : colors.primary} />
        ) : (
          <Text style={[styles.actionText, { color: plan.highlighted && !active ? "#fff" : active ? colors.primary : colors.textPrimary }]}>{buttonLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: fontSizes.body, fontWeight: "800" },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  overline: { fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
  title: { fontSize: fontSizes.h1, fontWeight: "800" },
  subtitle: { fontSize: fontSizes.body, lineHeight: 23, marginTop: 8, marginBottom: spacing.xl },
  cards: { gap: spacing.base },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  planName: { fontSize: fontSizes.h2, fontWeight: "900" },
  planDescription: { fontSize: fontSizes.small, lineHeight: 20, marginTop: 4, maxWidth: 230 },
  badge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: "900" },
  intervalToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: radii.pill,
    padding: 4,
    marginTop: spacing.lg,
    alignSelf: "flex-start",
  },
  intervalOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.pill },
  intervalOptionText: { fontSize: fontSizes.small, fontWeight: "800" },
  priceBlock: { marginTop: spacing.lg, marginBottom: spacing.base },
  priceLine: { flexDirection: "row", alignItems: "flex-end", gap: 6, flexWrap: "wrap" },
  currentPrice: { fontSize: 34, fontWeight: "900" },
  period: { fontSize: fontSizes.small, fontWeight: "700", marginBottom: 7 },
  savingsBadge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 7, marginLeft: 4 },
  savingsBadgeText: { fontSize: 11, fontWeight: "900" },
  priceNote: { fontSize: fontSizes.small, fontWeight: "700", marginTop: 6 },
  priceFinePrint: { fontSize: 12, marginTop: 2 },
  features: { gap: spacing.sm, marginTop: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { flex: 1, fontSize: fontSizes.small, lineHeight: 20 },
  actionButton: { marginTop: spacing.lg, borderWidth: 1, borderRadius: radii.lg, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  actionText: { fontSize: fontSizes.body, fontWeight: "900" },
});
