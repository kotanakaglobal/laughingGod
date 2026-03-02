import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/normalize";
import { postSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = postSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "入力が不正です" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { id: parsed.data.sessionId } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status === "closed") {
    return NextResponse.json({ error: "締切後は投稿できません" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      sessionId: parsed.data.sessionId,
      authorNameRaw: parsed.data.authorName.trim(),
      authorNameNorm: normalizeName(parsed.data.authorName),
      text: parsed.data.text.trim(),
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
