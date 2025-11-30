import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { adminLoginSchema } from "@/lib/validation";
import { createAdminSessionCookie, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = adminLoginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const admin = await prisma.adminUser.findUnique({ where: { email } });

    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createAdminSessionCookie({ sub: admin.id, email: admin.email });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login failed", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}


