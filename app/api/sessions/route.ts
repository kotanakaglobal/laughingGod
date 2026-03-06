import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionSchema } from "@/lib/validation";

export async function GET() {
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
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "入力が不正です" }, { status: 400 });
  }

  const { date, firstPost } = parsed.data;

  const session = await prisma.session.create({
    data: {
      date: new Date(date),
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
}
