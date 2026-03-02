import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const start = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

export async function GET(_: Request, { params }: { params: { month: string } }) {
  const range = parseMonth(params.month);
  if (!range) return NextResponse.json({ error: "Invalid month" }, { status: 400 });

  const sessions = await prisma.session.findMany({
    where: {
      date: {
        gte: range.start,
        lt: range.end,
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
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

  const ranking = sessions
    .flatMap((s) =>
      s.posts.map((p) => ({
        postId: p.id,
        sessionId: s.id,
        sessionTitle: s.title,
        text: p.text,
        authorName: p.authorNameRaw,
        createdAt: p.createdAt,
        points: p._count.votes,
      })),
    )
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  return NextResponse.json({ sessions, ranking });
}
