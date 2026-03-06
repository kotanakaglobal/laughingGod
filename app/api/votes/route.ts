import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { voteSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = voteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "入力が不正です" }, { status: 400 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: parsed.data.sessionId },
      });

      if (!session) throw new Error("Session not found");
      if (session.status !== "open") throw new Error("締切後は投票できません");

      const post = await tx.post.findFirst({
        where: {
          id: parsed.data.postId,
          sessionId: parsed.data.sessionId,
        },
      });

      if (!post) throw new Error("投稿が見つかりません");

      return tx.vote.create({
        data: {
          sessionId: parsed.data.sessionId,
          postId: parsed.data.postId,
        },
      });
    });

    return NextResponse.json({ vote: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "投票に失敗しました";
    const status = message === "Session not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
