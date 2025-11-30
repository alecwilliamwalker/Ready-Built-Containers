import { NextResponse } from "next/server";
import { clearUserSessionCookie } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearUserSessionCookie();
  return NextResponse.json({ success: true });
}

