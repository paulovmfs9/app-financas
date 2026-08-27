import React, { useState } from "react";
import { Alert, Linking, View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/providers/ThemeProvider";
import { useAuth } from "../src/providers/AuthProvider";
import { spacing, fontSizes } from "../src/utils/theme";
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
import { Card, Badge, Button, SegmentedControl, type SegmentOption } from "../src/components/ui";

const INTERVAL_OPTIONS: SegmentOption[] = [
  { id: "monthly", label: "Mensal" },
  { id: "annual", label: "Anual" },
];

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
  const buttonVariant = active ? "secondary" : plan.highlighted ? "primary" : "secondary";

  return (
    <View testID={`plan-card-${plan.key}`}>
      {hasMultiplePrices ? (
        <View style={styles.intervalToggleWrap}>
          <SegmentedControl
            testID={`plan-interval-${plan.key}`}
            options={INTERVAL_OPTIONS}
            selectedId={interval}
            onSelect={(id) => onIntervalChange(id as BillingInterval)}
          />
        </View>
      ) : null}

      <Card style={[plan.highlighted ? { borderColor: colors.primary } : null]}>
        <View style={styles.cardTopRow}>
          <View>
            <Text style={[styles.planName, { color: colors.textPrimary }]}>{plan.name}</Text>
            <Text style={[styles.planDescription, { color: colors.textSecondary }]}>{plan.description}</Text>
          </View>
          {plan.highlighted ? <Badge label="Mais escolhido" variant="soft" /> : null}
        </View>

        <View style={styles.priceBlock}>
          <View style={styles.priceLine}>
            <Text style={[styles.currentPrice, { color: colors.textPrimary }]}>{price.priceLabel}</Text>
            <Text style={[styles.period, { color: colors.textMuted }]}>{price.periodLabel}</Text>
            {isAnnual ? <Badge label={`Economize ${annualSavingsPercent()}%`} variant="soft" /> : null}
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

        <Button
          testID={`plan-action-${plan.key}`}
          label={buttonLabel}
          onPress={() => onPress(price)}
          disabled={disabled}
          loading={loading}
          variant={buttonVariant}
        />
      </Card>
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
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  planName: { fontSize: fontSizes.h2, fontWeight: "900" },
  planDescription: { fontSize: fontSizes.small, lineHeight: 20, marginTop: 4, maxWidth: 230 },
  intervalToggleWrap: { marginTop: spacing.lg, alignItems: "flex-start" },
  priceBlock: { marginTop: spacing.lg, marginBottom: spacing.base },
  priceLine: { flexDirection: "row", alignItems: "flex-end", gap: 6, flexWrap: "wrap" },
  currentPrice: { fontSize: 34, fontWeight: "900" },
  period: { fontSize: fontSizes.small, fontWeight: "700", marginBottom: 7 },
  priceNote: { fontSize: fontSizes.small, fontWeight: "700", marginTop: 6 },
  priceFinePrint: { fontSize: 12, marginTop: 2 },
  features: { gap: spacing.sm, marginTop: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { flex: 1, fontSize: fontSizes.small, lineHeight: 20 },
});
