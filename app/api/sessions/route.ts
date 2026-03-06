import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionSchema } from "@/lib/validation";

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        posts: {
          orderBy: [{ createdAt: "desc" }],
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "一覧取得に失敗しました";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "リクエスト本文が不正です" },
        { status: 400 },
      );
    }

    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "入力が不正です" }, { status: 400 });
    }

    const { date, firstPost } = parsed.data;
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "日付が不正です" },
        { status: 400 },
      );
    }

    const session = await prisma.session.create({
      data: {
        date: parsedDate,
        posts: {
          create: {
            text: firstPost.trim(),
            authorNameRaw: "",
            authorNameNorm: "",
          },
        },
      },
      include: {
        posts: {
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "投稿に失敗しました";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
