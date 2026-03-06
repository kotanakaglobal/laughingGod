import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { closeSchema } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => ({}));
  const parsed = closeSchema.safeParse({
    sessionId: params.id || body.sessionId,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "入力が不正です" }, { status: 400 });
  }

  const existing = await prisma.session.findUnique({
    where: { id: parsed.data.sessionId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = await prisma.session.update({
    where: { id: parsed.data.sessionId },
    data: { status: "closed" },
  });

  return NextResponse.json({ session });
}
