import Stripe from "stripe";
import { env, requireEnv } from "@/lib/env";

const globalStripe = globalThis as unknown as {
  stripeClient?: Stripe;
};

export function getStripeClient() {
  if (globalStripe.stripeClient) {
    return globalStripe.stripeClient;
  }

  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("Stripe secret key is not configured");
  }

  const client = new Stripe(secret);

  if (process.env.NODE_ENV !== "production") {
    globalStripe.stripeClient = client;
  }

  return client;
}

export function getDepositPriceId() {
  return requireEnv("STRIPE_PRICE_ID_DEPOSIT");
}

export function getStripeWebhookSecret() {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

