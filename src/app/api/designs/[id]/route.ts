import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserSession } from "@/lib/user-auth";
import { designSaveSchema, designUpdateSchema } from "@/lib/validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function requireSession() {
  const session = await getUserSession();
  if (!session) {
    return null;
  }
  return session;
}

export async function GET(_: Request, { params }: RouteParams) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const design = await prisma.design.findFirst({ where: { id, userId: session.sub } });
  if (!design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  return NextResponse.json({ design });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.design.findFirst({ where: { id, userId: session.sub } });
  if (!existing) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const parsed = designUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid design payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (typeof data.name === "string") updateData.name = data.name;
    if (typeof data.shellLengthFt === "number") updateData.shellLengthFt = data.shellLengthFt;
    if (data.config !== undefined) updateData.configJson = data.config;
    if (data.configJson !== undefined) updateData.configJson = data.configJson;
    if (data.bomSelectionsJson !== undefined) updateData.bomSelectionsJson = data.bomSelectionsJson ?? null;
    if (typeof data.priceCents === "number") updateData.priceCents = data.priceCents;
    if (data.previewImageUrl !== undefined) updateData.previewImageUrl = data.previewImageUrl ?? null;
    
    // Extract shellLengthFt from DesignConfig if configJson is provided and shellLengthFt is not
    if (data.configJson && typeof data.configJson === "object" && data.configJson !== null) {
      const config = data.configJson as { shell?: { lengthFt?: number } };
      if (config.shell?.lengthFt && !updateData.shellLengthFt) {
        updateData.shellLengthFt = config.shell.lengthFt;
      }
    }

    const design = await prisma.design.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({ design });
  } catch (error) {
    console.error("Error updating design", error);
    return NextResponse.json({ error: "Failed to update design" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.design.findFirst({ where: { id, userId: session.sub } });
  if (!existing) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  await prisma.design.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}

