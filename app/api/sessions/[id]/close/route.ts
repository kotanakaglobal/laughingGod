import { NextRequest, NextResponse } from "next/server";
const bcrypt = require("bcryptjs") as {
  compare: (plain: string, hashed: string) => Promise<boolean>;
};
import { prisma } from "@/lib/prisma";
import { closeSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = closeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "PINは4桁で入力してください" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { id: params.id } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status === "closed") return NextResponse.json({ error: "既に締切済みです" }, { status: 400 });

  const ok = await bcrypt.compare(parsed.data.pin, session.pinHash);
  if (!ok) return NextResponse.json({ error: "PINが違います" }, { status: 401 });

  const updated = await prisma.session.update({
    where: { id: params.id },
    data: { status: "closed" },
  });

  return NextResponse.json({ session: updated });
}
