import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(["STORY", "BUG"]).default("STORY"),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  assigneeId: z.string().optional(),
  statusId: z.string().optional(),
  customValues: z
    .array(z.object({ customFieldId: z.string(), value: z.string().optional() }))
    .optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assigneeId = searchParams.get("assigneeId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const statusId = searchParams.get("statusId");

  const where: Record<string, unknown> = { projectId };
  if (assigneeId) where.assigneeId = assigneeId;
  if (statusId) where.statusId = statusId;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      status: true,
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      customValues: { include: { customField: true } },
      _count: { select: { comments: true, images: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { projectId, type, title, description, assigneeId, statusId, customValues } =
    parsed.data;

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = statusId
    ? await prisma.status.findFirst({ where: { id: statusId, projectId } })
    : await prisma.status.findFirst({
        where: { projectId },
        orderBy: { position: "asc" },
      });

  if (!status) {
    return NextResponse.json(
      { error: "No status available in this project" },
      { status: 400 }
    );
  }

  if (assigneeId) {
    const assigneeMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
    });
    if (!assigneeMember) {
      return NextResponse.json(
        { error: "Assignee must be a project member" },
        { status: 400 }
      );
    }
  }

  const validFieldIds = (
    await prisma.customField.findMany({
      where: { projectId },
      select: { id: true },
    })
  ).map((f) => f.id);

  const filteredValues = (customValues ?? []).filter(
    (v) => validFieldIds.includes(v.customFieldId) && v.value
  );

  const ticket = await prisma.ticket.create({
    data: {
      projectId,
      type,
      title,
      description,
      creatorId: session.user.id,
      assigneeId,
      statusId: status.id,
      customValues: {
        create: filteredValues.map((v) => ({
          customFieldId: v.customFieldId,
          value: v.value,
        })),
      },
    },
    include: {
      status: true,
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      customValues: { include: { customField: true } },
    },
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
