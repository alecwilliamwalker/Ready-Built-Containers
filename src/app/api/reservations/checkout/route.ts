import { NextResponse } from "next/server";
import { reservationSchema } from "@/lib/validation";
import prisma from "@/lib/db";
import { getStripeClient, getDepositPriceId } from "@/lib/stripe";
import { env } from "@/lib/env";

const DEFAULT_SITE_URL = "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = reservationSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid reservation submission",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { confirmTerms, ...data } = parsed.data;
    if (!confirmTerms) {
      return NextResponse.json({ error: "Reservation terms must be accepted" }, { status: 400 });
    }

    const stripe = getStripeClient();
    const priceId = getDepositPriceId();
    const price = await stripe.prices.retrieve(priceId);

    if (!price.active || !price.unit_amount) {
      return NextResponse.json({ error: "Reservation deposit price is not available" }, { status: 500 });
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
    const successUrl = `${siteUrl}/thank-you?type=reserve`;
    const cancelUrl = `${siteUrl}/reserve?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        name: data.name,
        email: data.email,
        modelSlug: data.modelSlug ?? "",
      },
      customer_email: data.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe session could not be created" }, { status: 500 });
    }

    await prisma.reservation.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        modelSlug: data.modelSlug ?? null,
        amountCents: price.unit_amount,
        stripeSessionId: session.id,
        status: "pending",
      },
    });

    return NextResponse.json({ url: session.url }, { status: 201 });
  } catch (error) {
    console.error("Error creating reservation checkout session", error);
    return NextResponse.json({ error: "Failed to create reservation checkout" }, { status: 500 });
  }
}


