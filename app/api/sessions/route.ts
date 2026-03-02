import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sessionSchema } from "@/lib/validation";

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = sessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const pinHash = await bcrypt.hash(parsed.data.pin, 10);
  const date = new Date(`${parsed.data.date}T00:00:00.000Z`);

  const session = await prisma.session.create({
    data: {
      title: parsed.data.title.trim(),
      date,
      pinHash,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
