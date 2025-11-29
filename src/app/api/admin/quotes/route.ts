import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const modelSlug = searchParams.get("model") ?? undefined;

  const quotes = await prisma.quoteRequest.findMany({
    where: modelSlug ? { modelSlug } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ quotes });
}


