import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { userRegisterSchema } from "@/lib/validation";
import { createUserSessionCookie, hashUserPassword } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = userRegisterSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid registration details", details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password, confirmPassword, name, phone, state, zip, timeline } = parsed.data;
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Account already exists with this email" }, { status: 409 });
    }

    const hashed = await hashUserPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        phone: phone ?? null,
        state: state ?? null,
        zip: zip ?? null,
        timeline: timeline ?? null,
      },
    });

    await createUserSessionCookie({ sub: user.id, email: user.email });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("User registration failed", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}

