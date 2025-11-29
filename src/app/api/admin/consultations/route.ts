import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const preferredModel = searchParams.get("model") ?? undefined;

  const consultations = await prisma.consultationRequest.findMany({
    where: preferredModel ? { preferredModel } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ consultations });
}


