import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";

const stripe = getStripeClient();

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.id) {
    return;
  }

  const amount = session.amount_total ?? undefined;

  const data: Prisma.ReservationUpdateManyMutationInput = {
    status: "completed",
  };

  if (typeof amount === "number") {
    data.amountCents = amount;
  }

  await prisma.reservation.updateMany({
    where: { stripeSessionId: session.id },
    data,
  });
}

async function handleCheckoutCanceled(session: Stripe.Checkout.Session) {
  if (!session.id) {
    return;
  }

  await prisma.reservation.updateMany({
    where: { stripeSessionId: session.id },
    data: {
      status: "canceled",
    },
  });
}

export async function POST(request: Request) {
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const webhookSecret = getStripeWebhookSecret();
  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await handleCheckoutCanceled(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Error processing Stripe webhook", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}


