import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  const reservations = await prisma.reservation.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reservations });
}


