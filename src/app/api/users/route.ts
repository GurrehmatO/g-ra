import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  password: z.string().min(8).max(100),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, name, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A user with that email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), name, passwordHash, role },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
