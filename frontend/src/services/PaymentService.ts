import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase.config";
import { PRO_ANNUAL_MAX_INSTALLMENTS, type BillingInterval, type PlanKey } from "./MonetizationService";

export type PaymentProvider = "manual" | "mercadopago" | "stripe" | "apple" | "google" | "revenuecat";

export interface SubscriptionPaymentResult {
  paymentId: string;
  provider: PaymentProvider;
  interval: BillingInterval;
  installments: number;
  checkoutUrl: string | null;
  status: "pending" | "configuration_required";
}

export async function initSubscriptionPayment(
  plan: Exclude<PlanKey, "basic">,
  interval: BillingInterval,
  provider: PaymentProvider = "manual"
): Promise<SubscriptionPaymentResult> {
  const installments = interval === "annual" ? PRO_ANNUAL_MAX_INSTALLMENTS : 1;
  const callable = httpsCallable<
    { plan: Exclude<PlanKey, "basic">; interval: BillingInterval; installments: number; provider: PaymentProvider },
    SubscriptionPaymentResult
  >(functions, "initSubscriptionPayment");
  const result = await callable({ plan, interval, installments, provider });
  return result.data;
}
