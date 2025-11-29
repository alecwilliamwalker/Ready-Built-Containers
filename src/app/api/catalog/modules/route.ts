import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const modules = await prisma.moduleCatalog.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ modules });
}

