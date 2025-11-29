import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { userLoginSchema } from "@/lib/validation";
import { createUserSessionCookie, verifyUserPassword } from "@/lib/user-auth";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = userLoginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials", details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyUserPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createUserSessionCookie({ sub: user.id, email: user.email });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User login failed", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}

