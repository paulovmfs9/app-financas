import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/providers/ThemeProvider";
import { useAuth } from "../src/providers/AuthProvider";
import { spacing, radii, fontSizes } from "../src/utils/theme";
import { PLAN_DEFINITIONS, normalizePlanKey, type PlanDefinition, type PlanKey } from "../src/services/MonetizationService";
import { initSubscriptionPayment } from "../src/services/PaymentService";

export default function PlansScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const router = useRouter();
  const currentPlan = normalizePlanKey(profile?.plan);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  const startSubscription = async (plan: PlanDefinition) => {
    if (plan.key === "basic") return;
    if (plan.comingSoon) {
      Alert.alert("Plano Pro", "As funcionalidades do Plano Pro serão liberadas em breve.");
      return;
    }

    setLoadingPlan(plan.key);
    try {
      const payment = await initSubscriptionPayment(plan.key, "manual");
      if (payment.checkoutUrl) {
        await Linking.openURL(payment.checkoutUrl);
        Alert.alert("Pagamento iniciado", "Conclua o pagamento no checkout para ativar seu plano.");
        return;
      }
      Alert.alert(
        "Checkout pendente",
        "A função de pagamento já foi criada. Configure STANDARD_CHECKOUT_URL e PAYMENT_WEBHOOK_SECRET nas Firebase Functions para ativar o checkout real."
      );
    } catch (error: any) {
      Alert.alert("Erro no pagamento", error?.message || "Não foi possível iniciar a assinatura.");
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
              onPress={() => startSubscription(plan)}
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
}: {
  plan: PlanDefinition;
  active: boolean;
  colors: any;
  onPress: () => void;
  loading?: boolean;
}) {
  const disabled = active || plan.comingSoon || plan.key === "basic" || loading;
  const buttonLabel = active ? "Plano atual" : plan.comingSoon ? "Em breve" : plan.key === "basic" ? "Incluso" : "Assinar";

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

      <View style={styles.priceBlock}>
        <View style={styles.priceLine}>
          <Text style={[styles.pricePrefix, { color: colors.textMuted }]}>de</Text>
          <Text style={[styles.originalPrice, { color: colors.textMuted }]}>{plan.originalPrice}</Text>
        </View>
        <View style={styles.priceLine}>
          <Text style={[styles.pricePrefix, { color: colors.textSecondary }]}>por</Text>
          <Text style={[styles.currentPrice, { color: colors.textPrimary }]}>{plan.currentPrice}</Text>
          <Text style={[styles.period, { color: colors.textMuted }]}>/mês</Text>
        </View>
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
        onPress={onPress}
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
  priceBlock: { marginTop: spacing.lg, marginBottom: spacing.base },
  priceLine: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  pricePrefix: { fontSize: fontSizes.small, fontWeight: "700", marginBottom: 4 },
  originalPrice: { fontSize: fontSizes.body, fontWeight: "700", textDecorationLine: "line-through" },
  currentPrice: { fontSize: 34, fontWeight: "900" },
  period: { fontSize: fontSizes.small, fontWeight: "700", marginBottom: 7 },
  features: { gap: spacing.sm, marginTop: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { flex: 1, fontSize: fontSizes.small, lineHeight: 20 },
  actionButton: { marginTop: spacing.lg, borderWidth: 1, borderRadius: radii.lg, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  actionText: { fontSize: fontSizes.body, fontWeight: "900" },
});
