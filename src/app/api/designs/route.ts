import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserSession } from "@/lib/user-auth";
import { designSaveSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

async function requireUser() {
  const session = await getUserSession();
  if (!session) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const designs = await prisma.design.findMany({
    where: { userId: session.sub },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ designs });
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = designSaveSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid design payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, shellLengthFt, config, configJson, bomSelectionsJson, priceCents, previewImageUrl } = parsed.data;
    
    // Support both old format (config) and new format (configJson)
    const configData = configJson ?? config;
    // Extract shellLengthFt from DesignConfig if not provided directly
    const shellLength = shellLengthFt ?? (configData as { shell?: { lengthFt?: number } })?.shell?.lengthFt ?? 40;
    
    const design = await prisma.design.create({
      data: {
        userId: session.sub,
        name,
        shellLengthFt: shellLength,
        configJson: configData ?? {},
        bomSelectionsJson: bomSelectionsJson ?? undefined,
        priceCents: priceCents ?? 0,
        previewImageUrl: previewImageUrl ?? undefined,
      },
    });

    return NextResponse.json({ design }, { status: 201 });
  } catch (error) {
    console.error("Error creating design", error);
    return NextResponse.json({ error: "Failed to create design" }, { status: 500 });
  }
}

