import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const addSchema = z.object({
  email: z.string().email(),
  role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: session.user.id } },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId: params.id },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: session.user.id } },
  });
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user) {
    return NextResponse.json(
      { error: "No user with that email exists" },
      { status: 404 }
    );
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "User is already a member" },
      { status: 409 }
    );
  }

  const member = await prisma.projectMember.create({
    data: { projectId: params.id, userId: user.id, role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  return NextResponse.json({ member }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: session.user.id } },
  });
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: params.id, userId } },
  });

  return NextResponse.json({ ok: true });
}
