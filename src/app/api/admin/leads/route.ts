import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") ?? undefined;

  const leads = await prisma.lead.findMany({
    where: source ? { source } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leads });
}


