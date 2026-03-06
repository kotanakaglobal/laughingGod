import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/normalize";
import { voteSchema } from "@/lib/validation";

function isP2002Error(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string"
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = voteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "入力が不正です" }, { status: 400 });
  }

  const uniquePostIds = [...new Set(parsed.data.postIds)];
  if (uniquePostIds.length !== parsed.data.postIds.length) {
    return NextResponse.json(
      { error: "同じ投稿に複数票は入れられません" },
      { status: 400 },
    );
  }

  const voterNameNorm = normalizeName(parsed.data.voterName);

  try {
    const createdCount = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const session = await tx.session.findUnique({
          where: { id: parsed.data.sessionId },
        });
        if (!session) throw new Error("Session not found");
        if (session.status !== "open") throw new Error("締切後は投票できません");

        const posts = (await tx.post.findMany({
          where: { sessionId: parsed.data.sessionId, id: { in: uniquePostIds } },
          select: { authorNameNorm: true },
        })) as Array<{ authorNameNorm: string }>;

        if (posts.length !== uniquePostIds.length) {
          throw new Error("投稿が見つかりません");
        }

        const hasSelfVote = posts.some(
          (p: { authorNameNorm: string }) => p.authorNameNorm === voterNameNorm,
        );
        if (hasSelfVote) throw new Error("自己投票は禁止です");

        const existingVoteCount = await tx.vote.count({
          where: { sessionId: parsed.data.sessionId, voterNameNorm },
        });
        if (existingVoteCount + uniquePostIds.length > 2) {
          throw new Error("1セッションで投票は最大2票までです");
        }

        const created = await tx.vote.createMany({
          data: uniquePostIds.map((postId) => ({
            sessionId: parsed.data.sessionId,
            postId,
            voterNameRaw: parsed.data.voterName.trim(),
            voterNameNorm,
          })),
        });

        return created.count;
      },
    );

    return NextResponse.json({ created: createdCount }, { status: 201 });
  } catch (error) {
    if (isP2002Error(error) && error.code === "P2002") {
      return NextResponse.json(
        { error: "同じ投稿に重複投票はできません" },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "投票に失敗しました";
    const status = message === "Session not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
