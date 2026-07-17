import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const commentSchema = z.object({
  body: z.string().min(1).max(5000),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    select: { projectId: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: ticket.projectId, userId: session.user.id },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comments = await prisma.comment.findMany({
    where: { ticketId: params.id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    select: { projectId: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: ticket.projectId, userId: session.user.id },
    },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      ticketId: params.id,
      authorId: session.user.id,
      body: parsed.data.body,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
