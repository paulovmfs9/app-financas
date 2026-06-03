import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase.config";
import type { PlanKey } from "./MonetizationService";

export type PaymentProvider = "manual" | "mercadopago" | "stripe" | "apple" | "google" | "revenuecat";

export interface SubscriptionPaymentResult {
  paymentId: string;
  provider: PaymentProvider;
  checkoutUrl: string | null;
  status: "pending" | "configuration_required";
}

export async function initSubscriptionPayment(
  plan: Exclude<PlanKey, "basic">,
  provider: PaymentProvider = "manual"
): Promise<SubscriptionPaymentResult> {
  const callable = httpsCallable<
    { plan: Exclude<PlanKey, "basic">; provider: PaymentProvider },
    SubscriptionPaymentResult
  >(functions, "initSubscriptionPayment");
  const result = await callable({ plan, provider });
  return result.data;
}
